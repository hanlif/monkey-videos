// ==UserScript==
// @name          iqiyiHTML5
// @version       1.3
// @description   play video with html5 in iqiyi.com
// @include       http://*.iqiyi.com/*
// @grant         GM_xmlhttpRequest
// @run-at        document-end
// ==/UserScript==


/**
 * v1.3 - 2013.11.5
 * algorithm updated.
 * v1.2 - 2013.8.3
 * Create UI
 * v1.1 - 2013.7.31
 * Start from scratch.
 * Need to enable js on iqiyi.com, because setInterval() does not work
 * without window js context.
 * v1.0 - 2012.3.28 23:14
 * 刚搞清iqiyi.com里面的数据流;
 *
 */

var uw = unsafeWindow,
    log = uw.console.log,
    error = uw.console.error;

var iqiyi = {
  title: '',
  vid: '', // default vid
  type: 0, // default type
  rc: {
    96: {
      vid: '',
      key: '',
      name: '极速',
      links: [],
    },
    1: {
      vid: '',
      key: '',
      name: '流畅',
      links: [],
    },
    2: {
      vid: '',
      key: '',
      name: '高清',
      links: [],
    },
    3: {
      vid: '',
      key: '',
      name: '超清',
      links: [],
    },
    5: {
      vid: '',
      key: '',
      name: '1080P',
      links: [],
    },
  },
  jobs: 0,

  run: function() {
    log('run()');
    this.getTitle();
    this.getVid();
    if (this.vid !== '') {
      this.getVideoUrls(this.vid);
      this.createPanel();
    } else {
      error('No video to download!');
      return false;
    }
  },

  getTitle: function() {
    log('getTitle() --');
    var nav = uw.document.querySelector('#navbar em'),
        id,
        title;

    if (nav) {
      title = nav.innerHTML;
    } else {
      title = uw.document.title.split('-')[0];
    }
    this.title = title.trim();
  },

  getVid: function() {
    log('getVid() --');
    var videoPlay = uw.document.querySelector('div.videoPlay div');
    if (videoPlay && videoPlay.hasAttribute('data-player-videoid')) {
      this.vid = videoPlay.getAttribute('data-player-videoid');
    }
  },

  getVideoUrls: function(vid) {
    log('getVideoUrls()', vid);
    var url = 'http://cache.video.qiyi.com/v/' + vid
        that = this;

    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function(response) {
        var xml = that.parseXML(response.responseText),
            title,
            vid_elemes,
            vid_elem,
            type,
            container,
            i,
            j,
            files,
            file;

        if (that.title === '') {
          title = xml.querySelector('title').innerHTML;
          that.title = title.substring(9, title.length - 3);
        }

        vid_elems = xml.querySelectorAll('relative data');
        if (that.jobs === 0) {
          that.jobs = vid_elems.length;
          log('that.job is: ', that.jobs, that, url);
        }
        for (i = 0; vid_elem = vid_elems[i]; i += 1) {
          type = vid_elem.getAttribute('version');
          container = that.rc[type];
          if (container.vid.length === 0) {
            container.vid = vid_elem.innerHTML;
            if (container.vid != vid && that.vid === vid) {
              that.getVideoUrls(container.vid);
            }
            if (vid === that.vid) {
              that.type = type;
            }
          }
          if (container.vid === vid) {
            files = xml.querySelectorAll('fileUrl file');
            for (j = 0; file = files[j]; j += 1) {
              container.links.push(file.innerHTML);
            }
            that.getKey(container);
          }
        }
      },
    });
  },

  getKey: function(container) {
    log('getKey()', container);
    var hash = container.links[0].split('/'),
        url = [
          'http://data.video.qiyi.com/',
          hash[hash.length - 1].substr(0, 32),
          '.ts',
        ].join(''),
        that = this;

    log('getKey: ', url);
    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function(response) {
        var finalUrl = response.finalUrl;

        log(response, response.finalUrl);
        container.key = finalUrl.substr(finalUrl.search('key='));
        that.jobs -= 1;
        log('jobs: ', that.jobs, that);
        if (that.jobs === 0) {
          that.createUI();
        }
      },
      onerror: function(response) {
        log('onerror:', response);
      },
    });
  },

  createUI: function() {
    log('createUI() --');
    var type;

    for (type in this.rc) {
      if (this.rc[type].key.length > 0) {
        this.appendPlaylist(type);
      }
    }
    uw.document.getElementById('choose-format-' + this.type).checked = true;
    this.modifyPlaylist(this.type);
  },

  createPanel: function() {
    log('createPanel() --');
    var panel = uw.document.createElement('div');

    this.addStyle([
      '.iqiyi-panel {',
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
      '.iqiyi-panel:hover {',
        'overflow-y: auto; ',
      '}',
      '.iqiyi-label {',
        'margin-right: 10px;',
      '}',
      '#iqiyi-playlist {',
      '}',
      '.iqiyi-video-items {',
        'display: block;',
      '}',
    ].join(''));

    panel.innerHTML = [
      '<form id="iqiyi-formats">',
      '</form>',
      '<div id="iqiyi-playlist">',
      '</div>',
    ].join('');

    uw.document.body.appendChild(panel);
    panel.className = 'iqiyi-panel';
  },

  appendPlaylist: function(type) {
    log('appendPlaylist() --');
    var label = uw.document.createElement('label'),
        input = uw.document.createElement('input'),
        span = uw.document.createElement('span'),
        form = uw.document.getElementById('iqiyi-formats'),
        that = this,
        id;

    id = 'choose-format-' + type;
    label.className = 'iqiyi-label';
    label.setAttribute('for', id);
    input.id = id;
    input.type = 'radio';
    input.setAttribute('data-type', type);
    input.name = 'iqiyi-format-choice';
    span.innerHTML = this.rc[type]['name'];

    label.appendChild(input);
    label.appendChild(span);
    form.appendChild(label);

    input.addEventListener('change', function() {
      that.modifyPlaylist(type);
    }, false);
  },

  modifyPlaylist: function(type) {
    log('modifyPlaylist() --', type);
    var playlist = uw.document.querySelector('#iqiyi-playlist'),
        title,
        url,
        container = this.rc[type],
        a,
        i;

    // 清空列表:
    playlist.innerHTML = '';

    for (i = 0; url = container.links[i]; i += 1) {
      a = uw.document.createElement('a');
      a.href = [url,'?', container.key].join('');
      a.className = 'iqiyi-video-items';
      title = this.title + '-' + container.name;
      if (container.links.length > 9 && i < 9) {
        title = title + '-(0' + String(i + 1) + ')';
      } else {
        title = title + '-(' + String(i + 1) + ')';
      }
      a.title = title;
      a.innerHTML = title;
      playlist.appendChild(a);
    }
  },

  whenReady: function(eventFunc, callbackFunc, interval) {
    log('whenReady() --');
    var intervalFlag,
        that = this;

    intervalFlag = uw.setInterval(function() {
      log('setInterval check --');
      if (eventFunc.call(that)) {
        log('intervalFlag: ', intervalFlag);
        uw.clearInterval(intervalFlag);
        callbackFunc.call(that);
      }
    }, interval);
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

iqiyi.run();
