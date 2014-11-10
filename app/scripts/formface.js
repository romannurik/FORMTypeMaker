/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function() {
  var formFace = {};

  var FONT = {};
  var GLYPH_NAMES = {};

  var FONTHEIGHT = 144;

  var DEFAULT_LINE_SPACING = 72;
  var DEFAULT_LETTER_SPACING = 20;
  var DEFAULT_PADDING = 144;
  var DEFAULT_ANIM_GLYPH_DURATION = 1000;
  var DEFAULT_ANIM_GLYPH_AVERAGE_DELAY = 50;
  var DEFAULT_ANIM_INTERPOLATOR = accelerate;

  var ctx = null; // current active canvas context


  // Library init

  _loadGlyphs();




  // Public API

  function Instance() {}

  formFace.createInstance = function(text, options) {
    var instance = new Instance();
    instance._text = text;

    instance._options = options = options || {};
    instance._theme = options.theme || formFace.THEME_DEFAULT;
    instance._densityMultiplier = options.densityMultiplier || 1;
    instance._letterHeight = options.letterHeight || FONTHEIGHT;
    instance._scale = options.letterHeight / FONTHEIGHT * instance._densityMultiplier;

    instance._padding = options.padding || (DEFAULT_PADDING * instance._scale);
    instance._lineSpacing = options.lineSpacing || (DEFAULT_LINE_SPACING * instance._scale);
    instance._letterSpacing = options.letterSpacing || (DEFAULT_LETTER_SPACING * instance._scale);
    instance._animGlyphDuration = options.animGlyphDuration || DEFAULT_ANIM_GLYPH_DURATION;
    instance._animGlyphAverageDelay = options.animGlyphAverageDelay || DEFAULT_ANIM_GLYPH_AVERAGE_DELAY;
    instance._animInterpolator = options.animInterpolator || DEFAULT_ANIM_INTERPOLATOR;

    instance._loadText();
    instance._createCanvas();
    return instance;
  };

  Instance.prototype.getCanvas = function() {
    return this._canvas;
  };

  Instance.prototype.draw = function() {
    var me = this;
    ctx = this._canvas.getContext('2d'); // set global
    ctx.fillStyle = this._theme.colorbg;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    var glyphIndex = 0;
    this._layoutPass(function(glyphName, rect) {
      var glyphStartTime = interpolate(me._animInterpolator(glyphIndex / (me._numGlyphs - 1)), 0, me._lastGlyphStartTime);
      var t = progress(me._time, glyphStartTime, glyphStartTime + me._animGlyphDuration);

      ctx.save();
      ctx.translate(rect.l + me._padding, rect.t + me._padding);
      ctx.scale(me._scale, me._scale);
      FONT[glyphName](me._theme, t);
      ctx.restore();

      ++glyphIndex;
    });

    ctx = null; // unset global
  };

  Instance.prototype.setTime = function(t) {
    this._time = constrain(t, 0, this._endTime);
  };

  Instance.prototype.setAnimInterpolator = function(interpolator) {
    this._animInterpolator = interpolator || DEFAULT_ANIM_INTERPOLATOR;
  };

  Instance.prototype.getEndTime = function() {
    return this._endTime;
  };



  // Themes

  formFace.THEME_BLUE = {
    colorbg: '#ffffff',
    color3: '#2A36B1',
    color2: '#02A8F3',
    color1: '#4EC2F6',
    keyColor: '#02A8F3',
    name: 'blue'
  };
  formFace.THEME_MID_BLUE = {
    colorbg: formFace.THEME_BLUE.color2,
    color3: formFace.THEME_BLUE.color3,
    color2: formFace.THEME_BLUE.color1,
    color1: '#ffffff',
    keyColor: formFace.THEME_BLUE.color1,
    name: 'midblue'
  };
  formFace.THEME_DARK_BLUE = {
    colorbg: formFace.THEME_BLUE.color3,
    color3: '#ffffff',
    color2: formFace.THEME_BLUE.color2,
    color1: formFace.THEME_BLUE.color1,
    keyColor: formFace.THEME_BLUE.color1,
    name: 'darkblue'
  };

  formFace.THEME_RED = {
    colorbg: '#ffffff',
    color3: '#A52714',
    color2: '#DB4437',
    color1: '#E67C73',
    keyColor: '#DB4437',
    name: 'red'
  };
  formFace.THEME_MID_RED = {
    colorbg: formFace.THEME_RED.color2,
    color3: formFace.THEME_RED.color3,
    color2: formFace.THEME_RED.color1,
    color1: '#ffffff',
    keyColor: formFace.THEME_RED.color1,
    name: 'midred'
  };
  formFace.THEME_DARK_RED = {
    colorbg: formFace.THEME_RED.color3,
    color3: '#ffffff',
    color2: formFace.THEME_RED.color2,
    color1: formFace.THEME_RED.color1,
    keyColor: formFace.THEME_RED.color1,
    name: 'darkred'
  };

  formFace.THEME_YELLOW = {
    colorbg: '#ffffff',
    color3: '#F09300',
    color2: '#F4B400',
    color1: '#F7CB4D',
    keyColor: '#F4B400',
    name: 'yellow'
  };
  formFace.THEME_MID_YELLOW = {
    colorbg: formFace.THEME_YELLOW.color2,
    color3: formFace.THEME_YELLOW.color3,
    color2: formFace.THEME_YELLOW.color1,
    color1: '#ffffff',
    keyColor: formFace.THEME_YELLOW.color1,
    name: 'midyellow'
  };
  formFace.THEME_DARK_YELLOW = {
    colorbg: formFace.THEME_YELLOW.color3,
    color3: formFace.THEME_YELLOW.color2,
    color2: formFace.THEME_YELLOW.color1,
    color1: '#ffffff',
    keyColor: formFace.THEME_YELLOW.color1,
    name: 'darkyellow'
  };

  formFace.THEME_TEAL = {
    colorbg: '#ffffff',
    color3: '#00695C',
    color2: '#009688',
    color1: '#4DB6AC',
    keyColor: '#009688',
    name: 'teal'
  };
  formFace.THEME_MID_TEAL = {
    colorbg: formFace.THEME_TEAL.color2,
    color3: formFace.THEME_TEAL.color3,
    color2: formFace.THEME_TEAL.color1,
    color1: '#ffffff',
    keyColor: formFace.THEME_TEAL.color1,
    name: 'midteal'
  };
  formFace.THEME_DARK_TEAL = {
    colorbg: formFace.THEME_TEAL.color3,
    color3: '#ffffff',
    color2: formFace.THEME_TEAL.color2,
    color1: formFace.THEME_TEAL.color1,
    keyColor: formFace.THEME_TEAL.color1,
    name: 'darkteal'
  };

  formFace.THEME_GRAY = {
    colorbg: '#ffffff',
    color3: '#424242',
    color2: '#9E9E9E',
    color1: '#BDBDBD',
    keyColor: '#9E9E9E',
    name: 'gray'
  };
  formFace.THEME_MID_GRAY = {
    colorbg: formFace.THEME_GRAY.color2,
    color3: formFace.THEME_GRAY.color3,
    color2: formFace.THEME_GRAY.color1,
    color1: '#ffffff',
    keyColor: formFace.THEME_GRAY.color1,
    name: 'midgray'
  };
  formFace.THEME_DARK_GRAY = {
    colorbg: formFace.THEME_GRAY.color3,
    color3: '#ffffff',
    color2: formFace.THEME_GRAY.color2,
    color1: formFace.THEME_GRAY.color1,
    keyColor: formFace.THEME_GRAY.color1,
    name: 'darkgray'
  };

  formFace.THEMES = [
    formFace.THEME_BLUE,
    formFace.THEME_MID_BLUE,
    formFace.THEME_DARK_BLUE,
    formFace.THEME_YELLOW,
    formFace.THEME_MID_YELLOW,
    formFace.THEME_DARK_YELLOW,
    formFace.THEME_RED,
    formFace.THEME_MID_RED,
    formFace.THEME_DARK_RED,
    formFace.THEME_TEAL,
    formFace.THEME_MID_TEAL,
    formFace.THEME_DARK_TEAL,
    formFace.THEME_GRAY,
    formFace.THEME_MID_GRAY,
    formFace.THEME_DARK_GRAY
  ];

  formFace.THEME_DEFAULT = formFace.THEME_BLUE;

  // Private methods

  Instance.prototype._createCanvas = function() {
    var size = this._measure();
    this._canvas = $('<canvas>')
        .attr('width', size.width)
        .attr('height', size.height)
        .css({
          width: (size.width / this._densityMultiplier) + 'px',
          height: (size.height / this._densityMultiplier) + 'px'
        })
        .get(0);
  };

  Instance.prototype._loadText = function() {
    var text = this._text || '';
    var lineTexts = text.split(/[\r\n]/g);
    this._lines = [];
    var numQuotes = 0;
    for (var l = 0; l < lineTexts.length; l++) {
      var lineText = lineTexts[l];
      var line = [];
      for (var c = 0; c < lineText.length; c++) {
        var char = lineText.charAt(c).toUpperCase();
        if (char in GLYPH_NAMES) {
          if (char == '"') {
            ++numQuotes;
            line.push(numQuotes % 2 === 0 ? '”' : '“');
          } else {
            if (GLYPH_NAMES[char] in FONT) {
              line.push(char);
            }
          }
        } else if (console && console.warn) {
          console.warn('No glyph for character: ' + lineText.charAt(c));
        }
      }
      this._lines.push(line);
    }
  };

  Instance.prototype._measure = function() {
    var size = {
      width: 0,
      height: 0
    };

    var me = this;
    this._numGlyphs = 0;
    this._layoutPass(function(glyphName, rect) {
      size.width = Math.max(size.width, rect.r);
      size.height = Math.max(size.height, rect.b);
      ++me._numGlyphs;
    });

    this._lastGlyphStartTime = this._numGlyphs * this._animGlyphAverageDelay;
    this._endTime = this._lastGlyphStartTime + this._animGlyphDuration;
    this._time = this._endTime;

    size.width += this._padding * 2;
    size.height += this._padding * 2;
    return size;
  };

  Instance.prototype._layoutPass = function(visitFunction) {
    if (!visitFunction) {
      return;
    }

    var x = 0;
    var y = 0;

    var rect = {
      l: 0,
      t: 0,
      r: 0,
      b: 0
    };

    for (var l = 0; l < this._lines.length; l++) {
      x = 0;

      var line = this._lines[l];
      for (var c = -1; c < line.length; c++) {
        var char = (c >= 0) ? line[c] : '\n';
        var glyphName = GLYPH_NAMES[char];
        var glyphWidth = FONT[glyphName].WIDTH * this._scale;

        var kerning = 0;
        if (c > 0) {
          var kerningPairKey = line[c - 1].toUpperCase() + line[c].toUpperCase();
          if (kerningPairKey in KERNING) {
            kerning = KERNING[kerningPairKey] * this._scale;
          }
        }

        x += Math.floor(kerning);

        rect.l = x;
        rect.t = y;
        rect.r = rect.l + glyphWidth;
        rect.b = rect.t + this._letterHeight * this._densityMultiplier;
        visitFunction(glyphName, rect);

        x += Math.floor(glyphWidth + (c >= 0 ? this._letterSpacing : 0));
      }

      y += Math.floor(this._letterHeight * this._densityMultiplier + this._lineSpacing);
    }
  };





  // Library public methods

  function hasGlyphForCharCode(charCode) {
    var char = String.fromCharCode(charCode);
    return char.toUpperCase() in GLYPH_NAMES || char == '\r' || char == '\n';
  }
  formFace.hasGlyphForCharCode = hasGlyphForCharCode;



  // Helpers

  function drawHorzHalfCircle(l, t, r, b, right) {
    ctx.beginPath();
    ctx.arc(
        right ? l : r, (t + b) / 2,
        Math.abs(b - t) / 2,
        Math.PI / 2, -Math.PI / 2, right);
    ctx.fill();
    ctx.closePath();
  }

  function drawCircle(l, t, r, b) {
    ctx.beginPath();
    ctx.arc(
        (l + r) / 2, (t + b) / 2,
        Math.abs((t - b) / 2),
        0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }

  // a vertical isosceles triangle
  function drawVertIsoTriangle(l, t, r, b, up) {
    ctx.beginPath();
    ctx.moveTo(l, up ? b : t);
    ctx.lineTo((l + r) / 2, up ? t : b);
    ctx.lineTo(r, up ? b : t);
    ctx.lineTo(l, up ? b : t);
    ctx.fill();
    ctx.closePath();
  }

  function drawRect(l, t, r, b) {
    ctx.beginPath();
    ctx.moveTo(l, t);
    ctx.lineTo(r, t);
    ctx.lineTo(r, b);
    ctx.lineTo(l, b);
    ctx.lineTo(l, t);
    ctx.fill();
    ctx.closePath();
  }

  function accelerate(t) {
    return Math.pow(t, 5);
  }

  function decelerate(t) {
    return 1 - Math.pow(1 - t, 5);
  }

  function pivotScaleUniform(s, px, py) {
    ctx.translate(px || 0, py || 0);
    ctx.scale(s, s);
    ctx.translate(-px || 0, -py || 0);
  }

  function pivotRotate(r, px, py) {
    ctx.translate(px || 0, py || 0);
    ctx.rotate(r);
    ctx.translate(-px || 0, -py || 0);
  }

  function interpolate(f, min, max) {
    return min + (max - min) * f;
  }

  function progress(v, min, max) {
    return constrain((v - min) / (max - min), 0, 1);
  }

  function constrain(val, min, max) {
    if (val < min) {
      return min;
    } else if (val > max) {
      return max;
    } else {
      return val;
    }
  }

  // http://stackoverflow.com/questions/11068240/what-is-the-most-efficient-way-to-parse-a-css-color-in-javascript
  function cachedParseColor(input) {
    if (!(input in cachedParseColor.cache)) {
      var m = input.match(/^#([0-9a-f]{6})$/i)[1];
      if (m) {
        cachedParseColor.cache[input] = {
          r: parseInt(m.substr(0,2), 16),
          g: parseInt(m.substr(2,2), 16),
          b: parseInt(m.substr(4,2), 16)
        };
      }
    }

    return cachedParseColor.cache[input];
  }
  cachedParseColor.cache = {};

  function colorStr(clr) {
    var r = Math.floor(clr.r).toString(16);
    var g = Math.floor(clr.g).toString(16);
    var b = Math.floor(clr.b).toString(16);
    return '#'
        + (r.length < 2 ? '0' : '') + r
        + (g.length < 2 ? '0' : '') + g
        + (b.length < 2 ? '0' : '') + b;
  }

  function interpolateColors(f, from, to) {
    from = cachedParseColor(from);
    to = cachedParseColor(to);
    return colorStr({
      r: interpolate(f, from.r, to.r),
      g: interpolate(f, from.g, to.g),
      b: interpolate(f, from.b, to.b)
    });
  }


  // Library init
  function _loadGlyphs() {
    var c_a = 'a'.charCodeAt(0);
    var c_z = 'z'.charCodeAt(0);
    var c_0 = '0'.charCodeAt(0);
    var c_9 = '9'.charCodeAt(0);

    var c;
    var char;

    for (c = c_a; c <= c_z; c++) {
      char = String.fromCharCode(c);
      GLYPH_NAMES[char.toUpperCase()] = char.toUpperCase();
    }
    for (c = c_0; c <= c_9; c++) {
      char = String.fromCharCode(c);
      GLYPH_NAMES[char] = char;
    }

    GLYPH_NAMES['#'] = 'HASH';
    GLYPH_NAMES[':'] = 'COLON';
    GLYPH_NAMES['!'] = 'EXCLAMATION';
    GLYPH_NAMES['-'] = 'DASH';
    GLYPH_NAMES['.'] = 'PERIOD';
    GLYPH_NAMES[','] = 'COMMA';
    GLYPH_NAMES['"'] = 'LQUOTE';
    GLYPH_NAMES['“'] = 'LQUOTE';
    GLYPH_NAMES['”'] = 'RQUOTE';
    GLYPH_NAMES['\''] = 'APOSTROPHE';
    GLYPH_NAMES['+'] = 'PLUS';
    GLYPH_NAMES['?'] = 'QUESTION';
    GLYPH_NAMES['@'] = 'AT';
    GLYPH_NAMES['&'] = 'AMPERSAND';
    GLYPH_NAMES['='] = 'EQUAL';
    GLYPH_NAMES[' '] = 'SPACE';
    GLYPH_NAMES[String.fromCharCode(924)] = 'M2';
    GLYPH_NAMES['\n'] = 'NEWLINE';
  }


  // Font data

  FONT.SPACE = function(o, t) {
  };
  FONT.SPACE.WIDTH = 60;

  FONT.NEWLINE = function(o, t) {
  };
  FONT.NEWLINE.WIDTH = 0;

  FONT.A = function(o, t) {
    ctx.save();
    pivotScaleUniform(interpolate(decelerate(t), 0.5, 1), 83, 0);
    ctx.fillStyle = o.color3;
    drawVertIsoTriangle(0, 0, 166, 144, true);
    ctx.restore();

    ctx.save();
    pivotScaleUniform(decelerate(t), 83, 0);
    ctx.fillStyle = o.color1;
    drawVertIsoTriangle(41.5, 0, 124.5, 72, true);
    ctx.restore();
  };
  FONT.A.WIDTH = 166;

  FONT.B = function(o, t) {
    var t1 = progress(t, 0, 0.7);
    var t2 = progress(t, 0.4, 1.0);

    ctx.save();
    ctx.fillStyle = o.color3;
    var left = interpolate(decelerate(t1), 120, 96);
    var top = interpolate(decelerate(t1), 96, 48);
    drawHorzHalfCircle(left, top, 144, 144, true);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color3;
    pivotRotate(interpolate(decelerate(t1), 0, Math.PI), left, top);
    drawHorzHalfCircle(left - 24, top, left, top + 48, false);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color1;
    drawRect(
        interpolate(decelerate(t2), left, 0), 0,
        left, 48);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color2;
    drawRect(
        interpolate(decelerate(t2), left, 0), 48,
        left, 144);
    ctx.restore();
  };
  FONT.B.WIDTH = 144;

  FONT.C = function(o, t) {
    var t1 = progress(t, 0, 0.7);
    var t2 = progress(t, 0.4, 1.0);

    ctx.save();
    ctx.fillStyle = interpolateColors(decelerate(t1), o.color3, o.color2);
    pivotRotate(interpolate(decelerate(t1), 0, Math.PI), 72, 72);
    drawHorzHalfCircle(72, 0, 72, 144, true);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color3;
    drawHorzHalfCircle(0, 0, 72, 144, false);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color1;
    drawRect(
        72, 0,
        interpolate(decelerate(t2), 72, 144), 72);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color2;
    drawRect(
        72, 72,
        interpolate(decelerate(t2), 72, 144), 144);
    ctx.restore();
  };
  FONT.C.WIDTH = 144;

  FONT.D = function(o, t) {
    var t1 = progress(t, 0, 0.7);
    var t2 = progress(t, 0.4, 1.0);

    ctx.save();
    ctx.fillStyle = interpolateColors(decelerate(t1), o.color3, o.color2);
    pivotRotate(interpolate(decelerate(t1), 0, Math.PI), 72, 72);
    drawHorzHalfCircle(0, 0, 72, 144, false);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color3;
    drawHorzHalfCircle(72, 0, 72, 144, true);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color2;
    drawRect(
        interpolate(decelerate(t2), 72, 0), 0,
        72, 144);
    ctx.restore();
  };
  FONT.D.WIDTH = 144;

  FONT.E = function(o, t) {
    var t1 = progress(t, 0, 1.0);
    var t2 = progress(t, 0.1, 1.0);
    var t3 = progress(t, 0.2, 1.0);

    ctx.save();
    ctx.fillStyle = o.color3;
    drawRect(0, 0, 72, 144);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color3;
    drawRect(72, 96, interpolate(decelerate(t1), 72, 144), 144);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color2;
    drawRect(72, 48, interpolate(decelerate(t2), 72, 144), 96);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color1;
    drawRect(72, 0, interpolate(decelerate(t3), 72, 144), 48);
    ctx.restore();
  };
  FONT.E.WIDTH = 144;

  FONT.F = function(o, t) {
    var t1 = progress(t, 0, 1.0);
    var t2 = progress(t, 0.1, 1.0);
    var t3 = progress(t, 0.2, 1.0);

    ctx.save();
    ctx.fillStyle = o.color3;
    drawRect(0, 0, 72, 144);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color2;
    drawRect(72, 0, interpolate(decelerate(t1), 72, 144), 48);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color1;
    drawRect(72, 48, interpolate(decelerate(t2), 72, 144), 96);
    ctx.restore();
  };
  FONT.F.WIDTH = 144;

  FONT.G = function(o, t) {
    ctx.save();
    ctx.fillStyle = interpolateColors(decelerate(t), o.color2, o.color1);
    pivotScaleUniform(interpolate(decelerate(t), 0.5, 1), 144, 0);
    pivotRotate(interpolate(decelerate(t), 0, Math.PI), 72, 72);
    drawHorzHalfCircle(72, 0, 144, 144, true);

    var t1 = progress(t, 0.3, 1);
    ctx.fillStyle = o.color3;
    drawRect(interpolate(decelerate(t1), 24, 0), interpolate(decelerate(t1), 24, 0), 72, 72);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color2;
    pivotScaleUniform(interpolate(decelerate(t), 0.5, 1), 144, 0);
    pivotRotate(interpolate(decelerate(t), 0, Math.PI / 4), 72, 72);
    drawHorzHalfCircle(0, 0, 72, 144, false);
    ctx.restore();
  };
  FONT.G.WIDTH = 144;

  FONT.H = function(o, t) {
    var t1 = progress(t, 0, 0.4);
    var t2 = progress(t, 0.4, 1.0);

    ctx.save();
    ctx.translate(0, interpolate(decelerate(t2), 0, 48));

    ctx.save();
    ctx.fillStyle = o.color1;
    drawRect(0, 0, interpolate(decelerate(t1), 48, 144), 48);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color3;
    drawRect(0, 48, interpolate(decelerate(t1), 24, 72), interpolate(decelerate(t2), 48, 96));
    ctx.fillStyle = o.color2;
    drawRect(
        interpolate(decelerate(t1), 24, 72), 48,
        interpolate(decelerate(t1), 48, 144), interpolate(decelerate(t2), 48, 96));
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color3;
    drawRect(0, 0, interpolate(decelerate(t1), 24, 72), interpolate(decelerate(t2), 0, -48));
    ctx.fillStyle = o.color2;
    drawRect(
        interpolate(decelerate(t1), 24, 72), 0,
        interpolate(decelerate(t1), 48, 144), interpolate(decelerate(t2), 0, -48));
    ctx.restore();

    ctx.restore();
  };
  FONT.H.WIDTH = 144;

  FONT.I = function(o, t) {
    ctx.save();
    ctx.fillStyle = o.color3;
    drawRect(0, interpolate(decelerate(t), 72, 48), 72, 144);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color1;
    drawRect(0, interpolate(decelerate(t), 72, 0), 72, interpolate(decelerate(t), 72, 48));
    ctx.restore();
  };
  FONT.I.WIDTH = 72;

  FONT.J = function(o, t) {
    pivotRotate(interpolate(decelerate(t), -Math.PI / 2, Math.PI / 2), 72, 72);

    var t1 = progress(t, 0.1, 1);

    ctx.save();
    ctx.fillStyle = o.color3;
    drawHorzHalfCircle(72, 0, 72, 144, true);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color2;
    drawRect(72, 0, interpolate(decelerate(t1), 72, 0), 72);
    ctx.restore();
  };
  FONT.J.WIDTH = 144;

  FONT.K = function(o, t) {
    var t1 = progress(t, 0.1, 1);

    pivotScaleUniform(interpolate(decelerate(t), 0.5, 1), 0, 144);

    ctx.fillStyle = o.color3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(144, 144);
    ctx.lineTo(0, 144);
    ctx.moveTo(0, 0);
    ctx.fill();
    ctx.closePath();

    ctx.save();
    pivotScaleUniform(interpolate(decelerate(t), 0, 1), 72, 72);
    ctx.fillStyle = o.color2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(144, 0);
    ctx.lineTo(72, 72);
    ctx.moveTo(0, 0);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  };
  FONT.K.WIDTH = 144;

  FONT.L = function(o, t) {
    ctx.fillStyle = o.color3;
    drawRect(72, 72, 144, 144);

    ctx.fillStyle = o.color1;
    var d = decelerate(t);
    drawRect(interpolate(d, 72, 0), interpolate(d, 72, 0), interpolate(d, 144, 72), 144);
  };
  FONT.L.WIDTH = 144;

  FONT.M = function(o, t) {
    var d = decelerate(t);

    ctx.save();
    ctx.fillStyle = o.color2;
    pivotScaleUniform(interpolate(d, 0.25, 1), 144, 144);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 144);
    ctx.lineTo(144, 144);
    ctx.moveTo(0, 0);
    ctx.fill();
    ctx.restore();

    ctx.save();
    pivotScaleUniform(interpolate(d, 0.5, 1), 144, 144);
    ctx.fillStyle = o.color3;
    ctx.beginPath();
    ctx.moveTo(0, 144);
    ctx.lineTo(144, 144);
    ctx.lineTo(144, 0);
    ctx.moveTo(0, 144);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  };
  FONT.M.WIDTH = 144;

  FONT.M2 = function(o, t) {
    ctx.save();
    ctx.translate(interpolate(decelerate(t), 52, 0), 0);
    ctx.fillStyle = o.color3;
    drawVertIsoTriangle(0, 0, 166, 144, true);
    ctx.restore();

    ctx.save();
    ctx.translate(interpolate(decelerate(t), 52, 46), 0);
    ctx.fillStyle = o.color2;
    drawVertIsoTriangle(0, 0, 166, 144, true);
    ctx.restore();
  };
  FONT.M2.WIDTH = 212;

  FONT.N = function(o, t) {
    var t1 = progress(t, 0.4, 1);
    var d = decelerate(t);
    var d1 = decelerate(t1);

    pivotScaleUniform(interpolate(d, 0.5, 1), 0, 144);

    ctx.save();
    ctx.fillStyle = o.color1;
    drawRect(
        interpolate(d, 0, 72), interpolate(d1, 72, 0),
        interpolate(d, 0, 144), interpolate(d1, 144, 72));
    ctx.fillStyle = o.color2;
    drawRect(
        interpolate(d, 0, 72), interpolate(d1, 144, 72),
        interpolate(d, 0, 144), 144);
    //drawRect(0, 0, left, 72);
    ctx.restore();

    ctx.fillStyle = o.color3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(144, 144);
    ctx.lineTo(0, 144);
    ctx.moveTo(0, 0);
    ctx.fill();
    ctx.closePath();
  };
  FONT.N.WIDTH = 144;

  FONT.O = function(o, t) {
    var t1 = progress(t, 0.05, 1);

    pivotScaleUniform(interpolate(decelerate(t), 0.5, 1), 0, 144);

    ctx.fillStyle = o.color2;
    ctx.beginPath();
    ctx.arc(72, 72, 76, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = o.color3;
    ctx.beginPath();
    var angle = interpolate(decelerate(t1), 0, Math.PI / 2);
    ctx.arc(72, 72, 76, Math.PI / 2 - angle, Math.PI / 2 + angle);
    ctx.fill();
    ctx.closePath();
  };
  FONT.O.WIDTH = 144;

  FONT.P = function(o, t) {
    var t1 = progress(t, 0, 0.7);
    var t2 = progress(t, 0.4, 1.0);

    ctx.save();
    ctx.fillStyle = interpolateColors(decelerate(t1), o.color3, o.color2);
    pivotScaleUniform(interpolate(decelerate(t2), 1.0, 0.66666666), 144, 0);
    pivotRotate(interpolate(decelerate(t1), 0, Math.PI), 72, 72);
    drawHorzHalfCircle(0, 0, 72, 144, false);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color3;
    pivotScaleUniform(interpolate(decelerate(t2), 1.0, 0.66666666), 144, 0);
    drawHorzHalfCircle(72, 0, 72, 144, true);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color2;
    drawRect(
        interpolate(decelerate(t2), 72, 0), 0,
        interpolate(decelerate(t2), 72, 96), 144);
    ctx.restore();
  };
  FONT.P.WIDTH = 144;

  FONT.Q = function(o, t) {
    var d1 = decelerate(progress(t, 0, 0.7));
    var d2 = decelerate(progress(t, 0.2, 1.0));

    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = interpolateColors(d1, o.color2, o.color1);
    ctx.moveTo(72, 72);
    ctx.arc(72, 72, 72, -Math.PI / 2, interpolate(d1, Math.PI / 2, Math.PI / 4), false);
    ctx.fill();
    ctx.closePath();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color2;
    drawHorzHalfCircle(0, 0, 72, 144, false);
    ctx.restore();

    ctx.save();
    pivotScaleUniform(interpolate(d2, 0, 1), 72, 72);
    ctx.fillStyle = o.color3;
    ctx.beginPath();
    ctx.moveTo(72, 72);
    ctx.lineTo(144, 144);
    ctx.lineTo(72, 144);
    ctx.lineTo(72, 72);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  };
  FONT.Q.WIDTH = 144;

  FONT.R = function(o, t) {
    var t1 = progress(t, 0.2, 1);

    pivotScaleUniform(interpolate(decelerate(t), 0.5, 1), 0, 144);

    ctx.save();
    pivotScaleUniform(interpolate(decelerate(t), 0, 1), 0, 72);
    ctx.fillStyle = o.color2;
    var left = interpolate(decelerate(t1), 0, 96);
    drawRect(0, 0, left, 96);

    ctx.fillStyle = o.color1;
    drawHorzHalfCircle(left, 0, left + 96, 96, true);
    ctx.restore();

    ctx.fillStyle = o.color3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(144, 144);
    ctx.lineTo(0, 144);
    ctx.moveTo(0, 0);
    ctx.fill();
    ctx.closePath();
  };
  FONT.R.WIDTH = 144;

  FONT.S = function(o, t) {
    var d1 = decelerate(progress(t, 0, 0.5));
    var d2 = decelerate(progress(t, 0.5, 1));

    ctx.fillStyle = o.color3;
    drawHorzHalfCircle(
        interpolate(d1, 36, 0), interpolate(d1, 36, 0),
        interpolate(d1, 72, 36), interpolate(d1, 108, 72), false);

    ctx.fillStyle = o.color1;
    drawRect(
        interpolate(d1, 72, 36), interpolate(d1, 36, 0),
        interpolate(d1, 72, interpolate(d2, 108, 144)), interpolate(d1, 108, 72));

    ctx.fillStyle = o.color2;
    drawRect(
        interpolate(d1, 72, interpolate(d2, 36, 0)), interpolate(d1, 36, 72),
        interpolate(d1, 72, 108), interpolate(d1, 108, 144));

    ctx.fillStyle = o.color3;
    drawHorzHalfCircle(
        interpolate(d1, 72, 108), interpolate(d1, 36, 72),
        interpolate(d1, 108, 144), interpolate(d1, 108, 144), true);
  };
  FONT.S.WIDTH = 144;

  FONT.T = function(o, t) {
    ctx.fillStyle = o.color1;
    drawRect(0, 0, 144, 48);

    ctx.fillStyle = o.color3;
    drawRect(36, 48, 108, interpolate(decelerate(t), 48, 144));
  };
  FONT.T.WIDTH = 144;

  FONT.U = function(o, t) {
    var t1 = progress(t, 0.1, 1.0);

    ctx.save();
    ctx.fillStyle = o.color2;
    drawRect(
        0, 72,
        72, interpolate(decelerate(t), 72, 0));
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color1;
    drawRect(
        72, 72,
        144, interpolate(decelerate(t1), 72, 0));
    ctx.restore();

    ctx.save();
    ctx.fillStyle = interpolateColors(decelerate(t), o.color3, o.color2);
    pivotRotate(interpolate(decelerate(t), -Math.PI / 2, Math.PI / 2), 72, 72);
    drawHorzHalfCircle(72, 0, 72, 144, true);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color3;
    pivotRotate(-Math.PI / 2, 72, 72);
    drawHorzHalfCircle(0, 0, 72, 144, false);
    ctx.restore();
  };
  FONT.U.WIDTH = 144;

  FONT.V = function(o, t) {
    ctx.save();
    pivotScaleUniform(interpolate(decelerate(t), 0.5, 1), 166, 0);
    ctx.fillStyle = o.color1;
    drawVertIsoTriangle(0, 0, 166, 144, false);
    ctx.restore();

    ctx.save();
    pivotScaleUniform(interpolate(decelerate(t), 0, 0.7), 166, 0);
    ctx.fillStyle = o.color3;
    drawVertIsoTriangle(0, 0, 166, 144, false);
    ctx.restore();
  };
  FONT.V.WIDTH = 166;

  FONT.W = function(o, t) {
    ctx.save();
    pivotScaleUniform(interpolate(decelerate(t), 0.5, 1), 212, 0);

    ctx.save();
    ctx.translate(interpolate(decelerate(t), 52, 46), 0);
    ctx.fillStyle = o.color2;
    drawVertIsoTriangle(0, 0, 166, 144, false);
    ctx.restore();

    ctx.save();
    ctx.translate(interpolate(decelerate(t), 52, 0), 0);
    ctx.fillStyle = o.color3;
    drawVertIsoTriangle(0, 0, 166, 144, false);
    ctx.restore();

    ctx.restore();
  };
  FONT.W.WIDTH = 212;

  FONT.X = function(o, t) {
    var d = decelerate(t);

    // parallelogram
    ctx.save();
    ctx.fillStyle = o.color2;
    ctx.beginPath();
    ctx.moveTo(0, 144);
    ctx.lineTo(interpolate(d, 36, 72), interpolate(d, 72, 0));
    ctx.lineTo(interpolate(d, 108, 144), interpolate(d, 72, 0));
    ctx.lineTo(72, 144);
    ctx.lineTo(0, 144);
    ctx.fill();
    ctx.closePath();
    ctx.restore();

    ctx.save();
    pivotScaleUniform(interpolate(d, 0, 1), 36, 72);
    ctx.fillStyle = o.color1;
    ctx.beginPath();
    ctx.moveTo(36, 72);
    ctx.lineTo(72, 0);
    ctx.lineTo(0, 0);
    ctx.lineTo(36, 72);
    ctx.fill();
    ctx.closePath();
    ctx.restore();

    ctx.save();
    pivotScaleUniform(interpolate(d, 0, 1), 72, 144);
    ctx.fillStyle = o.color3;
    ctx.beginPath();
    ctx.moveTo(72, 144);
    ctx.lineTo(108, 72);
    ctx.lineTo(144, 144);
    ctx.lineTo(72, 144);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  };
  FONT.X.WIDTH = 144;

  FONT.Y = function(o, t) {
    var d = decelerate(t);

    ctx.save();
    ctx.translate(interpolate(d, -24, 0), 0);
    ctx.fillStyle = o.color2;
    drawVertIsoTriangle(0, 0, 166, 144, false);

    ctx.save();
    pivotScaleUniform(interpolate(d, 0, 1), 166 / 2, 144);
    ctx.fillStyle = o.color3;
    ctx.beginPath();
    ctx.moveTo(0, 144);
    ctx.lineTo(166 / 4, 72);
    ctx.lineTo(166 / 2, 144);
    ctx.lineTo(0, 144);
    ctx.fill();
    ctx.closePath();
    ctx.restore();

    ctx.restore();
  };
  FONT.Y.WIDTH = 166;

  FONT.Z = function(o, t) {
    var d1 = decelerate(progress(t, 0, 0.5));

    // top left
    ctx.fillStyle = o.color1;
    drawRect(interpolate(d1, 72, 8), 0, 72, 72);

    // bottom right
    ctx.save();
    ctx.fillStyle = o.color3;
    ctx.translate(0, interpolate(d1, 0, 72));
    drawRect(72, 0, interpolate(d1, 72, 144), 72);
    ctx.restore();

    // parallelogram
    ctx.save();
    ctx.fillStyle = o.color2;
    ctx.beginPath();
    ctx.moveTo(72, 0);
    ctx.lineTo(144, 0);
    ctx.lineTo(interpolate(d1, 108, 72), interpolate(d1, 72, 144));
    ctx.lineTo(interpolate(d1, 36, 0), interpolate(d1, 72, 144));
    ctx.lineTo(72, 0);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  };
  FONT.Z.WIDTH = 144;

  FONT['0'] = function(o, t) {
    pivotScaleUniform(interpolate(decelerate(t), 0.5, 1), 72, 144);

    ctx.fillStyle = o.color2;
    ctx.beginPath();
    ctx.arc(72, 72, 76, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = o.color3;
    ctx.beginPath();
    var angle = interpolate(decelerate(t), 0, Math.PI / 2);
    ctx.arc(72, 72, 76, Math.PI / 4 - angle, Math.PI / 4 + angle);
    ctx.fill();
    ctx.closePath();
  };
  FONT['0'].WIDTH = 144;

  FONT['1'] = function(o, t) {
    ctx.fillStyle = o.color2;
    var d = decelerate(t);
    drawRect(interpolate(d, 28, 0), interpolate(d, 72, 0), 100, interpolate(d, 144, 48));

    ctx.fillStyle = o.color3;
    drawRect(28, interpolate(d, 144, 48), 100, 144);
  };
  FONT['1'].WIDTH = 100;

  FONT['2'] = function(o, t) {
    var d1 = decelerate(progress(t, 0, 0.7));
    var d2 = decelerate(progress(t, 0.4, 1.0));

    ctx.fillStyle = o.color3;
    ctx.beginPath();
    ctx.moveTo(0, 144);
    ctx.lineTo(72, 72);
    ctx.lineTo(72, 144);
    ctx.lineTo(0, 144);
    ctx.fill();
    ctx.closePath();

    ctx.save();
    ctx.fillStyle = interpolateColors(d2, o.color2, o.color1);
    ctx.translate(interpolate(d2, 0, 108), interpolate(d1, 72, 0));
    drawHorzHalfCircle(0, 0, 36, 72, true);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color1;
    ctx.translate(0, interpolate(d1, 72, 0));
    drawRect(interpolate(d2, 0, 8), 0, interpolate(d2, 72, 108), 72);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color2;
    ctx.translate(interpolate(d2, 0, 72), 0);
    drawRect(0, 72, 72, 144);
    ctx.restore();

    // ctx.fillStyle = o.color2;
    // var d = decelerate(t);
    // drawRect(interpolate(d, 28, 0), interpolate(d, 72, 0), 100, interpolate(d, 144, 48));

    // ctx.fillStyle = o.color3;
    // drawRect(28, interpolate(d, 144, 48), 100, 144);
  };
  FONT['2'].WIDTH = 144;

  FONT['3'] = function(o, t) {
    var d1 = decelerate(progress(t, 0, 0.6));
    var d2 = decelerate(progress(t, 0.2, 0.8));
    var d3 = decelerate(progress(t, 0.6, 1.0));

    // circles
    ctx.save();
    ctx.translate(interpolate(d2, -8, 32), 0);

    ctx.save();
    ctx.fillStyle = interpolateColors(d1, o.color3, o.color2);
    pivotRotate(interpolate(d1, 0, Math.PI), 48, 96);
    drawHorzHalfCircle(0, 48, 48, 144, false);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color3;
    drawHorzHalfCircle(48, 48, 96, 144, true);
    ctx.restore();

    ctx.restore();

    // bottom rectangle
    ctx.save();
    ctx.fillStyle = o.color1;
    drawRect(
        interpolate(d2, 40, 0), 96,
        interpolate(d2, 40, 80), 144);
    ctx.restore();

    // middle rectangle
    ctx.save();
    ctx.fillStyle = o.color2;
    drawRect(
        interpolate(d2, 40, interpolate(d3, 0, 32)), 48,
        interpolate(d2, 40, 80), 96);
    ctx.restore();

    // top part
    ctx.save();
    ctx.fillStyle = o.color3;
    ctx.translate(0, interpolate(d3, 48, 0));
    drawRect(
        interpolate(d2, 40, 0), 0,
        interpolate(d2, 40, 81), 48); // hack: should be 80
    ctx.restore();

    // triangle in top part
    ctx.fillStyle = o.color3;
    ctx.beginPath();
    var p = interpolate(d3, 48, 0);
    ctx.moveTo(80, 48);
    ctx.lineTo(80, p);
    ctx.lineTo(80 + (48 - p), p);
    ctx.lineTo(80, 48);
    ctx.fill();
    ctx.closePath();
  };
  FONT['3'].WIDTH = 128;

  FONT['4'] = function(o, t) {
    var d1 = decelerate(progress(t, 0, 0.7));
    var d2 = decelerate(progress(t, 0.4, 1.0));

    // bottom rectangle
    ctx.fillStyle = o.color2;
    drawRect(72, interpolate(d1, 144, 108), 144, 144);

    // middle rectangle
    ctx.fillStyle = o.color1;
    drawRect(interpolate(d2, 72, 0), interpolate(d1, 144, 72), 144, interpolate(d1, 144, 108));

    // triangle
    ctx.save();
    ctx.fillStyle = o.color2;
    pivotScaleUniform(d2, 72, 72);
    ctx.beginPath();
    ctx.moveTo(72, 72);
    ctx.lineTo(72, 0);
    ctx.lineTo(0, 72);
    ctx.lineTo(72, 72);
    ctx.fill();
    ctx.closePath();
    ctx.restore();

    // top rectangle
    ctx.fillStyle = o.color3;
    drawRect(72, interpolate(d1, 72, 0), 144, interpolate(d1, 144, 72));
  };
  FONT['4'].WIDTH = 144;

  FONT['5'] = function(o, t) {
    var d1 = decelerate(progress(t, 0, 0.6));
    var d2 = decelerate(progress(t, 0.2, 0.8));
    var d3 = decelerate(progress(t, 0.6, 1.0));

    // wing rectangle
    ctx.save();
    ctx.fillStyle = o.color2;
    drawRect(
        80, interpolate(d3, 48, 0),
        interpolate(d3, 80, 128), interpolate(d3, 96, 48));
    ctx.restore();

    // bottom rectangle
    ctx.save();
    ctx.fillStyle = o.color2;
    drawRect(
        interpolate(d2, 40, 0), 96,
        interpolate(d2, 40, 80), 144);
    ctx.restore();

    // middle rectangle
    ctx.save();
    ctx.fillStyle = o.color1;
    drawRect(
        interpolate(d2, 40, 0), interpolate(d3, 48, 0),
        interpolate(d2, 40, 80), interpolate(d3, 144, 96));
    ctx.restore();

    // circles
    ctx.save();
    ctx.translate(interpolate(d2, -8, 32), 0);

    ctx.save();
    ctx.fillStyle = interpolateColors(d1, o.color3, o.color2);
    pivotRotate(interpolate(d1, 0, Math.PI), 48, 96);
    drawHorzHalfCircle(0, 48, 48, 144, false);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color3;
    drawHorzHalfCircle(48, 48, 96, 144, true);
    ctx.restore();

    ctx.restore();
  };
  FONT['5'].WIDTH = 128;

  FONT['6'] = function(o, t) {
    var d = decelerate(t);

    // parallelogram
    ctx.save();
    ctx.fillStyle = o.color2;
    ctx.beginPath();
    ctx.moveTo(0, 72);
    ctx.lineTo(interpolate(d, 0, 36), interpolate(d, 72, 0));
    ctx.lineTo(interpolate(d, 72, 108), interpolate(d, 72, 0));
    ctx.lineTo(72, 72);
    ctx.lineTo(0, 72);
    ctx.fill();
    ctx.closePath();
    ctx.restore();

    // circles
    ctx.save();

    ctx.fillStyle = o.color3;
    ctx.beginPath();
    ctx.arc(72, 72, 72, 0, Math.PI);
    ctx.fill();
    ctx.closePath();

    pivotRotate(interpolate(d, 0, Math.PI), 72, 72);
    ctx.beginPath();
    ctx.arc(72, 72, 72, 0, Math.PI, true);
    ctx.fill();
    ctx.closePath();

    ctx.restore();
  };
  FONT['6'].WIDTH = 144;

  FONT['7'] = function(o, t) {
    var d1 = decelerate(progress(t, 0, 0.7));
    var d2 = decelerate(progress(t, 0.4, 1.0));

    // rectangle
    ctx.fillStyle = o.color3;
    drawRect(interpolate(d2, 72, 0), 0, 72, 72);

    // parallelogram
    ctx.save();
    ctx.fillStyle = o.color2;
    ctx.beginPath();
    ctx.moveTo(0, 144);
    ctx.lineTo(interpolate(d1, 36, 72), interpolate(d1, 72, 0));
    ctx.lineTo(interpolate(d1, 108, 144), interpolate(d1, 72, 0));
    ctx.lineTo(72, 144);
    ctx.lineTo(0, 144);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  };
  FONT['7'].WIDTH = 144;

  FONT['8'] = function(o, t) {
    var d = decelerate(t);
    var d1 = decelerate(progress(t, 0, 0.3));

    // top
    ctx.save();
    ctx.translate(0, interpolate(d1, 48, 0));
    ctx.fillStyle = o.color3;
    ctx.beginPath();
    var p = interpolate(d, 24, 0);
    ctx.moveTo(48 + p, 0);
    ctx.arcTo(24 + p, 0, 24 + p, 24, 24);
    ctx.arcTo(24 + p, 48, 48 + p, 48, 24);
    ctx.lineTo(96 - p, 48);
    ctx.arcTo(120 - p, 48, 120 - p, 24, 24);
    ctx.arcTo(120 - p, 0, 96 - p, 0, 24);
    ctx.lineTo(48 + p, 0);
    ctx.fill();
    ctx.closePath();
    ctx.restore();

    // bottom-left
    ctx.save();
    ctx.fillStyle = o.color1;
    ctx.beginPath();
    p = interpolate(d, 24, 0);
    ctx.moveTo(48 + p, 48);
    ctx.arcTo(0 + p, 48, 0 + p, 96, 48);
    ctx.arcTo(0 + p, 144, 48 + p, 144, 48);
    ctx.lineTo(96 - p, 144);
    ctx.lineTo(96 - p, 48);
    ctx.fill();
    ctx.closePath();
    ctx.restore();

    // right half-circle
    ctx.save();
    ctx.fillStyle = interpolateColors(d, o.color1, o.color2);
    ctx.beginPath();
    ctx.translate(interpolate(d, -24, 0), 0);
    ctx.moveTo(96, 48);
    ctx.arcTo(144, 48, 144, 96, 48);
    ctx.arcTo(144, 144, 96, 144, 48);
    ctx.lineTo(96, 48);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  };
  FONT['8'].WIDTH = 144;

  FONT['9'] = function(o, t) {
    var d = decelerate(t);

    pivotRotate(interpolate(d, 0, Math.PI), 72, 72);

    // parallelogram
    ctx.save();
    ctx.fillStyle = o.color3;
    ctx.beginPath();
    ctx.moveTo(0, 72);
    ctx.lineTo(interpolate(d, 0, 36), interpolate(d, 72, 0));
    ctx.lineTo(interpolate(d, 72, 108), interpolate(d, 72, 0));
    ctx.lineTo(72, 72);
    ctx.lineTo(0, 72);
    ctx.fill();
    ctx.closePath();
    ctx.restore();

    // circles
    ctx.save();

    ctx.fillStyle = o.color2;
    ctx.beginPath();
    ctx.arc(72, 72, 72, 0, Math.PI);
    ctx.fill();
    ctx.closePath();

    pivotRotate(interpolate(d, 0, Math.PI), 72, 72);
    ctx.beginPath();
    ctx.arc(72, 72, 72, 0, Math.PI, true);
    ctx.fill();
    ctx.closePath();

    ctx.restore();
  };
  FONT['9'].WIDTH = 144;

  FONT.PERIOD = function(o, t) {
    ctx.fillStyle = o.color3;
    drawCircle(0, 96, 48, 144);
  };
  FONT.PERIOD.WIDTH = 48;

  FONT.COMMA = function(o, t) {
    var d = decelerate(t);

    ctx.fillStyle = o.color3;
    drawRect(0, 96, 48, 144);

    ctx.save();
    pivotScaleUniform(interpolate(d, 0, 1), 0, 144);
    ctx.fillStyle = o.color2;
    ctx.beginPath();
    ctx.moveTo(0, 144);
    ctx.lineTo(48, 144);
    ctx.lineTo(0, 144+48);
    ctx.lineTo(0, 144);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  };
  FONT.COMMA.WIDTH = 48;

  FONT.APOSTROPHE = function(o, t) {
    var d = decelerate(t);

    ctx.fillStyle = o.color3;
    drawRect(0, 0, 48, 48);

    ctx.save();
    pivotScaleUniform(interpolate(d, 0, 1), 0, 48);
    ctx.fillStyle = o.color2;
    ctx.beginPath();
    ctx.moveTo(0, 48);
    ctx.lineTo(48, 48);
    ctx.lineTo(0, 96);
    ctx.lineTo(0, 48);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  };
  FONT.APOSTROPHE.WIDTH = 48;

  FONT.LQUOTE = function(o, t) {
    var d1 = decelerate(progress(t, 0, 0.7));
    var d2 = decelerate(progress(t, 0.4, 1.0));

    function drawQuote(c2) {
      ctx.fillStyle = o.color3;
      drawRect(0, 0, 48, 48);

      ctx.save();
      pivotScaleUniform(interpolate(d2, 0, 1), 48, 48);
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.moveTo(0, 48);
      ctx.lineTo(48, 48);
      ctx.lineTo(48, 96);
      ctx.lineTo(0, 48);
      ctx.fill();
      ctx.closePath();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(interpolate(d1, 36, 72), 0);
    drawQuote(o.color2);
    ctx.restore();

    ctx.save();
    ctx.translate(interpolate(d1, 36, 0), 0);
    drawQuote(o.color2);
    ctx.restore();
  };
  FONT.LQUOTE.WIDTH = 120;

  FONT.RQUOTE = function(o, t) {
    var d1 = decelerate(progress(t, 0, 0.7));
    var d2 = decelerate(progress(t, 0.4, 1.0));

    function drawQuote(c2) {
      ctx.fillStyle = o.color3;
      drawRect(0, 48, 48, 96);

      ctx.save();
      pivotScaleUniform(interpolate(d2, 0, 1), 0, 48);
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.moveTo(0, 48);
      ctx.lineTo(48, 48);
      ctx.lineTo(0, 0);
      ctx.lineTo(0, 48);
      ctx.fill();
      ctx.closePath();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(interpolate(d1, 36, 0), 0);
    drawQuote(o.color2);
    ctx.restore();

    ctx.save();
    ctx.translate(interpolate(d1, 36, 72), 0);
    drawQuote(o.color2);
    ctx.restore();
  };
  FONT.RQUOTE.WIDTH = 120;

  FONT.COLON = function(o, t) {
    var d = decelerate(t);

    ctx.fillStyle = o.color2;
    ctx.beginPath();
    ctx.arc(24, interpolate(d, 72, 24), 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = o.color3;
    ctx.beginPath();
    ctx.arc(24, interpolate(d, 72, 120), 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  };
  FONT.COLON.WIDTH = 48;

  FONT.EXCLAMATION = function(o, t) {
    var d = decelerate(t);

    ctx.fillStyle = o.color3;
    ctx.beginPath();
    ctx.arc(24, interpolate(d, 72, 120), 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = o.color2;
    drawRect(0, interpolate(d, 48, 0), 48, 96);
  };
  FONT.EXCLAMATION.WIDTH = 48;

  FONT.DASH = function(o, t) {
    var d = decelerate(t);

    ctx.fillStyle = o.color3;
    drawRect(interpolate(d, 40, 0), 48, interpolate(d, 88, 128), 96);
  };
  FONT.DASH.WIDTH = 128;

  FONT.PLUS = function(o, t) {
    var d = decelerate(t);

    ctx.save();

    pivotRotate(interpolate(d, Math.PI / 2, 0), 72, 72);
    ctx.fillStyle = o.color2;
    drawRect(interpolate(d, 72, 0), 48, 72, 96);

    ctx.fillStyle = o.color1;
    drawRect(72, 48, interpolate(d, 72, 144), 96);

    ctx.restore();

    ctx.fillStyle = o.color3;
    drawRect(48, interpolate(d, 48, 0), 96, interpolate(d, 96, 144));
  };
  FONT.PLUS.WIDTH = 144;

  FONT.HASH = function(o, t) {
    var d = decelerate(t);

    ctx.fillStyle = o.color2;
    drawRect(
        interpolate(d, 48, 27), interpolate(d, 48, 0),
        interpolate(d, 96, 63), interpolate(d, 96, 144));
    drawRect(
        interpolate(d, 48, 81), interpolate(d, 48, 0),
        interpolate(d, 96, 117), interpolate(d, 96, 144));

    ctx.fillStyle = o.color3;
    drawRect(
        interpolate(d, 48, 0), interpolate(d, 48, 27),
        interpolate(d, 96, 144), interpolate(d, 96, 63));

    ctx.fillStyle = o.color1;
    drawRect(
        interpolate(d, 48, 0), interpolate(d, 48, 81),
        interpolate(d, 96, 144), interpolate(d, 96, 117));
  };
  FONT.HASH.WIDTH = 144;

  FONT.EQUAL = function(o, t) {
    var d1 = decelerate(progress(t, 0, 0.7));
    var d2 = decelerate(progress(t, 0.4, 1.0));

    ctx.fillStyle = o.color3;
    drawRect(
        interpolate(d2, 48, 0), interpolate(d1, 48, 27),
        interpolate(d2, 96, 144), interpolate(d1, 96, 63));

    ctx.fillStyle = o.color1;
    drawRect(
        interpolate(d2, 48, 0), interpolate(d1, 48, 81),
        interpolate(d2, 96, 144), interpolate(d1, 96, 117));
  };
  FONT.EQUAL.WIDTH = 144;

  FONT.QUESTION = function(o, t) {
    var d1 = decelerate(progress(t, 0, 0.6));
    var d2 = decelerate(progress(t, 0.2, 0.8));
    var d3 = decelerate(progress(t, 0.6, 1.0));

    ctx.translate(interpolate(d2, -16, 0), 0);

    // circles
    ctx.save();
    ctx.fillStyle = interpolateColors(d1, o.color3, o.color2);
    pivotRotate(interpolate(d1, 0, Math.PI), 80, 48);
    drawHorzHalfCircle(32, 0, 80, 96, false);
    ctx.restore();

    ctx.fillStyle = o.color3;
    drawHorzHalfCircle(80, 0, 144, 96, true);

    // middle rectangle
    ctx.fillStyle = o.color1;
    drawRect(
        interpolate(d2, 80, 32), 48,
        80, 96);

    if (d3 > 0) {
      // circle
      ctx.save();
      ctx.fillStyle = o.color3;
      ctx.translate(0, interpolate(d3, -96, 0));
      drawCircle(32, 96, 80, 144);
      ctx.restore();
    }

    // top rectangle
    ctx.fillStyle = o.color2;
    drawRect(
        interpolate(d2, 80, 0), 0,
        80, 48);
  };
  FONT.QUESTION.WIDTH = 128;

  FONT.AT = function(o, t) {
    var t1 = progress(t, 0, 0.7);
    var t2 = progress(t, 0.4, 1.0);

    ctx.save();
    ctx.rect(72,0,144,144);
    ctx.clip();

    ctx.save();
    ctx.translate(interpolate(decelerate(t2), -72, 0), 0);
    ctx.fillStyle = o.color2;
    drawHorzHalfCircle(72, 0, 132, 120, true);
    drawRect(72, 60, 132, 120);
    ctx.restore();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = interpolateColors(decelerate(t1), o.color3, o.color2);
    pivotRotate(interpolate(decelerate(t1), 0, -Math.PI), 72, 72);
    drawHorzHalfCircle(72, 0, 72, 144, true);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color1;
    drawHorzHalfCircle(0, 0, 72, 144, false);

    ctx.fillStyle = o.color3;
    ctx.beginPath();
    ctx.moveTo(72, 72);
    ctx.arc(72, 72, interpolate(decelerate(t2), 72, 48), -Math.PI / 2, Math.PI / 2, true);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  };
  FONT.AT.WIDTH = 132;

  FONT.AMPERSAND = function(o, t) {
    var d0 = decelerate(progress(t, 0, 0.6));
    var d1 = decelerate(progress(t, 0, 0.7));

    pivotScaleUniform(interpolate(d1, 0.5, 1), 48, 144);

    ctx.save();
    pivotScaleUniform(interpolate(d1, 0, 1), 48, 48);
    pivotRotate(interpolate(d1, Math.PI, 0), 48, 48);
    ctx.fillStyle = o.color3;
    ctx.beginPath();
    ctx.arc(48, 24, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = o.color1;
    var pivot = interpolate(d0, 48, 0);
    pivotRotate(interpolate(d1, -Math.PI * 3 / 4, 0), 96 + pivot, 96 + pivot);
    ctx.translate(pivot, pivot);
    ctx.beginPath();
    ctx.moveTo(144, 48);
    ctx.lineTo(144, 96);
    ctx.lineTo(96, 96);
    ctx.lineTo(144, 48);
    ctx.fill();
    ctx.closePath();
    ctx.restore();

    ctx.fillStyle = o.color3;
    ctx.beginPath();
    ctx.moveTo(48, 48);
    ctx.lineTo(48, 144);
    ctx.lineTo(144, 144);
    ctx.lineTo(48, 48);
    ctx.fill();
    ctx.closePath();

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 48, 48, 144);
    ctx.clip();
    ctx.closePath();

    ctx.fillStyle = o.color2;
    pivotRotate(interpolate(d1, -Math.PI / 2, 0), 48, 48);
    drawHorzHalfCircle(0, 48, 48, 144, false);
    ctx.restore();
    // ctx.beginPath();
    // ctx.moveTo(48, 96);
    // ctx.arc(48, 96, 48, Math.PI / 2, Math.PI / 2 + interpolate(d1, 0, Math.PI), false);
    // ctx.fill();
    // ctx.closePath();
  };
  FONT.AMPERSAND.WIDTH = 144;

  // Kerning pairs

  var KERNING = {};

  _kern('aµwv',    '@o069qcgj+-', -26);
  _kern('7',       '@o069qcgj+-', -22);
  _kern('yx',      '@o069qcgj+-', -22);
  _kern('y',       'j', -26);
  _kern('k',       '@o069qcgj+-', -30);

  _kern('aµ',      'u', -26);

  _kern('aµ',      't', -34);
  _kern('l',       't', -30);
  _kern('bg',      't', -20);

  _kern('aµ',      '1?', -30);
  _kern('l',       '1?', -26);
  _kern('bg',      '1?', -16);

  _kern('o0d+-',   'yx', -22);
  _kern('8bp@',    'yx', -16);
  
  _kern('l',       'wv', -36);
  _kern('pr@',     'wv', -16);
  _kern('aµ',      'wv', -70);
  _kern('bg&',     'wv', -26);
  _kern('8',       'wv', -30);

  _kern('o06d+-',  'aµwv', -26);

  _kern('wvy',     'aµ', -70);
  _kern('7',       'aµ', -60);
  _kern('pt',      'aµ', -34);
  _kern('f',       'aµ', -22);
  _kern('853bs',   'aµ', -16);
  _kern('uj',      'aµ', -26);

  _kern('aµ',      '4', -20);
  _kern('wvy',     '4', -30);
  _kern('k',       '4', -30);
  _kern('t',       '4', -20);
  _kern('x',       '4', -20);

  _kern('aµ',      '8', -16);
  _kern('wvy',     '8', -30);

  _kern('7wvy',    '.', -48);
  _kern('pt',      '.', -30);

  function _kern(l, r, v) {
    var i, j;
    for (i = 0; i < l.length; i++) {
      for (j = 0; j < r.length; j++) {
        KERNING[l.charAt(i).toUpperCase() + r.charAt(j).toUpperCase()] = v;
      }
    }
  }



  // Expose

  window.formFace = formFace;
})();