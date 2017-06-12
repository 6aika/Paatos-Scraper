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
  
  const MikkeliCasemScraper = require(__dirname + '/../scrapers/casem/mikkeli/mikkeli-casem-scraper');
  const MikkeliCasemMocker = require(__dirname + '/mockers/mikkeli-casem-mocker');
  const mikkeliKh170605Contents229 = require(__dirname + '/data/mikkeli/mikkeli_kh_170605_contents_229');
  const mocker = new MikkeliCasemMocker();
  
  describe('Mikkeli events contents scraper tests', () => {
    
    before((done) => {
      mocker.mock();
      done();
    });
      
    after((done) => {
      mocker.cleanAll();
      done();
    });
    
    it('Test event action contents scraping', () => {
      const testScraper = new MikkeliCasemScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(testScraper.extractOrganizationEventActionContents("11217", "12381", "4027")))
        .to.eventually.eql(mikkeliKh170605Contents229);
    });
    
  });
  
})();