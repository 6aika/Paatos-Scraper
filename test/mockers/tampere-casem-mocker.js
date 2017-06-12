/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const util = require('util');
  const AbstractCasemMocker = require(__dirname + '/abstract-casem-mocker');
  
  class TampereCasemMocker extends AbstractCasemMocker {
    
    constructor() {
      super({
        baseUrl: 'http://localhost',
        baseDir: __dirname + '/../data/tampere/casem/'
      });
    }
    
    mock() {
      this.mockResponse('Nodes', 'nodes.json');
      this.mockResponse('Nodes(11291)/SubNodes()', '11291_subnodes.json');
      this.mockResponse('Nodes(11291)/SubNodes(11292)/SubNodes()', '11291_11292_subnodes.json');
      this.mockResponse('Nodes(11291)/SubNodes(11292)/SubNodes(11291)/SubNodes()', '11291_11292_11291_subnodes.json');
      
      for (let contentId = 57; contentId <= 69; contentId++) {
        this.mockResponse(util.format('Contents(%d)/ExtendedProperties', contentId), util.format('contents_%d_extended_properties.json', contentId));
      }
      
      this.mockResponse('Contents(57)/ExtendedProperties', 'contents_57_extended_properties.json');
      this.mockResponse('Contents(58)/ExtendedProperties', 'contents_58_extended_properties.json');
      this.mockResponse('Contents(59)/ExtendedProperties', 'contents_59_extended_properties.json');
      
      this.mockFilteredResponse('Contents()', 'Classifications%2Fany(f%3Af%2FNodeId%20eq%2012486)', 'node_11292_contents.json');
      
      const heads = {
        '%7B22dbe55b-74bc-4bd2-8b5a-a7c81af4de81%7D/83442': {
          'Content-Length': '304118',  
          'Content-Disposition': 'image;filename="Liite kh Esitys Etelä-Savon maakuntavaltuuston ja -hallituksen kokoonpanoksi.pdf"'
        },
        '%7B58e84d27-f5ef-4813-b4e0-36b0917db5ee%7D/83441': {
          'Content-Length': '304118',  
          'Content-Disposition': 'image;filename="Liite kh Esitys Etelä-Savon maakuntavaltuuston ja -hallituksen kokoonpanoksi.pdf"'
        },
        '%7B73cac6cf-5f69-436c-99f8-e6dbaa4e97b3%7D/73398': {
          'Content-Length': '304118',  
          'Content-Disposition': 'image;filename="Liite kh Esitys Etelä-Savon maakuntavaltuuston ja -hallituksen kokoonpanoksi.pdf"'
        },
        '%7B5623fe30-8215-4488-ad4f-53d1b956b5d8%7D/73401': {
          'Content-Length': '304118',  
          'Content-Disposition': 'image;filename="Liite kh Esitys Etelä-Savon maakuntavaltuuston ja -hallituksen kokoonpanoksi.pdf"'
        },
        '%7B7472bba4-4b69-425d-9e90-5a562f69ae59%7D/73399': {
          'Content-Length': '304118',  
          'Content-Disposition': 'image;filename="Liite kh Esitys Etelä-Savon maakuntavaltuuston ja -hallituksen kokoonpanoksi.pdf"'
        },
        '%7B38926ed2-e7de-46eb-858e-69de325c5a38%7D/73400': {
          'Content-Length': '304118',  
          'Content-Disposition': 'image;filename="testpdf.pdf"'
        },
        '%7Bd6f8ef8c-7c1b-43fc-97c4-541bb188b62a%7D/73392': {},
        '%7B6c087290-1525-4d8b-b35e-8ff1083b7dd9%7D/73393': {},
        '%7B495a43d4-0f30-44f9-9740-46e5720f3edc%7D/73394': {},
        '%7Bf92942c9-36e5-4e34-8327-98f9bfe56aee%7D/73402': {},
        '%7B1493dc65-c655-4030-b2c5-cfb18bd687f5%7D/73395': {},
        '%7Ba3e6a626-12f2-47d8-9daf-1c8f78315fce%7D/73396': {},
        '%7B07c243f9-89c9-4603-abdb-6543e6cc415a%7D/73397': {},
        '%7Bdb851830-9604-4ef8-94c8-a28692a1fb5b%7D/73403': {}
      };
      
      const ids = Object.keys(heads);
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        this.mockHeadRequest(util.format('/download/noname/%s', id), Object.assign({
          'Cache-Control': 'public, no-cache="Set-Cookie"',
          'Content-Type': 'application/pdf',
          'Last-Modified': 'Fri, 02 Jun 2017 08:03:11 GMT',
          'Server': 'Microsoft-IIS/8.5',
          'Set-Cookie': 'ASP.NET_SessionId=xxx; path=/; HttpOnly',
          'X-AspNet-Version': '4.0.30319',
          'X-Powered-By': 'ASP.NET',
          'Date': 'Mon, 05 Jun 2017 18:03:09 GMT',
          'Content-Length': '0',
          'Content-Disposition': 'image;filename="Fake Liite 2016.pdf"'
        }, heads[id]));
      }
    }
    
  }
  
  module.exports = TampereCasemMocker;
  
})();