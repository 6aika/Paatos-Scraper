/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const OuluDataExtractor = require(__dirname + '/oulu-data-extractor'); 
  const VantaaDataExtractor = require(__dirname + '/vantaa-data-extractor'); 
  const EspooDataExtractor = require(__dirname + '/espoo-data-extractor');  
  const TampereDataExtractor = require(__dirname + '/tampere-data-extractor'); 
  const MikkeliDataExtractor = require(__dirname + '/mikkeli-data-extractor'); 

  /**
   * Factory class creating data extractors
   */
  class DataExtractorFactory {
    
    constructor() {
      
    }
    
    static getSources() {
      return ['oulu', 'vantaa','espoo','tampere','mikkeli'];
    }
    
    static createDataExtractor(source, options) {
      switch (source) {
        case 'oulu':
          return new OuluDataExtractor(options);
        case 'vantaa':
          return new VantaaDataExtractor(options);
        case 'espoo':
          return new EspooDataExtractor(options);
        case 'tampere':
          return new TampereDataExtractor(options);
        case 'mikkeli':
          return new MikkeliDataExtractor(options);
      }
    }
    
  }
  
  module.exports = DataExtractorFactory;
           
}).call(this);