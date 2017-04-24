/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  /**
   * PositionedText
   */
  class PositionedText {
    
    constructor(text, type, x, y, width, height, pageOffsetY, pageHeight, bold, italic) {
      this.text = text;
      this.type = type;
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.pageOffsetY = pageOffsetY;
      this.pageHeight = pageHeight;
      this.bold = bold;
      this.italic = italic;
    }
    
    static get VALUE() {
      return 'VALUE';
    }
    
    static get CAPTION() {
      return 'CAPTION';
    }
  }
  
  module.exports = PositionedText;
           
}).call(this);