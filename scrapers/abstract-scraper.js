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
    
    getActionValue(actions, title) {
      for (var i = 0; i < actions.length; i++) {
        if (actions[i].title === title) {
          return actions[i].content;
        } 
      }
      
      return null;
    }
    
    setActionValue(actions, title, content) {
      for (var i = 0; i < actions.length; i++) {
        if (actions[i].title === title) {
          actions[i].content = content;
          return;
        } 
      }
      
      actions.push({
        order: actions.length,
        title: title,
        content: content 
      });
    }
  }
  
  module.exports = AbstractScraper;
           
}).call(this);