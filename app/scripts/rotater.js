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

var PRE_SHAPES_IN_TIME = g_debug ? 100 : 500;//2000;
var PRE_SHAPES_OUT_TIME = PRE_SHAPES_IN_TIME;
var TRANSITION_TIME = 1000;

var DRAW_STATES = {
  NONE: 0,
  DRAWING_FORWARD: 1,
  DRAWING_REVERSE: 2
};


var g_debug = document.location.search.indexOf('_debug') > 0;

var g_sceneName = document.location.search.replace(/^\?/, '').replace(/_debug/, '');
var g_scene = SCENES[g_sceneName];

var g_slides = [];
var g_currentSlideIndex;
var g_nextSlideTimeout;
var g_transitionEndTimeout;


if (!document.fullscreenEnabled && !document.webkitFullscreenEnabled) {
  $('#full-screen-button').hide();
}

$('#full-screen-button').click(function() {
  goFullscreen();
});

function goFullscreen() {
  var slideContainer = $('#slide-container').get(0);
  var rfs = slideContainer.webkitRequestFullscreen || slideContainer.requestFullscreen;
  rfs.call(slideContainer);
}

function accelerate(t) {
  return Math.pow(t, 3);
}

function decelerate(t) {
  return 1 - Math.pow(1 - t, 3);
}

$(document).on('keydown', function(e) {
  if (!g_sceneName) {
    return;
  }

  var char = String.fromCharCode(e.keyCode).toLowerCase();
  if (char == 's') {
    startScene();
  } else if (char == 'e') {
    stopScene();
  } else if (char == 'f') {
    goFullscreen();
  }
});




// FormSlide class

function FormSlide($container, scene, info) {
  this.$container = $container;
  this.scene = scene;
  this.info = info;
  this.theme = this.info.theme || this.scene.theme;
  this.instantiate();
}

FormSlide.prototype.instantiate = function() {
  this.$el = $('<div>')
      .addClass('slide')
      .css('background-color', this.theme.colorbg)
      .appendTo(this.$container);

  this.formFaceInstance = this.createFormFaceInstance_();
  this.formFaceInstance.setTime(0);
  this.formFaceInstance.draw();
  this.$el.append(this.formFaceInstance.getCanvas());
};

FormSlide.prototype.createFormFaceInstance_ = function() {
  var text = this.info.text;
  if (this.info.textFn) {
    text = this.info.textFn();
  }

  var options = {
    theme: this.theme,
    letterHeight: 144,
    padding: 36,
    densityMultiplier: window.devicePixelRatio
  };

  if (this.info.instanceOptions) {
    for (var k in this.info.instanceOptions) {
      options[k] = this.info.instanceOptions[k];
    }
  }

  if (g_debug) {
    options.animGlyphDuration = 250;
    options.animGlyphAverageDelay = 20;
  }

  return formFace.createInstance(text, options);
};

FormSlide.prototype.prepareToShow = function() {
  if (this.info.textFn) {
    this.formFaceInstance = this.createFormFaceInstance_();
    this.formFaceInstance.setTime(0);
    this.formFaceInstance.draw();
    this.$el.empty().append(this.formFaceInstance.getCanvas());
  }
};

FormSlide.prototype.play = function() {
  this.resetAnimation();

  var me = this;

  this.playOriginTime = Number(new Date());
  this.drawStartTime = 0;
  this.drawState = DRAW_STATES.NONE;
  this.drawTimeoutHandle = 0;
  this.drawAnimationFrameHandle = 0;

  var continueDrawing_ = function() {
    var delay;
    switch (me.drawState) {
      case DRAW_STATES.NONE:
        delay = PRE_SHAPES_IN_TIME;
        me.formFaceInstance.setTime(0);
        me.formFaceInstance.draw();
        me.drawState = DRAW_STATES.DRAWING_FORWARD;
        me.drawStartTime = Number(new Date()) + delay;
        me.formFaceInstance.setAnimInterpolator(accelerate);
        me.drawTimeoutHandle = window.setTimeout(continueDrawing_, delay);
        break;

      case DRAW_STATES.DRAWING_FORWARD:
        var t = Number(new Date()) - me.drawStartTime;
        me.formFaceInstance.setTime(t);
        me.formFaceInstance.draw();
        if (t < me.formFaceInstance.getEndTime()) {
          me.drawAnimationFrameHandle = requestAnimationFrame(continueDrawing_);
        } else {
          delay = (me.playOriginTime + me.info.duration)
              - me.formFaceInstance.getEndTime() - PRE_SHAPES_OUT_TIME - Number(new Date());
          me.drawState = DRAW_STATES.DRAWING_REVERSE;
          me.drawStartTime = Number(new Date()) + delay;
          me.formFaceInstance.setAnimInterpolator(decelerate);
          me.drawTimeoutHandle = window.setTimeout(continueDrawing_, delay);
        }
        break;

      case DRAW_STATES.DRAWING_REVERSE:
        var t = me.formFaceInstance.getEndTime() - (Number(new Date()) - me.drawStartTime);
        me.formFaceInstance.setTime(t);
        me.formFaceInstance.draw();
        if (t > 0) {
          me.drawAnimationFrameHandle = requestAnimationFrame(continueDrawing_);
        } else {
          me.drawState = DRAW_STATES.NONE;
          me.drawTimeoutHandle = 0;
        }
        break;
    }


  };

  continueDrawing_();
};

