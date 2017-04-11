/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const AbstractDataExtractor = require(__dirname + '/abstract-data-extractor');
  const OuluTwebPdfScraper = require(__dirname + '/../scrapers/tweb/oulu/oulu-tweb-pdf-scraper');
  const OuluTwebHtmlScraper = require(__dirname + '/../scrapers/tweb/oulu/oulu-tweb-html-scraper');

  /**
   * Abstract base class for all data extractors
   */
  class OuluDataExtractor extends AbstractDataExtractor {
    
    constructor(options) {
      super(options);
    }
    
    extractOrganizations() {
      return new OuluTwebHtmlScraper(this.options)
        .extractOrganizations();
    }
    
    extractOrganizationEvents(organizationId) {
      return new OuluTwebHtmlScraper(this.options)
        .extractOrganizationEvents(organizationId);       
    }
    
    extractEventCases(organizationId, eventId) {
      return new OuluTwebHtmlScraper(this.options)
        .extractOrganizationEventCases(eventId);
    }
    
  }
  
  module.exports = OuluDataExtractor;
           
}).call(this);