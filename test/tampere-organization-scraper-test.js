/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const Promise = require('bluebird');
  const chai = require('chai');
  
  const expect = chai.expect;
  const assert = chai.assert;
  
  chai.use(require('chai-as-promised'));
  
  const MikkeliCasemMocker = require(__dirname + '/mockers/mikkeli-casem-mocker');
  const MikkeliCasemScraper = require(__dirname + '/../scrapers/casem/mikkeli/mikkeli-casem-scraper');
  const mikkeliToimielimet = require(__dirname + '/data/mikkeli/mikkeli_toimielimet');
  const mocker = new MikkeliCasemMocker();
  
  describe('Mikkeli Organization Scraper tests', () => {
    
    before((done) => {
      mocker.mock();
      done();
    });
      
    after((done) => {
      mocker.cleanAll();
      done();
    });
    
    const testScraper = new MikkeliCasemScraper({
      "host": "localhost"
    });
    
    it('Test organizations scraping', () => {
      return expect(Promise.resolve(testScraper.extractOrganizations()))
        .to.eventually.eql(mikkeliToimielimet);
    });
    
  });
  
})();
