// ==UserScript==
// @name         kankanHTML5
// @description  Play videos with html5 on kankan.com
// @version      1.0
// @include      http://vod.kankan.com/v/*
// @include      http://vod.kankan.com/trailer/*
// @include      http://vod.kankan.com/1080p/*
// @license      GPLv3
// @author       LiuLang
// @email        gsushzhsosgsu@gmail.com
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// ==/UserScript==


/**
 * v1.0 - 2012.11.1
 * project inited.
 */

var uw = unsafeWindow,
    log = uw.console.log,
    error = uw.console.error;


var kankan = {
  types: ['流畅', '标清', '高清'],
  gcids: ['', '', ''],
  videos: ['', '', ''],
  gcidsGot: false,
  title: '',
  totalJobs: 0,

  run: function() {
    this.getGCID();
    if (! this.gcidsGot) {
      error('Failed to get gcids!');
      return false;
    }
    this.getVideosByGCID();
  },

  getGCID: function() {
    log('getGCID()');
    var scripts = uw.document.querySelectorAll('script'),
        script,
        titleReg = /G_MOVIE_TITLE = '([^']+)'/,
        titleMatch,
        surlsReg = /surls:\[([^\]]+)\]/,
        surlsMatch,
        surls,
        surl,
        j,
        gcidReg = /http:\/\/.+?\/.+?\/(.+?)\//,
        gcidMatch,
        i;
    for (i = 0; script = scripts[i]; i += 1) {
      if (this.title.length === 0) {
        titleMatch = titleReg.exec(script.innerHTML);
        if (titleMatch) {
          this.title = titleMatch[1];
        }
      }

      if (this.gcidsGot === false) {
        surlsMatch = surlsReg.exec(script.innerHTML);
        if (! surlsMatch) {
          continue;
        }

        this.gcidsGot = true;
        surls = surlsMatch[1].split(',');
        log('surls:', surls);
        for (j = 0; surl = surls[j]; j += 1) {
          gcidMatch = gcidReg.exec(surl);

          if (gcidMatch) {
            this.gcids[j] = gcidMatch[1];
          }
        }
        return true;

      }
    }
  },

  getVideosByGCID: function() {
    log('getVideosByGCID()');
    log(this);
    var gcid,
        gcids = this.gcids,
        i;

    for (i = 0; i < gcids.length; i += 1) {
      gcid = gcids[i];
      if (gcid.length === 0) {
        continue;
      }
      this.totalJobs += 1;
      this.getVideoByGCID(gcid, i);
    }
  },

  getVideoByGCID: function(gcid, i) {
    log('getVideoByGCID()', gcid, i);
    var url = 'http://p2s.cl.kankan.com/getCdnresource_flv?gcid=' + gcid,
        that = this;

    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function(response) {
        log(response);
        var reg = /ip:"([^"]+)",port:8080,path:"([^"]+)"/,
            match = reg.exec(response.responseText);

        if (match) {
          that.videos[i] = 'http://' + match[1] + match[2];
        }
        that.totalJobs -= 1;
        if (that.totalJobs === 0) {
          that.createUI();
        }
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

    for (i in this.videos) {
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

};


kankan.run();
