// ==UserScript==
// @name        bilibiliHTML5
// @version     1.0
// @description Get video link on bilibili.tv
// @include     http://www.bilibili.tv/video/*
// @author      LiuLang
// @email       gsushzhsosgsu@gmail.com
// @license     GPLv3
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==


/**
 * v1.0 - 2013.11.2
 * Prpoject inited.
 */

var uw = unsafeWindow,
    log = uw.console.log,
    error = uw.console.error;

var bili = {
  cid: '',
  aid: '',
  title: '',

  videos: [],

  run: function() {
    this.getTitle();
    this.getCid();
    log(this);
    if (this.cid === '') {
      error('Failed to get cid!');
      return false;
    }
    this.getVideos();
  },

  getTitle: function() {
    log('getTitle()');
    var metas = uw.document.querySelectorAll('meta'),
        meta,
        i;
    for (i = 0; i < metas.length; i += 1) {
      meta = metas[i];
      if (meta.hasAttribute('name') && meta.getAttribute('name') === 'title') {
        this.title = meta.getAttribute('content');
        return true;
      }
    }
  },

  getCid: function() {
    log('getCid()');
    var iframe = uw.document.querySelector('iframe'),
        reg = /cid=(\d+)&aid=(\d+)/,
        match = reg.exec(iframe.src);
    if (match) {
      this.cid = match[1];
      this.aid = match[2];
    }
  },

  getVideos: function() {
    var url = 'http://interface.bilibili.tv/playurl?cid=' + this.cid,
        that = this;

    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function(response) {
        log(response);
        var reg = /<url>.{9}([^\]]+)/g,
            txt = response.responseText,
            match = reg.exec(txt);

        while (match) {
          that.videos.push(match[1]);
          match = reg.exec(txt);
        }
        log(that);
        that.createUI();
      },
    });
  },

  createUI: function() {
    log('createUI() --');
    var div = uw.document.createElement('div'),
        suffix,
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
      a = uw.document.createElement('a');
      a.href = this.videos[i];
      if (this.videos.length === 1) {
        a.innerHTML = this.title;
      } else if (i < 9) {
        a.innerHTML = [
          this.title,
          '-(0',
          i + 1,
          ')',
          ].join('');
      } else {
        a.innerHTML = [
          this.title,
          '-(',
          i + 1,
          ')',
          ].join('');
      }
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

bili.run();
