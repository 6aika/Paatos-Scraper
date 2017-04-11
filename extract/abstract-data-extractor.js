/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  /**
   * Abstract base class for all data extractors
   */
  class AbstractDataExtractor {
    
    constructor(options) {
      this.options = options || {};
    }
    
    extractOrganizations() {
      throw new Error("Unimplemented");
    }
    
    extractOrganizationEvents(organizationId) {
      throw new Error("Unimplemented");
    }
    
    extractEventCases(organizationId, eventId) {
      throw new Error("Unimplemented");
    }
    
  }
  
  module.exports = AbstractDataExtractor;
           
}).call(this);