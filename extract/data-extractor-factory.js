/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const OuluDataExtractor = require(__dirname + '/oulu-data-extractor'); 

  /**
   * Factory class creating data extractors
   */
  class DataExtractorFactory {
    
    constructor() {
      
    }
    
    static getSources() {
      return ['oulu'];
    }
    
    static createDataExtractor(source, options) {
      switch (source) {
        case 'oulu':
          return new OuluDataExtractor(options);
        break;
      }
    }
    
  }
  
  module.exports = DataExtractorFactory;
           
}).call(this);