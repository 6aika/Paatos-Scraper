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
  
  const VantaaTwebHtmlScraper = require(__dirname + '/../scrapers/tweb/vantaa/vantaa-tweb-html-scraper');

  const vantaaToimielimet = require(__dirname + '/data/vantaa/vantaa_toimielimet');

  describe('Vantaa Tweb Html Organization Scraper tests', () => {
    
    it('Test organizations scraping', () => {
      let htmlTestScraper = new VantaaTwebHtmlScraper({
        "host": "localhost"
      });
    
      nock('http://localhost')
        .get('/ktwebbin/dbisa.dll/ktwebscr/epj_tek_tweb.htm')
        .replyWithFile(200, __dirname + '/data/vantaa/vantaa_tweb_haku.html');
      
      return expect(Promise.resolve(htmlTestScraper.extractOrganizations()))
        .to.eventually.eql(vantaaToimielimet);
    });
    
  });
  
})();