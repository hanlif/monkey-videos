// ==UserScript==
// @name        acfunHTML5
// @version     1.0
// @include     http://www.acfun.tv/v/*
// @description Play Videos with html5 on acfun.tv
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

var pps = {
  vid: '',
  origUrl: '',

  run: function() {
    this.getVid();
    if (this.vid.length === 0) {
      error('Failed to get video id!');
      return false;
    }
    this.getVideoLink();
  },

  getVid: function() {
    log('getVid()');
    var pReg = /video\]([^\[]+)\[/,
        p = uw.document.querySelector('div#mainer-inner div#area-player.video div.hidden'),
        iframe = uw.document.querySelector('iframe#ACFlashPlayer-re'),
        iframeReg = /#vid=(\d+);/,
        match;
    if (p) {
      match = pReg.exec(p.innerHTML);
      this.vid = match[1];
    } else {
      match = iframeReg.exec(iframe.src);
      this.vid = match[1];
    }
  },

  getVideoLink: function() {
    log('getVideoLink()');
    log(this);
    var url = 'http://www.acfun.tv/api/getVideoByID.aspx?vid=' + this.vid,
        that = this;

    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function(response) {
        log('response:', response);
        var reg = /vurl":"([^"]+)"/,
            match = reg.exec(response.responseText);
        if (match) {
          that.origUrl = match[1];
          that.createUI();
        }
      },
    });
  },

  createUI: function() {
    log('createUI() --');
    var div = uw.document.createElement('div'),
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

    a = uw.document.createElement('a');
    a.href = this.origUrl;
    a.innerHTML = '视频原始地址';
    a.className = 'download-link';
    div.appendChild(a);

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

pps.run();
