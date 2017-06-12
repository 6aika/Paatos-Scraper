/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const util = require('util');
  const fs = require('fs');
  const Promise = require('bluebird');
  const chai = require('chai');
  const unzipper = require('unzipper');
  const rimraf = require('rimraf');
  const expect = chai.expect;
  const assert = chai.assert;
  

  chai.use(require('chai-fs'));
  chai.use(require('chai-as-promised'));
  
  const options = require(__dirname + '/../app/options');
  const TampereCasemMocker = require(__dirname + '/mockers/tampere-casem-mocker');
  const DataExtractorFactory = require(__dirname + '/../extract/data-extractor-factory');
  const mocker = new TampereCasemMocker();
  
  describe('Tampere extract tests', function () {
    this.timeout(60000);
    
    before((done) => {
      mocker.mock();
      done();
    });

    after((done) => {
      mocker.cleanAll();
      done();
    });

    it('Test organizations scraping', () => {
      const tempFolder = fs.mkdtempSync('paatos-scraper');
      const zipFile = util.format('%s/tre.zip', tempFolder);
      const output = util.format('%s/tre', tempFolder); 
      
      options.options = {
        'organization-id': '11292',
        'max-events': 1,
        'output-zip': zipFile,
        'host': 'localhost'
      };
      
      const extractor = DataExtractorFactory.createDataExtractor('tampere', {
        host: options.getOption('host')
      });
      
      const promise = new Promise((resolve, reject) => {
        extractor.extractOrganizationData(options)
          .then(() => {
            fs.createReadStream(zipFile)
              .pipe(unzipper.Extract({ path: output }))
              .promise()
              .then(() => {
                setTimeout(() => {
                  expect(output).to.be.a.directory().and.deep.equal(__dirname + '/data/tampere/extracted');
                  rimraf.sync(tempFolder);
                  resolve(null);
                }, 500);
              })
              .catch(reject);
          })
          .catch(reject);
      });
      
      return expect(Promise.resolve(promise))
        .to.eventually.eql(null);
    });
    
  });
  
})();