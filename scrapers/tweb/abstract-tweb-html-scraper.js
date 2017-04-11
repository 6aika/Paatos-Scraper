/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const AbstractHtmlScraper = require(__dirname + '/../abstract-html-scraper');
  const request = require('request');
  
  /**
   * Abstract base class for scrapers
   */
  class AbstractTWebHtmlScraper extends AbstractHtmlScraper {
    
    constructor() {
      super();
    }
    
  }
  
  module.exports = AbstractTWebHtmlScraper;
           
}).call(this);