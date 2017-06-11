/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const util = require('util');
  const commandLineArgs = require('command-line-args');
  const getUsage = require('command-line-usage');
  
  /**
   * Command line options
   */
  class AbstractOptions {
    
    constructor(definitions, required) {
      this.definitions = definitions;
      
      try {
        this.options = commandLineArgs(this.definitions);
      } catch (e) {
        this.parseException = e;
      }
    }
    
    getRequired() {
      return [];
    }
    
    getError() {
      if (this.parseException) {
        return this.parseException.message;
      }
      
      if (this.options['help']) {
        return 'help';
      }
      
      const required = this.getRequired();
      for (var i = 0; i < required.length; i++) {
        var requiredOption = required[i];
        if (!this.options[requiredOption]) {
          return util.format("Missing required option: %s", requiredOption);
        }
      }
      
      return null;
    }
    
    isOk() {
      return !this.getError();
    }
    
    getOptions() {
      return this.options;
    }
    
    getOption(name, defaultValue) {
      return this.options[name] || defaultValue;
    }
   
    printUsage() {
      const error = this.getError();
      const sections = this.getSections();
      
      if (error && error !== 'help') {
        sections.push({
          header: error
        });
      };
      
      console.log(getUsage(sections));
    } 
  }
  
  module.exports = AbstractOptions;
           
}).call(this);