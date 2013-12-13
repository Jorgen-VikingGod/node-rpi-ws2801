rpi-ws2801
==========

This is a **node.js** library to control a **WS2801** RGB LED stripe via **SPI** with your **Raspberry Pi**.

I wrote this to control a RGB LED stripe using the **WS2801** with my **Raspberry Pi**.
This should also work with other SPI devices.

### installation
```sh
npm install rpi-ws2801
```

Module is registered to npm as [rpi-ws2801](https://npmjs.org/package/rpi-ws2801)

### initialization
```js
var leds = require("rpi-ws2801");
// connecting to SPI
leds.connect(32); // number of LEDs
```
parameters:
* the `number of LEDs` your RGB LED stripe has (32, 60, …)
* (optional) the name of the SPI device (if different to `/dev/spidev0.0`)
* (optional) the `gamma` correction value (1, 2.5, …)

### disconnect from SPI
```js
leds.disconnect();
```

### send stored buffer to SPI
```js
leds.update();
```
This command sends all stored or set colors to SPI.

### fill complete stripe with one color
```js
leds.fill(0xFF, 255, 0x00);
```
parameters:
* red value (0 to 255) or (0x00 to 0xFF)
* green value (0 to 255) or (0x00 to 0xFF)
* blue value (0 to 255) or (0x00 to 0xFF)

This example sets the complete stripe (all LEDs) to color yellow (r: 255, g: 255, b: 0).

### set LED color by array
```js
leds.setColor(0, [255,0,0]);  // set LED1 to red
```
parameters:
* set `led index` from (0 to `number of LEDs` -1)
* set `color array[red, green, blue]` with value (0 to 255)

This example sets the `LED` 0 (first LED) to red.

### set LED color by percentage value
```js
leds.setChannelPower(0, 0.5);
```
parameters:
* set `channel index` from (0 to `number of channels` - 1, `number of channels` = 3 * `number of LEDs`)
* set `percentage` from (0 to 1)

This example sets the `channel` 0 (by default the first red channel) to 50%.

### sending the values to your driver
```js
leds.setRGB(0, '#FF0000');    // set LED1 to red
```
parameters:
* set `led index` from (0 to `number of LEDs` -1)
* set `hex color` with web like hex color string.

This example sets the `LED` 0 (first LED) to red.

### example
```js
var leds = require('rpi-ws2801');

// connecting to Raspberry Pi SPI
leds.connect(32); // assign number of WS2801 LEDs
  
// set all colors to yellow
console.log("fill all yellow");
// fill(r, g, b)
// r, g, b: value as hex (0x00 = 0, 0xFF = 255, 0x7F = 127)
leds.fill(0xFF, 255, 0x00);
  
// after 2 seconds set first 6 LEDs to (red, green, blue, red, green, blue)
setTimeout(function(){
  console.log("red green blue red green blue");
  // setRGB(ledIndex, hexColor);
  // ledIndex: 0 = LED1, 1 = LED2, …
  // hexColor: '#FF0000' = red, '#00FF00' = green, ...
  leds.setRGB(0, '#FF0000');    // set LED1 to red
  leds.setRGB(1, '#00FF00');    // set LED2 to green
  leds.setRGB(2, '#0000FF');    // set LED3 to blue
 
  // setColor(ledIndex, color);
  // ledIndex: 0 = LED1, 1 = LED2, …
  // color: array[red, green, blue] = [255,0,0] = red, [0,255,0] = green
  leds.setColor(3, [255,0,0]);  // set LED4 to red
  leds.setColor(4, [0,255,0]);  // set LED5 to green
  leds.setColor(5, [0,0,255]);  // set LED6 to blue
  
  // send all set colors to SPI via update();
  leds.update();
}, 2000);
```

When running this example the LED stripe will first fill all LEDs with yellow color. After 2 seconds it sets the color of the first 6 LEDs to (red, green, blue, red, green, blue).

### additional commands
Invert all color values.
```js
leds.invert();
```

Reverse the order of LEDs (begin on start of stripe ot end of stripe).
```js
leds.reverse();
```

Clear complete LED stripe (fill with black)
```js
leds.clear();
```

Get channel count
```js
leds.getChannelCount();
```

Define a new RGB order (if first LED is blue instead of red).
```js
leds.setColorIndex(2, 1, 0);
```
parameters:
* set `red channel index` from (0, 1 or 2)
* set `green channel index` from (0, 1 or 2)
* set `blue channel index` from (0, 1 or 2)

This example sets the RGB order to address first the blue than the green and at last the red color channel. Red: 2, green. 1, blue: 0 => blue, green, red. Default is red: 0, green: 1, blue: 2 => red, green, blue.



thx @ [Frederic Worm](https://github.com/fjw) for the initial idea of creating this library.


### wiring the Raspberry Pi

Connect your Pi like this to the LED driver:

| Raspberry Pi | led driver |
|:------------:|:----------:|
| GND | GND |
| 5V or 3.3V (or external) | input V+ |
| SCLK | input CLK |
| MOSI | input DIN |
| CE0  | input LAT |

Connect `/OE` on the LED driver to `GND` or to a GPIO of your choice (you can quickly turn off all LEDs by using a GPIO).

Or use this [Raspberry Pi Bridge](https://github.com/hackerspaceshop/RaspberryPI_WS2801_Bridge) from [http://www.hackerspaceshop.com/](http://www.hackerspaceshop.com/raspberrypi-things/raspberrypi-ws2801.html)

**I am not responsible for any damages to your hardware. Use this at your own risk.**

