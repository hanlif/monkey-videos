// ==UserScript==
// @name          BaiduMusicParser
// @version       1.4
// @description   Parsing download link for music.baidu.com.
// @license       GPLv3
// @author        LiuLang
// @email         gsushzhsosgsu@gmail.com
// @include       http://music.baidu.com/*
// @run-at        document-end
// @grant         GM_xmlhttpRequest
// ==/UserScript==


/**
 * 1.4 2013.6.26
 * Update class name of <a>
 * Update song url.
 * 1.3 2013.3.23
 * No need to enable js on this page.
 * 1.2 2013.3.4
 * Baidu updated the music link.
 * Fix the reg exp check bug.
 * Update download link color.
 * 1.1 2013.2.27
 * Add local music source support.
 * 1.0 2013.2.27
 * Project inited.
 */

var uw = unsafeWindow,
    log = uw.console.log,
    error = uw.console.error;

var bd_music = {

  /**
   * addStyle()
   * 在<head>中加入一个新的<style>
   * v1.1
   * 2013.1.15
   * Replace innerText with innerHTML to cross-platform.
   * v1.0
   * 2012.2.16
   */
  addStyle: function(str) {
    var style = uw.document.createElement('style');
    if (uw.document.head) {
      uw.document.head.appendChild(style);
      style.innerHTML = str;
    }
  },

  /**
   * program starter.
   */
  run: function() {
    this.addStyle('.downloadable {color: green !important;}' +
    '.undownloadable {color: #585858 !important;}');

    // Create a information panel, to show the parsing process.
    var songs = uw.document.querySelectorAll('ul li span.song-title');
    var i = 0;
    var song = '';

    log('songs:', songs);
    for (i = 0; i < songs.length; i += 1) {
      song = songs[i].querySelector('a');
      log('song:::', song);
      this.getLink(song);
    }
  },


  /**
   * Get the donwload link of the given url.
   * @param song element 
   *  - the <a> element of a song.
   */
  getLink: function(song) {
    if (song.className === 'grayblack') {
      var urlSuf = '/download',
          id = song.href.split('#')[0],
          url = id + urlSuf;

      song.classList.add('undownloadable');
      return false;
      GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        onload: function(response) {
          var txt = response.responseText,
              mp3Reg = /"type":"song"\}'\s+href="([^"]+)"\s+class="/,
              match = mp3Reg.exec(txt);

          //if (match && match.length === 2) {
          //  song.href = match[1];
          //  song.classList.add('downloadable');
          //} else {
          //  song.classList.add('undownloadable');
          //}
        }
      });
    } else if (song.className === '') {
      var urlSuf = '/download';
      var url = song.href + urlSuf;
      log('url:', url);

      GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        onload: function(response) {
          var txt = response.responseText,
              mp3Reg = /href="([^"]+)"\s+id="128"/,
              match = mp3Reg.exec(txt);
          log('response:', response);
          log('match:', match);
          if (match != null && match.length === 2) {
            song.href = match[1];
            log('mp3 link:', match[1]);
            song.classList.add('downloadable');
          } else {
            song.classList.add('undownloadable');
          }
        }
      });
    } else {
      error('I do not know how to parse: ', song);
    }
  },

};

bd_music.run();
