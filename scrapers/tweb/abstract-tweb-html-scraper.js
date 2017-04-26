/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const _ = require('lodash');
  const util = require('util');
  const moment = require('moment');
  const Promise = require('bluebird'); 
  const normalize = require('normalize-space');
  const request = require('request');
  const winston = require('winston');
  const AbstractHtmlScraper = require(__dirname + '/../abstract-html-scraper');
  
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
            var select = $('form[name="form1"] select[name="kirjaamo"]').first();
            
            var options = $(select).find('option').filter((index, option) => {
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
              let link = $(row).find('td:nth-of-type(1) a');
              let dateText = link.text();
              let linkHref = link.attr('href');
              let idMatch = /(.*bid=)([0-9]*)(.*)/.exec(linkHref); 
              let eventStart = moment(dateText, 'D.M.YYYY HH:mm', true);
              let eventEnd = moment(dateText, 'D.M.YYYY HH:mm', true);
              let name = this.getEventName($(row).find('td:nth-of-type(2)').text(), eventStart, eventEnd);
              let id = idMatch[2];
              
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
     * Returns a promise for organization event case attachments.
     * 
     * Returned data is ordered in same order that it is in html page. 
     * 
     * @param {String} organizationId organizationId 
     * @param {String} eventId eventId
     * @param {String} actionId actionId
     */
    extractOrganizationEventActionAttachments(organizationId, eventId, actionId) {
      return new Promise((resolve, reject) => {       
        var options = {
          "url": util.format("http://%s%s?%s", this.options.host, this.options.eventCaseAttachmentsPath, actionId),
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
                "actionId": actionId,
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
     * Returns event's name.
     * 
     * @param {type} name original name in html page
     * @param {type} startDate event's start date
     * @param {type} endDate event's end datte
     * @returns {String} event's name
     */
    getEventName(name, startDate, endDate) {
      return name;  
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
        "toimikunta",
        "toimielin",
        "neuvosto"
      ];
      
      for (var i = 0; i < classifications.length; i++) {
        if (lowerCaseName.includes(classifications[i])) {
          return classifications[i];
        }
      }
      
      winston.log('warn', util.format('Could not guess classification for %s', name));
       
      return null;
    }
    
  }
  
  module.exports = AbstractTWebHtmlScraper;
           
}).call(this);