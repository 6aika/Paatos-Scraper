/*jshint esversion: 6 */
/* global __dirname, process */

(function() {
  'use strict';
  
  const DataExtractorFactory = require(__dirname + '/extract/data-extractor-factory');
  const ResultBuilder = require(__dirname + '/result/result-builder');
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

  var organizationId = options.getOption("organization-id");
  var maxEvents = options.getOption("max-events");
  var errorLog = options.getOption("error-log");
  var eventsAfter = options.getOption("events-after") ? moment(options.getOption("events-after"), "YYYY-MM-DD", true) : null;

  if (errorLog) {
    winston.add(winston.transports.File, { filename: errorLog });
    winston.remove(winston.transports.Console);
  }
  
  var extractorOptions = {};
  var extractor = DataExtractorFactory.createDataExtractor(options.getOption('source'), extractorOptions);
  var resultBuilder = new ResultBuilder();
  
  console.log("Extracting organizations...");
  
  extractor.extractOrganizations()
    .then((organizations) => {
      var eventPromises = [];
      var organizationIds = [];
        
      (organizations||[]).forEach((organization) => {
        if ((!organizationId) || (organizationId === organization.sourceId)) {
          resultBuilder.addOrganization(organization);
          organizationIds.push(organization.sourceId);
          eventPromises.push(extractor.extractOrganizationEvents(organization.sourceId, maxEvents, eventsAfter));
        }
      });
      
      console.log("Extracting organization events...");
        
      Promise.all(eventPromises)
        .then((organizationEvents) => {
          var casePromises = [];
          var eventIds = [];
          var eventOrganizationIds = [];
          
          for (var i = 0; i < organizationEvents.length; i++) {
            var organizationId = organizationIds[i];
            resultBuilder.addOrganizationEvents(organizationId, organizationEvents[i]);
            for (var eventIndex = 0; eventIndex < organizationEvents[i].length; eventIndex++) {
              var eventId = organizationEvents[i][eventIndex].sourceId;
              eventIds.push(eventId);
              eventOrganizationIds.push(organizationId);
              casePromises.push(extractor.extractEventCases(organizationId, eventId));
            }
          }
          
          console.log("Extracting organization event cases...");
      
          Promise.all(casePromises)
            .then((eventCases) => {
              var caseIds = [];
              var caseOrganizationIds = [];
              var caseEventIds = [];
              var actionPromises = [];
              
              for (let eventIndex = 0; eventIndex < eventIds.length; eventIndex++) {
                var eventId = eventIds[eventIndex];
                var eventOrganizationId = eventOrganizationIds[eventIndex];
                var cases = eventCases[eventIndex];
                
                for (let caseIndex = 0; caseIndex < cases.length; caseIndex++) {
                  resultBuilder.addOrganizationEventCase(eventOrganizationId, eventId, cases[caseIndex]);
                  caseIds.push(cases[caseIndex].sourceId);
                  caseOrganizationIds.push(eventOrganizationId);
                  caseEventIds.push(eventId);
                  actionPromises.push(extractor.extractActions(eventOrganizationId, eventId, cases[caseIndex].sourceId));
                }
              }
              
              console.log("Extracting organization event case actions...");
              
              Promise.all(actionPromises)
                .then((caseActions) => {                  
                  for (var i = 0; i < caseIds.length; i++) {
                    var caseOrganizationId = caseOrganizationIds[i];
                    var caseEventId = caseEventIds[i];
                    var caseId = caseIds[i];
                    var actions = caseActions[i];
                    resultBuilder.setOrganizationCaseActions(caseOrganizationId, caseEventId, caseId, actions);
                  }
                  
                  console.log("Building zip file...");
                  
                  resultBuilder.buildZip(options.getOption('output-zip'));
                  
                  console.log("Done.");
                })
                .catch((err) => {
                  console.error(err);
                  process.exitCode = 1;
                });
              
              
            })
            .catch((err) => {
              console.error(err);
              process.exitCode = 1;
            });
        })
        .catch((err) => {
          console.error(err);
          process.exitCode = 1;
        });      
    })
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    });
  
}).call(this);