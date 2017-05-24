/*jshint esversion: 6 */

(function() {
  'use strict';

  const fs = require('fs');
  const cheerio = require('cheerio');
  const request = require('request');
  const syncRequest = require('sync-request');
  const contentDisposition = require('content-disposition');
  const AbstractScraper = require('./abstract-scraper');
  const Entities = require('html-entities').AllHtmlEntities;
  const entities = new Entities();
  
  let queuedRequests = [];
  let queueRunning = false;
  
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
            if (options.cleanWordHtml) {
              resolve(cheerio.load(this.cleanWordHtml(body)));
            } else {
              resolve(cheerio.load(body));
            }
          })
          .catch(reject);     
      });
    }
    
    nextRequest() {
      if (queuedRequests.length) {   
        queueRunning = true;
        var queuedRequest = queuedRequests.splice(0, 1)[0];
        request(queuedRequest.options, (error, response, body) => {
           queuedRequest.callback.call(this, error, response, body);
           setTimeout(() => {             
             this.nextRequest();
           }, queuedRequest.options.htmlDownloadInterval || 10);
        });
      } else {
        queueRunning = false;
      }
    }
    
    /**
     * Performs a HEAD request to specified url and returns headers or null 
     * if request is a failure
     * 
     * @param {String} url url
     * @returns {Object} headesr
     */
    getHeaders(url) {
      var response = syncRequest('HEAD', url);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response.headers;    
      } else {
        return null;
      }
    }
    
    /**
     * Parses a content disposition header
     * 
     * @param {String} header content disposition header value
     * @returns {ContentDisposition} parsed content disposition object
     */
    parseContentDisposition(header) {
      return contentDisposition.parse(header);
    }
    
    /**
     * Returns Promise for request data
     * 
     * @param {Object} options options te be passed to request
     * @returns {Promise} Promise for request data
     */
    doRequest(options) {
      return new Promise((resolve, reject) => {
        queuedRequests.push({
          options: options,
          callback: (error, response, body) => {
            if (error) {
              reject(error);
            } else {
              resolve(body); 
            }
          }
        });
       
        if (!queueRunning) {
          this.nextRequest();
        }
      });
    }
    
    trimHtml(html) {
      return html.replace(/>\s+</g,'><'); 
    }
    
    decodeHtmlEntities(html) {
      return entities.decode(html);
    }
    
    cleanWordHtml(html) {
      return this.normalizeQuotes(html);
    }
    
    normalizeQuotes(text) {
      return text
        .replace(/[\u0092\u2019\u2018\u2019]/g, "'")
        .replace(/[\u0094\u201C\u201D]/g, '"');
    }
    
  }
  
  module.exports = AbstractHtmlScraper;
           
}).call(this);