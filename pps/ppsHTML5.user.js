// ==UserScript==
// @name        ppsHTML5
// @version     1.3
// @include     http://*.pps.tv/*
// @include     http://v.pps.tv/play_*
// @description Play Videos with html5 on pps.com
// @author      LiuLang
// @email       gsushzhsosgsu@gmail.com
// @license     GPLv3
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==

/**
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
  video_id: '',
  url_key: '',
  title: '',

  videoUrl: {
    p0: '', // 标清
    p1: '', // 高清
    //p2: '',
    p3: '', // 超清
  },

  run: function() {
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
    if (uw.location.href.search('v.pps.tv/play_') !== -1) {
      this.getId();
      this.getVideoJSON();
    } else {
      error('Do nothing.');
    }
  },

  getId: function() {
    log('getId() -- ');
    var scripts = uw.document.querySelectorAll('head script'),
        script,
        i;

    for (i = 0; script = scripts[i]; i += 1) {
      if (script.hasAttribute('src') === false) {
        log('script: ', script);
        break;
      }
    }

    if (uw.video === undefined) {
      uw.eval(script.innerHTML);
    }
    log('uw: ', uw);
    this.url_key = uw.video.url_key;
    this.video_id = uw.video.video_id;

    //this.title = uw.document.title.split('-')[0];
    this.title = uw.video.new_title;

    log('this: ', this);
  },

  getVideoJSON: function() {
    log('getVideoJSON() --');
    var pref = 'http://dp.ugc.pps.tv/get_play_url_html.php?',
        that = this,
        url = '';

    url = [
      pref,
      'video_id=', this.video_id,
      '&url_key=', this.url_key,
      ].join('');

    log('url: ', url);
    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function(response) {
        log('response: ', response);

        var txt = response.responseText,
            json = JSON.parse(txt),
            t,
            i;
        log('json: ', json);
        for (i = 0; t = json[i]; i += 1) {
          that.videoUrl['p' + t.type] = t.path;
        }
        log('that: ', that);

        that.createUI();
      },
    });
  },

  createUI: function() {
    log('createUI() --');
    var div = uw.document.createElement('div'),
        labels = {p0: '(标清)', p1: '(高清)', p3: '(流畅)'},
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

    for (p in this.videoUrl) {
      if (this[p] === '') {
        continue;
      }
      a = uw.document.createElement('a');
      a.href = this.videoUrl[p];
      a.innerHTML = this.title + labels[p];
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

pps.run();
