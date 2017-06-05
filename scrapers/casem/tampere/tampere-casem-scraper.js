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
    
  }
  
  module.exports = TampereCasemScraper;
           
}).call(this);