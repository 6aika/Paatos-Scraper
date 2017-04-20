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

  const ouluKaupunginhallitusKokoukset = require(__dirname + '/data/oulu_kaupunginhallitus_kokoukset');
  
  describe('Oulu Tweb Html Events Scraper tests', () => {
    
    var htmlTestScraper = new OuluTwebHtmlScraper({
      "host": "localhost"
    });
    
    it('Test events scraping', () => {
      nock('http://localhost')
        .post('/ktwebbin/dbisa.dll/ktwebscr/pk_kokl_tweb.htm', {
          'kirjaamo': '690',
          'oper': 'where'
        })
        .replyWithFile(200, __dirname + '/data/oulu_tweb_kaupunginhallitus_kokoukset.html');
      
      return expect(Promise.resolve(htmlTestScraper.extractOrganizationEvents("690")))
        .to.eventually.eql(ouluKaupunginhallitusKokoukset);
    });
    
  });
  
})();