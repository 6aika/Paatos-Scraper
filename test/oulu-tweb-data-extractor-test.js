/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const chai = require('chai');
  const nock = require('nock');
  const expect = chai.expect;
  const assert = chai.assert;
  
  chai.use(require('chai-as-promised'));
  
  const DataExtractorFactory = require(__dirname + '/../extract/data-extractor-factory');
  const ouluToimielimet = require(__dirname + '/data/oulu_toimielimet');
  const ouluKaupunginhallitusKokoukset = require(__dirname + '/data/oulu_kaupunginhallitus_kokoukset');
  const ouluKaupunginhallitus5_2017_asiat = require(__dirname + '/data/oulu_kaupunginhallitus_5_2017_asiat');
  const ouluKaupunginhallitus5_2017_toimenpiteet = require(__dirname + '/data/oulu_kaupunginhallitus_5_2017_73_toimenpiteet');

  describe('Oulu Tweb Pdf Scraper tests', () => {
    
    var ouluDataExtractor = DataExtractorFactory.createDataExtractor("oulu", {
      "host": "localhost"
    });

    it('Test organizations extracting', () => {
      nock('http://localhost')
        .get('/ktwebbin/dbisa.dll/ktwebscr/pk_tek_tweb.htm')
        .replyWithFile(200, __dirname + '/data/oulu_tweb_haku.html');
      
      return expect(Promise.resolve(ouluDataExtractor.extractOrganizations()))
        .to.eventually.eql(ouluToimielimet);
    });
    
    it('Test events extracting', () => {
      nock('http://localhost')
        .post('/ktwebbin/dbisa.dll/ktwebscr/pk_kokl_tweb.htm', {
          'kirjaamo': '690',
          'oper': 'where'
        })
        .replyWithFile(200, __dirname + '/data/oulu_tweb_kaupunginhallitus_kokoukset.html');
      
      return expect(Promise.resolve(ouluDataExtractor.extractOrganizationEvents("690")))
        .to.eventually.eql(ouluKaupunginhallitusKokoukset);
    });
    
    it('Test cases extracting', () => {
      nock('http://localhost')
        .get('/ktwebbin/dbisa.dll/ktwebscr/pk_asil_tweb.htm?+bid=12867')
        .replyWithFile(200, __dirname + '/data/oulu_tweb_kaupunginhallitus_5_2017.html');
      
      return expect(Promise.resolve(ouluDataExtractor.extractEventCases("690", "12867")))
        .to.eventually.eql(ouluKaupunginhallitus5_2017_asiat);
    });
    
    it('Test actions extracting', () => {
      nock('http://localhost')
        .get('/ktwebbin/ktproxy2.dll?doctype=3&docid=35090068')
        .replyWithFile(200, __dirname + '/data/35090068.pdf');
      
      return expect(Promise.resolve(ouluDataExtractor.extractActions("690", "12867", "35090068")))
        .to.eventually.eql(ouluKaupunginhallitus5_2017_toimenpiteet);
    });
    
  });
  
})();