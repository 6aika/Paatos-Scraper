/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const util = require('util');
  const moment = require('moment');
  const commandLineArgs = require('command-line-args');
  const getUsage = require('command-line-usage');
  const DataExtractorFactory = require(__dirname + '/../extract/data-extractor-factory');
  const AbstractOptions = require(__dirname + '/abstract-options');
  
  /**
   * Command line options
   */
  class Options extends AbstractOptions {
    
    constructor() {
      super([
        { name: 'source', alias: 's', type: String },
        { name: "print-organizations", type: Boolean },
        { name: 'output-zip', alias: 'z', type: String },
        { name: 'organization-id', alias: 'o', type: String },
        { name: 'action-id', alias: 'a', type: String },
        { name: 'event-id', alias: 'e', type: String },
        { name: 'max-events', type: Number },
        { name: 'pdf-download-interval', type: Number },
        { name: 'html-download-interval', type: Number },
        { name: 'host', type: String },
        { name: 'events-after', type: String },
        { name: "error-log", type: String },
        { name: 'help', alias: 'h', type: Boolean }
      ]);
    }
    
    getRequired() {
      if (this.options['print-organizations']) {
        return ['source'];
      } else {
        return ['source', 'output-zip', 'organization-id'];  
      }
    }
    
    getError() {
      const superError = super.getError();
      if (superError) {
        return superError;
      }
      
      if (!DataExtractorFactory.getSources().includes(this.options['source'])) {
        return util.format("Unsupported source: %s", this.options['source']);
      }
      
      if (this.options['events-after']) {
        if (!moment(this.options['events-after'], "YYYY-MM-DD", true).isValid()) {
          return "events-after must be in YYYY-MM-DD format (e.g. 2017-01-01)"; 
        }
      }
      
      const actionId = this.options['action-id'];
      const eventId = this.options['event-id'];
      
      if (actionId || eventId) {
        if (!actionId) {
          return "action-id is required when event-id is specified"; 
        }
        
        if (!eventId) {
          return "event-id is required when action-id is specified"; 
        }
        
        if (!DataExtractorFactory.getSingleActionSource().includes(this.options['source'])) {
          return util.format("Source: %s does not support extracting single actions", this.options['source']);
        }
      }
    }
    
    getSections() {
      const sections = [];
      const sources = DataExtractorFactory.getSources();
      
      sections.push({
        header: 'Paatos-Scraper',
        content: 'Scraper to scrape decision data from web pages and PDF documents in Finland.'
      });

      sections.push({      
        header: 'Options',
        optionList: [{
          name: 'source',
          typeLabel: '[underline]{source}',
          description: util.format('The source where to retrieve the date. Supported sources are: %s', sources.join(', '))
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
          name: 'event-id',
          description: 'Event id in source system format. Specify this and action-id to scrape single action'
        }, {
          name: 'action-id',
          description: 'Action id in source system format. Specify this and event-id to scrape single action'
        }, {
          name: 'max-events',
          description: 'Limit number of events'
        }, {
          name: 'pdf-download-interval',
          description: 'Interval between downloading PDF-files in milliseconds. Defaults to 100ms'
        }, {
          name: 'html-download-interval',
          description: 'Interval between downloading HTML-pages in milliseconds. Defaults to 10ms'
        }, {
          name: 'host',
          description: 'Override the default hostname of service being scraped'
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
      
      return sections;
    }
    
  }
  
  module.exports = new Options();
           
}).call(this);