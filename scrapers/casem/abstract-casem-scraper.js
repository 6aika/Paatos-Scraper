/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const _ = require('lodash');
  const odata = require('odata-client');
  const util = require('util');
  const winston = require('winston');
  const Promise = require('bluebird');
  const moment = require('moment');
  const Isemail = require('isemail');
  const cheerio = require('cheerio');
  const AbstractScraper = require(__dirname + '/../abstract-scraper');
  
  /**
   * Abstract base class for CaseM "scrapers"
   */
  class AbstractCasemScraper extends AbstractScraper {
    
    constructor(options) {
      super();
      
      
      this.options = Object.assign({
        languageId: 1
      }, options);
    }
    
    /**
     * Returns a promise for organizations.
     */
    extractOrganizations() {
      return new Promise((resolve, reject) => {
        this.findOrganizationsRoot()
          .then((rootNodeId) => {
            this.listOrganizations(rootNodeId)
              .then((organizations) => {
                resolve(organizations);
              })
              .catch(reject);
          })
          .catch(reject);
      });
    }
    
    /**
     * Returns a promise for organization events.
     * 
     * @param {String} organizationId organizationId where to scrape events
     * @param {Integer} maxEvents max events to return
     * @param {Moment} eventsAfter return only events afer the moment
     */
    extractOrganizationEvents(organizationId, maxEvents, eventsAfter) {
      return new Promise((resolve, reject) => {
        this.findOrganizationsRoot()
          .then((rootNodeId) => {
            this.listOrganizationEvents(rootNodeId, organizationId, maxEvents, eventsAfter)
              .then((events) => {
                resolve(events);
              })
              .catch(reject);
          })
          .catch(reject);
      });
    }
    
    /**
     * Returns a promise for organization event actions.
     * 
     * @param {String} organizationId organizationId where to scrape actions
     * @param {String} eventId eventId where to scrape actions
     */
    extractOrganizationEventActions(organizationId, eventId) {
      return new Promise((resolve, reject) => {
        this.listOrganizationEventContents(eventId)
          .then((contents) => {
            const extendedPropertyPromises = _.map(contents, (content) => {
              return this.listContentsExtendedPropertiesAsKeyValuePairs(content.ContentId);
            });
            
            Promise.all(extendedPropertyPromises)
              .then((extendedProperties) => {
                const actions = [];
        
                contents.forEach((content, index) => {
                  const extendedPropertyMap = extendedProperties[index]; 
                  const articleNumber = extendedPropertyMap['Article'];
                  const dno = extendedPropertyMap['CaseNativeId'];
                  
                  if (dno) {
                    actions.push({
                      "title": content.Subject,
                      "sourceId": content.ContentId,  
                      "articleNumber": articleNumber,
                      "ordering": index,
                      "eventId": eventId
                    });
                  }
                });
        
                resolve(actions);
              });
          })
          .catch(reject);
      });
    }
    
    /**
     * Returns a promise for organization event action contents.s
     * 
     * @param {String} organizationId organizationId 
     * @param {String} eventId eventId
     * @param {String} actionId actionId
     */
    extractOrganizationEventActionContents(organizationId, eventId, actionId) {
      return new Promise((resolve, reject) => {
        this.listContentsExtendedProperties(actionId)
          .then((extendedProperties) => {
            let order = 0;
            const contents = [];
            extendedProperties.forEach((extendedProperty) => {
              if (extendedProperty.Name && extendedProperty.Text) {
                const contentValue = this.processContentValue(extendedProperty.Name, extendedProperty.Text);
                if (contentValue) {
                  contents.push({
                    order: order++,
                    title: contentValue.title,
                    content: contentValue.value
                  }); 
                }
              }  
            });
            
            resolve(contents);
          })
          .catch(reject);
      });
    }
    
    /**
     * Returns a promise for organization event action attachments.
     * 
     * @param {String} organizationId organizationId 
     * @param {String} eventId eventId
     * @param {String} actionId actionId
     */
    extractOrganizationEventActionAttachments(organizationId, eventId, actionId) {
      return new Promise((resolve, reject) => {
        this.listContentsExtendedProperties(actionId)
          .then((extendedProperties) => {
            const attachments = [];
            const headerPromises = [];
            
            let index = 0;
            
            extendedProperties.forEach((extendedProperty) => {
              if (extendedProperty.Name === 'Attachments') {
                const $ = cheerio.load(extendedProperty.Text);
                const href = $('a').attr('href');
                const name = $('a').text();
                const idMatch = /(download.aspx\?ID=)([0-9]*)\&GUID=\{([0-9a-zA-Z-]*)\}/.exec(href);
                if (idMatch && idMatch.length === 4) {
                  const id = idMatch[2];
                  const guid = idMatch[3];
                  const sourceId = util.format("{%s}/%d", guid, id);
                          
                  const attachmentUrl = util.format('http://%s/download/noname/%s', this.options.host, sourceId);

                  attachments.push({
                    "sourceId": id,
                    "name": name,
                    "filename": null,
                    "url": attachmentUrl,
                    "actionId": actionId,
                    "number": index++,
                    "public": true,
                    "confidentialityReason": null,
                    "contentType": null,
                    "contentLength": null
                  });
                  
                  const headerOptions = {
                    "url": attachmentUrl,
                    "encoding": "binary"
                  };

                  headerPromises.push(this.getHeaders(headerOptions));
                } else {
                  winston.log('warn', 'Failed to resolve attachment id from %s', href);
                }
              }
            });
            
            Promise.all(headerPromises)
              .then((data) => {
                for (let i = 0; i < data.length; i++) {
                  const headers = data[i];          
                  const attachment = attachments[i];
                  const contentType = headers['content-type'];
                  const contentLength = headers['content-length'];
                  const contentDisposition = headers['content-disposition'] ? this.parseContentDisposition(headers['content-disposition']) : null;
                  let filename = contentDisposition && contentDisposition.parameters ? contentDisposition.parameters.filename : null;
                  
                  if (filename) {
                    filename = this.decodeString(filename, 'latin1').replace(/\ {0,}(\.pdf){1,}/i, '.pdf');
                  }
                  
                  attachment['filename'] = filename;
                  attachment['contentType'] = headers['content-type'];
                  attachment['contentLength'] = headers['content-length'];
                }
                
                resolve(attachments);
              })
              .catch(reject);
          })
          .catch(reject);
      });
    }
    
    findOrganizationsRoot() {
      const options = {
        service: util.format('http://%s/api/opennc/v1/', this.options.host), 
        resources: 'Nodes', 
        format: 'json' 
      };
      
      return new Promise((resolve, reject) => {
        odata(options).get()
          .then((response) => {
            let rootNodeId = false;
            
            if (response.statusCode === 200) {
              const body = JSON.parse(response.body);
              body.value.forEach((node) => {
                if (rootNodeId) {
                  return;
                }
                
                if (_.map(node.Names, 'Name').indexOf('Toimielimet') !== -1) {
                  rootNodeId = node.NodeId;
                }
              });
              
              if (!rootNodeId) {
                winston.log('warn', 'Failed to resolve organizations root node');
              }
              
              resolve(rootNodeId);
            } else {
              reject(response.statusMessage);
            }
          })
          .catch(reject);
      });
    }
    
    listOrganizations(rootNodeId) {
      const options = {
        service: util.format('http://%s/api/opennc/v1/', this.options.host), 
        resources: util.format('Nodes(%d)/SubNodes()', rootNodeId), 
        format: 'json' 
      };
      
      return new Promise((resolve, reject) => {
        odata(options).get()
          .then((response) => {
            if (response.statusCode === 200) {
              const body = JSON.parse(response.body);
              const nodes = body.value;
              const organizations = [];
              
              nodes.forEach((node) => {
                const id = node.NodeId;
                const name = this.getNodeName(this.options.languageId, node);
                
                organizations.push({
                  "sourceId": id.toString(),
                  "name": name,
                  "classification": this.guessClassification(name),
                  "dissolution_date": null,
                  "founding_date": null,
                  "parent": null
                });
              });
              
              resolve(organizations);
            } else {
              reject(response.statusMessage);
            }
          })
          .catch(reject);
      });
    }
    
    listOrganizationEvents(rootNodeId, organizationId, maxEvents, eventsAfter) {
      return new Promise((resolve, reject) => {
        this.findOrganizationEventsRoot(rootNodeId, organizationId)
          .then((eventsRootNodeId) => {  
            this.listOrganizationEventNodes(rootNodeId, organizationId, eventsRootNodeId, maxEvents)
              .then((eventNodes) => {
                // TODO: eventsAfter
                const events = [];
                
                eventNodes.forEach((eventNode) => {
                  const id = eventNode.NodeId;
                  const name = this.getNodeName(this.options.languageId, eventNode);
                  const dateMatch = /(.*\ )([0-9]{1,2}\.[0-9]{1,2}\.[0-9]{4})/.exec(name);
                  const eventStart = dateMatch && dateMatch.length === 3 ? moment(dateMatch[2], 'D.M.YYYY', 'fi', true) : null;
                  
                  if (!eventStart || !eventStart.isValid()) {
                    winston.log('warn', util.format('Could not parse date from name %s', name));
                    return;
                  }
              
                  if (!eventsAfter || eventsAfter.isBefore(eventStart)) {
                    events.push({
                      "sourceId": id,
                      "name": name,
                      "startDate": eventStart.format(),
                      "endDate": eventStart.format()
                    });
                  }
                });
                
                events.sort(function (event1, event2) {
                  return moment(event2.startDate).diff(moment(event1.startDate));
                });
                
                if (maxEvents) {
                  resolve(events.splice(0, maxEvents));
                } else {
                  resolve(events);
                }

              })
              .catch(reject);
          })
          .catch(reject);
      });
    }
    
    findOrganizationEventsRoot(rootNodeId, organizationId) {
      const options = {
        service: util.format('http://%s/api/opennc/v1/', this.options.host), 
        resources: util.format('Nodes(%d)/SubNodes(%d)/SubNodes()', rootNodeId, organizationId), 
        format: 'json' 
      };
      
      return new Promise((resolve, reject) => {
        odata(options).get()
          .then((response) => {
            if (response.statusCode === 200) {
              const body = JSON.parse(response.body);
              if (body.value.length === 1) {
                resolve(body.value[0].NodeId);
              } else {
                winston.log('warn', util.format('Unexpected events root node count %d in organization %s', body.value.length));
                resolve(null);
              }
            } else {
              reject(response.statusMessage);
            }
          })
          .catch(reject);
      });
    }
    
    listOrganizationEventNodes(rootNodeId, organizationId, eventsRootNode) {
      const options = {
        service: util.format('http://%s/api/opennc/v1/', this.options.host), 
        resources: util.format('Nodes(%d)/SubNodes(%d)/SubNodes(%d)/SubNodes()', rootNodeId, organizationId, eventsRootNode), 
        format: 'json' 
      };
      
      return new Promise((resolve, reject) => {
        let query = odata(options);
        
        query.get()
          .then((response) => {
            if (response.statusCode === 200) {
              resolve(JSON.parse(response.body).value);
            } else {
              reject(response.statusMessage);
            }
          })
          .catch(reject);
      });
    }
    
    listOrganizationEventContents(eventId) {
      return new Promise((resolve, reject) => {
        const options = {
          service: util.format('http://%s/api/opennc/v1/', this.options.host), 
          resources: 'Contents()', 
          format: 'json' 
        };
        
        const filter = util.format('Classifications/any(f:f/NodeId eq %d)', eventId);
        
        odata(options).filter(filter).get()
          .then((response) => {
            if (response.statusCode === 200) {
              const body = JSON.parse(response.body);
              resolve(body.value);
            } else {
              reject(response.statusMessage);
            }
          })
          .catch(reject);
      });
    }
    
    listContentsExtendedPropertiesAsKeyValuePairs(contentId) {
      return new Promise((resolve, reject) => {
        this.listContentsExtendedProperties(contentId)
          .then((values) => {
            const result = {};            
            values.forEach((value) => {
              if (value.Name && value.Text) {
                result[value.Name] = value.Text;
              }            
            });
            
            resolve(result);
          })
          .catch(reject);
      });
    }
    
    listContentsExtendedProperties(contentId) {
      return new Promise((resolve, reject) => {
        const options = {
          service: util.format('http://%s/api/opennc/v1/', this.options.host), 
          resources: util.format('Contents(%d)/ExtendedProperties', contentId), 
          format: 'json' 
        };
        
        odata(options).get()
          .then((response) => {
            if (response.statusCode === 200) {
              const body = JSON.parse(response.body);
              resolve(body.value);
            } else {
              reject(response.statusMessage);
            }
          })
          .catch(reject);
      });
    }
    
    processContentValue (name, value) {
      switch (name) {
        case 'Attachments':
        case 'AgendaAttachment':
        case 'IsAdditionalTopic':
        case 'HistoryTopics':
        case 'Name':
        case 'Article':
        case 'Votings':
          return null;
        case "CaseNativeId": 
          return {
            "title": "Dno",
            "value": value
          };
        case "Disqualification": 
          return {
            "title": "Esteellisyys",
            "value": value
          };
        case "Description":
          return {
            "title": "Kuvaus",
            "value": value
          };
        case "Decisionproposal":
          return {
            "title": "Päätösehdotus",
            "value": value
          };
        case "Decision":
          return {
            "title": "Päätös",
            "value": value
          };
        case "Inform":
          return {
            "title": "Tiedoksi",
            "value": value
          };
        case 'Draftsmans':
          return {
            "title": "Valmistelijat",
            "value": this.parsePresenters(value)
          };
        case "Presenters":
          return {
            "title": "Esittelijät",
            "value": this.parsePresenters(value)
          };
        case 'Participant_councilman': 
          return {
            "title": 'Kokouksen osallistujat',
            "value": this.parseParticipantCouncilmen(value)
          };
        default:
          winston.log('warn', util.format('Unknown content property %s (%s), returning as-is', name, value));                
          
          return {
            "title": name,
            "value": value
          };
      }
    }
    
    findOrganizationEventTocContent(eventId) {
      return new Promise((resolve, reject) => {
        const options = {
          service: util.format('http://%s/api/opennc/v1/', this.options.host), 
          resources: 'Contents()', 
          format: 'json' 
        };
        
        const filter = util.format('Classifications/any(f:f/NodeId eq %d) and Classifications/any(f:f/Type eq 43)', eventId);
        
        odata(options).filter(filter).get()
          .then((response) => {
            if (response.statusCode === 200) {
              const body = JSON.parse(response.body);
              if (body.value.length === 1) {
                resolve(body.value[0]);
              } else {
                winston.log('warn', util.format('Unexpected toc content count %d in event %s', body.value.length, eventId));
                resolve(null);
              }
            } else {
              reject(response.statusMessage);
            }
          })
          .catch(reject);
      });
    }
    
    parseParticipantCouncilmen(value) {
      const rows = this.parseCSV(value);
      if (rows && rows.length) {
        const result = [];
        
        const cellCount = rows[0].length;
        rows.forEach((row) => {
          if (row.length === 6 && cellCount === 5 && !row[5]) {
            row.splice(5, 1);
          }
          
          if (row.length !== cellCount) {
            winston.log('warn', util.format('Inconsistent cell count %d != %d', row.length, cellCount)); 
          }
          
          let name = row[0];
          let title;
          let arrived;
          let left;
          let email;
          let group;
          
          if (row.length === 5 || row.length === 6) {
            title = row[1];
            arrived = row[2] ? moment(row[2], 'YYYY-MM-DD HH:mm:ss', 'fi', true) : null;
            left = row[3] ? moment(row[3], 'YYYY-MM-DD HH:mm:ss', 'fi', true) : null;
            group = row[4];
          } else {
            winston.log('warn', util.format('Unexpected participant councilmen cell count %d', cellCount)); 
            return;
          }
          
          if (arrived && !arrived.isValid()) {
            winston.log('warn', util.format('Invalid date %s on arrived', row[2])); 
            arrived = null;
          }
          
          if (left && !left.isValid()) {
            winston.log('warn', util.format('Invalid date %s on left', row[3])); 
            left = null;
          }
          
          if (group === 'member') {
            group = 'jäsen';
          } else if (group === 'other') {
            group = 'muu';
          }
          
          let resultText = ''; 
          const displayName = email ? util.format('%s <%s>', name, email) : name;
          
          if (group) {
            resultText += util.format('%s: ', group);
          }
          
          if (displayName) {
            resultText += displayName;
          }
          
          if (title) {
            resultText += util.format(' - ', title);
          }
          
          if (arrived) {
            resultText += util.format(' (Paikalla %s - %s)', arrived.format('HH:mm'), left ? left.format('HH:mm') : '');
          } 
          
          result.push(resultText);
        });
          
        return result.join(', ');
      }
      
      return null;
    }
    
    parsePresenters(value) {
      const rows = this.parseCSV(value);
      if (rows && rows.length) {
        const result = [];
        
        const cellCount = rows[0].length;
        rows.forEach((row) => {
          if (row.length === 4 && cellCount === 5) {
            row.push('');
          } else if (cellCount === 4 && row.length === 5 && !row[4]) {
            row.splice(4, 1);
          }
          
          if (row.length !== cellCount) {
            winston.log('warn', util.format('Inconsistent cell count %d != %d', row.length, cellCount)); 
            return;
          }
          
          let name = row[0];
          let title;
          let email;
          
          if (cellCount >= 2) {
            title = row[1];
          }
          
          if (cellCount > 4) {
            email = row[3].toLowerCase();
            if (email && !Isemail.validate(email, {checkDNS: false})) {
              winston.log('warn', util.format('Invalid email address %s', email)); 
              email = null;  
            }
          }
          
          if (cellCount !== 5 && cellCount !== 4) {
            winston.log('warn', util.format('Unexpected presenter cell count %d', cellCount)); 
            return;
          }
          
          const displayName = email ? util.format('%s <%s>', name, email) : name;
          result.push(title ? util.format('%s - %s', displayName, title) : displayName);
        });
        
        return result.join(', ');
      }
      
      return null;
    }
    
    parseCSV(value) {
      const result = [];
      
      const rows = _.split(value, ';#!#');
      rows.forEach((row) => {
        result.push(_.split(row, ';#'));
      });
      
      return result;
    }
    
    getNodeName(languageId, node) {
      const names = node.Names;
      for (let i = 0; i < names.length; i++) {
        if (names[i].LanguageId === languageId) {
          return names[i].Name;
        }
      }
      
      return null;
    }
  }
  
  module.exports = AbstractCasemScraper;
           
}).call(this);