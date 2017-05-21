/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const util = require('util');
  const winston = require('winston');
  const normalize = require('normalize-space');
  
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
        resolve([]);
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
        resolve([]);
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
    
  }
  
  module.exports = EspooHtmlScraper;
           
}).call(this);