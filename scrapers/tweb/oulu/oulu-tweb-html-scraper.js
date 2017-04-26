/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const _ = require('lodash');
  const util = require('util');
  const moment = require('moment');
  const normalize = require('normalize-space');
  const Promise = require('bluebird'); 
  const AbstractTwebHtmlScraper = require(__dirname + '/../abstract-tweb-html-scraper');
  
  /**
   * Oulu TWeb specific implementation of Html scraper
   */
  class OuluTwebHtmlScraper extends AbstractTwebHtmlScraper {
    
    constructor(options) {
      super();
      
      this.options = Object.assign({
        "host": "asiakirjat.ouka.fi",
        "searchFormPath": "/ktwebbin/dbisa.dll/ktwebscr/pk_tek_tweb.htm",
        "eventsPath": "/ktwebbin/dbisa.dll/ktwebscr/pk_kokl_tweb.htm",
        "eventPath": "/ktwebbin/dbisa.dll/ktwebscr/pk_asil_tweb.htm",
        "eventCaseAttachmentsPath": "/ktwebbin/dbisa.dll/ktwebscr/epjattn_tweb.htm",
        "encoding": "binary"
      }, options || {});
    }
    
    /**
     * Returns a promise for organization event actions.
     * 
     * Returned data is ordered in same order that it is in html page. 
     * 
     * @param {String} eventId eventId where to scrape actions
     */
    extractOrganizationEventActions(eventId) {
      return new Promise((resolve, reject) => {       
        var options = {
          "url": util.format("http://%s%s", this.options.host, this.options.eventPath),
          "method": "GET",
          "encoding": this.options.encoding,
          "qs": {
            "+bid": eventId 
          },
          "qsStringifyOptions": { encode: false },
          "htmlDownloadInterval": this.options.htmlDownloadInterval
        };
        
        this.getParsedHtml(options)
          .then(($) => {
            var actions = [];
            var rows = $('table.list tr[class*="data"]').filter((index, row) => {
              return !!$(row).find('.data_pykala').text();
            });
                    
            rows.each((index, row) => {
              var link = $(row).find('td.data:nth-of-type(2) a');
              var linkHref = link.attr('href');
              var idMatch = /(.*docid=)([0-9]*)(.*)/.exec(linkHref);
              
              var id = idMatch[2];
              var articleNumber = $(row).find('.data_pykala').text();
              var title = normalize(link.text());
              
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
    
  }
  
  module.exports = OuluTwebHtmlScraper;
           
}).call(this);