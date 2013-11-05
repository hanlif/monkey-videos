// ==UserScript==
// @name        ppsHTML5
// @version     1.4
// @include     http://v.pps.tv/play_*
// @include     http://ipd.pps.tv/play_*
// @description Play Videos with html5 on pps.com
// @author      LiuLang
// @email       gsushzhsosgsu@gmail.com
// @license     GPLv3
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==

/**
 * v1.4 - 2013.11.5
 * update algorithm.
 * v1.3 - 2013.7.26
 * Show all images.
 * v1.2 - 2013.7.26
 * Remove js dependencies.
 * v1.1 - 2013.4.27
 * Fix the title bug.
 * v1.0 - 2013.4.27
 * Project inited.
 * Need page enables the javascript.
 */

var uw = unsafeWindow,
    log = uw.console.log,
    error = uw.console.error;

var pps = {
  vid: '',
  title: '',
  types: {
    1: '高清',
    2: '标清',
    3: '流畅',
  },
  videoUrl: {
    1: '',
    2: '',
    3: '',
  },
  jobs: 3,
  fromIqiyi: false,

  run: function() {
    log('run()');
    this.showImages();
    this.router();
  },

  showImages: function() {
    log('showImages() --');
    var imgs = uw.document.querySelectorAll('img'),
        img,
        i;

    for (i = 0; img = imgs[i]; i += 1) {
      if (img.hasAttribute('lazyload')) {
        img.src = img.getAttribute('lazyload');
      } else if (img.hasAttribute('lazy_src')) {
        img.src = img.getAttribute('lazy_src');
      }
    }
    log('All images show up');
  },

  router: function() {
    log('router() --');
    if (uw.location.href.search('pps.tv/play_') !== -1) {
      this.getId();
    } else {
      error('Failed to get vid!');
    }
  },

  getId: function() {
    log('getId() -- ');
    var vidReg = /play_([\s\S]+)\.html/,
        vidMatch = vidReg.exec(uw.document.location.href),
        titleReg = /([\s\S]+)-在线观看/,
        titleMatch = titleReg.exec(uw.document.title);
    if (vidMatch) {
      this.vid = vidMatch[1];
    }
    if (titleMatch) {
      this.title = titleMatch[1];
    }
    log('this: ', this);
    if (this.vid.length > 0) {
      this.getUrl(1); // 高清
      this.getUrl(2); // 标清
      this.getUrl(3); // 流畅
    }
  },

  getUrl: function(type) {
    log('getUrl()');
    var url = [
      'http://dp.ppstv.com/get_play_url_cdn.php?sid=',
      this.vid,
      '&flash_type=1&type=',
      type,
      ].join(''),
      that = this;

    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function(response) {
        log(response);
        var txt = response.responseText;

        if (txt.search('api.ipd.pps.tv/iqiyi/') > -1) {
          error('From iqiyi, not supported!');
          that.fromIqiyi = true;
          that.createUI();
          return false;
        }
        that.videoUrl[type] = txt.substr(0, txt.search('.pfv?') + 4);
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
    var div = uw.document.createElement('div'),
        p,
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
    div.className = 'download-wrap';
    uw.document.body.appendChild(div);

    if (this.fromIqiyi) {
      a = uw.document.createElement('p');
      a.innerHTML = 'This video comes from iqiyi!';
      div.appendChild(a);
      return;
    }

    for (type in this.videoUrl) {
      if (this.videoUrl[type] === '') {
        continue;
      }
      a = uw.document.createElement('a');
      a.href = this.videoUrl[type];
      a.innerHTML = this.title + '-' + this.types[type];
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

pps.run();
