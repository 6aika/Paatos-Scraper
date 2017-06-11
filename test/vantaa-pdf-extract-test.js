/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const util = require('util');
  const fs = require('fs');
  const Promise = require('bluebird');
  const chai = require('chai');
  const rimraf = require('rimraf');
  const expect = chai.expect;
  const assert = chai.assert;
  
  chai.use(require('chai-fs'));
  chai.use(require('chai-as-promised'));
  
  const options = require(__dirname + '/../options/pdf');
  const DataExtractorFactory = require(__dirname + '/../extract/data-extractor-factory');
  const vantaaActions17032010 = require(__dirname + '/data/vantaa/vantaa_kaupunginhallitus_3_20_2017_10_toimenpiteet.json');

  describe('Vantaa PDF extract tests', function () {
    it('Test Vantaa PDF scraping', () => {
      const tempFolder = fs.mkdtempSync('paatos-scraper');
      const outputFile = util.format('%s/vantaa.json', tempFolder);
      
      options.options = {
        'source': 'vantaa',
        'pdf-url': 'file://' + __dirname +  '/data/vantaa/510975521.pdf',
        'output-file': outputFile
      };
      
      const extractor = DataExtractorFactory.createDataExtractor('vantaa');
      
      const promise = new Promise((resolve, reject) => {
        extractor.extractPdfEventActionContents(options)
          .then(() => {
            expect(outputFile).to.be.a.file();
            expect(require(__dirname + '/../' + outputFile)).to.eql(vantaaActions17032010);
            rimraf.sync(tempFolder);
            resolve(null);
          })
          .catch(reject);
      });
      
      return expect(Promise.resolve(promise))
        .to.eventually.eql(null);
    });
    
  });
  
})();