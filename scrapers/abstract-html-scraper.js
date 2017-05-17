/*jshint esversion: 6 */

(function() {
  'use strict';

  const cheerio = require('cheerio');
  const AbstractScraper = require('./abstract-scraper');
  
  class AbstractHtmlScraper extends AbstractScraper {
    
    constructor() {
      super();
    }
    
    /**
     * Returns promise for parsed html
     * 
     * @param {Object} options options te be passed to request
     * @returns {Promise} Promise for parsed html data
     */
    getParsedHtml(options) {
      return new Promise((resolve, reject) => {
        this.doRequest(options)
          .then((body) => {
            resolve(cheerio.load(body));   
          })
          .catch(reject);     
      });
    }
    
  }
  
  module.exports = AbstractHtmlScraper;
           
}).call(this);