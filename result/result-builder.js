/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const util = require('util');
  const _ = require('lodash');
  const AdmZip = require('adm-zip');
  
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
      var zip = new AdmZip();
      
      _.forEach(this.organizationDatas, (organizationData, organizationId) => {
        let organization = organizationData.organization;
        let eventDatas = organizationData.eventDatas;
        let caseDatas = organizationData.caseDatas;
        let cases = [];
        zip.addFile(util.format("/organizations/%s/index.json", organizationId), new Buffer(JSON.stringify(organization)), organization.name);
        
        _.forEach(caseDatas, (caseData, caseId) => {
          cases.push(caseData.case);
        });
        zip.addFile(util.format("/organizations/%s/cases.json", organizationId), new Buffer(JSON.stringify(cases)), organization.name);
        
        _.forEach(eventDatas, (eventData, eventId) => {
          let event = eventData.event;
          let actionDatas = eventData.actionDatas;
          zip.addFile(util.format("/organizations/%s/events/%s/index.json", organizationId, eventId), new Buffer(JSON.stringify(event)), event.name);
      
          _.forEach(actionDatas, (actionData, actionId) => {
            let eventAction = actionData.action;
            let contents = actionData.contents;
            let attachments = actionData.attachments;
            
            zip.addFile(util.format("/organizations/%s/events/%s/actions/%s/index.json", organizationId, eventId, actionId), new Buffer(JSON.stringify(eventAction)), eventAction.title);
            zip.addFile(util.format("/organizations/%s/events/%s/actions/%s/contents.json", organizationId, eventId, actionId), new Buffer(JSON.stringify(contents)), util.format('%s - actions', eventAction.title));
            zip.addFile(util.format("/organizations/%s/events/%s/actions/%s/attachments.json", organizationId, eventId, actionId), new Buffer(JSON.stringify(attachments)), util.format('%s - attachments', eventAction.title));
          });
          
        });
      });
      
       zip.writeZip(outputFile);
    }
    
  }
  
  module.exports = ResultBuilder;
           
}).call(this);