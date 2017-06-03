/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const OuluDataExtractor = require(__dirname + '/oulu-data-extractor'); 
  const VantaaDataExtractor = require(__dirname + '/vantaa-data-extractor'); 
  const EspooDataExtractor = require(__dirname + '/espoo-data-extractor'); 

  /**
   * Factory class creating data extractors
   */
  class DataExtractorFactory {
    
    constructor() {
      
    }
    
    static getSources() {
      return ['oulu', 'vantaa','espoo'];
    }
    
    static createDataExtractor(source, options) {
      switch (source) {
        case 'oulu':
          return new OuluDataExtractor(options);
        break;
        case 'vantaa':
          return new VantaaDataExtractor(options);
        break;
        case 'espoo':
          return new EspooDataExtractor(options);
        break;
      }
    }
    
  }
  
  module.exports = DataExtractorFactory;
           
}).call(this);