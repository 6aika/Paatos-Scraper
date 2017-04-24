/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const _ = require('lodash');
  const util = require('util');
  const AbstractHtmlScraper = require(__dirname + '/../abstract-html-scraper');
  const request = require('request');
  
  /**
   * Abstract base class for scrapers
   */
  class AbstractTWebHtmlScraper extends AbstractHtmlScraper {
    
    constructor() {
      super();
    }
    
    /**
     * Returns a promise for scraped organizations.
     * 
     * Returned data is ordered in same order that it is in html page. 
     */
    extractOrganizations() {
      return new Promise((resolve, reject) => {
        var options = {
          url: util.format("http://%s%s", this.options.host, this.options.searchFormPath),
          encoding: this.options.encoding,
          requestInterval: this.options.requestInterval
        };
        
        this.getParsedHtml(options)
          .then(($) => {
            var options = $('form[name="form1"] select[name="kirjaamo"] option').filter((index, option) => {
              return $(option).val();
            });
            
            var organizations = _.map(options, (option) => {
              var id = $(option).val(); 
              var name = $(option).text();
              return {
                "sourceId": id,
                "classification": this.guessClassification(name),
                "name": name,
                "founding_date": null,
                "dissolution_date": null,
                "parent": null
              };
            });
            
            resolve(organizations);
          })
          .catch(reject);         
      });
    }
    
  }
  
  module.exports = AbstractTWebHtmlScraper;
           
}).call(this);