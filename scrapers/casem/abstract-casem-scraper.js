/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const AbstractScraper = require(__dirname + '/../../abstract-scraper');
  
  /**
   * Abstract base class for CaseM "scrapers"
   */
  class AbstractCasemScraper extends AbstractScraper {
    
    constructor() {
      super();
    }
    
  }
  
  module.exports = AbstractCasemScraper;
           
}).call(this);