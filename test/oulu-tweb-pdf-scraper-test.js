/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const chai = require('chai');
  const expect = chai.expect;
  const assert = chai.assert;
  
  chai.use(require('chai-as-promised'));
  
  const OuluTwebPdfScraper = require(__dirname + '/../scrapers/tweb/oulu/oulu-tweb-pdf-scraper');

  const smokeCaptions = require(__dirname + '/data/smoke/captions.json');
  const smokeValues = require(__dirname + '/data/smoke/values.json');

  describe('Oulu Tweb Pdf Scraper tests', () => {
    
    var smokeTestScraper = new OuluTwebPdfScraper(__dirname + '/data/smoke/395959398.pdf');
    
    it('Class construct test', () => {
      assert.isNotNull(smokeTestScraper, 'Failed to construct smoke test scraper');
    });
    
    it('Smoke test for field captions extraction', () => {
      return expect(Promise.resolve(smokeTestScraper.captions))
        .to.eventually.eql(smokeCaptions);
    });
    
    it('Smoke test for field values extraction', () => {
      return expect(Promise.resolve(smokeTestScraper.values))
        .to.eventually.eql(smokeValues);
    });
    
    
  });
  
})();