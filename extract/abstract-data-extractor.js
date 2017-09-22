/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const _ = require('lodash');

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
    
    extractOrganizationData(options) {
      throw new Error("Unimplemented");
    }
    
    extractActionData(organizationId, eventId, actionId, outputZip) {
      throw new Error("Source does not support single action extracting");
    }
    
    cleanContents(contents) {
      return this.reassignContentsOrders(this.filterContents(contents));
    }
    
    filterContents(contents) {
      return _.filter(contents, (content) => { 
        return content.title !== 'Dno' && content.title !== 'functionId'; 
      });
    }
    
    reassignContentsOrders(contents) {
      return _.forEach(contents, (content, index) => {
        content.order = index;
      });
    }
    
  }
  
  module.exports = AbstractDataExtractor;
           
}).call(this);