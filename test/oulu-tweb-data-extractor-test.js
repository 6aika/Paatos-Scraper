/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const Promise = require('bluebird');
  const chai = require('chai');
  const nock = require('nock');
  const expect = chai.expect;
  const assert = chai.assert;
  
  chai.use(require('chai-as-promised'));
  
  const DataExtractorFactory = require(__dirname + '/../extract/data-extractor-factory');
  const ouluToimielimet = require(__dirname + '/data/oulu/oulu_toimielimet');
  const ouluKaupunginhallitusKokoukset = require(__dirname + '/data/oulu/oulu_kaupunginhallitus_kokoukset');
  const ouluKaupunginhallitus5_2017_asiat = require(__dirname + '/data/oulu/oulu_kaupunginhallitus_5_2017_asiat');
  const ouluKaupunginhallitus5_2017_toimenpiteet_72 = require(__dirname + '/data/oulu/oulu_kaupunginhallitus_5_2017_72_toimenpiteet');
  const ouluKaupunginhallitus5_2017_toimenpiteet_73 = require(__dirname + '/data/oulu/oulu_kaupunginhallitus_5_2017_73_toimenpiteet');
    
  describe('Oulu Tweb Pdf Scraper tests', () => {
    
    var ouluDataExtractor = DataExtractorFactory.createDataExtractor("oulu", {
      "host": "localhost"
    });
    
    it('Test organizations extracting', () => {
      nock('http://localhost')
        .get('/ktwebbin/dbisa.dll/ktwebscr/pk_tek_tweb.htm')
        .replyWithFile(200, __dirname + '/data/oulu/oulu_tweb_haku.html');
      
      return expect(Promise.resolve(ouluDataExtractor.extractOrganizations()))
        .to.eventually.eql(ouluToimielimet);
    });
    
    it('Test events extracting', () => {
      nock('http://localhost')
        .post('/ktwebbin/dbisa.dll/ktwebscr/pk_kokl_tweb.htm', {
          'kirjaamo': '690',
          'oper': 'where'
        })
        .replyWithFile(200, __dirname + '/data/oulu/oulu_tweb_kaupunginhallitus_kokoukset.html');
      
      return expect(Promise.resolve(ouluDataExtractor.extractOrganizationEvents("690")))
        .to.eventually.eql(ouluKaupunginhallitusKokoukset);
    });
    
    it('Test actions extracting', () => {
      nock('http://localhost')
        .get('/ktwebbin/dbisa.dll/ktwebscr/pk_asil_tweb.htm?+bid=12867')
        .replyWithFile(200, __dirname + '/data/oulu/oulu_tweb_kaupunginhallitus_5_2017.html');
      
      return expect(Promise.resolve(ouluDataExtractor.extractEventActions("690", "12867")))
        .to.eventually.eql(ouluKaupunginhallitus5_2017_asiat);
    });
    
    it('Test contents extracting', () => {
      nock('http://localhost')
        .get('/ktwebbin/ktproxy2.dll?doctype=3&docid=35090068')
        .replyWithFile(200, __dirname + '/data/oulu/35090068.pdf');
      
      return expect(Promise.resolve(ouluDataExtractor.extractActionContents("690", "12867", "35090068")))
        .to.eventually.eql(ouluKaupunginhallitus5_2017_toimenpiteet_73);
    });
    
    it('Test contents extracting', () => {
      nock('http://localhost')
        .get('/ktwebbin/ktproxy2.dll?doctype=3&docid=632581845351090')
        .replyWithFile(200, __dirname + '/data/oulu/632581845351090.pdf');
      
      return expect(Promise.resolve(ouluDataExtractor.extractActionContents("690", "12867", "632581845351090")))
        .to.eventually.eql(ouluKaupunginhallitus5_2017_toimenpiteet_72);
    });
    
  });
  
})();