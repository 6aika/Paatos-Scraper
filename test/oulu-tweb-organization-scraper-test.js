/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const chai = require('chai');
  const nock = require('nock');
  const expect = chai.expect;
  const assert = chai.assert;
  
  chai.use(require('chai-as-promised'));
  
  const OuluTwebHtmlScraper = require(__dirname + '/../scrapers/tweb/oulu/oulu-tweb-html-scraper');

  const ouluToimielimet = require(__dirname + '/data/oulu_toimielimet');

  describe('Oulu Tweb Html Organization Scraper tests', () => {
    
    var htmlTestScraper = new OuluTwebHtmlScraper({
      "host": "localhost"
    })
    
    it('Test organizations scraping', () => {
      nock('http://localhost')
        .get('/ktwebbin/dbisa.dll/ktwebscr/pk_tek_tweb.htm')
        .replyWithFile(200, __dirname + '/data/oulu_tweb_haku.html');
      
      return expect(Promise.resolve(htmlTestScraper.extractOrganizations()))
        .to.eventually.eql(ouluToimielimet);
    });
    
  });
  
})();