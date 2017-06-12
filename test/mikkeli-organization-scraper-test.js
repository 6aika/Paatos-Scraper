/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const Promise = require('bluebird');
  const chai = require('chai');
  
  const expect = chai.expect;
  const assert = chai.assert;
  
  chai.use(require('chai-as-promised'));
  
  const TampereCasemMocker = require(__dirname + '/mockers/tampere-casem-mocker');
  const TampereCasemScraper = require(__dirname + '/../scrapers/casem/tampere/tampere-casem-scraper');
  const tampereToimielimet = require(__dirname + '/data/tampere/tampere_toimielimet');
  const mocker = new TampereCasemMocker();
  
  describe('Tampere Organization Scraper tests', () => {
    
    before((done) => {
      mocker.mock();
      done();
    });
      
    after((done) => {
      mocker.cleanAll();
      done();
    });
    
    const testScraper = new TampereCasemScraper({
      "host": "localhost"
    });
    
    it('Test organizations scraping', () => {
      return expect(Promise.resolve(testScraper.extractOrganizations()))
        .to.eventually.eql(tampereToimielimet);
    });
    
  });
  
})();