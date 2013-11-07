// ==UserScript==
// @name         neteaseHTML5
// @description  Play Videos with html5 on 163.com
// @include      http://v.163.com/*
// @version      1.1
// @license      GPLv3
// @author       LiuLang
// @email        gsushzhsosgsu@gmail.com
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// ==/UserScript==

/**
 * v1.1 - 2013.11.7
 * Fixed: get videos from m3u8 list.
 * v1.0 - 2013.10.31
 * project inited
 */

var uw = unsafeWindow,
    log = uw.console.log,
    error = uw.console.error;

var netease = {
  /* store video formats and its urls **/
  formats: {
  },
  /* video title **/
  title: '',
  /* video source url */
  videoUrl: '',

  /**
   * Program starter
   */
  run: function() {
    this.getTitle();
    this.getSource();
    if (this.videoUrl.length === 0) {
      error('Failed to get video source!');
      return false;
    }
    this.createUI();
  },

  getTitle: function() {
    this.title = uw.document.title;
  },

  getSource: function() {
    log('getSource()');
    var scripts = uw.document.querySelectorAll('script'),
        script,
        reg = /<source[\s\S]+src="([^"]+)"/,
        match,
        m3u8Reg = /appsrc\:\s*'([\s\S]+)\.m3u8'/,
        m3u8Match,
        i;
    for (i = 0; script = scripts[i]; i += 1) {
      match = reg.exec(script.innerHTML);
      log(match);
      if (match && match.length > 1) {
        this.videoUrl = match[1].replace('-mobile.mp4', '.flv');
        return true;
      }
      m3u8Match = m3u8Reg.exec(script.innerHTML);
      log(m3u8Match);
      if (m3u8Match && m3u8Match.length > 1) {
        this.videoUrl = m3u8Match[1].replace('-list', '') + '.mp4';
        return true;
      }
    }
  },


  /**
   * Create User interface.
   *
   * This function is called in decodeURL().
   */
  createUI: function() {
    log('createUI() --');
    // 检查可用的视频格式;
    this.createPanel();
  },

  /**
   * Create the control panel.
   */
  createPanel: function() {
    var panel = uw.document.createElement('div'),
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
    a.href = this.videoUrl;
    a.innerHTML = this.title;
    a.className = 'download-link';
    panel.appendChild(a);

    panel.className = 'download-wrap';
    uw.document.body.appendChild(panel);
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

};

netease.run();
