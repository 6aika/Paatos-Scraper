/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  process.on('unhandledRejection', function(error, promise) {
    console.error("UNHANDLED REJECTION", error.stack);
  });
  
  /**
   * Abstract base class for scrapers
   */
  class AbstractScraper {
    
    constructor() {
      
    }
    
    parseFunctionId(dnoValue) {
      let dnoSplit = dnoValue.split('/');
      if (dnoSplit.length >= 3) {
        return dnoSplit[2].replace(/\./g, ' ');
      }
      
      return null;
    }      
    
    getActionContentValue(actionContents, title) {
      for (var i = 0; i < actionContents.length; i++) {
        if (actionContents[i].title === title) {
          return actionContents[i].content;
        } 
      }
      
      return null;
    }
    
    setActionContentValue(actionContents, title, content) {
      for (var i = 0; i < actionContents.length; i++) {
        if (actionContents[i].title === title) {
          actionContents[i].content = content;
          return;
        } 
      }
      
      actionContents.push({
        order: actionContents.length,
        title: title,
        content: content 
      });
    }
  }
  
  module.exports = AbstractScraper;
           
}).call(this);