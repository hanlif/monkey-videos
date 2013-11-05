// ==UserScript==
// @name         baofengHML5
// @description  Play videos with html5 on baofeng.com
// @include      http://hd.baofeng.com/play/*
// @include      http://*.hd.baofeng.com/play/*
// @version      1.0
// @license      GPLv3
// @author       LiuLang
// @email        gsushzhsosgsu@gmail.com
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// ==/UserScript==

/**
 * v1.0 - 2012.3.28 10:40
 * project inited.
 * Needs to enable javascript in firefox.
 *
 */

var uw = unsafeWindow,
    log = uw.console.log,
    error = uw.console.error;


var baofeng = {
  aids: [],    // video aid
  fmts: {},    // video format
  video_lists: {},
  videos: {},  // video sources
  cidJobs: 0,
  title: '',

  run: function() {
    this.getTitle();
    log('run()');
    this.getAids();
    log(this);
    if (this.aids.length === 0) {
      error('Failed to get aids!');
      return false;
    }
  },

  getTitle: function() {
    var A = uw.document.querySelector('a#movie_name');
    if (A) {
      this.title = A.innerHTML;
    }
  },

  getAids: function() {
    log('getAids()');
    var aidsDiv = uw['movie_detail']['info_pianyuan'],
        item,
        aid,
        i;

    for (i = 0; i < aidsDiv.length; i += 1) {
      item = aidsDiv[i]['b'];
      aid = item['id'];
      log(item, aid);
      this.aids.push(aid);
      this.fmts[aid] = item['Ea'];
      this.videos[aid] = [];
      this.video_lists[aid] = uw['static_storm_json_' + aid]['video_list'];
      //this.getCids(aid);
      if (item['Ea'] === '480P') {
        this.getCids(aid);
      }
    }
  },

  getCids: function(aid) {
    log('getCids()');
    var vids = this.video_lists[aid],
        i;
    for (i = 0; i < vids.length; i += 1) {
      this.cidJobs += 1;
      this.getCid(aid, i, vids[i]['vid']);
    }
  },

  getCid: function(aid, pos, vid) {
    log('getCid()');
    var url = 'http://storm.baofeng.net/?c=storm://1310000' + vid + '||channel',
        that = this;

    log(url);
    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function(response) {
        var reg = /cid=([^\|]+)\|/,
            match = reg.exec(response.responseText);

        if (match) {
          that.getVideo(aid, pos, match[1]);
        } else {
          error('Failed to get video hash!');
        }
      },
    });
  },

  getVideo: function(aid, pos, hash) {
    log('getVideo()');
    var url = 'http://fldispatch.fl.baofeng.net/' + hash + '.mp4?',
        that = this;

    log(url);
    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function(response) {
        log(response);
        var xml = that.parseXML(response.responseText),
            url;
        that.videos[aid][pos] = [
          'http://',
          xml.getElementsByTagName('ip')[0].innerHTML.split(',')[0],
          ':',
          xml.getElementsByTagName('port')[0].innerHTML,
          xml.getElementsByTagName('path')[0].innerHTML,
          hash,
          '.flv?key=',
          xml.getElementsByTagName('key')[0].innerHTML,
          ].join('');
        that.cidJobs -= 1;
        if (that.cidJobs === 0) {
          log(that);
          that.createUI();
        }
      },
    });
  },


  createUI: function() {
    log('createUI()');
    var div = document.createElement('div'),
        videos,
        a,
        cid,
        i;

    for (cid in this.videos) {
      if (this.videos[cid].length > 0) {
        videos = this.videos[cid];
        break;
      }
    }

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

    for (i = 0; i < videos.length; i += 1) {
      a = document.createElement('a');
      if (videos.length === 1) {
        a.innerHTML = this.title;
      } else if (i < 9) {
        a.innerHTML = [
          this.title,
          '-480P-(0',
          String(i + 1),
          ')',
          ].join('');
      } else {
        a.innerHTML = [
          this.title,
          '-480P-(',
          String(i + 1),
          ')',
          ].join('');
      }
      a.href = videos[i];
      a.className = 'download-link';
      div.appendChild(a);
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
};

baofeng.run();
