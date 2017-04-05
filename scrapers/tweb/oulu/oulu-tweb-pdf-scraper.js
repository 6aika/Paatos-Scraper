/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const _ = require('lodash');
  const Promise = require('bluebird'); 
  const AbstractTwebPdfScraper = require(__dirname + '/../abstract-tweb-pdf-scraper');
  
  process.on('unhandledRejection', function(error, promise) {
    console.error("UNHANDLED REJECTION", error.stack);
  });
  
  class PositionedText {
    
    constructor(text, type, x, y, width, pageOffsetY, pageHeight) {
      this.text = text;
      this.type = type;
      this.x = x;
      this.y = y;
      this.width = width;
      this.pageOffsetY = pageOffsetY;
      this.pageHeight = pageHeight;
    }
    
    static get VALUE() {
      return 'VALUE';
    }
    
    static get CAPTION() {
      return 'CAPTION';
    }
    
  }
  
  /**
   * Oulu TWeb specific implementation of Pdf scraper
   */
  class OuluTwebPdfScraper extends AbstractTwebPdfScraper {
    
    constructor(pdfFile) {
      super(pdfFile);      
      this._captions = null;
      this._values = null;
      this._offset = {
        contentTop: 8.0,
        contentBottom: 7.0,
        captionX: 3.0,
        valueX: 11.0,
        blockThreshold: 1.0,
        blockMargin: 0.1,
        sameWordThreshold: 0.1,
        emptyLineThreshold: 1.2
      };
    }
    
    /**
     * Returns a promise for captions scraped out of the PDF-file.
     * 
     * Returned data is ordered in same order that it is in the PDF-document. 
     */
    get captions() {
      return new Promise((resolve, reject) => {
        if (this._captions !== null) {
          resolve(this._captions);
        } else {
          this.scrapeCaptions()
            .then((captions) => {
              this._captions = captions;
              resolve(this._captions);
            })
            .catch(reject);
        }
      });
    }
    
    /**
     * Returns a promise for values scraped out of the PDF-file.
     * 
     * Returned data is ordered in same order that it is in the PDF-document. 
     */
    get values() {
      return new Promise((resolve, reject) => {
        if (this._values !== null) {
          resolve(this._values);
        } else {
          this.scrapeValues()
            .then((values) => {
              this._values = values;
              resolve(this._values);
            })
            .catch(reject);
        }
      });
    }
    
    /**
     * Does actual captions scraping and returns a promise for the result.
     */
    scrapeCaptions() {
      return new Promise((resolve, reject) => {
      
        this.scrapeTexts()
          .then((pdfTexts) => {
            var result = [];
            
            var blocks = this.detectBlocks(pdfTexts);
            for (var i = 0; i < blocks.length; i++) {
              var block = blocks[i];
              
              var blockTexts = _.filter(pdfTexts, (pdfText) => {
                return pdfText.y >= block.top && pdfText.y <= block.bottom;
              });

              var blockCaptions = _.filter(blockTexts, (blockText) => {
                return blockText.type === PositionedText.CAPTION;
              });

              var blockTexts = _.map(blockCaptions, (blockCaption) => {
                return _.trim(blockCaption.text);
              });
              
              blockTexts = this.mergeHyphenatedTexts(blockTexts);
              
              var blockCaption = _.filter(blockTexts, (blockText) => {
                return !!blockText;
              }).join(' ');
              
              result.push(blockCaption);
            }
    
            resolve(result);
          })
          .catch(reject);
         
      });
    }
    
    /**
     * Does actual captions scraping and returns a promise for the result.
     */
    scrapeValues() {
      return new Promise((resolve, reject) => {
      
        this.scrapeTexts()
          .then((pdfTexts) => {
            var result = [];
            
            var blocks = this.detectBlocks(pdfTexts);

            for (var blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
              var block = blocks[blockIndex];
              
              var blockTexts = _.filter(pdfTexts, (pdfText) => {
                return pdfText.y >= block.top && pdfText.y <= block.bottom;
              });

              var blockValues = _.filter(blockTexts, (blockText) => {
                return blockText.type === PositionedText.VALUE;
              });
              
              if (!blockValues.length) {
                continue;
              }
              
              var blockTexts = [];
              
              for (var i = 0; i < blockValues.length - 1; i++) {
                var value = _.trim(blockValues[i].text); 
                var y = blockValues[i].y;
                var nextY = blockValues[i + 1].y;
                var samePage = blockValues[i].pageOffsetY == blockValues[i + 1].pageOffsetY;
                if (!samePage) {
                  nextY -= this._offset.contentTop + this._offset.contentBottom;  
                }
                
                if ((nextY - y) > this._offset.emptyLineThreshold) {
                  value += '\n\n';                  
                }
                
                blockTexts.push(value);
              }
              
              blockTexts.push(_.trim(blockValues[blockValues.length - 1].text));
              
              var blockValue = _.trim(_.map(blockTexts, (blockText) => {
                return _.endsWith(blockText, '\n') ? blockText : blockText + ' ';
              }).join(''));

              result.push(blockValue);
            }
    
            resolve(result);
          })
          .catch(reject);
         
      });
    }
    
    /**
     * Detects blocks (key - value pairs) and returns their horizontal position
     * within the document
     * 
     * @param {Array} pdfTexts PDF texts array
     * @returns {Array} detected blocks from the document
     */
    detectBlocks(pdfTexts) {
      var captions = _.filter(pdfTexts, (pdfText) => {
        return pdfText.type === PositionedText.CAPTION;
      });
      
      var blocks = [];
      var i = 0;
      
      while (i < (captions.length - 1)) {
        var caption = captions[i];
        var nextCaption = captions[i + 1];         
        
        var top = caption.y;
        var bottom = nextCaption.y;
        
        while (((nextCaption.y - caption.y) <= this._offset.blockThreshold) && i < (captions.length - 1)) {
          i++;  
          caption = captions[i];          
          nextCaption = captions[i + 1];         
          bottom = nextCaption.y - this._offset.blockMargin;
        }
        
        blocks.push({
          top: top,
          bottom: bottom - this._offset.blockMargin
        });
        
        i++;
      }
      
      if (i < captions.length) {
        var lastCaption = captions[captions.length - 1];
        var lastTop = lastCaption.y;
        var lastBottom = lastCaption.pageOffsetY + lastCaption.pageHeight;

        blocks.push({
          top: lastTop,
          bottom: lastBottom
        });
      }
        
      return blocks;
    }
    
    /**
     * Scrapes texts out of the PDF-document
     * @returns {Array} An array of pdf text fragments
     */
    scrapeTexts() {
      return new Promise((resolve, reject) => {
        if (this._pdfTexts) {
          resolve(this._pdfTexts);
        } else {        
          this.pdfData
            .then((pdfData) => {
              this._pdfTexts = this.extractTexts(pdfData);
              resolve(this._pdfTexts);
            })
            .catch((err) => {
              reject(err);
            });
        }
      });
    }
    
    /**
     * Extracts text fragments from the pdf data as PositionedText instances
     * 
     * @param {Object} pdfData
     * @returns {Array} text fragments extracted from the pdf data
     */
    extractTexts (pdfData) {
      var result = [];
      var pageOffsetY = 0;

      var pdfPages = pdfData.formImage.Pages;
      for (var pageIndex = 0; pageIndex < pdfPages.length; pageIndex++) {
        var pdfPage = pdfPages[pageIndex]; 
        var pdfTexts = pdfPage.Texts;     
        
        for (var textIndex = 0; textIndex < pdfTexts.length; textIndex++) {
          var pdfText = pdfTexts[textIndex];
          var x = pdfText.x;
          var y = pdfText.y;
          if ((y >= this._offset.contentTop) && (x >= this._offset.captionX) && (pdfText.R.length)) {
            if (pdfText.R.length === 1) {
              var text = decodeURIComponent(pdfText.R[0].T);
              var type = x >= this._offset.valueX ? PositionedText.VALUE : PositionedText.CAPTION;
              result.push(new PositionedText(text, type, x, y + pageOffsetY, pdfText.w, pageOffsetY, pdfPage.Height));
            } else {
              console.error('Unexpected count of pdfText.R', pdfText.R);
            }
          }
        }
        
        pageOffsetY += pdfPage.Height;
      }
      
      return result;
    }
    
    /**
     * Merges continuous text blocks as single text blocks (i.e. text blocks
     * that are close enought one another but are saved as different blocks 
     * within the PDF-file). 
     * 
     * @param {Array} texts text blocks
     * @returns {Array} merged text blocks
     */
    mergeContinuousTexts(texts) {
      var i = texts.length - 1;
      while (i > 0) {
        while ((texts[i].y === texts[i - 1].y) && (texts[i].type === texts[i - 1].type)) {
          var textRight = texts[i - 1].x + texts[i - 1].width;
          if (textRight >= texts[i].x) {
            texts[i - 1].width += texts[i].width;
            texts[i - 1].text += texts[i].text;
            texts.splice(i, 1);
          }
          
          i--;
        }
        
        i--;
      }
      
      return texts;
    }
    
    /**
     * Merges words splitted to multiple lines by - into single words
     * @param {type} texts texts
     * @returns {unresolved} merged texts
     */
    mergeHyphenatedTexts(texts) {
      var i = texts.length - 1;
      while (i > 0) {
        var text = _.trim(texts[i - 1]);
        if (_.endsWith(text, '-')) {
          texts[i - 1] = _.trim(text.substring(0, text.length - 1)) + texts[i];
          texts.splice(i, 1);
        }
        
        i--;
      }
      
      return texts;
    }
    
  }
  
  module.exports = OuluTwebPdfScraper;
           
}).call(this);