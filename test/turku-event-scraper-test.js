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
  
  const TurkuHtmlScraper = require(__dirname + '/../scrapers/turku/turku-html-scraper');

  const turkukh2017kokoukset = require(__dirname + '/data/turku/turku_kh_2017_kokoukset');
  const turkukh201612201701kokouksetMax3 = require(__dirname + '/data/turku/turku_kh_2017_kokoukset_max3');
  const turkukh201612201701kokoukset = require(__dirname + '/data/turku/turku_kh_2016-12-2017-01_kokoukset');
  
  function mockEmptyYears(fromYear, toYear) {
    for (let year = fromYear; year <= toYear; year++) {
      nock('http://localhost')
        .get(util.format('/kh/%d/welcome.htm', year))
        .replyWithFile(200, __dirname + '/data/turku/turku_kh_empty.htm');
    }
  }
  
  function mockEmptyYearsTo(toYear) {
    mockEmptyYears(1995, toYear);
  }
  
  describe('Turku Html Events Scraper tests', () => {
    
    it('Test events scraping', () => {
      mockEmptyYearsTo(2016);
      
      nock('http://localhost')
        .get('/kh/2017/welcome.htm')
        .replyWithFile(200, __dirname + '/data/turku/turku_kh_2017_kokoukset.htm');

      const htmlTestScraper = new TurkuHtmlScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(htmlTestScraper.extractOrganizationEvents("kh", null, null)))
        .to.eventually.eql(turkukh2017kokoukset);
    });
    
    it('Test events scraping across years', () => {
      nock('http://localhost')
        .get('/kh/2016/welcome.htm')
        .replyWithFile(200, __dirname + '/data/turku/turku_kh_2016-12_kokoukset.htm');
      
      nock('http://localhost')
        .get('/kh/2017/welcome.htm')
        .replyWithFile(200, __dirname + '/data/turku/turku_kh_2017-01_kokoukset.htm');
      
      const htmlTestScraper = new TurkuHtmlScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(htmlTestScraper.extractOrganizationEvents("kh", null, moment('2016-11-01'))))
        .to.eventually.eql(turkukh201612201701kokoukset);
    });
    
    it('Test events scraping maxEvents', () => {
      mockEmptyYearsTo(2016);
      
      nock('http://localhost')
        .get('/kh/2017/welcome.htm')
        .replyWithFile(200, __dirname + '/data/turku/turku_kh_2017_kokoukset.htm');

      const htmlTestScraper = new TurkuHtmlScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(htmlTestScraper.extractOrganizationEvents("kh", 3, null)))
        .to.eventually.eql(turkukh201612201701kokouksetMax3);
    });
  });
  
})();