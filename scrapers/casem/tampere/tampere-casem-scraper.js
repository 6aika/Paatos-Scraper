/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const AbstractCasemScraper = require(__dirname + '/../abstract-casem-scraper');
  
  /**
   * Implementation for Tampere CaseM "scaraper"
   */
  class TampereCasemScraper extends AbstractCasemScraper {
    
    constructor() {
      super();
    }
    
    /**
     * Returns a promise for organizations.
     */
    extractOrganizations() {
      return new Promise((resolve, reject) => {
        resolve([]);
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
  
  module.exports = TampereCasemScraper;
           
}).call(this);