/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const util = require('util');
  const _ = require('lodash');
  const fs = require('fs');
  const archiver = require('archiver');
  
  /**
   * Result builder
   */
  class ResultBuilder {
    
    constructor() {
      this.organizationDatas = {};
    }
    
    addOrganization(organization) {
      this.organizationDatas[organization.sourceId] = {
        eventDatas: {},
        caseDatas: {},
        organization: organization
      };
    }
    
    addOrganizationEvents(organizationId, events) {
      for (var i = 0; i < events.length; i++) {
        var event = events[i];
        this.organizationDatas[organizationId].eventDatas[event.sourceId] = {
          actionDatas: {},
          event: event   
        };
      }
    }

    addOrganizationCase(organizationId, organizationCase) {
      this.organizationDatas[organizationId].caseDatas[organizationCase.sourceId] = {
        case: organizationCase   
      };
    }
    
    addOrganizationEventAction(organizationId, eventId, eventAction) {
      var actionId = eventAction.sourceId;
      this.organizationDatas[organizationId].eventDatas[eventId].actionDatas[actionId] = {
        'action': eventAction,
        'contents': []
      };
    }
    
    getOrganizationEvent(organizationId, eventId) {
      return this.organizationDatas[organizationId].eventDatas[eventId].event;
    }
    
    getOrganizationEventAction(organizationId, eventId, actionId) {
      return this.organizationDatas[organizationId].eventDatas[eventId].actionDatas[actionId].action;
    }
    
    setOrganizationEventAction(organizationId, eventId, actionId, eventAction) {
      this.organizationDatas[organizationId].eventDatas[eventId].actionDatas[actionId].action = eventAction;
    }
    
    setOrganizationActionContents(organizationId, eventId, actionId, contents) {
      this.organizationDatas[organizationId].eventDatas[eventId].actionDatas[actionId].contents = contents;
    }
    
    setOrganizationActionAttachments(organizationId, eventId, actionId, attachments) {
      this.organizationDatas[organizationId].eventDatas[eventId].actionDatas[actionId].attachments = attachments;
    }
    
    removeOrganizationAction(organizationId, eventId, actionId) {
      delete this.organizationDatas[organizationId].eventDatas[eventId].actionDatas[actionId];
    }
    
    buildZip(outputFile) {
      const output = fs.createWriteStream(outputFile);
      const archive = archiver('zip', {
          zlib: { level: 9 }
      });
      
      output.on('close', () => {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
      });

      archive.on('error', (err) => {
        console.error("Error creating zip file", err);
      });
      
      archive.pipe(output);
      
      _.forEach(this.organizationDatas, (organizationData, organizationId) => {
        let organization = organizationData.organization;
        let eventDatas = organizationData.eventDatas;
        let caseDatas = organizationData.caseDatas;
        let cases = [];
        archive.append(JSON.stringify(organization), { name: util.format("/organizations/%s/index.json", organizationId) } );
        
        _.forEach(caseDatas, (caseData, caseId) => {
          cases.push(caseData.case);
        });
        archive.append(JSON.stringify(cases), { name: util.format("/organizations/%s/cases.json", organizationId) } );
        
        _.forEach(eventDatas, (eventData, eventId) => {
          let event = eventData.event;
          let actionDatas = eventData.actionDatas;
          archive.append(JSON.stringify(event), { name: util.format("/organizations/%s/events/%s/index.json", organizationId, eventId) } );
      
          _.forEach(actionDatas, (actionData, actionId) => {
            let eventAction = actionData.action;
            let contents = actionData.contents;
            let attachments = actionData.attachments;
            
            archive.append(JSON.stringify(eventAction), { name: util.format("/organizations/%s/events/%s/actions/%s/index.json", organizationId, eventId, actionId) } );
            archive.append(JSON.stringify(contents), { name: util.format("/organizations/%s/events/%s/actions/%s/contents.json", organizationId, eventId, actionId) } );
            archive.append(JSON.stringify(attachments), { name: util.format("/organizations/%s/events/%s/actions/%s/attachments.json", organizationId, eventId, actionId) } );
          });
          
        });
      });
      
      archive.finalize();
    }
    
  }
  
  module.exports = ResultBuilder;
           
}).call(this);