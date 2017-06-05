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
    
    mockResponse(resource, file) {
      const url = util.format('/api/opennc/v1/%s?%24format=json', resource);
      nock(this.options.baseUrl)
        .get(url)
        .replyWithFile(200, util.format('%s/%s', this.options.baseDir, file));
    }
    
    mockFilteredResponse(resource, filter, file) {
      const url = util.format('/api/opennc/v1/%s?%24format=json&%24filter=%s', resource, filter);
      nock(this.options.baseUrl)
        .get(url)
        .replyWithFile(200, util.format('%s/%s', this.options.baseDir, file));
    }
    
    mockHeadRequest(path, headers) {
      nock(this.options.baseUrl)
        .head(path)
        .reply(200, '', headers);
    }
    
  }
  
  module.exports = AbstractCasemMocker;
  
})();