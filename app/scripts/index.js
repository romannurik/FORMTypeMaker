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

// Import dependencies
import $ from 'jquery';
import { saveAs } from 'file-saver';
import './formface.js';
import { encode64 } from '../lib/gifencoder/b64.js';

// Make jQuery available globally for legacy code
window.$ = window.jQuery = $;
window.saveAs = saveAs;
window.encode64 = encode64;

(function() {

  var ua = navigator.userAgent.toLowerCase();
  var isMobile = ua.indexOf('mobile') >= 0;
  var isAndroid = ua.indexOf('android') >= 0;
  var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  var g_theme = formFace.THEME_DEFAULT;
  var g_text = '';
  var g_wrappedText = '';
  var g_formFaceInstance = null;
  var g_disableDownload = false;
  var g_cancelDownload = false;

  function accelerate(t) {
    return Math.pow(t, 2);
  }

  function decelerate(t) {
    return 1 - Math.pow(1 - t, 2);
  }

  $(window).resize(update);

  if (isTouch) {
    $('#output').addClass('virtualkeyboard');
  }

  function update() {
    var availableWidth = $('#output').width();
    var availableHeight = $('#output').height();

    $('#input-proxy').val(g_text);
    resetAnimations();
    g_wrappedText = wrapText(g_text);
    g_formFaceInstance = formFace.createInstance(g_wrappedText, {
      theme: g_theme,
      letterHeight: availableWidth > 600 ? 72 : 36,
      densityMultiplier: window.devicePixelRatio
    });
    var canvas = g_formFaceInstance.getCanvas();
    g_formFaceInstance.draw();

    $('#canvas-container').empty().append(canvas).css('height', canvas.offsetHeight + 'px');

    var scale = Math.min(1, Math.min(
        availableWidth / canvas.offsetWidth,
        availableHeight / canvas.offsetHeight));

    if (scale < 1) {
      $('#canvas-container').css('transform', 'scale(' + scale + ')');
    } else {
      $('#canvas-container').css('transform', '');
    }

    var lastRect = {};
    g_formFaceInstance._layoutPass(function(glyphName, rect) {
      lastRect = rect;
    });

    var padding = g_formFaceInstance._padding;
    $('<div>')
        .attr('id', 'cursor')
        .css({
          left: (lastRect.r + padding) / window.devicePixelRatio + 'px',
          top: (lastRect.t + padding) / window.devicePixelRatio + 'px',
          height: (lastRect.b - lastRect.t) / window.devicePixelRatio + 'px'
        })
        .appendTo('#canvas-container');
  }

  function updateTheme() {
    ga('set', 'dimension1', g_theme.name);
    $('body').css('background-color', g_theme.colorbg).addClass('theme-' + g_theme.name);
    // update theme changer
    $('paper-fab').css('background-color', g_theme.keyColor);
    $('#theme-changer').css('background-color', getNextTheme().keyColor);
  }

  $('#input-proxy')
      .on('input', function() {
        g_text = $(this).val();

        var filteredText = '';
        for (var i = 0; i < g_text.length; i++) {
          var charCode = g_text.charCodeAt(i);
          if (formFace.hasGlyphForCharCode(charCode)) {
            filteredText += g_text.charAt(i);
          }
        }

        if (filteredText != g_text) {
          $(this).val(filteredText);
        }

        g_text = filteredText;
        update();
      })
      .on('keydown', function() {
        var me = this;
        setTimeout(function() {
          var len = $(me).val().length;
          setCaretToPos(me, len);
        }, 0);
      })
      .on('focus', function() {
        $('#cursor').show();
      })
      .on('blur', function() {
        $('#cursor').hide();
      });

  $('#theme-changer').click(function() {
    $('body').removeClass('theme-' + g_theme.name);
    g_theme = getNextTheme();
    update();
    updateTheme();
  });

  function getNextTheme() {
    var themeIndex = 0;
    for (themeIndex = 0; themeIndex < formFace.THEMES.length; themeIndex++) {
      if (g_theme == formFace.THEMES[themeIndex]) {
        break;
      }
    }

    ++themeIndex;
    if (themeIndex >= formFace.THEMES.length) {
      themeIndex = 0;
    }

    return formFace.THEMES[themeIndex];
  }

  // http://stackoverflow.com/questions/499126/jquery-set-cursor-position-in-text-area
  function setSelectionRange(input, selectionStart, selectionEnd) {
    if (input.setSelectionRange) {
      input.focus();
      input.setSelectionRange(selectionStart, selectionEnd);
    }
    else if (input.createTextRange) {
      var range = input.createTextRange();
      range.collapse(true);
      range.moveEnd('character', selectionEnd);
      range.moveStart('character', selectionStart);
      range.select();
    }
  }

  function setCaretToPos(input, pos) {
    setSelectionRange(input, pos, pos);
  }

  function wrapText(s) {
    var lines = (s || '').split(/\n/);
    var wrappedLines = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      // need to wrap this line
      while (line.length > WRAP_AT) {
        var lastSpaceBeforeWrap = line.lastIndexOf(' ', WRAP_AT);
        if (lastSpaceBeforeWrap >= 0) {
          // found a space, wrap there
          console.log('found a space, wrap there');
          wrappedLines.push(line.substring(0, lastSpaceBeforeWrap));
          line = line.substring(lastSpaceBeforeWrap + 1);

        } else {
          // no spaces in first N characters
          //console.log('no spaces in first N characters');
          var firstSpaceAfterWrap = line.indexOf(' ', WRAP_AT);
          if (firstSpaceAfterWrap >= 0) {
            //console.log('wrapped long line after wrap');
            wrappedLines.push(line.substring(0, firstSpaceAfterWrap));
            line = line.substring(firstSpaceAfterWrap + 1);

          } else {
            // can't do anything, this line will have to be long.
            break;
          }
        }
      }

      // the rest need not be wrapped
      wrappedLines.push(line);
    }

    return wrappedLines.join('\n');
  }

  var WRAP_AT = 16;

  // Drawing animation

  var DRAW_STATES = {
    NONE: 0,
    DRAWING_FORWARD: 1
  };

  var g_drawStartTime = 0;
  var g_drawState = DRAW_STATES.NONE;
  var g_drawTimeoutHandle = 0;
  var g_drawAnimationFrameHandle = 0;

  function continueDrawing() {
    switch (g_drawState) {
      case DRAW_STATES.NONE:
        g_formFaceInstance.setTime(0);
        g_formFaceInstance.draw();
        g_drawState = DRAW_STATES.DRAWING_FORWARD;
        g_drawStartTime = Number(new Date()) + 500;
        g_formFaceInstance.setAnimInterpolator(accelerate);
        g_drawTimeoutHandle = window.setTimeout(continueDrawing, 500);
        break;

      case DRAW_STATES.DRAWING_FORWARD:
        var t = Number(new Date()) - g_drawStartTime;
        g_formFaceInstance.setTime(t);
        g_formFaceInstance.draw();
        if (t < g_formFaceInstance.getEndTime()) {
          g_drawAnimationFrameHandle = requestAnimationFrame(continueDrawing);
        }
        break;
    }
  };

  $('paper-fab').on('click', function() {
    ga('set', 'metric1', g_text.length);
    ga('send', 'event', 'play', 'button-press');
    resetAnimations();
    g_drawState = DRAW_STATES.NONE;
    continueDrawing();
  });

  $('#cancel-download-button').click(function() {
    g_cancelDownload = true;
    showDownloadDialog(false);
  });

  $('#accept-download-button').click(function() {
    ga('send', 'event', 'download-complete', 'button');
    var href = $(this).data('href');
    if (href) {
      window.open(href, '_blank');
    }
    showDownloadDialog(false);
  });

  $('#download-button').click(function() {
    if (g_disableDownload) {
      return;
    }

    ga('set', 'metric1', g_text.length);
    ga('send', 'event', 'download-start', 'button-press');
    showDownloadDialog(true);

    var scaleInv = (g_wrappedText.length > 15 || isMobile) ? 1.5 : 1;

    var padding = 144 / scaleInv;
    var instance = formFace.createInstance(g_wrappedText, {
      theme: g_theme,
      letterHeight: 72 / scaleInv,
      padding: padding
    });

    var canvas = instance.getCanvas();
    var ctx = canvas.getContext('2d');

    // grow the canvas to fit branding
    canvas.height += (36 /* spacing */ + 18 /* line height */) / scaleInv;

    var end = instance.getEndTime();
    var frameIndex = 0;
    var t = 0;

    var fps = 20;

    var worker;

    function sendNextFrame_() {
      var lastFrame = t > end;
      if (lastFrame) {
        t = end;
      }

      instance.setTime(t);
      instance.draw();

      // draw branding
      var whiteText = g_theme.name.match(/dark/) || g_theme.name.match(/mid/);
      ctx.fillStyle = whiteText ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.25)';
      ctx.font = '500 ' + (18 / scaleInv) + 'px RobotoDraft';
      ctx.fillText('#FORMSF14', padding, canvas.height - padding);

      var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      var delay = 1000 / fps;
      if (t == 0) { delay = 1000; }
      if (lastFrame) { delay = 5000; }

      worker.postMessage({
        quality: 100, // 100 should be sufficient for our simple color palettes
        lastFrame: lastFrame,
        frameIndex: frameIndex,
        progress: t / end,
        imgData: imgData.data,
        delay: delay,
        width: canvas.width,
        height: canvas.height
      });

      if (lastFrame) {
        return;
      }

      ++frameIndex;
      t += 1000 / fps;
    }

    // instantiate the worker
    worker = new Worker('scripts/gifencodeworker.js');

    worker.onmessage = function(e) {
      if (g_cancelDownload) {
        g_cancelDownload = false;
        g_disableDownload = false;
        return;
      }

      if ('progress' in e.data) {
        $('paper-progress').animate({value:e.data.progress * 100}, {duration: 50});
      }

      if (e.data.complete) {
        var gifData = e.data.frameData;
        for (var ui8arr = new Uint8Array(gifData.length), i = 0; i < gifData.length; ++i) {
          ui8arr[i] = gifData.charCodeAt(i);
        }

        var ua = navigator.userAgent.toLowerCase();
        var useWindowOpen = !new Blob || (isMobile && !isAndroid);
        if (!useWindowOpen) {
          ga('send', 'event', 'download-complete', 'auto');
          var blob = new Blob([ui8arr.buffer /* req'd for Safari */ || ui8arr], {type: 'image/gif'});
          saveAs(blob, 'FORMSF14.gif');
          showDownloadDialog(false);
        } else {
          $('#accept-download-button')
              .data('href', 'data:image/gif;base64,' + encode64(gifData))
              .show();
        }
      } else {
        sendNextFrame_();
      }
    };

    // kick things off
    g_cancelDownload = false;
    sendNextFrame_();
  });

  function showDownloadDialog(show) {
    if (show) {
      $('paper-progress').get(0).value = 0;
      $('#accept-download-button')
          .hide()
          .attr('href', '');
    }

    g_disableDownload = show;
    $('#download-dialog').removeClass('before-show').get(0).opened = show;
  }

  function resetAnimations() {
    if (g_drawTimeoutHandle) {
      window.clearTimeout(g_drawTimeoutHandle);
    }
    if (g_drawAnimationFrameHandle) {
      window.cancelAnimationFrame(g_drawAnimationFrameHandle);
    }
  }

  // Bootstrap

  $(function() {
    $('#input-proxy').focus();
    update();
    updateTheme();
  });
})();
