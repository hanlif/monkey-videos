// ==UserScript==
// @name        tucaoHTML5
// @version     1.0
// @include     http://www.tucao.cc/play/*
// @description Get video links in tucao.cc
// @author      LiuLang
// @email       gsushzhsosgsu@gmail.com
// @license     GPLv3
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==

/**
 * v1.0 - 2013.11.8
 * Project inited.
 */

var uw = unsafeWindow,
    log = uw.console.log,
    error = uw.console.error;

var tucao = {

  run: function() {
    log('run()');
    this.init();
    this.createPanel();
    this.getVid();
    if (this.vids.length === 0) {
      error('Failed to get Vid!');
      return false;
    }
    this.getTitle();
    log(this);
    this.getUrl();
  },

  init: function() {
    log('init()');
    var oldDiv = uw.document.querySelector('.download-wrap');

    if (oldDiv) {
      uw.document.body.removeChild(oldDiv);
    }
    this.url = '';
    this.playerId = '';
    this.title = '';
    this.vid = '';
    this.vids = [];
    this.pos = 0;
    this.videos = [];
    this.types = {
      sina: 'sina.php',
      tudou: false,
      youku: false,
    };
  },

  getVid: function() {
    log('getVid() -- ');
    var playerCode = uw.document.querySelectorAll('ul#player_code li');

    if (playerCode.length === 2) {
      this.vids = playerCode[0].firstChild.nodeValue.split('**');
      if (this.vids[this.vids.length - 1] == '') {
        this.vids.pop();
      }
      this.playerId = playerCode[1].innerHTML;
    }
  },

  getTitle: function() {
    log('getTitle()');

    if (this.vids.length === 1 || uw.location.hash === '') {
      this.pos = 0;
      this.url = uw.location.href;
    } else {
      // hash starts with 1, not 0
      this.pos = parseInt(uw.location.hash.replace('#', '')) - 1;
      this.url = uw.location.href.replace(uw.location.hash, '');
    }
    this.vid = this.vids[this.pos].split('|')[0];
    if (this.vids.length === 1) {
      this.title = uw.document.title.substr(0, uw.document.title.length - 16);
    } else {
      this.title = this.vids[this.pos].split('|')[1];
    }
  },

  getUrl: function(type) {
    log('getUrl()');
    var url,
        params,
        that = this;

    params = this.getQueryVariable(this.vid);
    if (this.types[params.type] === false) {
      this.redirect(params);
      return false;
    }

    url = [
      'http://www.tucao.cc/api/',
      this.types[params.type],
      '?vid=',
      params.vid,
      ].join('');

    log('url: ', url);
    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function(response) {
        log(response);
        var xml = that.parseXML(response.responseText),
            durl = xml.querySelector('durl'),
            urls = durl.querySelectorAll('url'),
            url,
            i;

        for (i = 0; url = urls[i]; i += 1) {
          that.videos.push(
            url.innerHTML.replace('<![CDATA[', '').replace(']]>', ''));
        }

        log(that);
        that.appendVideos();
      },
    });
  },

  redirect: function(params) {
    log('redirect()');
    var urls = {
      tudou: function(vid) {
        return 'http://www.tudou.com/programs/view/' + vid + '/';
      },
      youku: function(vid) {
        return 'http://v.youku.com/v_show/id_' + vid + '.html';
      },
    },
    url,
    div = uw.document.querySelector('.download-wrap'),
    a;

    url = urls[params.type](params.vid);
    log('url: ', url);

    a = uw.document.createElement('a');
    a.href = url;
    a.innerHTML = url;
    a.className = 'download-link';
    div.appendChild(a);
  },

  createPanel: function() {
    log('createPanel() --');
    var div = uw.document.createElement('div');

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
        '.download-pager {',
          'pading-bottom: 10px;',
        '}',
        '.download-pager a {',
          //'padding: 10px; ',
          'display: block; ',
        '}',
        '.download-link { ',
          'clear: both;',
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
    div.className = 'download-wrap';
    uw.document.body.appendChild(div);
  },

  appendVideos: function() {
    log('appendVideos()');
    var div = uw.document.querySelector('.download-wrap'),
        pager = uw.document.createElement('div'),
        video,
        i,
        a;

    pager.className = 'download-pager';
    div.appendChild(pager);

    if (this.vids.length > 1) {
      if (this.pos > 0) {
        // show prev page.
        a = uw.document.createElement('a');
        a.innerHTML = '上一集';
        a.href = this.url + '#' + String(this.pos);
        a.style.cssFloat = 'left';
        pager.appendChild(a);
      }
      if (this.pos < this.vids.length - 1) {
        // show next page.
        a = uw.document.createElement('a');
        a.innerHTML = '下一集';
        a.href = this.url + '#' + String(this.pos + 2);
        a.style.cssFloat = 'right';
        pager.appendChild(a);
      }
    }

    for (i = 0; video = this.videos[i]; i += 1) {
      a = uw.document.createElement('a');
      a.href = video;
      if (this.videos.length === 1) {
        a.innerHTML = this.title;
      } else if (this.videos.length > 9 && i < 9) {
        a.innerHTML = this.title + '-(0' + String(i) + ')';
      } else {
        a.innerHTML = this.title + '-(' + i + ')';
      }
      a.className = 'download-link';
      div.appendChild(a);
    }
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

  /**
   * Convert string to xml
   * @param string str
   *  - the string to be converted.
   * @return object xml
   *  - the converted xml object.
   */
  parseXML: function(str) {
    if (uw.document.implementation &&
        uw.document.implementation.createDocument) {
      xmlDoc = new DOMParser().parseFromString(str, 'text/xml');
    } else {
      log('parseXML() error: not support current web browser!');
      return null;
    }
    return xmlDoc;
  },

  getQueryVariable: function(query) {
    var vars = query.split('&'),
        params = {},
        param,
        i;

    for (i = 0; i < vars.length; i += 1) {
      param = vars[i].split('=');
      params[param[0]] = param[1];
    }
    return params;
  },
}

uw.addEventListener('hashchange', function() {
  tucao.run();
}, false);
//uw.onhashchange = function() {
//  tucao.run();
//};
tucao.run();
