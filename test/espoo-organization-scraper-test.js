/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const Promise = require('bluebird');
  const chai = require('chai');
  const nock = require('nock');
  const expect = chai.expect;
  const assert = chai.assert;
  
  chai.use(require('chai-as-promised'));
  
  const EspooHtmlScraper = require(__dirname + '/../scrapers/espoo/espoo-html-scraper');

  const espooToimielimet = require(__dirname + '/data/espoo/espoo_toimielimet');

  describe('Espoo Organization Scraper tests', () => {
    
    const htmlTestScraper = new EspooHtmlScraper({
      "host": "localhost"
    });
    
    it('Test organizations scraping', () => {
      nock('http://localhost')
        .get('/kokous/TELIMET.HTM')
        .replyWithFile(200, __dirname + '/data/espoo/TELIMET.HTM');
      
      return expect(Promise.resolve(htmlTestScraper.extractOrganizations()))
        .to.eventually.eql(espooToimielimet);
    });
    
  });
  
})();