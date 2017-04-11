/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const chai = require('chai');
  const expect = chai.expect;
  const assert = chai.assert;
  
  chai.use(require('chai-as-promised'));
  
  const OuluTwebHtmlScraper = require(__dirname + '/../scrapers/tweb/oulu/oulu-tweb-html-scraper');

  const ouluKaupunginhallitusKokoukset = require(__dirname + '/data/oulu_kaupunginhallitus_kokoukset');

  describe('Oulu Tweb Html Events Scraper tests', () => {
    
    var htmlTestScraper = new OuluTwebHtmlScraper();
    
    it('Test events scraping', () => {
      return expect(Promise.resolve(htmlTestScraper.getOrganizationEvents("690")))
        .to.eventually.eql(ouluKaupunginhallitusKokoukset);
    });
    
  });
  
})();