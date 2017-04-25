/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const chai = require('chai');
  const nock = require('nock');
  const expect = chai.expect;
  const assert = chai.assert;
  
  chai.use(require('chai-as-promised'));
  
  const VantaaTwebHtmlScraper = require(__dirname + '/../scrapers/tweb/vantaa/vantaa-tweb-html-scraper');

  const vantaaKaupunginhallitus_20_3_2017_asiat = require(__dirname + '/data/vantaa_kaupunginhallitus_20_3_2017_asiat');

  describe('Vantaa Tweb Html Events Scraper tests', () => {
    
    var htmlTestScraper = new VantaaTwebHtmlScraper({
      "host": "localhost"
    });
    
    it('Test events scraping', () => {
      nock('http://localhost')
        .get('/ktwebbin/dbisa.dll/ktwebscr/pk_asil_tweb.htm?+bid=130013')
        .replyWithFile(200, __dirname + '/data/vantaa_tweb_kaupunginhallitus_20_3_2017.html');
      
      return expect(Promise.resolve(htmlTestScraper.extractOrganizationEventActions("130013")))
        .to.eventually.eql(vantaaKaupunginhallitus_20_3_2017_asiat);
    });
    
  });
  
})();