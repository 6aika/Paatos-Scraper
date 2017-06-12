/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const _ = require('lodash');
  const util = require('util');
  const winston = require('winston');
  const Promise = require('bluebird'); 
  const AbstractTwebPdfScraper = require(__dirname + '/../abstract-tweb-pdf-scraper');
  const PositionedText = require(__dirname + '/../../positioned-text');

  process.on('unhandledRejection', function(error, promise) {
    console.error("UNHANDLED REJECTION", error.stack);
  });
  
  /**
   * Oulu TWeb specific implementation of Pdf scraper
   */
  class OuluTwebPdfScraper extends AbstractTwebPdfScraper {
    
    constructor(options) {
      super(Object.assign({
        "host": "asiakirjat.ouka.fi",
        "pdfPath": "/ktwebbin/ktproxy2.dll",
        "ignoreZoneOffset": 0.5
      }, options || {}));
      
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
    
    isInIngoreZone(ignoreZones, positionedText) {
      for (let i = 0; i < ignoreZones.length; i++) {
        var ignoreZone = ignoreZones[i];
        if (positionedText.y >= ignoreZone.y1 && positionedText.y <= ignoreZone.y2) {
          return true;
        }
      }
      
      return false;
    }
    
    /**
     * Returns a promise for organization event action contents.
     * 
     * Returned data is ordered in same order that it is in the source system. 
     * 
     * @param {String} organizationId organizationId 
     * @param {String} eventId eventId
     * @param {String} actionId actionId
     */
    extractOrganizationEventActionContents(organizationId, eventId, actionId) {
      return this.extractPdfEventActionContents(this.getPdfUrl(organizationId, eventId, actionId));
    }
    
    /**
     * Returns a promise for event action contents scraped out of the PDF-file.
     * 
     * Returned data is ordered in same order that it is in the PDF-document. 
     * 
     * @param {String} pdfUrl pdfUrl
     */
    extractPdfEventActionContents(pdfUrl) {
      return new Promise((resolve, reject) => {
        this.scrapePdf(pdfUrl)
          .then((scrapedData) => {
            const pdfTexts = scrapedData.pdfTexts;
            const ignoreZones = scrapedData.ignoreZones;
            
            var result = [];
            var unscrapableContents = false;
                
            var blocks = this.detectBlocks(pdfTexts, ignoreZones);
            for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
              let block = blocks[blockIndex];
              
              let blockTexts = _.filter(pdfTexts, (pdfText) => {
                let textY = pdfText.y;
                let result = textY >= block.top && textY <= block.bottom; 
                if (result) {
                  if (this.isInIngoreZone(ignoreZones, pdfText)) {
                    unscrapableContents = true; 
                    return false;
                  }
                }  
                
                return result; 
              });
              
              var blockValues = _.filter(blockTexts, (blockText) => {
                return blockText.type === PositionedText.VALUE;
              });

              var blockCaptions = _.filter(blockTexts, (blockText) => {
                return blockText.type === PositionedText.CAPTION;
              });

              var blockCaptionTexts = _.map(blockCaptions, (blockCaption) => {
                return _.trim(blockCaption.text);
              });
              
              blockCaptionTexts = this.mergeHyphenatedTexts(blockCaptionTexts);
              
              var blockCaption = _.filter(blockCaptionTexts, (blockCaptionText) => {
                return !!blockCaptionText;
              }).join(' ');
              
              let blockValueTexts = [];
              
              for (let i = 0; i < blockValues.length - 1; i++) {
                let value = _.trim(blockValues[i].text); 
                let y = blockValues[i].y;
                let nextY = blockValues[i + 1].y;
                let samePage = blockValues[i].pageOffsetY === blockValues[i + 1].pageOffsetY;
                if (!samePage) {
                  nextY -= this._offset.contentTop + this._offset.contentBottom;  
                }
                
                if ((nextY - y) > this._offset.emptyLineThreshold) {
                  value += '\n\n';                  
                }
                
                blockValueTexts.push(value);
              }
              
              if (blockValues.length) {
                blockValueTexts.push(_.trim(blockValues[blockValues.length - 1].text));
              }
            
              var blockValue = this.removeMultipleSpaces(_.trim(_.map(blockValueTexts, (blockValueText) => {
                return _.endsWith(blockValueText, '\n') ? blockValueText : blockValueText + ' ';
              }).join('')));
              
              if (blockValue || blockCaption) {
                if (!blockCaption) {
                  winston.log('warn', util.format('Missing content title (with content %s) on Oulu TWeb PDF (%s)', blockValue, pdfUrl));
                }
                
                if (!blockValue) {
                  winston.log('warn', util.format('Missing content content (with title %s) on Oulu TWeb PDF (%s)', blockCaption, pdfUrl));
                }
                
                result.push({
                  order: blockIndex,
                  title: blockCaption,
                  content: blockValue 
                });
              }
              
            }

            if (unscrapableContents) {    
              winston.log('info', util.format('Detected unscrapable contents on Oulu TWeb PDF (%s)', pdfUrl));
            }
            
            let dnoValue = this.getActionContentValue(result, 'Dno');
            if (dnoValue) {
              let functionId = this.parseFunctionId(dnoValue);
              if (!functionId) {
                winston.log('warn', util.format('Invalid Dno %s in Oulu TWeb PDF %s', dnoValue, pdfUrl));                      
              } else {
                this.setActionContentValue(result, 'functionId', functionId);
              }
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
     * @param {Array} ignoreZones array of zones to be ignored
     * @returns {Array} detected blocks from the document
     */
    detectBlocks(pdfTexts, ignoreZones) {
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
        
        while (this.isInIngoreZone(ignoreZones, nextCaption) || ((nextCaption.y - caption.y) <= this._offset.blockThreshold) && i < (captions.length - 1)) {
          i++;  
          caption = captions[i];          
          nextCaption = captions[i + 1];
          if (!nextCaption) {
            // Last block, so we extend it to fill the rest of the document
            bottom = caption.pageHeight + caption.pageOffsetY;
            break;
          }
          
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
     * Scrapes the PDF-document
     * 
     * @param {String} pdfUrl pdf url address
     * @returns {Array} An array of pdf text fragments
     */
    scrapePdf(pdfUrl) {
      return new Promise((resolve, reject) => {
        this.getPdfData(pdfUrl)
          .then((pdfData) => {
            resolve({
              pdfTexts: this.extractTexts(pdfData),
              ignoreZones: this.detectIgnoreZones(pdfData)
            });
          })
          .catch((err) => {
            reject(err);
          });
      });
    }
    
    /**
     * Extracts text fragments from the pdf data as PositionedText instances
     * 
     * @param {Object} pdfData pdfData
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
              let fontSize = pdfText.R[0].TS[1] * (1 / 72);
              let bold = pdfText.R[0].TS[2] === 1;
              let italic = pdfText.R[0].TS[3] === 1;
              result.push(new PositionedText(text, type, x, y + pageOffsetY, pdfText.w, fontSize, pageOffsetY, pdfPage.Height, bold, italic));
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
     * Attempts to detect unscrapeable parts from the source PDF
     * 
     * @param {Object} pdfData pdfData
     * @returns {Array} array of unscrapeable parts
     */
    detectIgnoreZones (pdfData) {
      var result = [];
      var pageOffsetY = 0;

      let pdfPages = pdfData.formImage.Pages;
      for (let pageIndex = 0; pageIndex < pdfPages.length; pageIndex++) {
        let pdfPage = pdfPages[pageIndex];  
        for (let fillIndex = 0; fillIndex < pdfPage.Fills.length; fillIndex++) {
          var fill = pdfPage.Fills[fillIndex];
          if (!fill.oc && fill.clr === 0) {
            // Fills contaning clr (color index) 1 are dropped. This should
            // remove e.g. tables from the documents
            if (fill.h > 0) {
              result.push({
                y1: fill.y + pageOffsetY - this.options.ignoreZoneOffset,
                y2: fill.y + fill.h + pageOffsetY + this.options.ignoreZoneOffset
              });
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
    
  }
  
  module.exports = OuluTwebPdfScraper;
           
}).call(this);