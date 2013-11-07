// ==UserScript==
// @name         neteaseHTML5
// @description  Play Videos with html5 on 163.com
// @include      http://v.163.com/*
// @version      1.2
// @license      GPLv3
// @author       LiuLang
// @email        gsushzhsosgsu@gmail.com
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// ==/UserScript==

/**
 * v1.2 - 2013.11.7
 * Add another way to get videos for open course
 * Can download srt files
 * Add margins betten video items.
 * v1.1 - 2013.11.7
 * Fixed: get videos from m3u8 list.
 * v1.0 - 2013.10.31
 * project inited
 */

var uw = unsafeWindow,
    log = uw.console.log,
    error = uw.console.error;

var netease = {
  videos: {
    sd: '',
    hd: '',
    shd: '',
  },
  types: {
    sd: '标清',
    hd: '高清',
    shd: '超清',
  },
  title: '',
  subs: {
  },

  run: function() {
    var type;

    this.getTitle();
    if (uw.document.title.search('网易公开课') > -1) {
      this.getOpenCourseSource();
    } else {
      this.getSource();
    }
  },

  getTitle: function() {
    this.title = uw.document.title;
  },

  getOpenCourseSource: function() {
    log('getOpenCourseSource()')
    var url = uw.document.location.href.split('/'),
        length = url.length,
        xmlUrl,
        that = this;

    xmlUrl = [
      'http://live.ws.126.net/movie',
      url[length - 3],
      url[length - 2],
      '2_' + url[length - 1].replace('html', 'xml'),
      ].join('/');
    log('xmlUrl: ', xmlUrl);
    GM_xmlhttpRequest({
      method: 'GET',
      url: xmlUrl,
      onload: function(response) {
        log(response);
        var xml = that.parseXML(response.responseText),
            type,
            video,
            subs,
            sub,
            subName,
            i;

        //that.title = xml.querySelector('all title').innerHTML;
        that.title = uw.document.title.replace('_网易公开课', '');
        for (type in that.videos) {
          video = xml.querySelector('playurl_origin ' + type +' mp4');
          if (video) {
            that.videos[type] = video.innerHTML;
            continue;
          }
          video = xml.querySelector(
            'playurl_origin ' + type.toUpperCase() +' mp4');
          if (video) {
            that.videos[type] = video.innerHTML;
          }
        }
        subs = xml.querySelectorAll('subs sub');
        for (i = 0; sub = subs[i]; i += 1) {
          subName = sub.querySelector('name').innerHTML + '字幕';
          that.subs[subName] = sub.querySelector('url').innerHTML;
        }
        that.createUI();
      },
    });
  },

  getSource: function() {
    log('getSource()');
    var scripts = uw.document.querySelectorAll('script'),
        script,
        reg = /<source[\s\S]+src="([^"]+)"/,
        match,
        m3u8Reg = /appsrc\:\s*'([\s\S]+)\.m3u8'/,
        m3u8Match,
        i;
    for (i = 0; script = scripts[i]; i += 1) {
      match = reg.exec(script.innerHTML);
      log(match);
      if (match && match.length > 1) {
        this.videos.sd = match[1].replace('-mobile.mp4', '.flv');
        this.createUI();
        return true;
      }
      m3u8Match = m3u8Reg.exec(script.innerHTML);
      log(m3u8Match);
      if (m3u8Match && m3u8Match.length > 1) {
        this.videos.sd = m3u8Match[1].replace('-list', '') + '.mp4';
        this.createUI();
        return true;
      }
    }
  },

  createUI: function() {
    log('createUI() --');
    log(this);

    var panel = uw.document.createElement('div'),
        type,
        subName,
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
          'margin: 8px;',
          '}',
        '.download-link:hover { ',
          'text-decoration: underline; ',
          '}',
        '.download-link:active {',
          'color: #e03434; ',
          'outline: none; ',
          '}',
        ].join(''));

    for (type in this.videos) {
      if (this.videos[type] === '') {
        continue;
      }
      a = uw.document.createElement('a');
      a.href = this.videos[type];
      a.innerHTML = this.title + '-' + this.types[type];
      a.className = 'download-link';
      panel.appendChild(a);
    }

    for (subName in this.subs) {
      if (this.subs[subName] === '') {
        continue;
      }
      a = uw.document.createElement('a');
      a.href = this.subs[subName];
      a.innerHTML = this.title + '-' + subName;
      a.className = 'download-link';
      panel.appendChild(a);
    }

    panel.className = 'download-wrap';
    uw.document.body.appendChild(panel);
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

netease.run();
