/*jshint esversion: 6 */

(function() {
  'use strict';

  const fs = require('fs');
  const cheerio = require('cheerio');
  const request = require('request');
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
    
    /**
     * Returns Promise for request data
     * 
     * @param {Object} options options te be passed to request
     * @returns {Promise} Promise for request data
     */
    doRequest(options) {
      return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
          if (error) {
            reject(error);
          } else {
            resolve(body); 
          }
        });
      });
    }
    
  }
  
  module.exports = AbstractHtmlScraper;
           
}).call(this);