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
  const mikkeliKhActions170605 = require(__dirname + '/data/mikkeli/mikkeli_kh_actions_170605');
  const mocker = new MikkeliCasemMocker();
  
  describe('Mikkeli Event actions scraper tests', () => {
    
    before((done) => {
      mocker.mock();
      done();
    });
      
    after((done) => {
      mocker.cleanAll();
      done();
    });
    
    it('Test event actions scraping', () => {

      const testScraper = new MikkeliCasemScraper({
        "host": "localhost"
      });
      
      return expect(Promise.resolve(testScraper.extractOrganizationEventActions("11217", "12381")))
        .to.eventually.eql(mikkeliKhActions170605);
    });
  });
  
})();