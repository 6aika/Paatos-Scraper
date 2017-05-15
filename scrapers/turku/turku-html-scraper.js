/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const Promise = require('bluebird');
  const _ = require('lodash');
  const util = require('util');
  const moment = require('moment');
  const normalize = require('normalize-space');
  const winston = require('winston');
  const AbstractHtmlScraper = require(__dirname + '/../abstract-html-scraper');
  
  /**
   * Turku specific implementation of Html scraper
   */
  class TurkuHtmlScraper extends AbstractHtmlScraper {
    
    constructor(options) {
      super();
      
      this.options = Object.assign({
        "host": "ah.turku.fi",
        "htmlDownloadInterval": 10
      }, options || {});
    }
    
    /**
     * Returns a promise for organization events.
     * 
     * Returned data is ordered in same order that it is in html page. 
     * 
     * @param {String} organizationId organizationId where to scrape events
     * @param {Integer} maxEvents max events to return
     * @param {Moment} eventsAfter return only events afer the moment
     */
    extractOrganizationEvents(organizationId, maxEvents, eventsAfter) {
      return new Promise((resolve, reject) => {
        const toYear = moment().year();
        const fromYear = eventsAfter ? eventsAfter.year() : 1995;
        let yearExtracts = [];
        
        for (let year = fromYear; year <= toYear; year++) {
          yearExtracts.push(this.extractOrganizationYearEvents(organizationId, year, eventsAfter));
        };
        
        Promise.all(yearExtracts)
          .then((data) => {
            let events = [];
            for (let i = 0; i < data.length; i++) {
              events = events.concat(data[i]);
              
              if (maxEvents && maxEvents <= events.length) {
                break;
              }
            }
            
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
     * Returned data is ordered in same order that it is in html page. 
     * 
     * @param {String} organizationId organizationId where to scrape actions
     * @param {String} eventId eventId where to scrape actions
     */
    extractOrganizationEventActions(organizationId, eventId) {
      return new Promise((resolve, reject) => {
        const eventIdParts = eventId.split('-'); 
        if (eventIdParts.length !== 2) {
          reject(util.format('Invalid eventId %s', eventId));
          return;
        }
        
        const options = {
          url: util.format("http://%s/%s/%s/%s/welcome.htm", this.options.host, organizationId, eventIdParts[0], eventIdParts[1]),
          htmlDownloadInterval: this.options.htmlDownloadInterval
        };
          
        let actions = [];

        this.getParsedHtml(options)
          .then(($) => {
            const rows = $('table tr').filter((index, row) => {
              return $(row).find('a').length === 1; 
            });

            rows.each((index, row) => {
              const title = normalize($(row).find('td:last-of-type').text());
              if (!title) {
                winston.log('warn', util.format('Could not read title from event %s', eventId));
                return;
              }
           
              const link = $(row).find('a');
              if (!link.length) {
                winston.log('warn', util.format('Could not find link from event %s', eventId));
                return;
              }
              
              const linkHref = $(link).attr('href');
              const linkText = $(link).text();
              const idMatch = /(.*\/)(.*)(\.htm)/.exec(linkHref);
              
              if (idMatch.length !== 4) {
                winston.log('warn', util.format('Unexpected link href %s in event %s', linkHref, eventId));
                return;
              }
              
              const id = idMatch[2];
              if (!id) {
                winston.log('warn', util.format('Invalid id read from href %s in event %s', linkHref, eventId));
                return;
              }
              
              if (!linkText.endsWith(' §')) {
                winston.log('warn', util.format('Unexpected link text %s in event %s', linkText, eventId));
                return;
              }
              
              const articleNumber = linkText.substring(0, linkText.length - 2);
              if (!articleNumber) {
                winston.log('warn', util.format('Invalid articleNumber read from link text %s in event %s', linkText, eventId));
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
     * Returns a promise for scraped data out of the PDF-file.
     * 
     * @param {String} organizationId organizationId 
     * @param {String} eventId eventId
     * @param {String} actionId actionId
     * 
     * Returned data is ordered in same order that it is in the PDF-document. 
     */
    extractOrganizationEventActionContents(organizationId, eventId, actionId) {
      return new Promise((resolve, reject) => {
        const eventIdParts = eventId.split('-'); 
        if (eventIdParts.length !== 2) {
          reject(util.format('Invalid eventId %s', eventId));
          return;
        }
        
        const options = {
          url: util.format("http://%s/%s/%s/%s/%s.htm", this.options.host, organizationId, eventIdParts[0], eventIdParts[1], actionId),
          htmlDownloadInterval: this.options.htmlDownloadInterval
        };
          
        let contents = [];

        this.getParsedHtml(options)
          .then(($) => {
            let order = 0;

            const dnoText = $('p:first-of-type').text();
            if (!dnoText) {
              winston.log('warn', util.format('Could not read dno from event %s action %s', eventId, actionId));
              return;
            }
            
            const dnoMatch = /([0-9]{1,}-[0-9]{4})(\ \([0-9]{1,}\)){0,1}/.exec(dnoText);
            const dno = dnoMatch.length > 0 ? dnoMatch[0] : null;
            
            if (!dno) {
              winston.log('warn', util.format('Unexpected dno from event %s action %s', eventId, actionId));
              return;
            }
            
            contents.push({
              order: order++,
              title: 'Dno',
              content: dno 
            });
            
            let ingress = $('.ing').last();
            if (ingress.length) {
              contents.push({
                order: order++,
                title: 'Tiivistelmä',
                content: normalize(ingress.text())
              });
            }
            
            const notify = this.extractOrganizationEventActionContentsNotify($);
            const xsDocs = this.extractOrganizationEventActionContentsXSDocs($);
            
            if (xsDocs.length === 0) {
              winston.log('warn', util.format('Could not find any contents from event %s action %s', eventId, actionId));
            } else {
              let title = 'Esittelyteksti';
              let contentTexts = { };
              
              $(xsDocs).find('.liiteoheis').remove();

              $(xsDocs).find('p').each((index, p) => {
                const titleElement = $(p).find('.ehdotuspaatos');
                if (titleElement.length) {
                  title = titleElement.text(); 
                  titleElement.remove();
                }
                if (!contentTexts[title]) {
                  contentTexts[title] = [];
                }
                
                contentTexts[title].push(normalize($(p).text()));
              });
              
              _.forEach(contentTexts, (contentText, title) => {
                contents.push({
                  order: order++,
                  title: title,
                  content: contentText.join('\n\n')
                });
              });
            }
            
            if (notify) {
              contents.push({
                order: order++,
                title: 'Jakelu',
                content: notify
              });
            }
            
            resolve(contents);
          })
          .catch(reject);
      });
    }
    
    extractOrganizationEventActionContentsXSDocs($) {
      const resultElements = [];
      const children = $('body').children();
      let i = children.length;
      
      while (i >= 0) {
        i--;
        
        if ($(children[i]).is("#divTiedote")) {
          break;
        }
      }
      
      while (i >= 0) {
        if ($(children[i]).is(".XSDoc")) {
          resultElements.unshift(children[i]);
        }
        
        if ($(children[i]).prop("tagName") === 'P') {
          break;
        }
        
        i--;
      }
      
      return $(resultElements);
    }
    
    extractOrganizationEventActionContentsNotify($) {
      if ($('.jakelu').length) {
        let type = '';
        let nodes = [];
        let texts = [];

        _.forEach($('.jakelu')[0].childNodes, (node) => {
          if (node.nodeType === 3) {
            nodes.push(node);
          } else {
            const element = node;
            if ($(element).is('.jaktyyppi')) {
              type = $(element).text();
            } else if ($(node).prop("tagName") === 'BR') {
              const text = _.map(nodes, (node) => {
                return normalize($(node).text());
              }).join('');

              texts.push(type ? util.format("%s (%s)", text, type) : text);
              nodes = [];
            }
          }
        });
        
        return texts.join(', ');
      }
      
      return null;
    }
    
    /**
     * Extracts events for a year
     * 
     * @param {String} organizationId organizationId where to scrape events
     * @param {Number} year year to extract
     * @param {Moment} eventsAfter return only events afer the moment
     * @returns {Promise}
     */
    extractOrganizationYearEvents(organizationId, year, eventsAfter) {
      return new Promise((resolve, reject) => {
        const options = {
          url: util.format("http://%s/%s/%s/welcome.htm", this.options.host, organizationId, year),
          htmlDownloadInterval: this.options.htmlDownloadInterval
        };
          
        let events = [];

        this.getParsedHtml(options)
          .then(($) => {
            const rows = $('ul li a').filter((index, row) => {
              return $(row).text().indexOf('Pöytäkirja') > 0; 
            });

            rows.each((index, row) => {
              const name = $(row).text();
              const linkHref = $(row).attr('href');
              const idMatch = /(\/[0-9]{4}\/)(.*)(\/welcome.htm)/.exec(linkHref);
              const dateMatch = /[0-9]{2}\.[0-9]{2}\.[0-9]{4}/.exec(name);

              if (idMatch.length < 3) {
                winston.log('warn', util.format('Could not read id from href %s', linkHref));
                return;
              }

              if (dateMatch.length < 1) {
                winston.log('warn', util.format('Could not read date from name %s', name));
                return;
              }

              const id = idMatch[2];
              const dateStr = dateMatch[0];
              const eventStart = moment(dateStr, 'D.M.YYYY', 'fi', true);

              if (!id) {
                winston.log('warn', util.format('Invalid id read from href %s', linkHref));
                return;
              }

              if (!eventStart.isValid()) {
                winston.log('warn', util.format('Could not parse date from name %s', name));
                return;
              }
              
              if (!eventsAfter || eventsAfter.isBefore(eventStart)) {
                events.push({
                  "sourceId": util.format("%d-%s", year, id),
                  "name": name,
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
  }
  
  module.exports = TurkuHtmlScraper;
           
}).call(this);