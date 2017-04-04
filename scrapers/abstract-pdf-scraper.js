/*jshint esversion: 6 */

(function() {
  'use strict';

  const fs = require('fs');
  const PDFParser = require("pdf2json");
  const AbstractScraper = require('./abstract-scraper');

  class AbstractPdfScraper extends AbstractScraper {
    
    constructor(pdfFile) {
      super();
      this.pdfParser = new PDFParser();
      this.pdfFile = pdfFile;
      
      this.pdfParser.on('pdfParser_dataError', this.onPdfParseError.bind(this));
      this.pdfParser.on('pdfParser_dataReady', this.onPdfParseReady.bind(this));
      this.pdfParser.loadPDF(this.pdfFile);
      this._pdfData = null;
      this._pdfDataCallback = null;
    }
    
    onPdfParseError(errData) {
      if (this._pdfDataCallback !== null) {
        this._pdfDataCallback(errData);
        this._pdfDataCallback = null;
      }
    }
    
    onPdfParseReady(pdfData) {
      if (this._pdfDataCallback !== null) {
        this._pdfDataCallback(null, pdfData);
        this._pdfData = pdfData;
        this._pdfDataCallback = null;
      } else {
        this._pdfData = pdfData;
      }
    }
    
    get pdfData() {
      return new Promise((resolve, reject) => {
        if (this._pdfData === null) {
          this._pdfDataCallback = (err, pdfData) => {
            if (err) {
              reject(err);
            } else {
              resolve(pdfData);
            }
          };
        } else {
          resolve(this._pdfData);
        }
      });
    }
    
  }
  
  module.exports = AbstractPdfScraper;
           
}).call(this);