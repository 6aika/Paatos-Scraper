/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const util = require('util');
  const AbstractCasemMocker = require(__dirname + '/abstract-casem-mocker');
  
  class MikkeliCasemMocker extends AbstractCasemMocker {
    
    constructor() {
      super({
        baseUrl: 'http://localhost/api/opennc/v1',
        baseDir: __dirname + '/../data/mikkeli/casem/'
      });
    }
    
    mock() {
      this.mockResponse('Nodes', 'nodes.json');
      this.mockResponse('Nodes(10717)/SubNodes()', '10717_subnodes.json');
      this.mockResponse('Nodes(10717)/SubNodes(11217)/SubNodes()', '10717_11217_subnodes.json');
      this.mockResponse('Nodes(10717)/SubNodes(11217)/SubNodes(11218)/SubNodes()', '10717_11217_11218_subnodes.json');
      
      for (let contentId = 4019; contentId <= 4065; contentId++) {
        this.mockResponse(util.format('Contents(%d)/ExtendedProperties', contentId), util.format('contents_%d_extended_properties.json', contentId));
      }
      
      this.mockResponse('Contents(4020)/ExtendedProperties', 'contents_4020_extended_properties.json');
      this.mockResponse('Contents(4021)/ExtendedProperties', 'contents_4021_extended_properties.json');
      this.mockResponse('Contents(4022)/ExtendedProperties', 'contents_4022_extended_properties.json');
      
      this.mockFilteredResponse('Contents()', 'Classifications%2Fany(f%3Af%2FNodeId%20eq%2012381)', 'node_12381_contents.json');
    }
    
  }
  
  module.exports = MikkeliCasemMocker;
  
})();