/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const _ = require('lodash');
  const Promise = require('bluebird'); 
  const AbstractTwebHtmlScraper = require(__dirname + '/../abstract-tweb-html-scraper');
  
  process.on('unhandledRejection', function(error, promise) {
    console.error("UNHANDLED REJECTION", error.stack);
  });
  
  /**
   * Oulu TWeb specific implementation of Html scraper
   */
  class OuluTwebHtmlScraper extends AbstractTwebHtmlScraper {
    
    constructor(options) {
      super();
      
      this._organizations = null;
      
      this.options = {
        "searchFormUrl": "http://asiakirjat.ouka.fi/ktwebbin/dbisa.dll/ktwebscr/pk_tek_tweb.htm",
        "encoding": "binary"
      };
    }
    
    /**
     * Returns a promise for organizations html page.
     * 
     * Returned data is ordered in same order that it is in html page. 
     */
    get organizations() {
      return new Promise((resolve, reject) => {
        if (this._organizations !== null) {
          resolve(this._organizations);
        } else {
          this.scrapeOrganizations()
            .then((organizations) => {
              this._organizations = organizations;
              resolve(this._organizations);
            })
            .catch(reject);
        }
      });
    }
    
    /**
     * Does actual scraping of organizations.
     */
    scrapeOrganizations() {
      return new Promise((resolve, reject) => {
        this.getParsedHtml(this.options.searchFormUrl, this.options.encoding)
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
    
    /**
     * Guesses the classification from the organization's name
     * 
     * @param {String} name name of the organization
     * @returns {String} classification
     */
    guessClassification(name) {
      var lowerCaseName = name.toLowerCase();
      var classifications = [
        "johtokunta", 
        "lautakunta", 
        "toimikunta", 
        "jaosto",
        "hallitus", 
        "valtuusto", 
        "toimikunta"
      ];
      
      for (var i = 0; i < classifications.length; i++) {
        if (lowerCaseName.includes(classifications[i])) {
          return classifications[i];
        }
      }
       
      return null;
    }
    
  }
  
  module.exports = OuluTwebHtmlScraper;
           
}).call(this);