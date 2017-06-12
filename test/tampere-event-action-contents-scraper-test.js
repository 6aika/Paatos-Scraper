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
  const tampereKh170605Contents229 = require(__dirname + '/data/tampere/tampere_kh_170605_contents_229');
  const mocker = new TampereCasemMocker();
  
  describe('Tampere events contents scraper tests', () => {
    
    before((done) => {
      mocker.mock();
      done();
    });

    after((done) => {
      mocker.cleanAll();
      done();
    });
   
    it('Test event action contents scraping', () => {
      
      const testScraper = new TampereCasemScraper({
        "host": "localhost"
      });

      return expect(Promise.resolve(testScraper.extractOrganizationEventActionContents("12486", "11292", "69")))
        .to.eventually.eql(tampereKh170605Contents229);
    });
    
  });
  
})();