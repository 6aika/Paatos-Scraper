/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const moment = require('moment');
  const chai = require('chai');
  const nock = require('nock');
  const expect = chai.expect;
  const assert = chai.assert;
  
  chai.use(require('chai-as-promised'));
  
  const DataExtractorFactory = require(__dirname + '/../extract/data-extractor-factory');
  const vantaaToimielimet = require(__dirname + '/data/vantaa_toimielimet');
  const vantaaKaupunginhallitusKokoukset = require(__dirname + '/data/vantaa_kaupunginhallitus_kokoukset');
  const vantaaKaupunginhallitus170320_asiat = require(__dirname + '/data/vantaa_kaupunginhallitus_20_3_2017_asiat');
  const vantaaKaupunginhallitus17032010_toimenpiteet = require(__dirname + '/data/vantaa_kaupunginhallitus_3_20_2017_10_toimenpiteet');
    
  describe('Vantaa Tweb data extractor tests', () => {
    
    var vantaaDataExtractor = DataExtractorFactory.createDataExtractor("vantaa", {
      "host": "localhost"
    });
    
    it('Test organizations extracting', () => {
      nock('http://localhost')
        .get('/ktwebbin/dbisa.dll/ktwebscr/epj_tek_tweb.htm')
        .replyWithFile(200, __dirname + '/data/vantaa_tweb_haku.html');
      
      return expect(Promise.resolve(vantaaDataExtractor.extractOrganizations()))
        .to.eventually.eql(vantaaToimielimet);
    });
    
    it('Test events extracting', () => {
      nock('http://localhost')
        .post('/ktwebbin/dbisa.dll/ktwebscr/pk_kokl_tweb.htm', {
          'kirjaamo': '55015.000000',
          'oper': 'where'
        })
        .replyWithFile(200, __dirname + '/data/vantaa_tweb_kaupunginhallitus_kokoukset.html');
      
      return expect(Promise.resolve(vantaaDataExtractor.extractOrganizationEvents("55015.000000")))
        .to.eventually.eql(vantaaKaupunginhallitusKokoukset);
    });
    
    it('Test cases extracting', () => {
      nock('http://localhost')
        .get('/ktwebbin/dbisa.dll/ktwebscr/pk_asil_tweb.htm?+bid=130013')
        .replyWithFile(200, __dirname + '/data/vantaa_tweb_kaupunginhallitus_20_3_2017.html');
      
      return expect(Promise.resolve(vantaaDataExtractor.extractEventCases("55015.000000", "130013")))
        .to.eventually.eql(vantaaKaupunginhallitus170320_asiat);
    });
    
    it('Test actions extracting', () => {
      nock('http://localhost')
        .get('/ktwebbin/ktproxy2.dll?doctype=3&docid=510975521')
        .replyWithFile(200, __dirname + '/data/510975521.pdf');
      
      return expect(Promise.resolve(vantaaDataExtractor.extractActions("55015.000000", "130013", "510975521", moment("2017-03-20T14:00:00.000Z"), "10")))
        .to.eventually.eql(vantaaKaupunginhallitus17032010_toimenpiteet);
    });
    
  });
  
})();