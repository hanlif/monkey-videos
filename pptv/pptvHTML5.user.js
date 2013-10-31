// ==UserScript==
// @name         pptvHTML5
// @description  Play videos with html5 on pptv.com
// @include      http://v.pptv.com/*
// @version      1.3
// @license      GPLv3
// @author       LiuLang
// @email        gsushzhsosgsu@gmail.com
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// ==/UserScript==

/**
 * v1.4 - 2013.10.31
 * styles for download panel updated.
 * v1.3 - 2013.10.31
 * update key
 * v1.2 - 2012.5.31 01:12
 * update the server IP
 * v1.1 - 2012.3.28 15:37
 * 生成UI;
 * v1.0 - 2012.3.28 10:40
 * 解析下载链接;
 *
 */

var uw = unsafeWindow,
    log = uw.console.log,
    error = uw.console.error;


var pptv = {
  id: 0,        // 存放页面id;
  playlistUrl: '',  // 从这里取得播放列表;
  playlist: [],    // 存放播放列表;
  key: '',      // 存放key;
  pic: '',      // 封面图片;
  title: '',      // 标题;
  rid: '',      // 用于构造下载链接;
  sgm: 0,        // 视频片段数;
  server: '',      // 下载服务器;
  lk: '',        // 本视频的原始网页;

  run: function() {
    log('run()');
    this.getId();
  },

  getId: function() {
    log('getId()');
    var scripts = document.querySelectorAll('script'),
        script,
        reg = /"id":(\d+),/,
        i,
        match,
        id;

    for (i = 0; script = scripts[i]; i += 1) {
      match = reg.exec(script.innerHTML);
      if (match && match.length > 1) {
        this.id= match[1];
        this.getPlaylistUrl();
        break;
      }
    }
  },

  getPlaylistUrl: function() {
    /*
     * 标清: http://web-play.pptv.com/webplay3-0-16840115.xml?type=web.fpp&ft=0
     * 高清: http://web-play.pptv.com/webplay3-0-16840115.xml?type=web.fpp&ft=1
     */
    log('getPlaylistUrl()');
    var pref = 'http://web-play.pptv.com/webplay3-0-',
        that = this;
    this.playlistUrl = pref + this.id + '.xml?type=web.fpp';

    GM_xmlhttpRequest({
      method: 'GET',
      url: this.playlistUrl,
      onload: function(response) {
        var txt = response.responseText;
        
        log(response);
        that.rid = txt.match(/rid="([^"]+)"/)[1];
        that.pic = txt.match(/pic="([^"]+)"/)[1];
        that.title = txt.match(/nm="([^"]+)"/)[1];
        that.server = txt.match(/<sh>([^<]+)</)[1];
        that.lk = txt.match(/lk="([^"]+)"/)[1];
        that.sgm = txt.match(/<sgm no="/g).length;
        that.key = txt.match(/<key expire=[^>]+>([^<]+)</)[1];

        that.createPlaylist();
      },
    });
  },

  createPlaylist: function() {
    log('createPlaylist()');
    var i;
    for (i = 0; i < this.sgm; i += 1) {
      this.playlist[i] = [
        'http://',
        this.server,
        '/',
        String(i),
        '/',
        this.rid,
        '?k=',
        this.key,
        '&type=web.fpp',
        ].join('');
    }
    log(this);
    this.createUI();
  },

  createUI: function() {
    log('createUI()');
    var div = document.createElement('div'),
      a,
      i;

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

    for (i = 0; i < this.sgm; i += 1) {
      a = document.createElement('a');
      div.appendChild(a);
      a.innerHTML = String(i) + ') ' + this.title.substr(0,15);
      a.href = this.playlist[i];
      a.className = 'download-link';
    }

    document.body.appendChild(div);
    div.className = 'download-wrap';
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


pptv.run();
