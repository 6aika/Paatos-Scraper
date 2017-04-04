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
      this._pdfDataPromise = null;
    }
    
    onPdfParseError(errData) {
      if (this._pdfDataPromise !== null) {
        this._pdfDataPromise.reject(errData);
        this._pdfDataPromise = null;
      }
    }
    
    onPdfParseReady(pdfData) {
      if (this._pdfDataPromise !== null) {
        this._pdfDataPromise.resolve(pdfData);
        this._pdfData = pdfData;
        this._pdfDataPromise = null;
      } else {
        this._pdfData = pdfData;
      }
    }
    
    get pdfData() {
      return new Promise((resolve, reject) => {
        if (this._pdfData === null) {
          this._pdfDataPromise = new Promise((resolve, reject));
        } else {
          resolve(this._pdfData);
        }
      });
    }
    
  }
  
  module.exports = AbstractPdfScraper;
           
}).call(this);