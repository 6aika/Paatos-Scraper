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
  const EspooHtmlScraper = require(__dirname + '/../scrapers/espoo/espoo-html-scraper');
  const ResultBuilder = require(__dirname + '/../result/result-builder');
  
  /**
   * Espoo implementation for data extractor
   */
  class EspooDataExtractor extends AbstractDataExtractor {
    
    constructor(options) {
      super(options);
      this._htmlScraper = new EspooHtmlScraper(this.options);
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
                        const actionContents = data[0];
                        const actionAttachments = data[1];

                        for (let i = 0; i < actionIds.length; i++) {
                          this.appendResultBuilderAction(resultBuilder, actionOrganizationIds[i], actionEventIds[i], actionIds[i], actionContents[i], actionAttachments[i]);
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
    
    appendResultBuilderAction(resultBuilder, actionOrganizationId, actionEventId, actionId, contents, attachments) {      
      const eventAction = resultBuilder.getOrganizationEventAction(actionOrganizationId, actionEventId, actionId);
      const caseRegisterId = this.resolveRegisterId(contents);
      const caseFunctionId = this.resolveFunctionId(contents);
      
      if (!caseRegisterId) {
        winston.log('warn', util.format('Could not resolve registerId for Espoo case (%s, %s, %s)', actionOrganizationId, actionEventId, actionId));
      } else if (!caseFunctionId) {
        winston.log('warn', util.format('Could not resolve functionId for Espoo case (%s, %s, %s)', actionOrganizationId, actionEventId, actionId));
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
    
    extractActionData(organizationId, eventId, actionId, outputZip) {
      return this.extractAction(organizationId, eventId, actionId)
        .then((data) => {
          const actionContents = data[0];
          const actionAttachments = data[1];
          
          const resultBuilder = new ResultBuilder();
          
          resultBuilder.addOrganization({
            sourceId: organizationId
          });
          
          resultBuilder.addOrganizationEvents(organizationId, [{
            sourceId: eventId
          }]);
          
          resultBuilder.addOrganizationEventAction(organizationId, eventId, {
            sourceId: actionId
          });
                        
          this.appendResultBuilderAction(resultBuilder, organizationId, eventId, actionId, actionContents, actionAttachments);
          
          return resultBuilder.buildZip(outputZip);
        });
    }
    
    extractOrganizations() {
      return this._htmlScraper.extractOrganizations();
    }
    
    extractOrganizationEvents(organizationId, maxEvents, eventsAfter) {
      return this._htmlScraper.extractOrganizationEvents(organizationId, maxEvents, eventsAfter);       
    }
    
    extractOrganizationEventActions(organizationId, eventId) {
      return this._htmlScraper.extractOrganizationEventActions(organizationId, eventId);
    }
    
    extractAction(organizationId, eventId, actionId) {
      const contentsPromise = this.extractOrganizationEventActionContents(organizationId, eventId, actionId);
      const attachmentsPromise = this.extractOrganizationEventActionAttachments(organizationId, eventId, actionId);
      return Promise.all([contentsPromise, attachmentsPromise]);
    }
    
    extractOrganizationEventActionContents(organizationId, eventId, actionId) {
      return this._htmlScraper.extractOrganizationEventActionContents(organizationId, eventId, actionId);
    }
    
    extractOrganizationEventActionAttachments(organizationId, eventId, actionId) {
      return this._htmlScraper.extractOrganizationEventActionAttachments(organizationId, eventId, actionId);
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
  
  module.exports = EspooDataExtractor;
           
}).call(this);