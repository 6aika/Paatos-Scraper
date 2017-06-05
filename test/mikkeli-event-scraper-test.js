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
  
  const MikkeliCasemMocker = require(__dirname + '/mockers/mikkeli-casem-mocker');
  const MikkeliCasemScraper = require(__dirname + '/../scrapers/casem/mikkeli/mikkeli-casem-scraper');
  const mikkeliKhKokoukset = require(__dirname + '/data/mikkeli/mikkeli_kh_kokoukset');
  const mikkeliKhKokouksetAfter17042017 = require(__dirname + '/data/mikkeli/mikkeli_kh_kokoukset_after_17042017');
  const mikkeliKhKokouksetMax3 = require(__dirname + '/data/mikkeli/mikkeli_kh_kokoukset_max3');
  
  describe('Mikkeli Events Scraper tests', () => {
    
    it('Test events scraping', () => {
      (new MikkeliCasemMocker()).mock();

      const testScraper = new MikkeliCasemScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(testScraper.extractOrganizationEvents("11217", null, null)))
        .to.eventually.eql(mikkeliKhKokoukset);
    });
    
    it('Test events scraping avents after', () => {
      (new MikkeliCasemMocker()).mock();

      const testScraper = new MikkeliCasemScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(testScraper.extractOrganizationEvents("11217", null, moment('2017-04-17T00:00:00+03:00'))))
        .to.eventually.eql(mikkeliKhKokouksetAfter17042017);
    });
    
    it('Test events scraping max 3', () => {
      (new MikkeliCasemMocker()).mock();

      const testScraper = new MikkeliCasemScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(testScraper.extractOrganizationEvents("11217", 3, null)))
        .to.eventually.eql(mikkeliKhKokouksetMax3);
    });
  });
  
})();