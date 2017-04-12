/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const fs = require('fs');
  const nock = require('nock');
  const chai = require('chai');
  const expect = chai.expect;
  const assert = chai.assert;
  
  chai.use(require('chai-as-promised'));
  
  const OuluTwebPdfScraper = require(__dirname + '/../scrapers/tweb/oulu/oulu-tweb-pdf-scraper');

  const smokeCaptions = require(__dirname + '/data/smoke/captions.json');
  const smokeValues = require(__dirname + '/data/smoke/values.json');

  describe('Oulu Tweb Pdf Scraper tests', () => {
    it('Smoke test for field captions extraction', () => {
      nock('http://localhost')
        .get('/ktwebbin/ktproxy2.dll?doctype=3&docid=395959398')
        .replyWithFile(200, __dirname + '/data/smoke/395959398.pdf');
      
      var smokeTestScraper = new OuluTwebPdfScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(smokeTestScraper.extractActions("123", "123", "395959398")))
        .to.eventually.eql(smokeCaptions);
    });
    
    it('Smoke test for field values extraction', () => {
      nock('http://localhost')
        .get('/ktwebbin/ktproxy2.dll?doctype=3&docid=395959398')
        .replyWithFile(200, __dirname + '/data/smoke/395959398.pdf');
      
      var smokeTestScraper = new OuluTwebPdfScraper({
        "host": "localhost"
      });
      
      return expect(Promise.resolve(smokeTestScraper.extractContents("123", "123", "395959398")))
        .to.eventually.eql(smokeValues);
    });
  });
  
})();