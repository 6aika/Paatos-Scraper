/*jshint esversion: 6 */

(function() {
  'use strict';

  const _ = require('lodash');
  const fs = require('fs');
  const request = require('request');
  const PDFParser = require("pdf2json");
  const AbstractScraper = require('./abstract-scraper');

  var queue = [];
  var queueRunning = false;
  
  class AbstractPdfScraper extends AbstractScraper {
    
    constructor(options) {
      super();
      this.options = options;
    }
    
    nextInQueue() {
      if (queue.length) {   
        queueRunning = true;
        const queued = queue.splice(0, 1)[0];
        const pdfParser = new PDFParser();
        
        pdfParser.on('pdfParser_dataError', (errData) => {
          queued.callback.call(this, errData);
          setTimeout(() => {             
            this.nextInQueue();
          }, this.options.pdfDownloadInterval || 100);
        });
        
        pdfParser.on('pdfParser_dataReady', (pdfData) => {
          queued.callback.call(this, null, pdfData);
          setTimeout(() => {             
            this.nextInQueue();
          }, this.options.pdfDownloadInterval || 100);
        });
        
        if (queued.url.startsWith('file://')) {
          fs.createReadStream(queued.url.substring(7)).pipe(pdfParser);
        } else {
          request(queued.url).pipe(pdfParser);
        }
        
      } else {
        queueRunning = false;
      }
    }
    
    getPdfData(url) {
      return new Promise((resolve, reject) => {
        queue.push({
          url: url,
          callback: (err, pdfData) => {
            if (err) {
              reject(err);
            } else {
              resolve(pdfData);
            }
          }
        });
        
        if (!queueRunning) {
          this.nextInQueue();
        }
      });
    }
    
    removeMultipleSpaces(text) {
      return text.replace(/  +/g, ' ');
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
  
  module.exports = AbstractPdfScraper;
           
}).call(this);