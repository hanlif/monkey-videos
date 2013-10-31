// ==UserScript==
// @name         youtubePlayer
// @description  youtube Player
// @include      *.c.youtube.com/*
// @version		   1.1.1
// @license      GPLv3
// @author       LiuLang
// @email        gsushzhsosgsu@gmail.com
// @run-at       document-end
// @grant        none
// ==/UserScript==

/**
 * TODO: Add a player wrap.
 * v1.1.1 - 2013.5.11
 * Fix the scaleRatio bug.
 * v1.1 - 2013.5.11
 * Modify the width and height of video to 80% of screen.
 * v1.0 - 2013.5.6
 * project inited.
 */
var uw = unsafeWindow,
    log = uw.console.log,
    error = uw.console.error;

var ytPlayer = {
  scaleRato: 0.85,
  video: false,

  run: function() {
    this.getVide();
    if (this.video) {
      this.addEnlarge();
    }
  },

  getVide: function() {
    this.video = uw.document.querySelector('video');
    log('this.video: ', this.video);
  },

  addEnlarge: function() {
    log('addEnlarge() --');
    this.video.width = uw.screen.availWidth * this.scaleRato;
    this.video.height = uw.screen.availHeight * this.scaleRato;
  },

};

ytPlayer.run();
