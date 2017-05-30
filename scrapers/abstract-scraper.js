/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const winston = require('winston');
  const util = require('util');

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
    
    /**
     * Guesses the classification from the organization's name
     * 
     * @param {String} name name of the organization
     * @returns {String} classification
     */
    guessClassification(name) {
      const lowerCaseName = name.toLowerCase();
      const classifications = [
        "johtokunta", 
        "lautakunta", 
        "toimikunta", 
        "jaosto",
        "hallitus", 
        "valtuusto", 
        "toimikunta",
        "toimielin",
        "neuvosto"
      ];
      
      for (let i = 0; i < classifications.length; i++) {
        if (lowerCaseName.includes(classifications[i])) {
          return classifications[i];
        }
      }
      
      winston.log('warn', util.format('Could not guess classification for %s', name));
       
      return null;
    }
  }
  
  module.exports = AbstractScraper;
           
}).call(this);