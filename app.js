/*jshint esversion: 6 */
/* global __dirname, process */

(function() {
  'use strict';
  
  const util = require('util');
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
  
  let extractorOptions = {
    pdfDownloadInterval: options.getOption('pdf-download-interval') || 100,
    htmlDownloadInterval: options.getOption('html-download-interval') || 10
  };
  
  if (options.getOption('host')) {
    extractorOptions.host = options.getOption('host');
  }
  
  const extractor = DataExtractorFactory.createDataExtractor(options.getOption('source'), extractorOptions);
  
  if (options.getOption('print-organizations')) {
    extractor.extractOrganizations()
      .then((organizations) => {
        organizations.forEach((organization) => {
          console.log(util.format("%s - %s", organization.sourceId, organization.name));   
        });
      })
      .catch((err) => {
        console.error(err);
      });
      
  } else {
    extractor.extractOrganizationData(options)
      .then(() => {
        console.log("Done.");
      })
      .catch((err) => {
        console.error(err);
        process.exitCode = 1;
      });
  }
  
}).call(this);