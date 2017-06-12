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
  const mikkeliKh170605Attachments222 = require(__dirname + '/data/mikkeli/mikkeli_kh_170605_attachments_222');
  const mocker = new MikkeliCasemMocker();
  
  describe('Mikkeli event action attachments scraper tests', () => {
    
    before((done) => {
      mocker.mock();
      done();
    });
      
    after((done) => {
      mocker.cleanAll();
      done();
    });
    
    it('Test event action attachments scraping', () => {
      
      const testScraper = new MikkeliCasemScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(testScraper.extractOrganizationEventActionAttachments("11217", "12381", "4060")))
        .to.eventually.eql(mikkeliKh170605Attachments222);
    });
    
  });
  
})();