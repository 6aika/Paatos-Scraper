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
  
  const turkukh20170205190toimenpiteet = require(__dirname + '/data/turku/turku_kh_2017-02-05-190-toimenpiteet');
  const turkukh20170205195toimenpiteet = require(__dirname + '/data/turku/turku_kh_2017-02-05-195-toimenpiteet');
  
  describe('Turku Html Events Scraper tests', () => {
    it('Test event actions scraping', () => {
      const TurkuHtmlScraper = require(__dirname + '/../scrapers/turku/turku-html-scraper');

      nock('http://localhost')
        .get('/kh/2017/0502011x/3540796.htm')
        .replyWithFile(200, __dirname + '/data/turku/turku_kh_2017-02-05-190.htm');

      const htmlTestScraper = new TurkuHtmlScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(htmlTestScraper.extractOrganizationEventActionContents("kh", "2017-0502011x", "3540796")))
        .to.eventually.eql(turkukh20170205190toimenpiteet);
    });
    
    it('Test event actions with history scraping', () => {
      const TurkuHtmlScraper = require(__dirname + '/../scrapers/turku/turku-html-scraper');

      nock('http://localhost')
        .get('/kh/2017/0502011x/3540636.htm')
        .replyWithFile(200, __dirname + '/data/turku/turku_kh_2017-02-05-195.htm');

      const htmlTestScraper = new TurkuHtmlScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(htmlTestScraper.extractOrganizationEventActionContents("kh", "2017-0502011x", "3540636")))
        .to.eventually.eql(turkukh20170205195toimenpiteet);
    });
  });
  
})();