// ==UserScript==
// @name         tudouHTML5
// @description  Play Videos with html5 on tudou.com
// @version      1.1
// @include      http://www.tudou.com/programs/view/*
// @include      http://www.tudou.com/albumplay/*
// @author       LiuLang
// @email        gsushzhsosgsu@gmail.com
// @license      GPLv3
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// ==/UserScript==


/**
 * v1.1 - 2013.10.31
 * iid method updated
 * v1.0 -2013.4.26
 * Project intied.
 * Need to enable javascript on web page.
 */

var uw = unsafeWindow,
    log = uw.console.log,
    error = uw.console.error;

var tudou = {
  url:'',   // document.location.href
  title: '',
  iid: '',
  vcode: '',
  segs: {},
  totalJobs: 0,

  p2: [],   // 流畅 240P
  p3: [],   // 清晰 360P
  p4: [],   // 高清 480P
  p5: [],   // 超清 720P
  p99: [],  // 原画

  links: {
  },

  run: function() {
    this.router();
  },

  router: function() {
    log('router()');
    this.url = uw.document.location.href;

    var scripts = uw.document.querySelectorAll('script'),
        script,
        titleReg = /kw: '([^']+)'/,
        titleMatch,
        iidReg = /iid\s*[:=]\s*(\d+)/,
        iidMatch,
        vcodeReg = /vcode: '([^']+)'/,
        vcodeMatch,
        i;
    for (i = 0; script = scripts[i]; i += 1) {
      log(i, script, script.innerHTML);
      if (this.vcode.length === 0) {
        vcodeMatch = vcodeReg.exec(script.innerHTML);
        log('vcodeMatch:', vcodeMatch);
        if (vcodeMatch && vcodeMatch.length > 1) {
          this.vcode = vcodeMatch[1];
          this.redirectToYouku();
          return true;
        }
      }

      if (this.title.length === 0) {
        titleMatch = titleReg.exec(script.innerHTML);
        log('titleMatch:', titleMatch);
        if (titleMatch) {
          this.title = titleMatch[1];
        }
      }

      if (this.iid.length === 0) {
        iidMatch = iidReg.exec(script.innerHTML);
        log('iidMatch:', iidMatch);
        if (iidMatch) {
          this.iid = iidMatch[1];
          this.getByIid();
          return true;
        }
      }
    }

    this.getPlayList();
  },

  /**
   * Redirect url to youku.com.
   * Because tudou.com use youku.com as video source on /albumplay/ page.
   */
  redirectToYouku: function() {
    var url = 'http://v.youku.com/v_show/id_' + this.vcode + '.html';
    this.redirect(url);
  },

  getByIid: function() {
    log('getByIid()');
    log(this);

    var that = this,
        url = 'http://www.tudou.com/outplay/goto/getItemSegs.action?iid=' +
            this.iid;

    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function(response) {
        log('respone:', response);

        var txt = response.responseText;

        that.segs = JSON.parse(txt);
        log(that);
        that.getAllVideos();
      },
    });
  },

  getPlayList: function() {
    log('getPlayList()');
    log(this);
  },

  getAllVideos: function() {
    log('getAllVideos()');
    log(this);
    var key,
        videos,
        video,
        i;

    for (key in this.segs) {
      videos = this.segs[key];
      for (i = 0; video = videos[i]; i += 1) {
        log(key, video);
        this.links[key] = {};
        this.totalJobs += 1;
        this.getVideoUrl(key, video['k'], video['no']);
      }
    }
  },

  getVideoUrl: function(key, k, num) {
    log('getVideoUrl()');
    var url = 'http://ct.v2.tudou.com/f?id=' + k,
        that = this;

    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function(response) { 
        log('response:', response);

        var reg = /<f[^>]+>([^<]+)</,
            match = reg.exec(response.responseText);

        if (match && match.length > 1) {
          that.links[key][num] = match[1];
          that.totalJobs -= 1;
          if (that.totalJobs === 0) {
            that.createUI();
          }
        }
      },
    });
  },

  createUI: function() {
    log('createUI()');
    log(this);

    var panel = uw.document.createElement('div'),
        that = this,
        pid,
        p2,
        choice;

    this.addStyle([
      '.td-panel {',
        'position: fixed; ',
        'right: 10px; ',
        'bottom: 10px; ',
        'z-index: 99999; ',
        'border: 2px solid #ccc; ',
        'border-top-left-radius: 14px; ',
        'margin: 10px 0px 0px 0px; ',
        'padding: 10px; ',
        'background-color: #fff; ',
        'overflow-y: hidden; ',
        'max-height: 90%; ',
        'min-width: 100px; ',
        'min-height: 120px; ',
      '}',
      '.td-panel:hover {',
        'overflow-y: auto; ',
      '}',
      '.td-label {',
        'margin-right: 10px;',
      '}',
      '.video-item {',
        'display: block; ',
      '}',
      ].join(''));

    uw.document.body.appendChild(panel);
    panel.className = 'td-panel';

    panel.innerHTML = [
      '<form id="choose-format">',
      '</form>',
      '<div id="playlist"></div>',
      ].join('');

    for (pid in this.links) {
      this.appendPlaylist(pid);
    }

    uw.document.querySelector('#choose-format').addEventListener('change', function() {
      var inputs = this.querySelectorAll('input'),
          input,
          i = 0;
      for (i = 0; input = inputs[i]; i += 1) {
        if (input.checked) {
          that.modifyList(input);
          break;
        }
      }
    }, false);

    p2 = uw.document.querySelector('#playlist-2');
    p2.checked = true;
    this.modifyList(p2);
  },

  appendPlaylist: function(pid) {
    log('appendPlaylist() --');
    var labels = {
          2: '240P',
          3: '360P',
          4: '480P',
          5: '720P',
          52: 'UN',
          99: '原画质'
        };

    uw.document.querySelector('#choose-format').innerHTML += [
      '<label for="playlist-', pid, '" class="td-label">',
        '<input type="radio" id="playlist-', pid, '" name="formatChoice" />', 
        '<span>', labels[pid], '</span>',
      '</label>',
      ].join('');
  },

  modifyList: function (input) {
    log('modifyList() --');
    var pid = '',
        playlist = uw.document.querySelector('#playlist'),
        a = '',
        url = '',
        num,
        i = 0;

    if (typeof input !== 'undefined') {
      pid = parseInt(input.id.substring(9));
    } else {
      pid = 2;
    }

    for (key in this.links[pid]) {
      url = this.links[pid][key];
      if (key < 9) {
        num = '0';
      } else {
        num = '';
      }
      a += [
        '<a href="',
        url,
        '" class="video-item">',
        this.title,
        '-',
        input.nextSibling.innerHTML,
        '-(',
        num,
        String(parseInt(key) + 1),
        ')',
        '</a>'
        ].join('');
    }
    playlist.innerHTML = a;
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
      xmlDoc = (new uw.DOMParser()).parseFromString(str, 'text/xml');
    } else {
      error('parseXML() error: not support current web browser!');
      return null;
    }
    return xmlDoc;
  },

  /**
   * Redirect location.
   */
  redirect: function(url) {
    uw.location = url;
  },
};

tudou.run();
