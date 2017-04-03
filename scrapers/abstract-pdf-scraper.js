/*jshint esversion: 6 */

(function() {
  'use strict';

  const fs = require('fs');
  const PDFParser = require("pdf2json");
  const AbstractScraper = require('./abstract-scraper');

  class AbstractPdfScraper extends AbstractScraper {
    
    constructor(pdfFile) {
      super();
      
      this.pdfFile = pdfFile;
    }
    
  }
  
  module.exports = AbstractPdfScraper;
           
}).call(this);