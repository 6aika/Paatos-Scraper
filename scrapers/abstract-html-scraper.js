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
     * @param {String} url url
     * @param {String} encoding content encoding 
     * @returns {unresolved}
     * 
     */
    getParsedHtml(url, encoding) {
      return new Promise((resolve, reject) => {
        this.doGetRequest(url, encoding)
          .then((body) => {
            resolve(cheerio.load(body));   
          })
          .catch(reject);     
      });
    }
    
    /**
     * Returns Promise for request data. Uses GET -method
     * 
     * @param {String} url url
     * @param {String} encoding content encoding 
     * @returns {Promise} 
     */
    doGetRequest(url, encoding) {
      return new Promise((resolve, reject) => {
        request({
          "url": url, 
          "encoding": encoding
        }, (error, response, body) => {
          if (error) {
            reject(error);
          } else {
            resolve(body); 
          }
        });
      });
    }
    
    doPostRequest(url, bodyParams) {
      
    }
    
  }
  
  module.exports = AbstractHtmlScraper;
           
}).call(this);