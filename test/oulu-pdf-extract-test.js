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
  const ouluKaupunginhallitus5_2017_toimenpiteet_73 = require(__dirname + '/data/oulu/oulu_kaupunginhallitus_5_2017_73_toimenpiteet');
  
  describe('Oulu PDF extract tests', function () {
    it('Test Oulu PDF scraping', () => {
      const tempFolder = fs.mkdtempSync('paatos-scraper');
      const outputFile = util.format('%s/oulu.json', tempFolder);
      
      options.options = {
        'source': 'oulu',
        'pdf-url': 'file://' + __dirname +  '/data/oulu/35090068.pdf',
        'output-file': outputFile
      };
      
      const extractor = DataExtractorFactory.createDataExtractor('oulu');
      
      const promise = new Promise((resolve, reject) => {
        extractor.extractPdfEventActionContents(options)
          .then(() => {
            expect(outputFile).to.be.a.file();
            expect(require(__dirname + '/../' + outputFile)).to.eql(ouluKaupunginhallitus5_2017_toimenpiteet_73);
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