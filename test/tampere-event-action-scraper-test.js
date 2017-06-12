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
  const tampereKhActions170605 = require(__dirname + '/data/tampere/tampere_kh_actions_170605');
  const mocker = new TampereCasemMocker();
  
  describe('Tampere Event actions scraper tests', () => {
    
    before((done) => {
      mocker.mock();
      done();
    });

    after((done) => {
      mocker.cleanAll();
      done();
    });
    
    it('Test event actions scraping', () => {

      const testScraper = new TampereCasemScraper({
        "host": "localhost"
      });
      
      return expect(Promise.resolve(testScraper.extractOrganizationEventActions("11292", "12486")))
        .to.eventually.eql(tampereKhActions170605);
    });
  });
  
})();