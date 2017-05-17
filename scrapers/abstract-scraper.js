/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const syncRequest = require('sync-request');
  const contentDisposition = require('content-disposition');
  const request = require('request');
  
  process.on('unhandledRejection', function(error, promise) {
    console.error("UNHANDLED REJECTION", error.stack);
  });
  
  let queuedRequests = [];
  let queueRunning = false;

  /**
   * Abstract base class for scrapers
   */
  class AbstractScraper {
    
    constructor() {
      
    }
    
    parseFunctionId(dnoValue) {
      let dnoSplit = dnoValue.split('/');
      if (dnoSplit.length >= 3) {
        return dnoSplit[2].replace(/\./g, ' ');
      }
      
      return null;
    }      
    
    getActionContentValue(actionContents, title) {
      for (var i = 0; i < actionContents.length; i++) {
        if (actionContents[i].title === title) {
          return actionContents[i].content;
        } 
      }
      
      return null;
    }
    
    setActionContentValue(actionContents, title, content) {
      for (var i = 0; i < actionContents.length; i++) {
        if (actionContents[i].title === title) {
          actionContents[i].content = content;
          return;
        } 
      }
      
      actionContents.push({
        order: actionContents.length,
        title: title,
        content: content 
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
  }
  
  module.exports = AbstractScraper;
           
}).call(this);