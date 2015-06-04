var fs        = require('fs');
var microtime = require('microtime');

/*
 A node.js library to control a WS2801 RGB LED stripe via SPI with your Raspberry Pi
 @copyright 2013 Jürgen Skrotzky (MIT-License)
*/

function RPiWS2801(){
  this.spiDevice = '/dev/spidev0.0';
  this.numLEDs = 32;
  this.spiFd = null; //filedescriptor for spidevice
  this.inverted = false;
  this.reversed = false;	
  this.gamma = 2.5;
  this.redIndex = 0;
  this.greenIndex = 1;
  this.blueIndex = 2;
  this.gammatable = new Array(256);
  this.bytePerPixel = 3; //RGB
  this.channelCount = this.numLEDs*this.bytePerPixel;
  this.values = new Buffer(this.channelCount);
  this.rowResetTime = 1000; // number of us CLK has to be pulled low (=no writes) for frame reset
    						            // manual of WS2801 says 500 is enough, however we need at least 1000
  this.lastWriteTime = microtime.now()-this.rowResetTime-1; //last time something was written to SPI
    												                                //required for save WS2801 reset	
  // clear buffer    												                                
  for( var i = 0; i < this.channelCount; i++) {
    this.values[i] = 0;
  }
}

RPiWS2801.prototype = {
  /*
   * connect to SPI port
   */
  connect: function(numLEDs, spiDevice, gamma){
    // sanity check for params
    if ((numLEDs !== parseInt(numLEDs)) || (numLEDs<1)) {
      console.error("invalid param for number of LEDs, plz use integer >0");
      return false;
    }
    if (spiDevice){
      this.spiDevice = spiDevice;
    }
    // connect synchronously
    try{
      this.spiFd = fs.openSync(this.spiDevice, 'w');
    } catch (err) {
      console.error("error opening SPI device "+this.spiDevice, err);
      return false;
    }
    this.numLEDs = numLEDs;

    this.channelCount = this.numLEDs*this.bytePerPixel;

    this.values = new Buffer(this.channelCount);

    this.gamma = gamma ? gamma : 2.5; //set gamma correction value
    // compute gamma correction table
    for (var i=0; i<256; i++)
      this.gammatable[i] = Math.round(255*Math.pow(i/255, this.gamma));
    //console.log("gammatable" + this.gammatable);
  },

  /*
   * disconnect from SPI port
   */
  disconnect : function(){
    if (this.spiFd) fs.closeSync(this.spiFd);
  },

  /*
   * send stored buffer with RGB values to WS2801 stripe
   */
  update: function(){
    if (this.spiFd) {
      this.sendRgbBuffer(this.values);
    }  
  },
  
  /*
   * invert all colors
   */
  invert: function(){
    this.inverted = !this.inverted;
  }, // end invert
  
  /*
   * send buffer with RGB values to WS2801 stripe in reverse order
   */        
  reverse: function(){
    this.reversed = !this.reversed;
  }, // end reverse

  /*
   * clear RGB stripe
   */  
  clear: function(){
    this.fill(0x00, 0x00, 0x00); 
  }, // end clear

  /*
   * set new RGB index order
   */
  setColorIndex: function(redIndex, greenIndex, blueIndex){
    this.redIndex = redIndex;
    this.greenIndex = greenIndex;
    this.blueIndex = blueIndex;
  }, // end setColorIndex

  /*
   * send buffer with RGB values to WS2801 stripe
   */
  sendRgbBuffer : function(buffer){
    // checking if enough time passed for resetting stripe
    if (microtime.now() > (this.lastWriteTime + this.rowResetTime)){
      // yes, its o.k., lets write
      // but first do gamma correction
      var adjustedBuffer = new Buffer(buffer.length);
      for (var i=0; i < buffer.length; i++){
        adjustedBuffer[i]=this.gammatable[buffer[i]];
      }
      fs.writeSync(this.spiFd, adjustedBuffer, 0, buffer.length, null);
      this.lastWriteTime = microtime.now();
      return true;
    }
    console.log('writing too fast, data dropped');
    return false;	
  }, // end sendRgbBuffer

  /*
   * fill whole stripe with one color
   */
  fill: function(r,g,b){
    if (this.spiFd) {      
      var colors = this.getRGBArray(r,g,b);
      var colorBuffer = new Buffer(this.channelCount);
      for (var i=0; i<(this.channelCount); i+=3){
        colorBuffer[i+0]=colors[0];
        colorBuffer[i+1]=colors[1];
  	colorBuffer[i+2]=colors[2];
      }
      this.sendRgbBuffer(colorBuffer);
    }    	
  }, //end fill

  /*
   * set color of led index [red, green, blue] from 0 to 255
   */  
  setColor: function(ledIndex, color) {
    if (this.spiFd) {
      var colors = this.getRGBArray(color[0],color[1],color[2]);
      var r, g, b;
      r = colors[0] / 255;
      g = colors[1] / 255;
      b = colors[2] / 255;      
      var redChannel = this.getRedChannelIndex(ledIndex);
      this.setChannelPower(redChannel,   r);
      this.setChannelPower(redChannel+1, g);
      this.setChannelPower(redChannel+2, b);
    }
  },

  /*
   * set power of channel from 0 to 1
   */  
  setChannelPower: function(channelIndex, powerValue) {
    if (this.spiFd) {  
      if(channelIndex > this.channelCount || channelIndex < 0) {
        return false;
      }
      if(powerValue < 0)
        powerValue = 0;
      if(powerValue > 1)
        powerValue = 1;
      this.values[channelIndex] = Math.floor((Math.pow(16, 2) - 1) * powerValue);
    }
  }, // end setChannelPower
        
  /*
   * set RGB hexcolor to LED index
   */  
  setRGB: function(ledIndex, hexColor) {
    if (this.spiFd) {
      var rgb = this.getRGBfromHex(hexColor);
      var colors = this.getRGBArray(rgb.r,rgb.g,rgb.b);
      var redChannel = this.getRedChannelIndex(ledIndex);
      this.setChannelPower(redChannel+this.redIndex,   colors[0]);
      this.setChannelPower(redChannel+this.greenIndex, colors[1]);
      this.setChannelPower(redChannel+this.blueIndex,  colors[2]);
    }
  }, // end setRGB  
         
  mySin: function(a, min, max){
    return min + ((max-min)/2.)*(Math.sin(a)+1)        
  }, 

  rainbow: function(a){
    var intense = 255;
    var r = parseInt(this.mySin(a, 0, intense));
    var g = parseInt(this.mySin(a+Math.pi/2, 0, intense));
    var b = parseInt(this.mySin(a + Math.pi, 0, intense));
    var colors = this.getRGBArray(r,g,b);
    return [colors[0],colors[1],colors[2]];
  }, 

  getChannelCount: function() {
    return this.channelCount;
  },
    
  getRedChannelIndex: function(ledIndex) {
    return ledIndex * 3;
  },
        
  getGreenChannelIndex: function(ledIndex) {
    return ledIndex * 3 + 1;
  },
        
  getBlueChannelIndex: function(ledIndex) {
    return ledIndex * 3 + 2;
  },
  
  getRGBArray: function(r, g, b){
    var colorArray = new Array(3);
    colorArray[this.redIndex] = r;
    colorArray[this.greenIndex] = g;
    colorArray[this.blueIndex] = b;
    if(this.inverted) {
      colorArray[0] = (1 - colorArray[0]/255)*255;
      colorArray[1] = (1 - colorArray[1]/255)*255;
      colorArray[2] = (1 - colorArray[2]/255)*255;
    }      
    return colorArray;
  },

  getRGBfromHex: function(color) {
    var r, g, b;
    if (color.length == 4) {
      r = parseInt(color.replace("#", "").substr(0,1)+color.replace("#", "").substr(0,1),16);
      g = parseInt(color.replace("#", "").substr(1,1)+color.replace("#", "").substr(1,1),16);
      b = parseInt(color.replace("#", "").substr(2,1)+color.replace("#", "").substr(2,1),16);
    }
    if (color.length == 7) {
      r = parseInt(color.replace("#", "").substr(0,2),16);
      g = parseInt(color.replace("#", "").substr(2,2),16);
      b = parseInt(color.replace("#", "").substr(4,2),16);
    }
    var colors = this.getRGBArray(r,g,b);
    r = colors[0] / 255;
    g = colors[1] / 255;
    b = colors[2] / 255;
    if (r>=0 && r<=1 && g>=0 && g<=1 && b>=0 && b<=1) {
      return {r:r,g:g,b:b};
    } else {
      return {r:0,g:0,b:0};
    }
  }
}

module.exports = new RPiWS2801();
