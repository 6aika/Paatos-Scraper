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
    }
    
    onPdfParseError(errData) {
      
    }
    
    onPdfParseReady(pdfData) {
      
    }
    
  }
  
  module.exports = AbstractPdfScraper;
           
}).call(this);