/*jshint esversion: 6 */
/* global __dirname, process */

(function() {
  'use strict';
  
  const DataExtractorFactory = require(__dirname + '/extract/data-extractor-factory');
  const Promise = require('bluebird'); 
  const options = require(__dirname + '/app/options');
  const winston = require('winston');
  const moment = require('moment');
  
  if (!options.isOk()) {
    options.printUsage();
    process.exitCode = 1;
    return;
  }
  
  winston.level = 'debug';

  var errorLog = options.getOption("error-log");
  if (errorLog) {
    winston.add(winston.transports.File, { filename: errorLog });
    winston.remove(winston.transports.Console);
  }
  
  let extractorOptions = {};
  let extractor = DataExtractorFactory.createDataExtractor(options.getOption('source'), extractorOptions);
  extractor.extractData(options);
  
}).call(this);