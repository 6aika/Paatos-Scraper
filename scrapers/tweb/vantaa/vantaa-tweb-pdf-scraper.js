/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const _ = require('lodash');
  const util = require('util');
  const winston = require('winston');
  const moment = require('moment');
  const Promise = require('bluebird'); 
  const AbstractTwebPdfScraper = require(__dirname + '/../abstract-tweb-pdf-scraper');
  const PositionedText = require(__dirname + '/../../positioned-text');
  
  /**
   * Vantaa TWeb specific implementation of Pdf scraper
   */
  class VantaaTwebPdfScraper extends AbstractTwebPdfScraper {
    
    constructor(options) {
      super(Object.assign({
        "host": "paatokset.vantaa.fi",
        "pdfPath": "/ktwebbin/ktproxy2.dll",
        "contentTop": 5,
        "paragraphThreshold": 0.75,
        "sameLineThreshold": 0.05
      }, options || {}));
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
        this.getPdfData(pdfUrl)
          .then((pdfData) => {
            const contentTexts = this.extractContentTexts(pdfData);
            const titleIndex = this.findIndex(contentTexts, '^(.*\ )([0-9]{1,2}.[0-9]{1,2}.[0-9]{1,4})(\ \§\ )([0-9]{1,})$');
            if (!titleIndex) {
              winston.log('warn', util.format('Could not find title index from %s', pdfUrl));
              resolve([]);
              return;
            }
          
            const title = contentTexts[titleIndex].text;
            if (!title) {
              winston.log('warn', util.format('Could not find title from %s', pdfUrl));
              resolve([]);
              return;
            }
            
            const titleMatch = /^(.*\ )([0-9]{1,2}.[0-9]{1,2}.[0-9]{1,4})(\ \§\ )([0-9]{1,})$/.exec(title);
            if (!titleMatch || titleMatch.length !== 5) {
              winston.log('warn', util.format('Unexpected title format (%s) in %s', title, pdfUrl));
              resolve([]);
              return;
            }
            
            const articleNumber = titleMatch[4];
            const date = moment(titleMatch[2], 'D.M.YYYY', 'fi', true);
            
            if (!articleNumber) {
              winston.log('warn', util.format('Invalid article number read from title %s', title));
              return;
            }

            if (!date.isValid()) {
              winston.log('warn', util.format('Could not parse date from title %s', title));
              return;
            }
            
            let y = this.options.contentTop;
            let index = 0;
            let result = [];
            let dnoIndex = this.findIndex(contentTexts, '^(VD\/){0,1}[0-9]{1,}\/[0-9.]*\/[0-9]{4}$');
            let draftsmenIndex = this.findIndex(contentTexts, '^[A-Z-\/]{1,}$');
            let contentsIndex = titleIndex;
            let hasSummary = (dnoIndex === null || dnoIndex > 0) && contentsIndex > 0;
                    
            if (contentsIndex > 0) { 
              if (hasSummary) {
                if ((index = this.appendSummary(index, contentTexts, result)) === -1) {
                  winston.log('warn', util.format('Could not extract summary from Vantaa TWeb PDF %s', pdfUrl));
                  index = 0; 
                }
              }

              if (dnoIndex !== null) {
                if ((index = this.appendDno(dnoIndex, contentTexts, result)) === -1) {
                  winston.log('warn', util.format('Could not extract Dno from Vantaa TWeb PDF %s', pdfUrl));
                  index = 0;
                } else {
                  let dnoValue = this.getActionContentValue(result, 'Dno');
                  if (dnoValue) {
                    if (!dnoValue.startsWith('VD/')) {
                      dnoValue = util.format('VD/%s', dnoValue);
                      this.setActionContentValue(result, 'Dno', dnoValue);
                    }
                    
                    let functionId = this.parseFunctionId(dnoValue);
                    if (!functionId) {
                      winston.log('warn', util.format('Invalid Dno %s in Vantaa TWeb PDF %s', dnoValue, pdfUrl));                      
                    } else {
                      this.setActionContentValue(result, 'functionId', functionId);
                    }
                  }
                }
              } else {
                winston.log('warn', util.format('Could not find Dno from Vantaa TWeb PDF %s', pdfUrl));
              }

              if (draftsmenIndex !== null) {
                if ((index = this.appendDraftsmen(draftsmenIndex, contentTexts, result)) === -1) {
                  winston.log('warn', util.format('Could not extract draftsmen from Vantaa TWeb PDF %s', pdfUrl));
                  index = 0;
                }
              }

              if (index < contentsIndex) {
                if ((index = this.appendIntroduction(index, contentTexts, result, date, articleNumber)) === -1) {
                  winston.log('warn', util.format('Could not extract introduction from Vantaa TWeb PDF %s', pdfUrl));
                  index = 0;
                }
              }
            } else {
              winston.log('warn', util.format('Could not extract any header data from TWeb PDF %s', pdfUrl));
            }
            
            index = contentsIndex + 1;
            
            while (index < contentTexts.length) {
              let extractedTitle = this.extractContentTitle(index, contentTexts);
              if (!extractedTitle) {
                winston.log('warn', util.format('Could not extract title from from Vantaa TWeb PDF %s', pdfUrl));
                return resolve(result);
              }
              
              index = extractedTitle.endIndex;
              let title = _.trim(extractedTitle.text.content);
               
              if (title.endsWith(':')) {
                title = title.substring(0, title.length - 1);
              } else {
                winston.log('warn', util.format('Unrecognized content caption %s in Vantaa TWeb PDF %s', title, pdfUrl));
              }
               
              if ((index = this.appendContentText(title, index, contentTexts, result)) === -1) {
                return resolve(result);
              }
               
              index--;
            }
            
            resolve(result);
          });
      });
    }
    
    appendSummary(index, contentTexts, result) {
     return this.appendParagraph("Tiivistelmä", index, contentTexts, result);     
    }
    
    appendDno(index, contentTexts, result) {
     return this.appendLine("Dno", index, contentTexts, result);
    }
    
    appendDraftsmen(index, contentTexts, result) {
     return this.appendParagraph("Valmistelijat", index, contentTexts, result);     
    }
    
    appendIntroduction(index, contentTexts, result, date, articleNumber) {
     return this.appendUntilMatch("Esittelyteksti", index, contentTexts, result, util.format('^.*%s § %s$', date.format("D.M.YYYY"), articleNumber), true);     
    }
    
    extractContentTitle(index, contentTexts) {
      let result = [];
      var endIndex = this.appendLine("", index, contentTexts, result);
      
      return {
        "text": result.length ? result[0] : null,
        "endIndex": endIndex
      };
    }
    
    appendContentText(title, index, contentTexts, result) {
      let resultIndex = this.appendUntilMatch(title, index, contentTexts, result, '^.*:$', true);
      if (resultIndex === -1) {
        this.appendToEnd(title, index, contentTexts, result);  
      }
      
      return resultIndex;
    }
    
    appendParagraph(title, index, contentTexts, result) {
      return this.appendBlock(title, index, contentTexts, result, this.options.paragraphThreshold);
    }
    
    appendLine(title, index, contentTexts, result) {
      return this.appendBlock(title, index, contentTexts, result, this.options.sameLineThreshold);
    }
    
    appendBlock(blockTitle, index, contentTexts, result, threshold) {
      let block = this.extractToGap(contentTexts, index, threshold);
      if (block) {
        result.push({
          order: result.length,
          title: blockTitle,
          content: block.text 
        });
        
        return block.endIndex + 1;
      }
      
      return -1; 
    }
    
    appendUntilMatch(blockTitle, index, contentTexts, result, regex, matchOnlyBold) {
      let block = this.extractToRegex(contentTexts, index, regex, matchOnlyBold);
      if (block) {
        result.push({
          order: result.length,
          title: blockTitle,
          content: block.text 
        });
        
        return block.endIndex + 1;
      }
      
      return -1; 
    }
    
    appendToEnd(blockTitle, startIndex, contentTexts, result) {
      let block = this.extractToEnd(contentTexts, startIndex);
      if (block) {
        result.push({
          order: result.length,
          title: blockTitle,
          content: block.text 
        });
      }
      
      return -1; 
    }
    
    extractToGap(contentTexts, startIndex, threshold) {
      let index = startIndex;
      let text = "";
      
      while ((index + 1) < contentTexts.length) {
        let contentText = contentTexts[index];
        let nextContentText = contentTexts[index + 1];
        let gapSize = nextContentText.y - (contentText.y + contentText.height);
        
        text += contentText.text;
        
        if (gapSize < this.options.sameLineThreshold) {
          text += ' ';
        }
        
        if (gapSize > threshold) {
          return {
            "text": this.removeMultipleSpaces(text),
            "startIndex": startIndex,
            "endIndex": index
          };
        }
        
        index++;
      }
      
      return null;
    }
    
    extractToRegex(contentTexts, startIndex, regex, matchOnlyBold) {
      let index = startIndex;
      let text = "";
      
      while ((index + 1) < contentTexts.length) {
        let contentText = contentTexts[index];
        let nextContentText = contentTexts[index + 1];
        let gapSize = nextContentText.y - (contentText.y + contentText.height);
        if ((matchOnlyBold && contentText.bold) && contentText.text.match(regex)) {          
          return {
            "text": this.removeMultipleSpaces(_.trim(text)),
            "startIndex": startIndex,
            "endIndex": index
          };
        } else {
          text += contentText.text;
          
          if (gapSize > this.options.paragraphThreshold) {
            text += '\n\n';
          } else if (gapSize < this.options.sameLineThreshold) {
            text += ' ';
          }

        }
        
        index++;
      }
      
      return null;
    }
    
    findIndex(contentTexts, regex) {
      for (let i = 0; i < contentTexts.length; i++) {
        if (contentTexts[i].text.match(regex)) {
          return i;
        }
      }
      
      return null;
    }
    
    extractToEnd(contentTexts, startIndex) {
      let index = startIndex;
      let text = "";
      
      while ((index + 1) < contentTexts.length) {
        let contentText = contentTexts[index];
        let nextContentText = contentTexts[index + 1];
        let gapSize = nextContentText.y - (contentText.y + contentText.height);
        text += contentText.text;
        
        if (gapSize > this.options.paragraphThreshold) {
          text += '\n\n';
        } else if (gapSize < this.options.sameLineThreshold) {
          text += ' ';
        }
        
        index++;
      }
      
      text += contentTexts[contentTexts.length - 1].text;
      
      return {
        "text": this.removeMultipleSpaces(_.trim(text)),
        "startIndex": startIndex,
        "endIndex": index
      };
    }
    
    extractContentTexts(pdfData) {
      let pageOffsetY = 0;
      let pdfPages = pdfData.formImage.Pages;
      let result = [];

      for (var pageIndex = 0; pageIndex < pdfPages.length; pageIndex++) {
        var pdfPage = pdfPages[pageIndex]; 
        var pdfTexts = pdfPage.Texts;     

        for (var textIndex = 0; textIndex < pdfTexts.length; textIndex++) {
          var pdfText = pdfTexts[textIndex];
          var x = pdfText.x;
          var y = pdfText.y;
          if (y >= this.options.contentTop) {
            if (pdfText.R.length === 1) {
              let text = decodeURIComponent(pdfText.R[0].T);
              let fontSize = pdfText.R[0].TS[1] * (1 / 72);
              let bold = pdfText.R[0].TS[2] === 1;
              let italic = pdfText.R[0].TS[3] === 1;
              result.push(new PositionedText(text, null, x, y + pageOffsetY, pdfText.w, fontSize, pageOffsetY, pdfPage.Height, bold, italic));
            } else {
              console.error('Unexpected count of pdfText.R', pdfText.R);
            }
          }
        }

        pageOffsetY += pdfPage.Height;
      } 
      
      return result;
    }
    
  }
  
  module.exports = VantaaTwebPdfScraper;
           
}).call(this);