/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const _ = require('lodash');
  const util = require('util');
  const winston = require('winston');
  const moment = require('moment');
  const normalize = require('normalize-space');
  const Promise = require('bluebird');
  
  const AbstractHtmlScraper = require(__dirname + '/../abstract-html-scraper');
  const organizationMapping = require(__dirname + '/organization-mapping');
  
  /**
   * Implementation for Espoo Html scaraper
   */
  class EspooHtmlScraper extends AbstractHtmlScraper {
    
    constructor(options) {
      super();
      
      this.options = Object.assign({
        "host": "espoo04.hosting.documenta.fi",
        "encoding": "binary"
      }, options || {});
    }
    
    /**
     * Returns a promise for organizations.
     */
    extractOrganizations() {
      const options = {
        "url": util.format("http://%s/kokous/TELIMET.HTM", this.options.host),
        "encoding": this.options.encoding
      };
        
      return new Promise((resolve, reject) => {
        const organizations = [];
        
        this.getParsedHtml(options)
          .then(($) => {
            const rows = $('table.tbl tr').filter((index, row) => {
              return !$(row).is('.trHea'); 
            });

            rows.each((index, row) => {
              const link = $($(row).find('.tcDat').first()).find('a');
              if (!link.length) {
                winston.log('warn', 'Could not find organization link');
                return;
              }
              
              const linkHref = $(link).attr('href');
              const name = normalize($(link).text());
              const idMatch = /(TELIN-)(.*)(.HTM)/.exec(linkHref);
              
              if (idMatch.length !== 4) {
                winston.log('warn', util.format('Unexpected organization link href %s', linkHref));
                return;
              }
              
              const id = idMatch[2];
              if (!id) {
                winston.log('warn', util.format('Invalid id read from href %s', linkHref));
                return;
              }
              
              if (organizationMapping[id]) {
                return;
              }
              
              if (!name) {
                winston.log('warn', util.format('Could not read title from organization %s', id));
                return;
              }
              
              organizations.push({
                "sourceId": id,
                "name": name,
                "classification": this.guessClassification(name),
                "dissolution_date": null,
                "founding_date": null,
                "parent": null
              });
              
            });
            
            resolve(organizations);
          })
          .catch(reject);
      });
    }
    
    /**
     * Returns a promise for organization events.
     * 
     * @param {String} organizationId organizationId where to scrape events
     * @param {Integer} maxEvents max events to return
     * @param {Moment} eventsAfter return only events afer the moment
     */
    extractOrganizationEvents(organizationId, maxEvents, eventsAfter) {
      return new Promise((resolve, reject) => {
        const pageLoads = [ this.extractOrganizationPageEvents(organizationId, eventsAfter) ];
        
        _.forEach(organizationMapping, (value, key) => {
          if (value === organizationId) {
             pageLoads.push(this.extractOrganizationPageEvents(key, eventsAfter));
          }
        });
        
        Promise.all(pageLoads)
          .then((data) => {
            let events = [];
            for (let i = 0; i < data.length; i++) {
              events = events.concat(data[i]);
            }
            
            events.sort(function (event1, event2) {
              return moment(event2.startDate).diff(moment(event1.startDate));
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
     * Returns a promise for organization event actions.
     * 
     * @param {String} organizationId organizationId where to scrape actions
     * @param {String} eventId eventId where to scrape actions
     */
    extractOrganizationEventActions(organizationId, eventId) {
      return new Promise((resolve, reject) => {
        const options = {
          "url": util.format("http://%s/kokous/%s.HTM", this.options.host, eventId),
          "encoding": this.options.encoding
        };
          
        let actions = [];

        this.getParsedHtml(options)
          .then(($) => {
            const table = $('body>p>table:first-of-type table').first();
            
            const rows = table.find('tr').filter((index, row) => {
              return !$(row).is('.trHea') && 
                $(row).find('.tcHeaSepa').length === 0 &&
                $(row).find('td a').length;
            });

            rows.each((index, row) => {
              const link = $(row).find('a');
              if (!link.length) {
                winston.log('warn', util.format('Could not find link from event %s', eventId));
                return;
              }
              
              const title = normalize(link.text());
              if (!title) {
                winston.log('warn', util.format('Could not read title from event %s', eventId));
                return;
              }
              
              const linkHref = $(link).attr('href');
              const idMatch = /(.*kokous\/)(.*)(.HTM)/.exec(linkHref);
              
              if (!idMatch || idMatch.length !== 4) {
                winston.log('warn', util.format('Unexpected link href %s in event %s', linkHref, eventId));
                return;
              }
              
              const id = idMatch[2];
              if (!id) {
                winston.log('warn', util.format('Invalid id read from href %s in event %s', linkHref, eventId));
                return;
              }
              
              const articleNumber = normalize($(row).find('td:first-of-type').text());
              if (!articleNumber) {
                winston.log('warn', util.format('Invalid articleNumber read from link text %s in event %s', linkText, eventId));
                return;
              }
              
              actions.push({
                "sourceId": id,  
                "articleNumber": articleNumber,
                "title": title,
                "ordering": index,
                "eventId": eventId
              });
              
            });
            
            resolve(actions);
          })
          .catch(reject);
      });
    }
    
    /**
     * Returns a promise for organization event action contents.s
     * 
     * @param {String} organizationId organizationId 
     * @param {String} eventId eventId
     * @param {String} actionId actionId
     */
    extractOrganizationEventActionContents(organizationId, eventId, actionId) {
      return new Promise((resolve, reject) => {
        resolve([]);
      });
    }
    
    /**
     * Returns a promise for organization event action attachments.
     * 
     * @param {String} organizationId organizationId 
     * @param {String} eventId eventId
     * @param {String} actionId actionId
     */
    extractOrganizationEventActionAttachments(organizationId, eventId, actionId) {
      return new Promise((resolve, reject) => {
        resolve([]);
      });
    }
    
    
    /**
     * Extracts events for a year
     * 
     * @param {String} organizationId organizationId where to scrape events
     * @param {Moment} eventsAfter return only events afer the moment
     * @returns {Promise}
     */
    extractOrganizationPageEvents(organizationId, eventsAfter) {
      return new Promise((resolve, reject) => {
        const options = {
          "url": util.format("http://%s/kokous/TELIN-%s.HTM", this.options.host, organizationId),
          "encoding": this.options.encoding
        };
          
        let events = [];

        this.getParsedHtml(options)
          .then(($) => {
            const rows = $('table.tbl tr').filter((index, row) => {
              return !$(row).is('.trHea') && 
                $(row).find('.tcHeaSepa').length === 0 &&
                $(row).find('td a').length;
            });

            rows.each((index, row) => {
              const dateStr = normalize($(row).find('td.tcDat:nth-of-type(1)').text());
              const linkHref = $(row).find('td.tcDat:nth-of-type(2) a').attr('href');
              const idMatch = /(.*kokous\/)(.*)(.HTM)/.exec(linkHref);
              
              if (!idMatch || idMatch.length !== 4) {
                winston.log('warn', util.format('Could not read id from href %s', linkHref));
                return;
              }

              const id = idMatch[2];
              const eventStart = moment(dateStr, 'DD.MM.YYYY', 'fi', true);
              
              if (!id) {
                winston.log('warn', util.format('Invalid id read from href %s', linkHref));
                return;
              }

              if (!eventStart.isValid()) {
                winston.log('warn', util.format('Could not parse date from name %s', name));
                return;
              }
              
              const organizationName = normalize($('label.h3').text().replace('Kokouslistat', ''));
              if (!organizationName) {
                winston.log('warn', util.format('Could not resolve organization name from event %s', id));
                return;
              }
              
              if (!eventsAfter || eventsAfter.isBefore(eventStart)) {
                events.push({
                  "sourceId": id,
                  "name": util.format("%s - %s", organizationName, dateStr),
                  "startDate": eventStart.format(),
                  "endDate": eventStart.format()
                });
              }
            });
            
            resolve(events);
          })
          .catch(reject);
      });
    }
    
  }
  
  module.exports = EspooHtmlScraper;
           
}).call(this);