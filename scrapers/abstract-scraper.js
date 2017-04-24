/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  process.on('unhandledRejection', function(error, promise) {
    console.error("UNHANDLED REJECTION", error.stack);
  });
  
  /**
   * Abstract base class for scrapers
   */
  class AbstractScraper {
    
    constructor() {
      
    }
    
  }
  
  module.exports = AbstractScraper;
           
}).call(this);