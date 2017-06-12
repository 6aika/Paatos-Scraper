/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const AbstractCasemDataExtractor = require(__dirname + '/abstract-casem-data-extractor');
  const MikkeliCasemScraper = require(__dirname + '/../scrapers/casem/mikkeli/mikkeli-casem-scraper');  
  
  /**
   * Mikkeli implementation for data extractor
   */
  class MikkeliDataExtractor extends AbstractCasemDataExtractor {
    
    constructor(options) {
      super(options, new MikkeliCasemScraper(options));
    }
    
  }
  
  module.exports = MikkeliDataExtractor;
           
}).call(this);