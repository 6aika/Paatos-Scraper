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
  
  const TampereCasemMocker = require(__dirname + '/mockers/tampere-casem-mocker');
  const TampereCasemScraper = require(__dirname + '/../scrapers/casem/tampere/tampere-casem-scraper');
  const tampereKhKokoukset = require(__dirname + '/data/tampere/tampere_kh_kokoukset');
  const tampereKhKokouksetAfter15052017 = require(__dirname + '/data/tampere/tampere_kh_kokoukset_after_15052017');
  const tampereKhKokouksetMax3 = require(__dirname + '/data/tampere/tampere_kh_kokoukset_max3');
  const mocker = new TampereCasemMocker();
  
  describe('Tampere Events Scraper tests', () => {
    
    before((done) => {
      mocker.mock();
      done();
    });

    after((done) => {
      mocker.cleanAll();
      done();
    });
    
    it('Test events scraping', () => {

      const testScraper = new TampereCasemScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(testScraper.extractOrganizationEvents("11292", null, null)))
        .to.eventually.eql(tampereKhKokoukset);
    });
    
    it('Test events scraping avents after', () => {
      (new TampereCasemMocker()).mock();

      const testScraper = new TampereCasemScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(testScraper.extractOrganizationEvents("11292", null, moment('2017-05-15T00:00:00+03:00'))))
        .to.eventually.eql(tampereKhKokouksetAfter15052017);
    });
    
    it('Test events scraping max 3', () => {
      (new TampereCasemMocker()).mock();

      const testScraper = new TampereCasemScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(testScraper.extractOrganizationEvents("11292", 3, null)))
        .to.eventually.eql(tampereKhKokouksetMax3);
    });
  });
  
})();