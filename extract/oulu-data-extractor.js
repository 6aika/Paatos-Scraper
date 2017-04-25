/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const fs = require('fs');
  const util = require('util');
  const request = require('request');
  const _ = require('lodash');
  const moment = require('moment');
  const winston = require('winston');
  const Promise = require('bluebird'); 
  const AbstractDataExtractor = require(__dirname + '/abstract-data-extractor');
  const OuluTwebPdfScraper = require(__dirname + '/../scrapers/tweb/oulu/oulu-tweb-pdf-scraper');
  const OuluTwebHtmlScraper = require(__dirname + '/../scrapers/tweb/oulu/oulu-tweb-html-scraper');
  const ResultBuilder = require(__dirname + '/../result/result-builder');

  /**
   * Oulu implementation for data extractor
   */
  class OuluDataExtractor extends AbstractDataExtractor {
    
    constructor(options) {
      super(options);
      
      this._htmlScraper = new OuluTwebHtmlScraper(this.options);
      this._pdfScraper = new OuluTwebPdfScraper(this.options);
    }
    
    extractOrganizations() {
      return this.extractOrganizations();
    }
  
    extractOrganizationData(options) {
      const resultBuilder = new ResultBuilder();      
      const organizationId = options.getOption("organization-id");
      const maxEvents = options.getOption("max-events");
      const eventsAfter = options.getOption("events-after") ? moment(options.getOption("events-after"), "YYYY-MM-DD", true) : null;

      console.log("Extracting organizations...");

      this.extractOrganizations()
        .then((organizations) => {
          var eventPromises = [];
          var organizationIds = [];

          (organizations||[]).forEach((organization) => {
            if ((!organizationId) || (organizationId === organization.sourceId)) {
              resultBuilder.addOrganization(organization);
              organizationIds.push(organization.sourceId);
              eventPromises.push(this.extractOrganizationEvents(organization.sourceId, maxEvents, eventsAfter));
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
                  casePromises.push(this.extractEventCases(organizationId, eventId));
                }
              }

              console.log("Extracting organization event cases...");

              Promise.all(casePromises)
                .then((eventCases) => {
                  var caseIds = [];
                  var caseOrganizationIds = [];
                  var caseEventIds = [];
                  var actionPromises = [];
                  var attachmentPromises = [];

                  for (let eventIndex = 0; eventIndex < eventIds.length; eventIndex++) {
                    var eventId = eventIds[eventIndex];
                    var eventOrganizationId = eventOrganizationIds[eventIndex];
                    var cases = eventCases[eventIndex];

                    for (let caseIndex = 0; caseIndex < cases.length; caseIndex++) {
                      resultBuilder.addOrganizationEventCase(eventOrganizationId, eventId, cases[caseIndex]);
                      caseIds.push(cases[caseIndex].sourceId);
                      caseOrganizationIds.push(eventOrganizationId);
                      caseEventIds.push(eventId);
                      actionPromises.push(this.extractActions(eventOrganizationId, eventId, cases[caseIndex].sourceId));
                      attachmentPromises.push(this.extractAttachments(eventOrganizationId, eventId, cases[caseIndex].sourceId));
                    }
                  }

                  console.log("Extracting organization event case actions...");

                  Promise.all([Promise.all(actionPromises), Promise.all(attachmentPromises)])
                    .then((data) => {                  
                      let caseActions = data[0];
                      let caseAttachments = data[1];

                      for (let i = 0; i < caseIds.length; i++) {
                        let caseOrganizationId = caseOrganizationIds[i];
                        let caseEventId = caseEventIds[i];
                        let caseId = caseIds[i];
                        let actions = caseActions[i];
                        let attachments = caseAttachments[i];
                        let eventCase = resultBuilder.getOrganizationEventCase(caseOrganizationId, caseEventId, caseId);
                        
                        let articleNumber = eventCase['articleNumber'];
                        let caseRegisterId = this.resolveRegisterId(actions);
                        let caseFunctionId = this.resolveFunctionId(actions);
                        
                        if (!caseRegisterId) {
                          winston.log('warn', util.format('Could not resolve registerId for Oulu TWeb PDF (%s, %s, %s)', caseOrganizationId, caseEventId, caseId));
                        }
                        
                        if (!caseFunctionId) {
                          winston.log('warn', util.format('Could not resolve functionId for Oulu TWeb PDF (%s, %s, %s)', caseOrganizationId, caseEventId, caseId));
                        }
                        
                        actions.push({
                          "title": "articleNumber",
                          "order": actions.length,
                          "content": util.format("%d", articleNumber)
                        });
                        
                        delete eventCase.articleNumber;
                        
                        resultBuilder.setOrganizationEventCase(caseOrganizationId, caseEventId, caseId, Object.assign(eventCase, {
                          "registerId": caseRegisterId,
                          "functionId": caseFunctionId
                        }));
 
                        resultBuilder.setOrganizationCaseActions(caseOrganizationId, caseEventId, caseId, actions);
                        resultBuilder.setOrganizationCaseAttachments(caseOrganizationId, caseEventId, caseId, attachments);
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
    }
    
    extractOrganizations() {
      return this._htmlScraper.extractOrganizations();
    }
    
    extractOrganizationEvents(organizationId, maxEvents, eventsAfter) {
      return this._htmlScraper.extractOrganizationEvents(organizationId, maxEvents, eventsAfter);       
    }
    
    extractEventCases(organizationId, eventId) {
      return this._htmlScraper.extractOrganizationEventCases(eventId);
    }
    
    extractActions(organizationId, eventId, caseId) {
      return this._pdfScraper.extractActions(organizationId, eventId, caseId);
    }
    
    extractAttachments(organizationId, eventId, caseId) {
      return this._htmlScraper.extractOrganizationEventCaseActionAttachments(organizationId, eventId, caseId);
    }
    
    resolveRegisterId(actions) {
      for (let i = 0; i < actions.length; i++) {
        if (actions[i].title === "Dno") {
          return actions[i].content;
        }
      }
      
      return null;
    }
    
    resolveFunctionId(actions) {
      for (let i = 0; i < actions.length; i++) {
        if (actions[i].title === "functionId") {
          return actions[i].content;
        }
      }
      
      return null;
    }
    
  }
  
  module.exports = OuluDataExtractor;
           
}).call(this);