FormSlide.prototype.resetAnimation = function() {
  if (this.drawTimeoutHandle) {
    window.clearTimeout(this.drawTimeoutHandle);
  }
  if (this.drawAnimationFrameHandle) {
    window.cancelAnimationFrame(this.drawAnimationFrameHandle);
  }
};




// Scene control methods

function startScene() {
  stopScene();

  g_slides = [];
  for (var i = 0; i < g_scene.slideInfos.length; i++) {
    var info = $.extend({}, g_scene.slideInfos[i]);
    if (g_debug) {
      info.duration *= 0.25;
    }
    var slide = new FormSlide($('#slide-container'), g_scene, info);
    g_slides.push(slide);
  }

  g_currentSlideIndex = -1;
  nextSlide();
}

function stopScene() {
  if (g_slides.length) {
    $('#slide-container').css('background-color', g_slides[0].theme.colorbg);
  }

  for (var i = 0; i < g_slides.length; i++) {
    g_slides[i].resetAnimation();
  }
  g_slides = [];

  if (g_nextSlideTimeout) {
    window.clearTimeout(g_nextSlideTimeout);
    g_nextSlideTimeout = 0;
  }
  if (g_transitionEndTimeout) {
    window.clearTimeout(g_transitionEndTimeout);
    g_transitionEndTimeout = 0;
  }

  $('#slide-container').empty();
}

function nextSlide() {
  ++g_currentSlideIndex;
  if (g_currentSlideIndex >= g_slides.length) {
    // Rotate!
    g_currentSlideIndex = 0;
  }

  var slide = g_slides[g_currentSlideIndex];

  $('#slide-container').css('background-color', slide.theme.colorbg);

  slide.prepareToShow();
  $('.slide')
      .css('z-index', 0)
      .css('opacity', 0)
      .removeClass('active');
      //.removeClass('transition');

  slide.$el
      .addClass('active')
      .addClass('transition')
      .css('z-index', 1);

  setTimeout(function() {
    slide.$el.css('opacity', 1);
  }, 0);

  g_transitionEndTimeout = window.setTimeout(function() {
    slide.play();
    $('.slide:not(.active)').css('opacity', 0);
    g_transitionEndTimeout = 0;
  }, TRANSITION_TIME);

  if (g_nextSlideTimeout) {
    window.clearTimeout(g_nextSlideTimeout);
  }

  g_nextSlideTimeout = window.setTimeout(nextSlide, slide.info.duration + TRANSITION_TIME);
}

function showMenu() {
  var $menuContainer = $('#menu-container');
  $('<h1>')
      .text('Rotater Menu')
      .appendTo($menuContainer);
  var scenes = [];
  for (var id in SCENES) {
    var scene = SCENES[id];
    scene.id = id;
    scenes.push(scene);
  }

  scenes.sort(function(x, y){ return x.order - y.order; });

  for (var i = 0; i < scenes.length; i++) {
    var scene = scenes[i];
    var $item = $('<div>')
        .addClass('item')
        .appendTo($menuContainer);
    if (scene.newGroup) {
      $item.addClass('newgroup');
    }
    $('<a>')
        .attr('href', '?' + scene.id)
        .text(scene.title)
        .appendTo($item);
  }
  $menuContainer.show();

  $('#full-screen-button').hide();
}




// Bootstrap

if (g_sceneName) {
  startScene();
} else {
  showMenu();
}