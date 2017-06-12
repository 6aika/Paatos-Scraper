/*jshint esversion: 6 */

(function() {
  'use strict';

  const _ = require('lodash');
  const fs = require('fs');
  const util = require('util');
  const cheerio = require('cheerio');
  const normalize = require('normalize-space');
  const AbstractScraper = require('./abstract-scraper');
  const Entities = require('html-entities').AllHtmlEntities;
  const entities = new Entities();
  
  class AbstractHtmlScraper extends AbstractScraper {
    
    constructor() {
      super();
    }
    
    /**
     * Returns promise for parsed html
     * 
     * @param {Object} options options te be passed to request
     * @returns {Promise} Promise for parsed html data
     */
    getParsedHtml(options) {
      return new Promise((resolve, reject) => {
        this.doRequest(options)
          .then((body) => {
            if (options.cleanWordHtml) {
              resolve(cheerio.load(this.cleanWordHtml(body)));
            } else {
              resolve(cheerio.load(body));
            }
          })
          .catch(reject);     
      });
    }
    
    trimHtml(html) {
      return html.replace(/>\s+</g,'><'); 
    }
    
    normalizeElementTexts($, elements) {
      $(elements).find('*').contents().each((index, element) => {
        const parentNode = element.parentNode;
        const parentTag = parentNode ? parentNode.tagName.toUpperCase() : null;
        if (element.nodeType === 3) {
          if ('P' === parentTag) {
            const firstChild = parentNode.firstChild === element;
            const lastChild = parentNode.lastChild === element;
            element.nodeValue = this.normalizeTextContent(element.nodeValue, !firstChild, !lastChild);
          } else {
            element.nodeValue = this.normalizeTextContent(element.nodeValue, true, true); 
          }
        }
      });
    }
    
    decodeHtmlEntities(html) {
      return entities.decode(html);
    }
    
    cleanWordHtml(html) {
      return this.normalizeQuotes(html);
    }
    
    normalizeQuotes(text) {
      return text
        .replace(/[\u0092\u2019\u2018\u2019]/g, "'")
        .replace(/[\u0094\u201C\u201D]/g, '"');
    }
    
    normalizeTextContent(text, keepLeading, keepTrailing) {
      if (text && text.length > 1) {
        const leading = keepLeading && text[0] === ' ' ? ' ' : '';
        const trailing = keepTrailing && text[text.length - 1] === ' ' ? ' ' : '';
        return util.format('%s%s%s', leading, normalize(text), trailing);
      }
      
      return text;
    }
    
  }
  
  module.exports = AbstractHtmlScraper;
           
}).call(this);