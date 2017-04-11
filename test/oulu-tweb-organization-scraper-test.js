/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const chai = require('chai');
  const expect = chai.expect;
  const assert = chai.assert;
  
  chai.use(require('chai-as-promised'));
  
  const OuluTwebHtmlScraper = require(__dirname + '/../scrapers/tweb/oulu/oulu-tweb-html-scraper');

  const ouluToimielimet = require(__dirname + '/data/oulu_toimielimet');

  describe('Oulu Tweb Html Organization Scraper tests', () => {
    
    var htmlTestScraper = new OuluTwebHtmlScraper('http://asiakirjat.ouka.fi/ktwebbin/dbisa.dll/ktwebscr/pk_tek_tweb.htm');
    
    it('Test organizations scraping', () => {
      return expect(Promise.resolve(htmlTestScraper.organizations))
        .to.eventually.eql(ouluToimielimet);
    });
    
  });
  
})();