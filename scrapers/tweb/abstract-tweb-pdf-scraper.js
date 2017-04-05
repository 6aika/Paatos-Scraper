/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const AbstractPdfScraper = require(__dirname + '/../abstract-pdf-scraper');

  /**
   * Abstract base class for scrapers
   */
  class AbstractTWebPdfScraper extends AbstractPdfScraper {
    
    constructor(pdfFile) {
      super(pdfFile);
    }
    
  }
  
  module.exports = AbstractTWebPdfScraper;
           
}).call(this);