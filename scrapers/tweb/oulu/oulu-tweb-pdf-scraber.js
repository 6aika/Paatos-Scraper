/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const AbstractTwebPdfScraper = require(__dirname + '/../abstract-tweb-pdf-scraber');

  /**
   * Abstract base class for scrapers
   */
  class OuluTwebPdfScraper extends AbstractTwebPdfScraper {
    
    constructor(pdfFile) {
      super(pdfFile);      
      this._captions = null;
      this._values = null;
    }
    
    get captions() {
      if (this._captions === null) {
        this._captions = this.scrapeCaptions();  
      }
      
      return this._captions;
    }
    
    get values() {
      if (this._values === null) {
        this._values = this.scrapeValues();  
      }
      
      return this._values;
    }
    
    scrapeCaptions() {
      // TODO: Implement
      return [];
    }
    
    scrapeValues() {
      // TODO: Implement
      return [];
    }
    
  }
  
  module.exports = OuluTwebPdfScraper;
           
}).call(this);