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
    
    extractOrganizationEvents(organizationId) {
      return new OuluTwebHtmlScraper(this.options)
        .extractOrganizationEvents(organizationId);       
    }
    
    extractEventCases(organizationId, eventId) {
      return new OuluTwebHtmlScraper(this.options)
        .extractOrganizationEventCases(eventId);
    }
    
    extractActions(organizationId, eventId, caseId) {
      // TODO: Reuse scraper, when scraping same pdf
      return new OuluTwebPdfScraper(this.getPdfStream(organizationId, eventId, caseId))
        .extractActions();
    }
    
    extractContents(organizationId, eventId, caseId) {
      // TODO: Reuse scraper, when scraping same pdf
      return new OuluTwebPdfScraper(this.getPdfStream(organizationId, eventId, caseId))
        .extractContents();
    }
    
    getPdfStream(organizationId, eventId, caseId) {
      var downloadUrl = util.format('http://%s/ktwebbin/ktproxy2.dll?doctype=3&docid=%s', this.options.host, caseId);
      return request(downloadUrl);
    }
  }
  
  module.exports = OuluDataExtractor;
           
}).call(this);