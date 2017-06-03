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
  const espooKh170529Contents4 = require(__dirname + '/data/espoo/espoo_kh_170529_contents_4');
  const espooYl130117Contents5 = require(__dirname + '/data/espoo/espoo_yl_130117_contents_5');
  
  describe('Espoo Html Events Scraper tests 8.5.2017 - 127', () => {
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
    
    it('Test event actions scraping 29.5.2017 - 3', () => {
      const EspooHtmlScraper = require(__dirname + '/../scrapers/espoo/espoo-html-scraper');

      nock('http://localhost')
        .get('/kokous/2017409886-4.HTM')
        .replyWithFile(200, __dirname + '/data/espoo/2017409886-4.HTM');

      const htmlTestScraper = new EspooHtmlScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(htmlTestScraper.extractOrganizationEventActionContents("217668", "2017409886", "2017409886-4")))
        .to.eventually.eql(espooKh170529Contents4);
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
    
    it('Test Dno scraping from 2017409886-26', () => {
      const EspooHtmlScraper = require(__dirname + '/../scrapers/espoo/espoo-html-scraper');

      nock('http://localhost')
        .get('/kokous/2017409886-26.HTM')
        .replyWithFile(200, __dirname + '/data/espoo/2017409886-26.HTM');

      const htmlTestScraper = new EspooHtmlScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(htmlTestScraper.extractOrganizationEventActionContents("200747", "2017409886", "2017409886-26")))
        .to
        .eventually
        .deep.property('[0].content', "2751/2015");
    });
    
    it('Test functionId scraping from 2017409886-26', () => {
      const EspooHtmlScraper = require(__dirname + '/../scrapers/espoo/espoo-html-scraper');

      nock('http://localhost')
        .get('/kokous/2017409886-26.HTM')
        .replyWithFile(200, __dirname + '/data/espoo/2017409886-26.HTM');

      const htmlTestScraper = new EspooHtmlScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(htmlTestScraper.extractOrganizationEventActionContents("200747", "2017409886", "2017409886-26")))
        .to
        .eventually
        .deep.property('[1].content', "10 02 03");
    });
  });
  
})();