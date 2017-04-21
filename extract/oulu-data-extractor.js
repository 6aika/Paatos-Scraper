/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const fs = require('fs');
  const util = require('util');
  const request = require('request');
  const AbstractDataExtractor = require(__dirname + '/abstract-data-extractor');
  const OuluTwebPdfScraper = require(__dirname + '/../scrapers/tweb/oulu/oulu-tweb-pdf-scraper');
  const OuluTwebHtmlScraper = require(__dirname + '/../scrapers/tweb/oulu/oulu-tweb-html-scraper');

  /**
   * Oulu implementation for data extractor
   */
  class OuluDataExtractor extends AbstractDataExtractor {
    
    constructor(options) {
      super(options);
    }
    
    extractOrganizations() {
      return new OuluTwebHtmlScraper(this.options)
        .extractOrganizations();
    }
    
    extractOrganizationEvents(organizationId, maxEvents, eventsAfter) {
      return new OuluTwebHtmlScraper(this.options)
        .extractOrganizationEvents(organizationId, maxEvents, eventsAfter);       
    }
    
    extractEventCases(organizationId, eventId) {
      return new OuluTwebHtmlScraper(this.options)
        .extractOrganizationEventCases(eventId);
    }
    
    extractActions(organizationId, eventId, caseId) {
      return new OuluTwebPdfScraper(this.options)
        .extractActions(organizationId, eventId, caseId);
    }
    
  }
  
  module.exports = OuluDataExtractor;
           
}).call(this);