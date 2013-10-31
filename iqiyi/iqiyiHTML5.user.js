// ==UserScript==
// @name          iqiyiHTML5
// @version       1.1
// @description   play video with html5 in iqiyi.com
// @include       http://*.iqiyi.com/*
// @grant         GM_xmlhttpRequest
// @run-at        document-end
// ==/UserScript==


/**
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
  key: 0,
  tvid: 0,
  videoid: 0,
  cacheJson: [],
  durations: {1: '流畅', 2: '高清', 3: '超清', 5: '1080P', 96: '极速'},
  videosLinks: {},
  videoLinksCount: 0,

  run: function() {
    this.getKey();
    this.getTitle();
    this.getId();
    if (this.tvid !== 0 && this.videoid !== 0) {
      this.createPanel();
      this.getVideoCache();
    } else {
      error('No video to download!');
    }
  },

  /**
   * Get Magic Number, and save it as this.key.
   */
  getKey: function() {
    log('getKey() --');
    var that = this;

    GM_xmlhttpRequest({
      method: 'get',
      url: 'http://data.video.qiyi.com/t',
      onload: function(response) {
        log('response:', response);
        var magicNumber = 2519219136,
            json = JSON.parse(response.responseText),
            t = json['t'];
        //that.key = that.LongXOR(magicNumber, parseInt(json['t']));
        //that.key = (t ^ (-1775748160)) + Math.pow(2, 32);
        that.key = window.Q.crypt.md5(t ^ 2391462251);
        that.key = t;
        log('magic key:', that.key);
      },
    });
  },

  /**
   * Check this.key is set.
   */
  checkKey: function() {
    log('checkKey() --');
    if (this.key === 0) {
      return true;
      //return false;
    }
    return true;
  },

  getTitle: function() {
    log('getTitle() --');
    var nav = uw.document.querySelector('#navbar'),
        id,
        title;

    if (nav) {
      id = nav.querySelector('span').innerHTML;
      title = nav.querySelector('em').innerHTML;
      this.title = id + title;
    } else {
      this.title = uw.document.title.split('-')[0];
    }
    this.title = this.title.trim();
  },

  getId: function() {
    log('getId() --');
    var flashbox = uw.document.querySelector('#flashbox');
    if (flashbox === null) {
      return false;
    }
    this.tvid = flashbox.getAttribute('data-player-tvid');
    this.videoid = flashbox.getAttribute('data-player-videoid');
  },

  getVideoCache: function() {
    log('getVideoCache() --');
    var url = [
          'http://cache.video.qiyi.com/vd/',
          this.tvid,
          '/',
          this.videoid,
          '/',
        ].join(''),
        that = this;

    log('url: ', url);
    GM_xmlhttpRequest({
      method: 'get',
      url: url,
      onload: function(response) {
        log('response: ', response);
        that.cacheJson = JSON.parse(response.responseText);
        that.whenReady(that.checkKey, that.getVideoLinks, 100);
      },
    });
  },

  /**
   * Get all available videos parallely.
   */
  getVideoLinks: function() {
    log('getVideoLinks() --');
    log('this: ', this);
    var i,
        j,
        v,
        f,
        url,
        vs = this.cacheJson.tkl[0].vs;
    for (i = 0; v = vs[i]; i += 1) {
      for (j = 0; f = v.fs[j]; j += 1) {
        this.videoLinksCount += 1;
        url = 'http://data.video.qiyi.com/' + this.key + f.l;
        log('url: ', url);
        GM_xmlhttpRequest({
          method: 'get',
          url: url,
          onload: (function(i, j, that) {
            return function(response) {
              log('response: ', response);
              log('i: ', i);
              log('j: ', j);
              log('that: ', that);
              var json = JSON.parse(response.responseText);
              that.appendVideoLinks(i, j, json);
            };
          })(i, j, this),
        });
      }
    }
  },

  /**
   * Save video links to this.
   * When all videos received, call createUI().
   */
  appendVideoLinks: function(i, j, json) {
    log('appendVideoLinks() --');
    this.cacheJson.tkl[0].vs[i].fs[j].json = json;
    this.videoLinksCount -= 1;
    if (this.videoLinksCount === 0) {
      log('All video links received.');
      this.createUI();
    }
  },

  createUI: function() {
    log('createUI() --');
    var vs = this.cacheJson.tkl[0].vs,
        i,
        j,
        v,
        videos,
        f;
    for (i = 0; v = vs[i]; i += 1) {
      this.videosLinks[v.bid] = [];
      for (j = 0; f = v.fs[j]; j += 1) {
        this.videosLinks[v.bid].push(this.rebuildVideoLink(f.json.l));
      }
      this.appendPlaylist(v.bid);
    }
    log('this: ', this);
    this.modifyPlaylist(96);
  },

  rebuildVideoLink: function(url) {
    log('rebuildVideoLink() --');
    var urlReg = /(http:\/\/[^\/]+)\//,
        urlMatch = urlReg.exec(url);

    if (urlMatch && urlMatch.length == 2) {
      return urlMatch[1] + '/videos2/' + url.replace(urlReg, '');
    } else {
      error('Failed to rebuild video link!');
    }
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

  appendPlaylist: function(format) {
    log('appendPlaylist() --');
    var label = uw.document.createElement('label'),
        input = uw.document.createElement('input'),
        span = uw.document.createElement('span'),
        form = uw.document.getElementById('iqiyi-formats'),
        that = this,
        id;

    id = 'choose-format-' + format;
    label.className = 'iqiyi-label';
    label.setAttribute('for', id);
    input.id = id;
    input.type = 'radio';
    input.setAttribute('data-format', format);
    input.name = 'iqiyi-format-choice';
    span.innerHTML = this.durations[format];

    label.appendChild(input);
    label.appendChild(span);
    form.appendChild(label);

    input.addEventListener('change', function() {
      that.modifyPlaylist(format);
    }, false);
  },

  modifyPlaylist: function(format) {
    log('modifyPlaylist() --');
    var playlist = uw.document.querySelector('#iqiyi-playlist'),
        title,
        url,
        a,
        i;

    // 清空列表:
    playlist.innerHTML = '';

    for (i = 0; url = this.videosLinks[format][i]; i += 1) {
      a = uw.document.createElement('a');
      a.href = url;
      a.className = 'iqiyi-video-items';
      title = this.title + '-' + this.durations[format];
      if (i < 9) {
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
   * XOR operator ^ in ECMA-Script5 only works for 32-bit integers,
   * this function supports XOR without bit-length limitatioin, 
   * like in Python.
   */

  LongXOR: function(a, b) {
    log('LongXOR() --');
    // XOR operation need non-negative integer.
    if (a < 0 || b < 0) {
      return false;
    }
    if (a === b) {
      return 0;
    }

    var arrA = a.toString(2).split('').reverse(),
        arrB = b.toString(2).split('').reverse(),
        result = [],
        i;

    if (a > b) {
      for (i = 0; i < arrB.length; i += 1) {
        result.push(arrA[i] ^ arrB[i]);
      }
      result = result.concat(arrA.slice(i)).reverse();
      return parseInt(result.join(''), 2);
    } else {
      return LongXOR(b, a);
    }
  },
};

uw.setTimeout(function() {
  log('test log');
  error('test error');
}, 1000);

iqiyi.run();
