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
  const ResultBuilder = require(__dirname + '/../result/result-builder');
  
  /**
   * CaseM implementation for data extractor
   */
  class AbstractCasemDataExtractor extends AbstractDataExtractor {
    
    constructor(options, scraper) {
      super(options);
      this._scraper = scraper;
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
            const eventPromises = [];
            const organizationIds = [];

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
                const actionPromises = [];
                const eventIds = [];
                const eventOrganizationIds = [];

                for (let i = 0; i < organizationEvents.length; i++) {
                  const organizationId = organizationIds[i];
                  resultBuilder.addOrganizationEvents(organizationId, organizationEvents[i]);
                  for (let eventIndex = 0; eventIndex < organizationEvents[i].length; eventIndex++) {
                    const eventId = organizationEvents[i][eventIndex].sourceId;
                    eventIds.push(eventId);
                    eventOrganizationIds.push(organizationId);
                    actionPromises.push(this.extractOrganizationEventActions(organizationId, eventId));
                  }
                }

                console.log("Extracting organization event actions...");

                Promise.all(actionPromises)
                  .then((eventActions) => {
                    const actionIds = [];
                    const actionOrganizationIds = [];
                    const actionEventIds = [];
                    const contentPromises = [];
                    const attachmentPromises = [];

                    for (let eventIndex = 0; eventIndex < eventIds.length; eventIndex++) {
                      const eventId = eventIds[eventIndex];
                      const eventOrganizationId = eventOrganizationIds[eventIndex];
                      const actions = eventActions[eventIndex];

                      for (let actionIndex = 0; actionIndex < actions.length; actionIndex++) {
                        resultBuilder.addOrganizationEventAction(eventOrganizationId, eventId, actions[actionIndex]);
                        actionIds.push(actions[actionIndex].sourceId);
                        actionOrganizationIds.push(eventOrganizationId);
                        actionEventIds.push(eventId);

                        contentPromises.push(this.extractOrganizationEventActionContents(eventOrganizationId, eventId, actions[actionIndex].sourceId));
                        attachmentPromises.push(this.extractOrganizationEventActionAttachments(eventOrganizationId, eventId, actions[actionIndex].sourceId));
                      }
                    }

                    Promise.all([Promise.all(contentPromises), Promise.all(attachmentPromises)])
                      .then((data) => {                  
                        let actionContents = data[0];
                        let actionAttachments = data[1];

                        for (let i = 0; i < actionIds.length; i++) {
                          const actionOrganizationId = actionOrganizationIds[i];
                          const actionEventId = actionEventIds[i];
                          const actionId = actionIds[i];
                          const contents = actionContents[i];
                          const attachments = actionAttachments[i];
                          const eventAction = resultBuilder.getOrganizationEventAction(actionOrganizationId, actionEventId, actionId);
                          const caseRegisterId = this.resolveRegisterId(contents);

                          if (!caseRegisterId) {
                            winston.log('warn', util.format('Could not resolve registerId for CaseM case (%s, %s, %s)', actionOrganizationId, actionEventId, actionId));
                          } 

                          resultBuilder.setOrganizationEventAction(actionOrganizationId, actionEventId, actionId, Object.assign(eventAction, {
                            "caseId": caseRegisterId
                          }));

                          if (caseRegisterId) {
                            resultBuilder.addOrganizationCase(actionOrganizationId, {
                              "registerId": caseRegisterId,
                              "functionId": this.extractFunctionId(caseRegisterId),
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
    
    extractOrganizations() {
      return this._scraper.extractOrganizations();
    }
    
    extractOrganizationEvents(organizationId, maxEvents, eventsAfter) {
      return this._scraper.extractOrganizationEvents(organizationId, maxEvents, eventsAfter);       
    }
    
    extractOrganizationEventActions(organizationId, eventId) {
      return this._scraper.extractOrganizationEventActions(organizationId, eventId);
    }
    
    extractOrganizationEventActionContents(organizationId, eventId, actionId, date, articleNumber) {
      return this._scraper.extractOrganizationEventActionContents(organizationId, eventId, actionId);
    }
    
    extractOrganizationEventActionAttachments(organizationId, eventId, actionId) {
      return this._scraper.extractOrganizationEventActionAttachments(organizationId, eventId, actionId);
    }
    
    resolveRegisterId(contents) {
      for (let i = 0; i < contents.length; i++) {
        if (contents[i].title === "Dno") {
          return contents[i].content;
        }
      }
      
      return null;
    }
    
    extractFunctionId(dno) {
      const result = dno.split('/');
      if (result.length === 3) {
        return result[1].replace(/\./g, ' ');
      }
      
      winston.log('warn', util.format('Could not extract functionId from dno %s', dno));
      return null;
    }
    
  }
  
  module.exports = AbstractCasemDataExtractor;
           
}).call(this);