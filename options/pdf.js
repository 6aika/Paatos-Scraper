/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const util = require('util');
  const AbstractOptions = require(__dirname + '/abstract-options');
  const commandLineArgs = require('command-line-args');
  const DataExtractorFactory = require(__dirname + '/../extract/data-extractor-factory');
  const getUsage = require('command-line-usage');
  
  /**
   * Command line options
   */
  class Options extends AbstractOptions {
    
    constructor() {
      super([
        { name: 'source', alias: 's', type: String },
        { name: 'pdf-url', type: String },
        { name: 'output-file', type: String },
        { name: "error-log", type: String },
        { name: 'help', alias: 'h', type: Boolean }
      ]);
    }
    
    getRequired() {
      return ['source', 'pdf-url', 'output-file'];
    }
    
    getError() {
      const superError = super.getError();
      if (superError) {
        return superError;
      }
      
      if (!DataExtractorFactory.getPdfSources().includes(this.options['source'])) {
        return util.format("Unsupported source: %s", this.options['source']);
      }
    }
    
    getSections() {
      const sections = [];
      const sources = DataExtractorFactory.getPdfSources();
      
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
          name: 'pdf-url',
          typeLabel: '[underline]{pdf-url}',
          description: 'The URL address of PDF file to be scraped'
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