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

  const vantaaKaupunginhallitusKokoukset = require(__dirname + '/data/vantaa/vantaa_kaupunginhallitus_kokoukset');
  
  describe('Vantaa Tweb Html Events Scraper tests', () => {
    
    var htmlTestScraper = new VantaaTwebHtmlScraper({
      "host": "localhost"
    });
    
    it('Test events scraping', () => {
      nock('http://localhost')
        .post('/ktwebbin/dbisa.dll/ktwebscr/pk_kokl_tweb.htm', {
          'kirjaamo': '55015.000000',
          'oper': 'where'
        })
        .replyWithFile(200, __dirname + '/data/vantaa/vantaa_tweb_kaupunginhallitus_kokoukset.html');
      
      return expect(Promise.resolve(htmlTestScraper.extractOrganizationEvents("55015.000000")))
        .to.eventually.eql(vantaaKaupunginhallitusKokoukset);
    });
    
  });
  
})();