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

importScripts('../lib/gifencoder/LZWEncoder.js', '../lib/gifencoder/NeuQuant.js', '../lib/gifencoder/GIFEncoder.js');

var encoder;

onmessage = function(e) {
  if (e.data.frameIndex === 0) {
    encoder = new GIFEncoder();
    encoder.setSize(e.data.width, e.data.height);
    encoder.setRepeat(0);
    encoder.setQuality(e.data.quality);
    encoder.start();
  }

  encoder.setDelay(e.data.delay);
  encoder.addFrame(e.data.imgData, true);

  if (e.data.lastFrame) {
    encoder.finish();
  }

  var frameData = '';
  if (e.data.lastFrame) {
    frameData = encoder.stream().getData();
  }

  postMessage({
    progress: e.data.progress,
    frameIndex: e.data.frameIndex,
    frameData: frameData,
    complete: e.data.lastFrame
  });
};
