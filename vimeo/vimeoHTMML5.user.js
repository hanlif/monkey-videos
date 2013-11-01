// ==UserScript==
// @name        vimeoHTML5
// @version     1.0
// @include     http://vimeo.com/*
// @include     https://vimeo.com/*
// @description Play Videos with html5 on vimeo.com
// @author      LiuLang
// @email       gsushzhsosgsu@gmail.com
// @license     GPLv3
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==

/**
 * v1.0 - 2013.11.1
 * Project inited.
 */

var uw = unsafeWindow,
    log = uw.console.log,
    error = uw.console.error;

var vimeo = {
  vid: '',
  title: '',
  videos: ['', '', ''],
  types: ['mobile', 'hd', 'sd'],

  run: function() {
    this.getVid();
    this.getVideoById();
  },

  getVid: function() {
    log('getVid()');
    var reg = /vimeo\.com\/(\d+)/,
        url = uw.document.location.href;
    this.vid = reg.exec(url)[1];
  },

  getVideoById: function() {
    log('getVideoById()');
    var url = 'http://player.vimeo.com/video/' + this.vid,
        that = this;

    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function(response) {
        log(response);
        var txt = response.responseText,
            titleReg = /<title>([^<]+)</,
            titleMatch = titleReg.exec(txt),
            mobileReg = /mobile":\{.+?url":"([^"]+)"/,
            mobileMatch = mobileReg.exec(txt),
            sdReg = /sd":\{.+?url":"([^"]+)"/,
            sdMatch = sdReg.exec(txt),
            hdReg = /hd":\{.+?url":"([^"]+)"/,
            hdMatch = hdReg.exec(txt);
        if (titleMatch) {
          that.title = titleMatch[1];
        } else {
          that.title = uw.document.title;
        }

        if (mobileMatch) {
          that.videos[0]= mobileMatch[1];
        }
        if (hdMatch) {
          that.videos[1]= hdMatch[1];
        }
        if (sdMatch) {
          that.videos[2] = sdMatch[1];
        }
        log(that);
        that.createUI();
      },
    });
  },

  createUI: function() {
    log('createUI() --');
    var div = uw.document.createElement('div'),
        i,
        a;

    this.addStyle([
        '.download-wrap { ',
          'position: fixed; ',
          'left: 10px; ',
          'bottom: 10px; ',
          'border: 2px solid #ccc; ',
          'border-top-right-radius: 15px; ',
          'margin; 0; ',
          'padding: 10px; ',
          'background-color: #fff; ',
          'z-index: 9999; ',
          '}',
        '.download-link { ',
          'display: block;',
          '}',
        '.download-link:hover { ',
          'text-decoration: underline; ',
          '}',
        '.download-link:active {',
          'color: #e03434; ',
          'outline: none; ',
          '}',
        ].join(''));

    for (i = 0; i < this.videos.length; i += 1) {
      if (this.videos[i] === '') {
        continue;
      }
      a = uw.document.createElement('a');
      a.href = this.videos[i];
      a.innerHTML = this.title + '-' + this.types[i];
      a.className = 'download-link';
      div.appendChild(a);
    }

    div.className = 'download-wrap';
    uw.document.body.appendChild(div);
  },

  /**
   * Create a new <style> tag with str as its content.
   * @param string styleText
   *   - The <style> tag content.
   */
  addStyle: function(styleText) {
    var style = uw.document.createElement('style');
    if (uw.document.head) {
      uw.document.head.appendChild(style);
      style.innerHTML = styleText;
    }
  },
}

vimeo.run();
