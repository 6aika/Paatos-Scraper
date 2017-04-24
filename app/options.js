/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const util = require('util');
  const moment = require('moment');
  const commandLineArgs = require('command-line-args');
  const getUsage = require('command-line-usage');
  const DataExtractorFactory = require(__dirname + '/../extract/data-extractor-factory');
  
  /**
   * Command line options
   */
  class Options {
    
    constructor() {
      this.definitions = [
        { name: 'source', alias: 's', type: String },
        { name: "print-organizations", type: Boolean },
        { name: 'output-zip', alias: 'z', type: String },
        { name: 'organization-id', alias: 'o', type: String },
        { name: 'max-events', type: Number },
        { name: 'events-after', type: String },
        { name: "error-log", type: String },
        { name: 'help', alias: 'h', type: Boolean }
      ];
      
      try {
        this.options = commandLineArgs(this.definitions);
      } catch (e) {
        this.parseException = e;
      }
    }
    
    getError() {
      if (this.parseException) {
        return this.parseException.message;
      }
      
      if (this.options['help']) {
        return 'help';
      }
      
      let required;
      
      if (this.options['print-organizations']) {
        required = ['source'];
      } else {
        required = ['source', 'output-zip', 'organization-id'];  
      }
      
      for (var i = 0; i < required.length; i++) {
        var requiredOption = required[i];
        if (!this.options[requiredOption]) {
          return util.format("Missing required option: %s", requiredOption);
        }
      }
      
      if (!DataExtractorFactory.getSources().includes(this.options['source'])) {
        return util.format("Unsupported source: %s", this.options['source']);
      }
      
      if (this.options['events-after']) {
        if (!moment(this.options['events-after'], "YYYY-MM-DD", true).isValid()) {
          return "events-after must be in YYYY-MM-DD format (e.g. 2017-01-01)"; 
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
      var sources = DataExtractorFactory.getSources();
      
      var sections = [];
      var error = this.getError();
      
      sections.push({
        header: 'Paatos-Scraper',
        content: 'Scraper to scrape decision data from web pages and PDF documents in Finland.'
      });

      sections.push({      
        header: 'Options',
        optionList: [{
          name: 'source',
          typeLabel: '[underline]{source}',
          description: util.format('The source where to retrieve the date. Supported sources are: %s', sources.join(','))
        }, {
          name: 'print-organizations',
          description: 'Print organizations and exit without extracting data'
        }, {
          name: 'output-zip',
          typeLabel: '[underline]{output zip file}',
          description: 'The target zip-file where retrieved data will be stored'
        }, {
          name: 'organization-id',
          description: 'Organization id in source system format'
        }, {
          name: 'max-events',
          description: 'Limit number of events'
        }, {
          name: 'events-after',
          description: 'Extract only events after specified date. Date should be formatted in following format: YYYY-MM-DD'
        }, {
          name: 'error-log',
          description: 'Path to error log file. By default errors are written into console.'
        }, {
          name: 'help',
          description: 'Print this usage guide.'
        }]
      });
      
      if (error && error !== 'help') {
        sections.push({
          header: error
        });
      };
      
      console.log(getUsage(sections));
    }
    
  }
  
  module.exports = new Options();
           
}).call(this);