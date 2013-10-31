// ==UserScript==
// @name        funshionHTML5 
// @version     1.3
// @include     http://www.funshion.com/*
// @include     http://funshion.com/*
// @description Play Videos with html5 on funshion.com
// @license     GPLv3
// @author      LiuLang
// @email       gsushzhsosgsu@gmail.com
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==

/**
 * v1.3 - 2013.7.26
 * Add pager.
 * Show all images.
 * Support UGC videos.
 * v1.2 - 2013.7.24
 * 支持超清视频.
 * v1.1 - 2013.7.24
 * Fix video title.
 * v1.0 - 2013.7.24
 * Project inited.
 */

var uw = unsafeWindow,
    log = uw.console.log,
    error = uw.console.error;

var funshion = {
  mediaid: 0,       // 专辑ID;
  number: 0,        // 第几集, 从1计数;
  fileformats: {
    '1': '标清版',
    '327680': '标清版',
    '491520': '高清版',
    '737280': '超清版',
  },
  json: [],
  playListLength: 0,

  run: function() {
    this.showImgs();
    this.router();
  },
  
  /**
   * Show all the hidden images.
   */
  showImgs: function() {
    log('showImgs() --');
    this.addStyle([
      '.ugcvideo-auto, .loading, #mediacomment, .footer, #footer {',
        'display: none !important;',
      '}',
    ].join(''));

    var imgs = uw.document.getElementsByTagName('img'),
        img,
        i;

    for (i = 0; img = imgs[i]; i += 1) {
      if (img.hasAttribute('_lazysrc')) {
        img.src = img.getAttribute('_lazysrc');
      }
    }
    log('All images show on');
  },


  /**
   * App router.
   */
  router: function() {
    if (uw.location.href.search('subject/play/') !== -1) {
      this.initUI();
      this.getId();
      this.showPlayList();
    } else if (uw.location.href.search('subject/') !== -1) {
      this.addLinks();
    } else if (uw.location.href.search('uvideo/play/') !== -1) {
      this.initUI();
      this.getUGCID();
    } else {
      error('I do not know what to do!');
    }
  },

  /**
   * Get UGC video ID.
   * For uvideo/play/'.
   */
  getUGCID: function() {
    log('getUGCID() --');
    var urlReg = /uvideo\/play\/(\d+)$/,
        urlMatch = urlReg.exec(uw.location.href);

    log('urlMatch: ', urlMatch);
    if (urlMatch.length === 2) {
      this.mediaid = urlMatch[1];
      this.getUGCVideoInfo();
    } else {
      error('Failed to parse video ID!');
    }
  },

  getUGCVideoInfo: function() {
    log('getUGCVideoInfo() --');
    var url = 'http://api.funshion.com/ajax/get_media_data/ugc/' + this.mediaid,
        that = this;

    log('url: ', url);
    GM_xmlhttpRequest({
      url: url,
      method: 'GET',
      onload: function(response) {
        log('response: ', response);
        that.json = JSON.parse(response.responseText);
        log('json: ', that.json);
        that.decodeUGCVideoInfo();
      },
    });
  },

  decodeUGCVideoInfo: function() {
    log('decodeUGCVideoInfo() --');
    var url = [
          'http://jobsfe.funshion.com/query/v1/mp4/',
          this.json.data.hashid,
          '.json?file=',
          this.json.data.filename,
        ].join(''),
        that = this;

    log('url: ', url);
    GM_xmlhttpRequest({
      url: url,
      method: 'GET',
      onload: function(response) {
        log('response: ', response);
        that.appendUGCVideo(JSON.parse(response.responseText));
      },
    });
  },

  appendUGCVideo: function(videoJson) {
    log('appendUGCVideo() --');
    log('this: ', this);
    log('videoJson:', videoJson);
    var fileformat = this.fileformats[videoJson.playlist[0].bits];

    info = {
      title: this.json.data.name_cn,
      href: videoJson.playlist[0].urls[0],
    };
    log('info: ', info);

    this._appendVideo(info);
  },


  /**
   * Add links to #playbtn.
   * For 'subject/'.
   */
  addLinks: function() {
    log('addLinks() --');
    var urlReg = /subject\/(\d+)/,
        urlMatch = urlReg.exec(uw.location.href),
        url = 'http://www.funshion.com/subject/play/';
    if (urlMatch.length === 2) {
      url = url + urlMatch[1] + '/1';
      log('url: ', url);
      uw.document.querySelector('a#playbtn').href = url;
    } else {
      error('Failed to parse video ID!');
    }
  },


  /**
   * Get video ID.
   * For subject/play/'.
   */
  getId: function() {
    log('getId() --');
    var urlReg = /subject\/play\/(\d+)\/(\d+)$/,
        urlMatch = urlReg.exec(uw.location.href);

    log('urlMatch: ', urlMatch);
    if (urlMatch.length === 3) {
      this.mediaid = urlMatch[1];
      this.number = parseInt(urlMatch[2]);
      this.getVideoInfo();
    } else {
      error('Failed to parse video ID!');
    }
  },

  getVideoInfo: function() {
    log('getVideoInfo() --');
    var url = [
          'http://api.funshion.com/ajax/get_webplayinfo',
          this.mediaid,
          this.number,
          'mp4',
        ].join('/'),
        that = this;

    log('url: ', url);
    GM_xmlhttpRequest({
      url: url,
      method: 'GET',
      onload: function(response) {
        log('response: ', response);
        that.json = JSON.parse(response.responseText);
        log('json: ', that.json);
        that.decodeVideoInfo();
      },
    });
  },

  decodeVideoInfo: function() {
    log('decodeVideoInfo() --');
    var playinfo, 
        i, 
        url,
        that = this;
    for (i = 0; playinfo = this.json.playinfos[i]; i = i + 1) {
      log('playinfo: ', playinfo);
      url = [
        'http://jobsfe.funshion.com/query/v1/mp4/',
        playinfo.cid,
        '.json?bits=',
        playinfo.byterate,
        ].join('');
      log('url: ', url);

      GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        onload: function(response) {
          log('response', response);
          log('that:', that);
          log('i: ', i);
          that.appendVideo(JSON.parse(response.responseText));
        },
      });
    }
  },

  appendVideo: function(videoJson) {
    log('appendVideo() --');
    log('this: ', this);
    log('videoJson: ', videoJson);

    var title,
        fileformat = this.fileformats[videoJson.playlist[0].bits];

    if (this.json.name_cn === this.json.playinfos[0].description) {
      title = this.json.name_cn + '-' + fileformat;
    } else {
      title = [
        this.json.name_cn,
        this.json.playinfos[0].description,
        fileformat,
      ].join('-');
    }

    info = {
      title: title,
      href: videoJson.playlist[0].urls[0],
    };
    log('info: ', info);

    this._appendVideo(info);
  },

  _appendVideo: function(info) {
    var a = uw.document.createElement('a'),
        div = uw.document.querySelector('div.download-wrap');

    a.title = info.title;
    a.innerHTML = info.title;
    a.href = info.href;
    a.className = 'download-link';
    div.appendChild(a);
  },

  initUI: function() {
    log('initUI() --');
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
        '.download-link { ',
          'clear: both; ',
          'display: block;',
          'padding: 10px 2px;',
          '}',
        '.download-link:hover { ',
          'text-decoration: underline; ',
          '}',
        '.download-link:active {',
          'color: #e03434; ',
          'outline: none; ',
          '}',
        '.download-pager {',
          'pading-bottom: 10px;',
        '}',
        '.download-pager a {',
          //'padding: 10px; ',
          'display: block; ',
        '}',
        ].join(''));

    div.className = 'download-wrap';
    uw.document.body.appendChild(div);
  },

  /**
   * Show episode play list.
   */
  showPlayList: function() {
    log('showPlayList() --');
    var url = [
          'http://api.funshion.com/ajax/get_web_fsp',
          this.mediaid,
          'mp4',
        ].join('/'),
        that = this;

    log('url: ', url);
    GM_xmlhttpRequest({
      url: url,
      method: 'GET',
      onload: function(response) {
        log('response: ', response);
        var json = JSON.parse(response.responseText);
        log('playlist: ', json);
        if (json.status === 200) {
          that.playListLength = json.data.fsps.mult.length;
          that._showPlayList();
        } else {
          error('Failed to get playlist json!');
        }
      },
    });
  },

  _showPlayList: function() {
    log('_showPlayList() --');
    log('this: ', this);
    var i,
        url,
        pref = 'http://www.funshion.com/subject/play',
        div = uw.document.querySelector('.download-wrap'),
        parent = uw.document.createElement('div'),
        a;
    if (this.number > 1) {
      url = [
        pref,
        this.mediaid,
        this.number - 1,
      ].join('/');
      a = uw.document.createElement('a');
      a.title = '上一集';
      a.innerHTML = a.title;
      a.href = url;
      a.style.cssFloat = 'left';
      parent.appendChild(a);
    }
    if (this.number < this.playListLength) {
      url = [
        pref,
        this.mediaid,
        this.number + 1,
      ].join('/');
      a = uw.document.createElement('a');
      a.title = '下一集';
      a.innerHTML = a.title;
      a.href = url;
      a.style.cssFloat = 'right';
      parent.appendChild(a);
    }
    parent.className = 'download-pager';
    div.insertBefore(parent, div.children[0]);
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

funshion.run();
