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
  const tampereKh170605Attachments222 = require(__dirname + '/data/tampere/tampere_kh_170605_attachments_222');
  const mocker = new TampereCasemMocker();
  
  describe('Tampere event action attachments scraper tests', () => {
    
    before((done) => {
      mocker.mock();
      done();
    });

    after((done) => {
      mocker.cleanAll();
      done();
    });
    
    it('Test event action attachments scraping', () => {
      
      const testScraper = new TampereCasemScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(testScraper.extractOrganizationEventActionAttachments("11217", "12381", "69")))
        .to.eventually.eql(tampereKh170605Attachments222);
    });
    
  });
  
})();