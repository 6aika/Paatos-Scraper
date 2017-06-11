/*jshint esversion: 6 */
/* global __dirname, process */

(function() {
  'use strict';
  
  const util = require('util');
  const DataExtractorFactory = require(__dirname + '/extract/data-extractor-factory');
  const Promise = require('bluebird'); 
  const options = require(__dirname + '/options/pdf');
  const winston = require('winston');
  const moment = require('moment');
  
  if (!options.isOk()) {
    options.printUsage();
    process.exitCode = 1;
    return;
  }
  
  winston.level = 'debug';

  const errorLog = options.getOption("error-log");
  if (errorLog) {
    winston.add(winston.transports.File, { filename: errorLog });
    winston.remove(winston.transports.Console);
  }
  
  const extractor = DataExtractorFactory.createDataExtractor(options.getOption('source'));
  extractor.extractPdfEventActionContents(options)
    .then(() => {
      console.log("Done.");
    })
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    });
  
  
}).call(this);