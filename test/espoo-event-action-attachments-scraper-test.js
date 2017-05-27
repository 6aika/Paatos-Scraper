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
  
  const espooKh170508Attachments127 = require(__dirname + '/data/espoo/espoo_kh_170508_attachments_127');
  
  describe('Espoo Html Event attachments scraper tests', () => {
    it('Test event action attachments scraping', () => {
      const EspooHtmlScraper = require(__dirname + '/../scrapers/espoo/espoo-html-scraper');

      nock('http://localhost')
        .get('/kokous/2017406946-3.HTM')
        .replyWithFile(200, __dirname + '/data/espoo/2017406946-3.HTM');

      nock('http://espoo04.hosting.documenta.fi')
        .head('/kokous/2017406946-3-1.PDF')
        .reply(200, 'DATA', {
          'content-length': "375600",
          'content-type': 'application/pdf'
        });
        
      nock('http://espoo04.hosting.documenta.fi')
        .head('/kokous/2017406946-3-2.PDF')
        .reply(200, 'DATA', {
          'content-length': "12088",
          'content-type': 'application/pdf'
        });

      const htmlTestScraper = new EspooHtmlScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(htmlTestScraper.extractOrganizationEventActionAttachments("217668", "2017406946", "2017406946-3")))
        .to.eventually.eql(espooKh170508Attachments127);
    });
    
    it('Test event action empty attachments scraping', () => {
      const EspooHtmlScraper = require(__dirname + '/../scrapers/espoo/espoo-html-scraper');

      nock('http://localhost')
        .get('/kokous/2013262303-5.HTM')
        .replyWithFile(200, __dirname + '/data/espoo/2013262303-5.HTM');

      const htmlTestScraper = new EspooHtmlScraper({
        "host": "localhost"
      });
    
      return expect(Promise.resolve(htmlTestScraper.extractOrganizationEventActionAttachments("200747", "2013262303", "2013262303-5")))
        .to.eventually.eql([]);
    });
  });
  
})();