/*jshint esversion: 6 */

(function() {
  'use strict';
  
  const chai = require('chai');
  const expect = chai.expect;
  
  describe('System test', () => {
    it('Sanity test, should indicate that testing environment is working properly', () => {
      expect(true).to.equal(true);
    });
  });
  
})();