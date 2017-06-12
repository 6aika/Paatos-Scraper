/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const AbstractCasemDataExtractor = require(__dirname + '/abstract-casem-data-extractor');
  const TampereCasemScraper = require(__dirname + '/../scrapers/casem/tampere/tampere-casem-scraper');  
  
  /**
   * Tampere implementation for data extractor
   */
  class TampereDataExtractor extends AbstractCasemDataExtractor {
    
    constructor(options) {
      super(options, new TampereCasemScraper(options));
    }
    
  }
  
  module.exports = TampereDataExtractor;
           
}).call(this);