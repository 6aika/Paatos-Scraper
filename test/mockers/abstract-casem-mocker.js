/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const nock = require('nock');
  const util = require('util');
  
  class AbstractCasemMocker {
    
    constructor(options) {
      this.options = options;
    }
    
    mockResponse(path, file) {
      const url = util.format('/%s?%24format=json', path);
      nock(this.options.baseUrl)
        .get(url)
        .replyWithFile(200, util.format('%s/%s', this.options.baseDir, file));
    }
    
  }
  
  module.exports = AbstractCasemMocker;
  
})();