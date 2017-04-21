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
        organization: organization
      };
    }
    
    addOrganizationEvents(organizationId, events) {
      for (var i = 0; i < events.length; i++) {
        var event = events[i];
        this.organizationDatas[organizationId].eventDatas[event.sourceId] = {
          caseDatas: {},
          event: event   
        };
      }
    }
    
    addOrganizationEventCase(organizationId, eventId, eventCase) {
      var caseId = eventCase.sourceId;
      this.organizationDatas[organizationId].eventDatas[eventId].caseDatas[caseId] = {
        'case': eventCase,
        'actions': [],
        'contents': []
      };
    }
    
    getOrganizationEventCase(organizationId, eventId, caseId) {
      return this.organizationDatas[organizationId].eventDatas[eventId].caseDatas[caseId].case;
    }
    
    setOrganizationEventCase(organizationId, eventId, caseId, eventCase) {
      this.organizationDatas[organizationId].eventDatas[eventId].caseDatas[caseId].case = eventCase;
      console.log(this.organizationDatas[organizationId].eventDatas[eventId].caseDatas[caseId].case);
    }
    
    setOrganizationCaseActions(organizationId, eventId, caseId, actions) {
      this.organizationDatas[organizationId].eventDatas[eventId].caseDatas[caseId].actions = actions;
    }
    
    setOrganizationCaseAttachments(organizationId, eventId, caseId, attachments) {
      this.organizationDatas[organizationId].eventDatas[eventId].caseDatas[caseId].attachments = attachments;
    }
    
    buildZip(outputFile) {
      var zip = new AdmZip();
      
      _.forEach(this.organizationDatas, (organizationData, organizationId) => {
        let organization = organizationData.organization;
        let eventDatas = organizationData.eventDatas; 
        zip.addFile(util.format("/organizations/%s/index.json", organizationId), new Buffer(JSON.stringify(organization)), organization.name);
        
        _.forEach(eventDatas, (eventData, eventId) => {
          let event = eventData.event;
          let caseDatas = eventData.caseDatas;
          zip.addFile(util.format("/organizations/%s/events/%s/index.json", organizationId, eventId), new Buffer(JSON.stringify(event)), event.name);
      
          _.forEach(caseDatas, (caseData, caseId) => {
            let eventCase = caseData.case;
            let actions = caseData.actions;
            let attachments = caseData.attachments;
            
            zip.addFile(util.format("/organizations/%s/events/%s/cases/%s/index.json", organizationId, eventId, caseId), new Buffer(JSON.stringify(eventCase)), eventCase.title);
            zip.addFile(util.format("/organizations/%s/events/%s/cases/%s/actions.json", organizationId, eventId, caseId), new Buffer(JSON.stringify(actions)), util.format('%s - actions', eventCase.title));
            zip.addFile(util.format("/organizations/%s/events/%s/cases/%s/attachments.json", organizationId, eventId, caseId), new Buffer(JSON.stringify(attachments)), util.format('%s - attachments', eventCase.title));
          });
          
        });
      });
      
       zip.writeZip(outputFile);
    }
    
  }
  
  module.exports = ResultBuilder;
           
}).call(this);