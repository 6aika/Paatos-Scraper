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
  
  const espooKhKokous170508 = require(__dirname + '/data/espoo/espoo_kh_kokous_170508');
  
  describe('Espoo Html Events Scraper tests', () => {
    it('Test event actions scraping', () => {
      const EspooHtmlScraper = require(__dirname + '/../scrapers/espoo/espoo-html-scraper');

      nock('http://localhost')
        .get('/kokous/2017406946-3.HTM')
        .replyWithFile(200, __dirname + '/data/espoo/2017406946-3.HTM');

      const htmlTestScraper = new EspooHtmlScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(htmlTestScraper.extractOrganizationEventActionContents("kh", "2017406946", "2017406946-3")))
        .to.eventually.eql(espooKhKokous170508);
    });
  });
  
})();