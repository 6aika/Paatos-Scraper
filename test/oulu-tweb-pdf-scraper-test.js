/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const fs = require('fs');
  const chai = require('chai');
  const expect = chai.expect;
  const assert = chai.assert;
  
  chai.use(require('chai-as-promised'));
  
  const OuluTwebPdfScraper = require(__dirname + '/../scrapers/tweb/oulu/oulu-tweb-pdf-scraper');

  const smokeCaptions = require(__dirname + '/data/smoke/captions.json');
  const smokeValues = require(__dirname + '/data/smoke/values.json');

  describe('Oulu Tweb Pdf Scraper tests', () => {
    it('Smoke test for field captions extraction', () => {
      var smokeTestScraper = new OuluTwebPdfScraper(fs.createReadStream(__dirname + '/data/smoke/395959398.pdf'));
    
      return expect(Promise.resolve(smokeTestScraper.extractActions()))
        .to.eventually.eql(smokeCaptions);
    });
    
    it('Smoke test for field values extraction', () => {
      var smokeTestScraper = new OuluTwebPdfScraper(fs.createReadStream(__dirname + '/data/smoke/395959398.pdf'));
    
      return expect(Promise.resolve(smokeTestScraper.extractContents()))
        .to.eventually.eql(smokeValues);
    });
  });
  
})();