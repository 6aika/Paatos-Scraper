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
  const VantaaTwebPdfScraper = require(__dirname + '/../scrapers/tweb/vantaa/vantaa-tweb-pdf-scraper');
  const VantaaTwebHtmlScraper = require(__dirname + '/../scrapers/tweb/vantaa/vantaa-tweb-html-scraper');
  const ResultBuilder = require(__dirname + '/../result/result-builder');
  
  /**
   * Vantaa implementation for data extractor
   */
  class VantaaDataExtractor extends AbstractDataExtractor {
    
    constructor(options) {
      super(options);
      
      this._htmlScraper = new VantaaTwebHtmlScraper(this.options);
      this._pdfScraper = new VantaaTwebPdfScraper(this.options);
    }
    
    extractOrganizations() {
      return this.extractOrganizations();
    }
  
    extractOrganizationData(options) {
      return new Promise((resolve, reject) => {
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
                var actionPromises = [];
                var eventIds = [];
                var eventOrganizationIds = [];

                for (var i = 0; i < organizationEvents.length; i++) {
                  var organizationId = organizationIds[i];
                  resultBuilder.addOrganizationEvents(organizationId, organizationEvents[i]);
                  for (var eventIndex = 0; eventIndex < organizationEvents[i].length; eventIndex++) {
                    var eventId = organizationEvents[i][eventIndex].sourceId;
                    eventIds.push(eventId);
                    eventOrganizationIds.push(organizationId);
                    actionPromises.push(this.extractEventActions(organizationId, eventId));
                  }
                }

                console.log("Extracting organization event actions...");

                Promise.all(actionPromises)
                  .then((eventActions) => {
                    var actionIds = [];
                    var actionOrganizationIds = [];
                    var actionEventIds = [];
                    var contentPromises = [];
                    var attachmentPromises = [];

                    for (let eventIndex = 0; eventIndex < eventIds.length; eventIndex++) {
                      var eventId = eventIds[eventIndex];
                      var eventOrganizationId = eventOrganizationIds[eventIndex];
                      var actions = eventActions[eventIndex];

                      for (let actionIndex = 0; actionIndex < actions.length; actionIndex++) {
                        resultBuilder.addOrganizationEventAction(eventOrganizationId, eventId, actions[actionIndex]);
                        actionIds.push(actions[actionIndex].sourceId);
                        actionOrganizationIds.push(eventOrganizationId);
                        actionEventIds.push(eventId);
                        
                        contentPromises.push(this.extractOrganizationEventActionContents(eventOrganizationId, eventId, actions[actionIndex].sourceId));
                        attachmentPromises.push(this.extractAttachments(eventOrganizationId, eventId, actions[actionIndex].sourceId));
                      }
                    }

                    console.log("Extracting organization event action contents...");

                    Promise.all([Promise.all(contentPromises), Promise.all(attachmentPromises)])
                      .then((data) => {                  
                        let actionContents = data[0];
                        let actionAttachments = data[1];

                        for (let i = 0; i < actionIds.length; i++) {
                          let actionOrganizationId = actionOrganizationIds[i];
                          let actionEventId = actionEventIds[i];
                          let actionId = actionIds[i];
                          let contents = actionContents[i];
                          let attachments = actionAttachments[i];
                          let eventAction = resultBuilder.getOrganizationEventAction(actionOrganizationId, actionEventId, actionId);

                          let caseRegisterId = this.resolveRegisterId(contents);
                          let caseFunctionId = this.resolveFunctionId(contents);

                          if (!caseRegisterId) {
                            winston.log('warn', util.format('Could not resolve registerId for Vantaa TWeb PDF (%s, %s, %s)', actionOrganizationId, actionEventId, actionId));
                          } else if (!caseFunctionId) {
                            winston.log('warn', util.format('Could not resolve functionId for Vantaa TWeb PDF (%s, %s, %s)', actionOrganizationId, actionEventId, actionId));
                          }

                          resultBuilder.setOrganizationEventAction(actionOrganizationId, actionEventId, actionId, Object.assign(eventAction, {
                            "caseId": caseRegisterId
                          }));

                          if (caseRegisterId && caseFunctionId) {
                            resultBuilder.addOrganizationCase(actionOrganizationId, {
                              "registerId": caseRegisterId,
                              "functionId": caseFunctionId,
                              "sourceId": caseRegisterId,
                              "geometries": [],
                              "title": resultBuilder.getOrganizationEventAction(actionOrganizationId, actionEventId, actionId).title
                            });
                          }

                          resultBuilder.setOrganizationActionContents(actionOrganizationId, actionEventId, actionId, this.cleanContents(contents));
                          resultBuilder.setOrganizationActionAttachments(actionOrganizationId, actionEventId, actionId, attachments);
                        }

                        console.log("Building zip file...");

                        resultBuilder.buildZip(options.getOption('output-zip'))
                          .then(resolve)
                          .catch(reject);
                      })
                      .catch(reject);
                  })
                  .catch(reject);
              })
              .catch(reject);      
          })
          .catch(reject);
        });
    }
    
    extractPdfEventActionContents(options) {
      const pdfUrl = options.getOption('pdf-url');
      const outputFile = options.getOption('output-file');
      
      return new Promise((resolve, reject) => {
        this._pdfScraper.extractPdfEventActionContents(pdfUrl)
          .then((contents) => {
            fs.writeFile(outputFile, JSON.stringify(contents), (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          })
          .catch(reject);
      }); 
    }
    
    extractOrganizations() {
      return this._htmlScraper.extractOrganizations();
    }
    
    extractOrganizationEvents(organizationId, maxEvents, eventsAfter) {
      return this._htmlScraper.extractOrganizationEvents(organizationId, maxEvents, eventsAfter);       
    }
    
    extractEventActions(organizationId, eventId) {
      return this._htmlScraper.extractOrganizationEventActions(eventId);
    }
    
    extractOrganizationEventActionContents(organizationId, eventId, actionId) {
      return this._pdfScraper.extractOrganizationEventActionContents(organizationId, eventId, actionId);
    }
    
    extractActionContents(organizationId, eventId, actionId, date, articleNumber) {
      return this._pdfScraper.extractActionContents(organizationId, eventId, actionId, date, articleNumber);
    }
    
    extractAttachments(organizationId, eventId, actionId) {
      return this._htmlScraper.extractOrganizationEventActionAttachments(organizationId, eventId);
    }
    
    resolveRegisterId(contents) {
      for (let i = 0; i < contents.length; i++) {
        if (contents[i].title === "Dno") {
          return contents[i].content;
        }
      }
      
      return null;
    }
    
    resolveFunctionId(contents) {
      for (let i = 0; i < contents.length; i++) {
        if (contents[i].title === "functionId") {
          return contents[i].content;
        }
      }
      
      return null;
    }
    
  }
  
  module.exports = VantaaDataExtractor;
           
}).call(this);