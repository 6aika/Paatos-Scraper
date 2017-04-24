/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const _ = require('lodash');
  const util = require('util');
  const moment = require('moment');
  const Promise = require('bluebird'); 
  const normalize = require('normalize-space');
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
      
      this.options = Object.assign({
        "host": "asiakirjat.ouka.fi",
        "searchFormPath": "/ktwebbin/dbisa.dll/ktwebscr/pk_tek_tweb.htm",
        "eventsPath": "/ktwebbin/dbisa.dll/ktwebscr/pk_kokl_tweb.htm",
        "eventPath": "/ktwebbin/dbisa.dll/ktwebscr/pk_asil_tweb.htm",
        "eventCaseAttachmentsPath": "/ktwebbin/dbisa.dll/ktwebscr/epjattn_tweb.htm",
        "encoding": "binary",
        "requestInterval": 10
      }, options || {});
    }
    
    /**
     * Returns a promise for organization events.
     * 
     * Returned data is ordered in same order that it is in html page. 
     * 
     * @param {String} organizationId organizationId where to scrape events
     * @param {Integer} maxEvents max events to return
     * @param {Moment} eventsAfter return only events afer the moment
     */
    extractOrganizationEvents(organizationId, maxEvents, eventsAfter) {
      return new Promise((resolve, reject) => {       
        var options = {
          "url": util.format("http://%s%s", this.options.host, this.options.eventsPath),
          "method": "POST",
          "encoding": this.options.encoding,
          "form": {
            'kirjaamo': organizationId,
            'oper': 'where'
          },
          requestInterval: this.options.requestInterval
        };
        
        this.getParsedHtml(options)
          .then(($) => {
            var events = [];
    
            $('table.list tr[class*="data"]').each((index, row) => {
              var link = $(row).find('td:nth-of-type(1) a');
              var dateText = link.text();
              var linkHref = link.attr('href');
              var idMatch = /(.*bid=)([0-9]*)(.*)/.exec(linkHref); 
              var name =  $(row).find('td:nth-of-type(2)').text();
              var eventStart = moment(dateText, 'D.M.YYYY HH:mm', true);
              var eventEnd = moment(dateText, 'D.M.YYYY HH:mm', true);
              var id = idMatch[2];
              
              if (!eventsAfter || eventsAfter.isBefore(eventStart)) {
                events.push({
                  "sourceId": id,
                  "name": name,
                  "startDate": eventStart.toISOString(),
                  "endDate": eventEnd.toISOString()
                });
              }
            });
            
            if (maxEvents) {
              events = events.splice(0, maxEvents);  
            }
            
            resolve(events);
          })
          .catch(reject);
  
      });
    }
    
    /**
     * Returns a promise for organization event cases.
     * 
     * Returned data is ordered in same order that it is in html page. 
     * 
     * @param {String} eventId eventId where to scrape cases
     */
    extractOrganizationEventCases(eventId) {
      return new Promise((resolve, reject) => {       
        var options = {
          "url": util.format("http://%s%s", this.options.host, this.options.eventPath),
          "method": "GET",
          "encoding": this.options.encoding,
          "qs": {
            "+bid": eventId 
          },
          qsStringifyOptions: { encode: false },
          requestInterval: this.options.requestInterval
        };
        
        this.getParsedHtml(options)
          .then(($) => {
            var cases = [];
            var rows = $('table.list tr[class*="data"]').filter((index, row) => {
              return !!$(row).find('.data_pykala').text();
            });
                    
            rows.each((index, row) => {
              var link = $(row).find('td.data:nth-of-type(2) a');
              var linkHref = link.attr('href');
              var idMatch = /(.*docid=)([0-9]*)(.*)/.exec(linkHref);
              
              var id = idMatch[2];
              var articleNumber = $(row).find('.data_pykala').text();
              var title = normalize(link.text());
              
              cases.push({
                "sourceId": id,  
                "articleNumber": articleNumber,
                "title": title,
                "function": null,
                "geometries": null
              });
            });
 
            resolve(cases);
          })
          .catch(reject);
  
      });
    }
    
    /**
     * Returns a promise for organization event case attachments.
     * 
     * Returned data is ordered in same order that it is in html page. 
     * 
     * @param {String} organizationId organizationId 
     * @param {String} eventId eventId
     * @param {String} caseId caseId
     */
    extractOrganizationEventCaseActionAttachments(organizationId, eventId, caseId) {
      return new Promise((resolve, reject) => {       
        var options = {
          "url": util.format("http://%s%s?%s", this.options.host, this.options.eventCaseAttachmentsPath, caseId),
          "method": "GET",
          "encoding": this.options.encoding,
          requestInterval: this.options.requestInterval
        };
        
        this.getParsedHtml(options)
          .then(($) => {
            var attachments = [];
            var rows = $('table.list tr[class*="data"]');
                    
            rows.each((index, row) => {
              let link = $(row).find('td.data a');
              let linkHref = link.attr('href');
              let idMatch = /(.*docid=)([0-9]*)(.*)/.exec(linkHref);
              let id = idMatch[2];
              var url = util.format("http://%s%s", this.options.host, linkHref);
              let name = normalize(link.text());
              let headers = this.getHeaders(url);
              let contentDisposition = headers['content-disposition'] ? this.parseContentDisposition(headers['content-disposition']) : null;
              let filename = null;
              
              if (contentDisposition && contentDisposition.parameters) {
                filename = contentDisposition.parameters.filename;
              }
              
              if (!filename) {
                filename = id;
              }
            
              attachments.push({
                "sourceId": id,
                "name": name,
                "filename": filename,
                "url": url,
                "actionId": null,
                "number": index,
                "public": true,
                "confidentialityReason": null,
                "contentType": headers['content-type'],
                "contentLength": headers['content-length']
              });
            });
            
            resolve(attachments);
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