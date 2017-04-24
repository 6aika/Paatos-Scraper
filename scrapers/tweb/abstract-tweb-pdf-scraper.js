/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const util = require('util'); 
  const AbstractPdfScraper = require(__dirname + '/../abstract-pdf-scraper');

  /**
   * Abstract base class for scrapers
   */
  class AbstractTWebPdfScraper extends AbstractPdfScraper {
    
    constructor(options) {
      super(options);
    }
    
    getPdfUrl(organizationId, eventId, caseId) {
      return util.format("http://%s%s?doctype=3&docid=%s", this.options.host, this.options.pdfPath, caseId);
    }
  }
  
  module.exports = AbstractTWebPdfScraper;
           
}).call(this);