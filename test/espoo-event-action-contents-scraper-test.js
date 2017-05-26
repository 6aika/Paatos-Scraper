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
  
  const espooKh170508Contents127 = require(__dirname + '/data/espoo/espoo_kh_170508_contents_127');
  const espooYl130117Contents5 = require(__dirname + '/data/espoo/espoo_yl_130117_contents_5');
  
  describe('Espoo Html Events Scraper tests', () => {
    it('Test event actions scraping', () => {
      const EspooHtmlScraper = require(__dirname + '/../scrapers/espoo/espoo-html-scraper');

      nock('http://localhost')
        .get('/kokous/2017406946-3.HTM')
        .replyWithFile(200, __dirname + '/data/espoo/2017406946-3.HTM');

      const htmlTestScraper = new EspooHtmlScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(htmlTestScraper.extractOrganizationEventActionContents("217668", "2017406946", "2017406946-3")))
        .to.eventually.eql(espooKh170508Contents127);
    });
    
    it('Test event actions scraping from 2013 format', () => {
      const EspooHtmlScraper = require(__dirname + '/../scrapers/espoo/espoo-html-scraper');

      nock('http://localhost')
        .get('/kokous/2013262303-5.HTM')
        .replyWithFile(200, __dirname + '/data/espoo/2013262303-5.HTM');

      const htmlTestScraper = new EspooHtmlScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(htmlTestScraper.extractOrganizationEventActionContents("200747", "2013262303", "2013262303-5")))
        .to.eventually.eql(espooYl130117Contents5);
    });
  });
  
})();