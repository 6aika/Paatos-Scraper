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

  const ouluKaupunginhallitus5_2017_asiat = require(__dirname + '/data/oulu_kaupunginhallitus_5_2017_asiat');

  describe('Oulu Tweb Html Events Scraper tests', () => {
    
    var htmlTestScraper = new OuluTwebHtmlScraper({
      "host": "localhost"
    });
    
    it('Test events scraping', () => {
      nock('http://localhost')
        .get('/ktwebbin/dbisa.dll/ktwebscr/pk_asil_tweb.htm?+bid=12867')
        .replyWithFile(200, __dirname + '/data/oulu_tweb_kaupunginhallitus_5_2017.html');
      
      return expect(Promise.resolve(htmlTestScraper.getOrganizationEventCases("12867")))
        .to.eventually.eql(ouluKaupunginhallitus5_2017_asiat);
    });
    
  });
  
})();