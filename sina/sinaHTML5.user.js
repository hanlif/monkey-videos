// ==UserScript==
// @name        sinaHTML5
// @version     1.2
// @description Modify image path to display them directly.
// @include     http://video.sina.com.cn/*
// @include     http://ent.sina.com.cn/*
// @include     http://open.sina.com.cn/course/*
// @author      LiuLang
// @email       gsushzhsosgsu@gmail.com
// @license     GPLv3
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==


/**
 * v1.2 - 2013.11.1
 * algorithm updated.
 * v1.1 - 2013.3.24
 * Now we can show all images in blog, not only images in article.
 * v1.0 - 2013.3.24
 * Prpoject inited.
 */

var uw = unsafeWindow,
    log = uw.console.log,
    error = uw.console.error;

var sohu = {
  vid: '',
  vidVideos: [],
  hd_vid: '',
  hdVideos: [],
  jobs: 0,
  title: '',

  run: function() {
    var loc = uw.location.href;
    if (loc.search('ent.sina.com.cn') != -1) {
      this.getEnt();
    } else if (loc.search('/vlist/') != -1) {
      this.getVlist();
    } else if (loc.search('video.sina.com.cn') != -1 ||
        loc.search('open.sina.com.cn') != -1) {
      this.getVid(loc);
    } else {
      error('This page is not supported!');
      return false;
    }
  },

  resetProps: function() {
    this.vid = '';
    this.vidVideos = [];
    this.hd_vid = '';
    this.hdVideos = [];
    this.jobs = 0;
    this.title = '';
  },

  /**
   * e.g.
   * http://video.sina.com.cn/vlist/news/zt/topvideos1/?opsubject_id=top12#118295074
   * http://video.sina.com.cn/news/vlist/zt/chczlj2013/?opsubject_id=top12#109873117
   */
  getVlist: function() {
    log('getVlist()');
    var h4s = uw.document.querySelectorAll('h4.video_btn'),
        h4,
        i,
        lis = uw.document.querySelectorAll('ul#video_list li'),
        li,
        As,
        A,
        j,
        that = this;

    if (h4s && h4s.length > 0) {
      this.getVlistItem(h4s[0].parentElement);
      for (i = 0; i < h4s.length; i += 1) {
        h4 = h4s[i];
        h4.addEventListener('click', function(event) {
          that.getVlistItem(event.target.parentElement);
        }, false);
      }

    } else if (lis && lis.length > 0) {
      this.getVlistItem(lis[0]);
      for (i = 0; i < lis.length; i += 1) {
        li = lis[i];
        As = li.querySelectorAll('a.btn_play');
        for (j = 0; A = As[j]; j += 1) {
          A.href= li.getAttribute('vurl');
        }
        li.addEventListener('click', function(event) {
          that.getVlistItem(event.target);
          event.preventDefault();
          return true;
        }, false);
      }
    }
  },

  getVlistItem: function(div) {
    log('getVlistItem()', div);
    if (div.hasAttribute('data-url')) {
      this.getVid(div.getAttribute('data-url'));
    } else if (div.nodeName === 'A' && div.className === 'btn_play') {
      this.getVid(div.parentElement.parentElement.parentElement.getAttribute('vurl'));
    } else if (div.nodeName === 'IMG') {
      this.getVid(div.parentElement.parentElement.parentElement.parentElement.getAttribute('vurl'));
    } else if (div.hasAttribute('vurl')) {
      this.getVid(div.getAttribute('vurl'));
    } else {
      error('Failed to get vid!', div);
      return false;
    }
  },

  getEnt: function() {
    log('getEnt()');
    var h4s = uw.document.querySelectorAll('div#video_list div.detail h4 a'),
        h4,
        As = uw.document.querySelectorAll('div#video_list div.ul_pages span.title a'),
        A,
        i,
        that = this;

    if (h4s && h4s.length > 0) {
      this.getEntItem(h4s[0]);
    } else if (As && As.length > 0) {
      this.getEntItem(As[0]);
    } else {
      error('Failed to get vid!');
      return false;
    }
    for (i = 0; i < h4s.length; i += 1) {
      h4 = h4s[i];
      h4.addEventListener('click', function(event) {
        log(event, that);
        that.getEntItem(event.target);
        event.preventDefault();
        return true;
      }, false);
    }
    // Use this when js disabled.
    for (i = 0; i < As.length; i += 1) {
      A = As[i];
      A.addEventListener('click', function(event) {
        log(event, that);
        that.getEntItem(event.target);
        event.preventDefault();
        return true;
      }, false);
    }
  },

  getEntItem: function(a) {
    log('getEntItem()', a);
    this.getVid(a.href);
  },

  getVid: function(url) {
    log('getVid()', url);
    var that = this;

    this.resetProps();

    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function(response) {
        log(response);
        var reg = /vid:['"](\d{5,})['"]/,
            txt = response.responseText,
            match = reg.exec(txt),
            hdReg = /hd_vid:'(\d{5,})'/,
            hdMatch = hdReg.exec(txt),
            titleReg = /\s+title:'([^']+)'/,
            titleMatch = titleReg.exec(txt);
            title2Reg = /VideoTitle : "([^"]+)"/,
            title2Match = title2Reg.exec(txt);

        if (titleMatch) {
          that.title = titleMatch[1];
        } else if (title2Match) {
          that.title = title2Match[1];
        }
        if (hdMatch && hdMatch.length > 1) {
          that.hd_vid = hdMatch[1];
          that.jobs += 1;
          that.getVideoByVid(that.hdVideos, that.hd_vid);
          return true;
        }
        if (match) {
          that.vid = match[1];
          that.jobs += 1;
          that.getVideoByVid(that.vidVideos, that.vid);
        }
      },
    });
  },

  getVideoByVid: function(container, vid) {
    log('getVideoByVid()');
    log(this, vid);
    var url = 'http://www.tucao.cc/api/sina.php?vid=' + vid,
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
          container.push(match[1]);
          match = reg.exec(txt);
        }
        that.jobs -= 1;
        if (that.jobs === 0) {
          that.createUI();
        }
      },
    });
  },

  createUI: function() {
    log('createUI() --');
    log(this);
    var div,
        suffix,
        videos,
        i,
        a;

    div = uw.document.querySelector('div.download-wrap');
    if (! div) {
      div = uw.document.createElement('div');
      div.className = 'download-wrap';
      uw.document.body.appendChild(div);
    } else {
      div.innerHTML = '';
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

    if (this.hdVideos.length > 0) {
      videos = this.hdVideos;
    } else {
      videos = this.vidVideos;
    }

    for (i = 0; i < videos.length; i += 1) {
      a = uw.document.createElement('a');
      a.href = videos[i];
      if (videos.length === 1) {
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

sohu.run();
