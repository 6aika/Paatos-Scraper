/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const util = require('util');
  const chai = require('chai');
  const nock = require('nock');
  const Promise = require('bluebird');
  const moment = require('moment');
  const expect = chai.expect;
  const assert = chai.assert;
  
  chai.use(require('chai-as-promised'));
  
  const espooKhActions170508 = require(__dirname + '/data/espoo/espoo_kh_actions_170508');
  
  describe('Espoo Html Events Scraper tests', () => {
    
    it('Test event actions scraping', () => {
      const EspooHtmlScraper = require(__dirname + '/../scrapers/espoo/espoo-html-scraper');
      
      nock('http://localhost')
        .get('/kokous/2017406946.HTM')
        .replyWithFile(200, __dirname + '/data/espoo/2017406946.HTM');

      const htmlTestScraper = new EspooHtmlScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(htmlTestScraper.extractOrganizationEventActions("217668", "2017406946")))
        .to.eventually.eql(espooKhActions170508);
    });
  });
  
})();