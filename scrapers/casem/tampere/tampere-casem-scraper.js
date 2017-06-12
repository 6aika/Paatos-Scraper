/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const _ = require('lodash');
  const odata = require('odata-client');
  const util = require('util');
  const winston = require('winston');
  
  const AbstractCasemScraper = require(__dirname + '/../abstract-casem-scraper');
  
  /**
   * Implementation for Tampere CaseM "scaraper"
   */
  class TampereCasemScraper extends AbstractCasemScraper {
    
    constructor(options) {
      super(Object.assign({
        "host": "tampere.cloudnc.fi"
      }, options || {}));
      
    }
    
    processContentValues (name, value) {
      switch (name) {
        case "DraftingNotes":
          return [{
            "title": "Valmistelijan yhteystiedot",
            "value": value
          }];
        case "CaseNativeId": 
          return [{
            "title": "Dno",
            "value": value
          }, {
            "title": "functionId",
            "value": this.extractFunctionId(value)
          }];
      }
      
      return super.processContentValues(name, value);
    }
    
    extractFunctionId(dno) {
      const result = dno.split('/');
      if (result.length === 3) {
        return result[1].replace(/\./g, ' ');
      }
      
      winston.log('warn', util.format('Could not extract functionId from dno %s', dno)); 
    }
    
  }
  
  module.exports = TampereCasemScraper;
           
}).call(this);