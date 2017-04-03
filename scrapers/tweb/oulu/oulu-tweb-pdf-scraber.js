/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const AbstractTwebPdfScraper = require(__dirname + '/../abstract-tweb-pdf-scraber');

  /**
   * Abstract base class for scrapers
   */
  class OuluTwebPdfScraper extends AbstractTwebPdfScraper {
    
    constructor(pdfFile) {
      super(pdfFile);      
      this._captions = null;
      this._values = null;
    }
    
    get captions() {
      return new Promise((resolve, reject) => {
        if (this._captions !== null) {
          resolve(this._captions);
        } else {
          this.scrapeCaptions()
            .then((captions) => {
              this._captions = captions;
              resolve(this._captions);
            })
            .catch(reject);
        }
      });
    }
    
    get values() {
      return new Promise((resolve, reject) => {
        if (this._values !== null) {
          resolve(this._values);
        } else {
          this.scrapeValues()
            .then((values) => {
              this._values = values;
              resolve(this._values);
            })
            .catch(reject);
        }
      });
    }
    
    scrapeCaptions() {
      // TODO: Implement
      return new Promise((resolve, reject) => {
        resolve([]);
      });
    }
    
    scrapeValues() {
      // TODO: Implement
      return new Promise((resolve, reject) => {
        resolve([]);
      });
    }
    
  }
  
  module.exports = OuluTwebPdfScraper;
           
}).call(this);