/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const _ = require('lodash');
  const util = require('util');
  const moment = require('moment');
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
      
      this.options = Object.assign({
        "host": "asiakirjat.ouka.fi",
        "searchFormPath": "/ktwebbin/dbisa.dll/ktwebscr/pk_tek_tweb.htm",
        "eventsPath": "/ktwebbin/dbisa.dll/ktwebscr/pk_kokl_tweb.htm",
        "encoding": "binary"
      }, options || {});
    }
    
    /**
     * Returns a promise for organizations html page.
     * 
     * Returned data is ordered in same order that it is in html page. 
     */
    getOrganizations() {
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
     * Returns a promise for organization events.
     * 
     * Returned data is ordered in same order that it is in html page. 
     * 
     * @param {String} organizationId organizationId where to scrape events
     */
    getOrganizationEvents(organizationId) {
      return new Promise((resolve, reject) => {       
        var options = {
          "url": util.format("http://%s%s", this.options.host, this.options.eventsPath),
          "method": "POST",
          "encoding": this.options.encoding,
          "form": {
            'kirjaamo': organizationId,
            'oper': 'where'
          }
        };
        
        this.getParsedHtml(options)
          .then(($) => {
            var events = [];
            
            $('table.list tr[class*="data"]').each((index, row) => {
              var link = $(row).find('td:nth-of-type(1) a');
              var dateText = link.text();
              var linkHref = link.attr('href');
              var idMatch = /(.*bid=)([0-9]*)/.exec(linkHref); 
              var name =  $(row).find('td:nth-of-type(2)').text();
              var dateTime = moment(dateText, 'D.M.YYYY HH:mm', true).toISOString();
              var id = idMatch[2];
              
              events.push({
                "sourceId": id,
                "name": name,
                "startDate": dateTime,
                "endDate": dateTime
              });
            });
            
            resolve(events);
          })
          .catch(reject);
  
      });
    }
    
    /**
     * Does actual scraping of organizations.
     */
    scrapeOrganizations() {
      return new Promise((resolve, reject) => {
        var options = {
          url: util.format("http://%s%s", this.options.host, this.options.searchFormPath),
          encoding: this.options.encoding
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