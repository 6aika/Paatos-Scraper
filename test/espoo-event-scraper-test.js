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
  
  const EspooHtmlScraper = require(__dirname + '/../scrapers/espoo/espoo-html-scraper');

  const espooKhKokoukset = require(__dirname + '/data/espoo/espoo_kh_kokoukset');
  const espooKhKokouksetAfter27022017 = require(__dirname + '/data/espoo/espoo_kh_kokoukset_events_after_27022017');
  const espooKhKokouksetMax3 = require(__dirname + '/data/espoo/espoo_kh_kokoukset_events_max3');
  
  describe('Espoo Html Events Scraper tests', () => {
    
    it('Test events scraping', () => {
      ['200120', '214778', '217668'].forEach((eventId) => {
        nock('http://localhost')
          .get(util.format('/kokous/TELIN-%s.HTM', eventId))
          .replyWithFile(200, __dirname + util.format('/data/espoo/TELIN-%s.HTM', eventId));
      });
      
      const htmlTestScraper = new EspooHtmlScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(htmlTestScraper.extractOrganizationEvents("217668", null, null)))
        .to.eventually.eql(espooKhKokoukset);
    });
    
    it('Test events scraping avents after', () => {
      ['200120', '214778', '217668'].forEach((eventId) => {
        nock('http://localhost')
          .get(util.format('/kokous/TELIN-%s.HTM', eventId))
          .replyWithFile(200, __dirname + util.format('/data/espoo/TELIN-%s.HTM', eventId));
      });
      
      const htmlTestScraper = new EspooHtmlScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(htmlTestScraper.extractOrganizationEvents("217668", null, moment('2017-04-02T00:00:00+03:00'))))
        .to.eventually.eql(espooKhKokouksetAfter27022017);
    });
    
    it('Test events scraping max 3', () => {
      ['200120', '214778', '217668'].forEach((eventId) => {
        nock('http://localhost')
          .get(util.format('/kokous/TELIN-%s.HTM', eventId))
          .replyWithFile(200, __dirname + util.format('/data/espoo/TELIN-%s.HTM', eventId));
      });
      
      const htmlTestScraper = new EspooHtmlScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(htmlTestScraper.extractOrganizationEvents("217668", 3, null)))
        .to.eventually.eql(espooKhKokouksetMax3);
    });
  });
  
})();