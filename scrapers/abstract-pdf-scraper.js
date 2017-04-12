/*jshint esversion: 6 */

(function() {
  'use strict';

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
        var queued = queue.splice(0, 1)[0];
        
        var pdfParser = new PDFParser();
        
        pdfParser.on('pdfParser_dataError', (errData) => {
          queued.callback.call(this, errData);
        });
        
        pdfParser.on('pdfParser_dataReady', (pdfData) => {
          queued.callback.call(this, null, pdfData);
          setTimeout(() => {             
            this.nextInQueue();
           }, this.options.downloadInterval || 100);
        });
        
        request(queued.url).pipe(pdfParser);
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
    
  }
  
  module.exports = AbstractPdfScraper;
           
}).call(this);