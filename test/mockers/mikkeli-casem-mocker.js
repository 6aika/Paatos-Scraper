/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const util = require('util');
  const AbstractCasemMocker = require(__dirname + '/abstract-casem-mocker');
  
  class MikkeliCasemMocker extends AbstractCasemMocker {
    
    constructor() {
      super({
        baseUrl: 'http://localhost',
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
      
      const heads = {
        '%7B6f7c7c68-d5cb-4b39-aabc-d2fafb56815c%7D/57440': {
          'Content-Length': '304118',  
          'Content-Disposition': 'image;filename="Liite kh Esitys Etelä-Savon maakuntavaltuuston ja -hallituksen kokoonpanoksi.pdf"'
        },
        '%7B207b749f-522d-44ec-a080-ec32e6f8d0cd%7D/57441': {
         'Content-Length': '7967683',
         'Content-Disposition': 'image;filename="Liite kh Oikeusministeriön päätös lautamiesten lukumäärästä.pdf"'
        },
        '%7B207b749f-522d-44ec-a080-ec32e6f8d0cd%7D/57441': {
         'Content-Length': '136355',
         'Content-Disposition': 'image;filename="Liite kh Sähköisen kokouskäytännön toimintamalli.pdf"'
        },
        '%7B98937375-dfb8-4e17-b17b-966de818f46b%7D/57437': {
          'Content-Length': '136355',
          'Content-Disposition': 'image;filename="Liite kh Sähköisen kokouskäytännön toimintamalli.pdf"'
        },
        '%7Ba10a4156-710a-4cfe-9e2a-9110a41d635b%7D/57435': {
          'Content-Length': '1759911',
          'Content-Disposition': 'image;filename="Liite kh Arviointikertomus 2016.pdf"'
        },
        '%7B03be4c0c-e887-4d95-a741-160e517b7df5%7D/57436': {
          'Content-Length': '182553',
          'Content-Disposition': 'image;filename="Liite kh Tilintarkastuskertomus vuodelta 2016.pdf"'
        },
        '%7B9146660e-ea73-4b38-9c64-0618c6d5c90b%7D/57438': {
          'Content-Length': '61384',
          'Content-Disposition': 'image;filename="Liite kh Tilinpäätös 2016 tekniset korjaukset.pdf"'
        },
        '%7B314cce09-0f09-4aff-acb0-648f3b74abdb%7D/57439': {
          'Content-Length': '3223789',
          'Content-Disposition': 'image;filename="Liite kh Tilinpäätös 2016.pdf"'
        },
        '%7Bbdc88fb4-6f79-4b11-a237-4c390d493568%7D/57432': {},
        '%7Bbbeb6ea8-86e8-491c-9694-10168b89cbc1%7D/57433': {},
        '%7Beed1f5a8-1387-46a2-9bcd-93beec8468ba%7D/57434': {},
        '%7B4e98e92b-0591-4e71-bc33-d44dd18d9c46%7D/57442': {},
        '%7B29856994-5aa5-49bc-9958-efd40df9c836%7D/57443': {},
        '%7Ba4306067-4bf8-4e39-ae09-8be902119397%7D/57444': {}
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
  
  module.exports = MikkeliCasemMocker;
  
})();