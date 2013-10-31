// ==UserScript==
// @name        letvHTML5
// @version     1.6
// @description Play Videos with html5 on letv.com
// @license     GPLv3
// @author      LiuLang
// @email       gsushzhsosgsu@gmail.com
// @include     http://www.letv.com/*
// @include     http://letv.com/*
// @include     http://*.letv.com/*
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==

/**
 * v1.6 - 2013.7.26
 * Show all images.
 * Remove js dependency.
 * v1.5 - 2013.7.6
 * Fix the download link.
 * v1.4 - 2013.6.30
 * Fix the json.dispatch bug.
 * v1.3 -2013.6.21
 * Support /ptv/vplay/
 * v1.2 - 2013.4.24
 * Can download VIP videos.
 * v1.1 - 2013.4.22
 * Project works.
 * Web age need enable js.
 * v1.0 - 2013.2.16
 * Project inited.
 */

var uw = unsafeWindow,
    log = uw.console.log,
    error = uw.console.error;

var letv = {
  pid: '',
  vid: '',
  title: '',

  // '350': 标清.
  // '1000': 高清.
  videoUrl: {
    '350': false,
    '1000': false,
  },

  run: function() {
    this.showImages();

    var url = uw.location.href;
    log('url:', url);

    if (url.search('yuanxian.letv') !== -1) {
      // movie info page.
      this.addLinkToYuanxian();
    } else if (url.search('ptv/pplay/') !== -1 || url.search('ptv/vplay/' !== -1)) {
      this.getVid();
      this.getVideoXML();
    } else {
      error('I do not know what to do!');
    }
  },

  showImages: function() {
    log('showImages() --');
    var imgs = uw.document.getElementsByTagName('img'),
        img,
        i;

    for (i = 0; img = imgs[i]; i += 1) {
      if (img.hasAttribute('data-src')) {
        img.src = img.getAttribute('data-src');
      }
    }
    log('All images show up');
  },

  addLinkToYuanxian: function() {
    log('addLinkToYuanxian() --');
    var pid = uw.__INFO__.video.pid,
        url = 'http://www.letv.com/ptv/pplay/' + pid + '.html',
        titleLink = uw.document.querySelector('dl.w424 dt a');
    log('titleLink: ', titleLink);
    log('title link url: ', url);
    titleLink.href = url;
  },

  getVid: function() {
    log('getVid() --')

    var input = uw.document.querySelector('.add input'),
        vidReg,
        vidMatch,
        titleReg = /^([^-]+) -/,
        titleMatch = titleReg.exec(uw.document.title);

    if (input && input.hasAttribute('value')) {
      vidReg = /\/(\d+)\.html$/;
      vidMatch = vidReg.exec(input.getAttribute('value'));
    } else {
      error('Failed to get input element');
      return false;
    }

    if (vidMatch.length === 2) {
      this.vid = vidMatch[1];
    } else {
      error('Failed to get video ID!');
      return false;
    }

    if (titleMatch.length === 2) {
      this.title = titleMatch[1];
    } else {
      this.title = uw.document.title;
    }
    log('this: ', this);
  },

  getVideoXML: function() {
    log('getVideoXML() --');
    var url = 'http://www.letv.com/v_xml/' + this.vid + '.xml',
        that = this;

    log('videoXML url: ', url);
    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function(response) {
        log('response: ', response);
        var txt = response.responseText,
            //xml = that.parseXML(txt);
            jsonReg = /<playurl><!\[CDATA\[([\s\S]+)\]\]><\/playurl/,
            match = jsonReg.exec(txt),
            jsonTxt = '',
            json = '';

        //log('xml: ', xml);
        log('match: ', match);
        if (match.length == 2) {
          jsonTxt = match[1];
          log('jsonTxt: ', jsonTxt);
          json = JSON.parse(jsonTxt);
          log('json: ', json);
          that.getVideoUrl(json);
        }
      },
    });
  },

  getVideoUrl: function(json) {
    log('getVideoUrl() --');
    log('json.dispatch: ', json.dispatch);
    this.videoUrl['350'] = json.dispatch && json.dispatch['350'] && json.dispatch['350'][0];
    this.videoUrl['1000'] = json.dispatch && json.dispatch['1000'] && json.dispatch['1000'][0];
    log('videoUrl: ', this.videoUrl);

    this.createUI();
  },

  createUI: function() {
    log('createUI() --');
    var div = uw.document.createElement('div'),
        a = uw.document.createElement('a');

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

    // 标清:
    if (this.videoUrl['350']) {
      a.href = this.videoUrl['350'];
      a.innerHTML = this.title + '(标清)';
      a.className = 'download-link';
      div.appendChild(a);
    }

    // 高清:
    if (this.videoUrl['1000']) {
      a = uw.document.createElement('a');
      a.href = this.videoUrl['1000'];
      a.innerHTML = this.title + '(高清)';
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
}

letv.run();
