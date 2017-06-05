/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const AbstractCasemMocker = require(__dirname + '/abstract-casem-mocker');
  
  class MikkeliCasemMocker extends AbstractCasemMocker {
    
    constructor() {
      super({
        baseUrl: 'http://localhost/api/opennc/v1',
        baseDir: __dirname + '/../data/mikkeli/casem/'
      });
    }
    
    mock() {
      this.mockResponse("Nodes", 'nodes.json');
      this.mockResponse("Nodes(10717)/SubNodes()", '10717_subnodes.json');
    }
    
  }
  
  module.exports = MikkeliCasemMocker;
  
})();