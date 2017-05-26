/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const _ = require('lodash');
  const util = require('util');
  const winston = require('winston');
  const moment = require('moment');
  const normalize = require('normalize-space');
  const Promise = require('bluebird');
  const AbstractHtmlScraper = require(__dirname + '/../abstract-html-scraper');
  const organizationMapping = require(__dirname + '/organization-mapping');
  
  /**
   * Implementation for Espoo Html scaraper
   */
  class EspooHtmlScraper extends AbstractHtmlScraper {
    
    constructor(options) {
      super();
      
      this.options = Object.assign({
        "host": "espoo04.hosting.documenta.fi",
        "encoding": "binary"
      }, options || {});
    }
    
    /**
     * Returns a promise for organizations.
     */
    extractOrganizations() {
      const options = {
        "url": util.format("http://%s/kokous/TELIMET.HTM", this.options.host),
        "encoding": this.options.encoding
      };
        
      return new Promise((resolve, reject) => {
        const organizations = [];
        
        this.getParsedHtml(options)
          .then(($) => {
            const rows = $('table.tbl tr').filter((index, row) => {
              return !$(row).is('.trHea'); 
            });

            rows.each((index, row) => {
              const link = $($(row).find('.tcDat').first()).find('a');
              if (!link.length) {
                winston.log('warn', 'Could not find organization link');
                return;
              }
              
              const linkHref = $(link).attr('href');
              const name = normalize($(link).text());
              const idMatch = /(TELIN-)(.*)(.HTM)/.exec(linkHref);
              
              if (idMatch.length !== 4) {
                winston.log('warn', util.format('Unexpected organization link href %s', linkHref));
                return;
              }
              
              const id = idMatch[2];
              if (!id) {
                winston.log('warn', util.format('Invalid id read from href %s', linkHref));
                return;
              }
              
              if (organizationMapping[id]) {
                return;
              }
              
              if (!name) {
                winston.log('warn', util.format('Could not read title from organization %s', id));
                return;
              }
              
              organizations.push({
                "sourceId": id,
                "name": name,
                "classification": this.guessClassification(name),
                "dissolution_date": null,
                "founding_date": null,
                "parent": null
              });
              
            });
            
            resolve(organizations);
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
        const pageLoads = [ this.extractOrganizationPageEvents(organizationId, eventsAfter) ];
        
        _.forEach(organizationMapping, (value, key) => {
          if (value === organizationId) {
             pageLoads.push(this.extractOrganizationPageEvents(key, eventsAfter));
          }
        });
        
        Promise.all(pageLoads)
          .then((data) => {
            let events = [];
            for (let i = 0; i < data.length; i++) {
              events = events.concat(data[i]);
            }
            
            events.sort(function (event1, event2) {
              return moment(event2.startDate).diff(moment(event1.startDate));
            });
            
            if (maxEvents) {
              events = events.splice(0, maxEvents);  
            }
            
            resolve(events);
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
        const options = {
          "url": util.format("http://%s/kokous/%s.HTM", this.options.host, eventId),
          "encoding": this.options.encoding
        };
          
        let actions = [];

        this.getParsedHtml(options)
          .then(($) => {
            const table = $('body>p>table:first-of-type table').first();
            
            const rows = table.find('tr').filter((index, row) => {
              return !$(row).is('.trHea') && 
                $(row).find('.tcHeaSepa').length === 0 &&
                $(row).find('td a').length;
            });

            rows.each((index, row) => {
              const link = $(row).find('a');
              if (!link.length) {
                winston.log('warn', util.format('Could not find link from event %s', eventId));
                return;
              }
              
              const title = normalize(link.text());
              if (!title) {
                winston.log('warn', util.format('Could not read title from event %s', eventId));
                return;
              }
              
              const linkHref = $(link).attr('href');
              const idMatch = /(.*kokous\/)(.*)(.HTM)/.exec(linkHref);
              
              if (!idMatch || idMatch.length !== 4) {
                winston.log('warn', util.format('Unexpected link href %s in event %s', linkHref, eventId));
                return;
              }
              
              const id = idMatch[2];
              if (!id) {
                winston.log('warn', util.format('Invalid id read from href %s in event %s', linkHref, eventId));
                return;
              }
              
              const articleNumber = normalize($(row).find('td:first-of-type').text());
              if (!articleNumber) {
                winston.log('warn', util.format('Could not find articleNumber from event %s', eventId));
                return;
              }
              
              actions.push({
                "sourceId": id,  
                "articleNumber": articleNumber,
                "title": title,
                "ordering": index,
                "eventId": eventId
              });
              
            });
            
            resolve(actions);
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
        const url = util.format("http://%s/kokous/%s.HTM", this.options.host, actionId);        
        const options = {
          "url": url,
          "encoding": this.options.encoding,
          "cleanWordHtml": true
        };
          
        const contents = [];

        this.getParsedHtml(options)
          .then(($) => {
            let dno = '';
            let functionId = '';
            
            let removeRest = false;
            $('.WordSection1 p').each((index, p) => {
              if (_.trim($(p).find('b').text()).toLowerCase() === 'päätöshistoria') {
                removeRest = true;
              }
              
              if (removeRest) {
                $(p).remove();
              }
            });
            
            $('.WordSection1 p.MsoNormal[align="right"]').each((index, p) => {
              const text = normalize($(p).text());

              if (!dno) {
                const dnoMatch = /^[0-9]{1,}\/[0-9]{4}$/.exec(text);
                if (dnoMatch && dnoMatch.length === 1) {
                  dno = dnoMatch[0];
                  return;
                }
              }
              
              if (!functionId) {
                const functionIdMatch = /^[0-9.]{1,}$/.exec(text);
                if (functionIdMatch && functionIdMatch.length === 1) {
                  functionId = functionIdMatch[0];
                  return;
                }
              }
              
              if (!dno && !functionId) {
                const dnoFunctionIdMatch = /^([0-9]{1,})\/([0-9.]{1,})\/([0-9]{4})$/.exec(text);
                if (dnoFunctionIdMatch && dnoFunctionIdMatch.length === 4) {
                  dno = util.format('%s/%s', dnoFunctionIdMatch[1], dnoFunctionIdMatch[3]);
                  functionId = dnoFunctionIdMatch[2];
                  return;
                }
              }
            });
            
            if (!dno) {
              winston.log('warn', util.format('Unexpected dno from event %s action %s (%s)', eventId, actionId, url));
              return;
            }
            
            if (!functionId) {
              winston.log('warn', util.format('Unexpected functionId from event %s action %s (%s)', eventId, actionId, url));
              return;
            }
            
            functionId = functionId.replace(/\./g, ' ');
            let order = 0;
            
            contents.push({
              order: order++,
              title: 'Dno',
              content: dno 
            });
            
            contents.push({
              order: order++,
              title: 'functionId',
              content: functionId 
            });
            
            const draftsmenText = this.getExtractDraftsmenText($);
            if (draftsmenText) {
              contents.push({
                order: order++,
                title: 'Valmistelijat / lisätiedot',
                content: draftsmenText 
              });
            }
          
            let title = null;
            let content = [];
            
            $('.Sivuotsikko,.Sisennetty').each((index, contentElement) => {
              const elementText = normalize($(contentElement).text());
              if (elementText) {
                const isTitle = $(contentElement).is('.Sivuotsikko') ||
                  $(contentElement).css('text-indent') === '-117.0pt';

                if (isTitle) {
                  if (title) {
                    contents.push({
                      order: order++,
                      title: title,
                      content: this.elementsToHtml($, content)
                    });
                  }

                  const titleElement = $(contentElement).clone();
                  title = normalize(titleElement.find('b,strong').remove().text());

                  content = [];
                  const text = normalize(titleElement.text());
                  if (text) {
                    content.push($('<p>').text(text));
                  }
                } else {
                  if (elementText) {
                    content.push(contentElement);
                  }
                }
              }
            });
            
            if (content.length) {
              if (title) {
                contents.push({
                  order: order++,
                  title: title,
                  content: this.elementsToHtml($, content)
                });
              } else {
                winston.log('warn', util.format('Could not parse content title from event %s action %s (%s)', eventId, actionId, url));
              }
            }
                
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
        const url = util.format("http://%s/kokous/%s.HTM", this.options.host, actionId);        
        const options = {
          "url": url,
          "encoding": this.options.encoding
        };
          
        this.getParsedHtml(options)
          .then(($) => {
            const attachments = [];
    
            $('p table.tcDat > tbody > tr > td:nth-of-type(3) > a').each((index, attachment) => {
              const attachmentUrl = $(attachment).attr('href');
              const name = normalize($(attachment).text()); 
              const headers = this.getHeaders(attachmentUrl);
              const contentDisposition = headers['content-disposition'] ? this.parseContentDisposition(headers['content-disposition']) : null;
              
              if (!attachmentUrl) {
                winston.log('warn', util.format('Could not read attachment url from event %s action %s (%s)', eventId, actionId, url));
                return;
              }
              
              const lastUrlSlash = attachmentUrl.lastIndexOf('/');
              const filename = lastUrlSlash !== -1 ? attachmentUrl.substring(lastUrlSlash + 1) : null;
              const lastDotIndex = filename.lastIndexOf('.');
              const id = lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
                      
              if (!id) {
                winston.log('warn', util.format('Could not parse attachment id from event %s action %s (%s)', eventId, actionId, url));
                return;
              }
              
              if (contentDisposition && contentDisposition.parameters) {
                filename = contentDisposition.parameters.filename;
              }
              
              if (!filename) {
                filename = id;
              }
            
              attachments.push({
                "sourceId": id,
                "name": name,
                "filename": filename,
                "url": attachmentUrl,
                "actionId": actionId,
                "number": index,
                "public": true,
                "confidentialityReason": null,
                "contentType": headers['content-type'],
                "contentLength": headers['content-length']
              });
            });
    
            resolve(attachments);
          })
          .catch(reject);
      });
    }
    
    /**
     * Extracts events for a year
     * 
     * @param {String} organizationId organizationId where to scrape events
     * @param {Moment} eventsAfter return only events afer the moment
     * @returns {Promise}
     */
    extractOrganizationPageEvents(organizationId, eventsAfter) {
      return new Promise((resolve, reject) => {
        const options = {
          "url": util.format("http://%s/kokous/TELIN-%s.HTM", this.options.host, organizationId),
          "encoding": this.options.encoding
        };
          
        let events = [];

        this.getParsedHtml(options)
          .then(($) => {
            const rows = $('table.tbl tr').filter((index, row) => {
              return !$(row).is('.trHea') && 
                $(row).find('.tcHeaSepa').length === 0 &&
                $(row).find('td a').length;
            });

            rows.each((index, row) => {
              const dateStr = _.trim($(row).find('td.tcDat:nth-of-type(1)').text());
              const linkHref = $(row).find('td.tcDat:nth-of-type(2) a').attr('href');
              const idMatch = /(.*kokous\/)(.*)(.HTM)/.exec(linkHref);
              
              if (!idMatch || idMatch.length !== 4) {
                winston.log('warn', util.format('Could not read id from href %s', linkHref));
                return;
              }

              const id = idMatch[2];
              const eventStart = moment(dateStr, 'DD.MM.YYYY', 'fi', true);
              
              if (!id) {
                winston.log('warn', util.format('Invalid id read from href %s', linkHref));
                return;
              }

              if (!eventStart.isValid()) {
                winston.log('warn', util.format('Could not parse date from string %s', dateStr));
                return;
              }
              
              const organizationName = normalize($('label.h3').text().replace('Kokouslistat', ''));
              if (!organizationName) {
                winston.log('warn', util.format('Could not resolve organization name from event %s', id));
                return;
              }
              
              if (!eventsAfter || eventsAfter.isBefore(eventStart)) {
                events.push({
                  "sourceId": id,
                  "name": util.format("%s - %s", organizationName, dateStr),
                  "startDate": eventStart.format(),
                  "endDate": eventStart.format()
                });
              }
            });
            
            resolve(events);
          })
          .catch(reject);
      });
    }
    
    getExtractDraftsmenText($) {
      let start = false;
      let end = false;
      
      const textElements = $('.WordSection1>*[class]')
        .filter((index, child) => {
          if (!start) {
            if ($(child).find('strong').length) {
              start = true;
            }
            
            return false;
          }

          if (!end) {
            if ($(child).is('.Sivuotsikko')) {
              end = true;
              return false;
            }
          } else {
            return false;
          }
          
          return !!normalize($(child).text());
        });
        
      if (textElements.length) {
        if ($(textElements[0]).text().toLowerCase().indexOf('valmistelijat') !== -1) {
          textElements.splice(0, 1);         
          return this.elementsToHtml($, textElements);
        }
      }
        
      return null;
    }
    
    elementsToHtml($, elements) {
      elements = this.replaceLists($, elements);
      
      const result = $('<pre>').append(elements);
      
      result.find('*')
        .removeAttr('style')
        .removeAttr('class')
        .removeAttr('lang')
        .removeAttr('valign');
        
      this.normalizeElementTexts($, result);
        
      return this.decodeHtmlEntities(this.trimHtml(result.html()));
    }
    
    replaceLists($, elements) {
      for (let i = elements.length - 1; i >= 0; i--) {
        if (this.isListItem($, elements[i])) {
          const ul = $('<ul>');
          
          while (this.isListItem($, elements[i])) {
            const element = $(elements.splice(i, 1));
            
            $('<li>')
              .text(normalize(element.text()).substring(2))
              .prependTo(ul);
      
            i--;
          };
          
          elements.splice(i + 1, 0, ul);
        }
      }
      
      return elements;
    }
    
    isListItem($, element) {
      if ($(element).is('.Sisennetty')) {
        return normalize($(element).text()).startsWith('- ');
      }
      
      return false;
    }
    
  }
  
  module.exports = EspooHtmlScraper;
           
}).call(this);


