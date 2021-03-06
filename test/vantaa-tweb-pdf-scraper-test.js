/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const Promise = require('bluebird');
  const fs = require('fs');
  const nock = require('nock');
  const chai = require('chai');
  const expect = chai.expect;
  const assert = chai.assert;
  const moment = require('moment');
  
  chai.use(require('chai-as-promised'));
  
  const VantaaTwebPdfScraper = require(__dirname + '/../scrapers/tweb/vantaa/vantaa-tweb-pdf-scraper');
  const vantaaActions17032010 = require(__dirname + '/data/vantaa/vantaa_kaupunginhallitus_3_20_2017_10_toimenpiteet.json');

  describe('Vantaa Tweb Pdf Scraper tests', () => {
    it('Smoke test for field captions extraction', () => {
      nock('http://localhost')
        .get('/ktwebbin/ktproxy2.dll?doctype=3&docid=510975521')
        .replyWithFile(200, __dirname + '/data/vantaa/510975521.pdf');

      var smokeTestScraper = new VantaaTwebPdfScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(smokeTestScraper.extractOrganizationEventActionContents("123", "123", "510975521")))
        .to.eventually.eql(vantaaActions17032010);
    });
  });
  
})();