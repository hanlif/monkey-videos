// ==UserScript==
// @name        cntvHTML5
// @version     1.2
// @include     http://*.cntv.cn/*
// @include     http://*.cctv.com/*
// @description Play Videos with html5 on cntv.cn
// @license     GPLv3
// @author      LiuLang
// @email       gsushzhsosgsu@gmail.com
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==

/**
 * v1.2 - 2013.8.12
 * Add m3u playlist.
 * v1.1 - 2013.8.11
 * Add router.
 * v1.0 - 2013.8.11
 * Project inited.
 * No need to enable js on cntv.cn
 */

var uw = unsafeWindow,
    log = uw.console.log,
    error = uw.console.error;

var cntv = {
  pid: '',
  title: '',
  json: [],
  durations: {
    'chapters': '标清',
    'chapters2': '高清',
  },
  videos: {
    'chapters': [],
    'chapters2': [],
  },

  run: function() {
    this.router();
  },

  router: function() {
    log('router() --');
    this.createPanel();
    var href = uw.location.href;
    //if (uw.location.hostname === 'search.cctv.com') {
    if (href.search('search.cctv.com/playVideo.php?') > -1) {
      var schema = this.hashToObject(uw.location.search.substr(1));
      this.pid = schema.detailsid;
      this.title = decodeURI(schema.title);
      //this.pid = href.match(/detailsid=([^&]+)/)[1];
      //this.title = href.match(/title=([^&]+)/)[1];
      this.getVideoInfo();
    } else if (href.search('tv.cntv.cn/video/') > -1) {
    //} else if (uw.location.hostname == 'tv.cntv.cn') {
      this.pid = href.match(/\/([^\/]+)$/)[1];
      this.title = uw.document.title.substring(0, uw.document.title.length-8);
      this.getVideoInfo();
    } else {
      this.getPidFromSource();
    }
  },

  getPidFromSource: function() {
    log('getPidFromSource() --');
    var that = this;
    GM_xmlhttpRequest({
      url: uw.location.href,
      method: 'GET',
      onload: function(response) {
        log('response:', response);
        that._getPid(response.responseText);
      },
    });
  },

  _getPid: function(txt) {
    log('_getPid() --');
    var pidReg = /code\.begin-->([^<]+)/,
        pidMatch = pidReg.exec(txt),
        titleReg = /title\.begin-->([^<]+)/,
        titleMatch = titleReg.exec(txt);
    if (titleMatch && titleMatch.length === 2) {
      this.title = titleMatch[1];
    } else {
      this.title = uw.document.title;
    }

    log('pidMatch:', pidMatch);
    if (pidMatch && pidMatch.length === 2) {
      this.pid = pidMatch[1];
      this.getVideoInfo();
    } else {
      error('Failed to get Pid');
      return false;
    }
  },

  getVideoInfo: function() {
    log('getVideoInfo() --');
    var url = [
          'http://vdn.apps.cntv.cn/api/getHttpVideoInfo.do?',
          'tz=-8&from=000tv&idlr=32&modified=false&idl=32&pid=',
          this.pid,
          '&url=',
          uw.location.href,
        ].join(''),
        that = this;

    log('url:', url);
    GM_xmlhttpRequest({
      url: url,
      method: 'GET',
      onload: function(response) {
        log('response: ', response);
        that.json = JSON.parse(response.responseText);
        log('this: ', this);
        that.parseVideos();
      },
    });
  },

  /**
   * Get videos from json object.
   */
  parseVideos: function() {
    log('parseVideos() --');
    var chapter;
    for (chapter in this.json.video) {
      if (chapter.startsWith('chapters')) {
        this._parseVideos(chapter);
        this.appendPlaylist(chapter);
      }
    }

    this.modifyPlaylist('chapters')
  },

  _parseVideos: function(chapter) {
    log('_parseVideos() --');
    var item,
        i;
    for (i = 0; item = this.json.video[chapter][i]; i += 1) {
      if (this.videos[chapter] === undefined) {
        this.videos[chapter] = [];
      }
      this.videos[chapter].push(item.url);
    }
  },

  createPanel: function() {
    log('createPanel() --');
    var panel = uw.document.createElement('div'),
        inner = uw.document.querySelector('.play_box .inner');

    this.addStyle([
      '.fixed {',
        'position: fixed; ',
      '}',
      '.download-panel {',
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
      '.download-panel:hover {',
        'overflow-y: auto; ',
      '}',
      '.download-label {',
        'margin-right: 10px;',
      '}',
      '#download-playlist {',
      '}',
      '.download-video-items {',
        'display: block;',
      '}',
	  '#pls-link {',
	  	'margin-right: 15px;',
		'padding-right: 10px;',
	  '}',
      ].join(''));

    panel.innerHTML = [
      '<form id="download-formats">',
	  	'<a id="pls-link" href="#">播放列表</a>',
      '</form>',
      '<div id="download-playlist">',
      '</div>',
    ].join('');

    panel.className = 'download-panel';
    if (inner) {
      inner.innerHTML = '';
      inner.appendChild(panel);
    } else {
      log('panel:', panel, 'from body');
      uw.document.body.appendChild(panel);
      panel.className = 'download-panel fixed';
    }
  },

  appendPlaylist: function(chapter) {
    log('appendPlaylist() --');
    var label = uw.document.createElement('label'),
        input = uw.document.createElement('input'),
        span = uw.document.createElement('span'),
        form = uw.document.getElementById('download-formats'),
        that = this,
        id;
    id = 'choose-format-' + chapter;
    label.className = 'download-label';
    label.setAttribute('for', id);
    input.id = id;
    input.type = 'radio';
    input.setAttribute('data-format', chapter);
    input.name = 'download-format-choice';
    span.innerHTML = this.durations[chapter];

    label.appendChild(input);
    label.appendChild(span);
    form.appendChild(label);

    input.addEventListener('change', function() {
      that.modifyPlaylist(chapter);
    }, false);
  },

  modifyPlaylist: function(chapter) {
    log('modifyPlaylist() --');
    var playlist = uw.document.querySelector('#download-playlist'),
        title,
        url,
        a,
        i;

    // 清空列表:
    playlist.innerHTML = '';

    for (i = 0; url = this.videos[chapter][i]; i += 1) {
      a = uw.document.createElement('a');
      a.href = url;
      a.className = 'download-video-items';
      title = this.title + '-' + this.durations[chapter];
      if (i < 9) {
        title = title + '-(0' + String(i + 1) + ')';
      } else {
        title = title + '-(' + String(i + 1) + ')';
      }
      a.title = title;
      a.innerHTML = title;
      playlist.appendChild(a);
    }
    log('this:', this);

    // Refresh m3u playlist file.
    uw.document.getElementById('pls-link').href = this.plsDataScheme(chapter);
  },

  /**
   * Generate Playlist using base64 and Data URI scheme.
   * So that we can download directly and same it as a pls file using HTML.
   * URL:http://en.wikipedia.org/wiki/Data_URI_scheme
   * @param string format
   *  - the video format.
   * @return string
   *  - Data scheme containting playlist.
   */
  plsDataScheme: function(format) {
    return 'data:audio/x-m3u;charset=UTF-8;base64,' + 
           this.base64.encode(this.generatePls(format));
  },

  /**
   * Generate pls - a multimedia playlist file, like m3u.
   * @param string format
   *  - the video format.
   * @return string
   *  - playlist content.
   */
  generatePls: function(format) {
    var output = [],
        //videos = this.videos[format],
		links = uw.document.querySelectorAll('#download-playlist a'),
		a,
        i = 0;

	output.push('#EXTM3U');
    for (i = 0; a = links[i]; i += 1) {
	  output.push('#EXTINF:81, ' + a.title);
	  output.push(a.href);
    }
    return output.join('\n');
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
   * 将URL中的hash转为了个对象/字典, 用于解析链接;
   * v1.0 - 2013.1.19
   */
  hashToObject: function(hashTxt) {
    var list = hashTxt.split('&'),
        output = {},
        len = list.length,
        i = 0,
        tmp = '';

    for (i = 0; i < len; i += 1) {
      tmp = list[i].split('=')
      output[tmp[0]] = tmp[1];
    }
    return output;
  },

  /**
   * base64 function wrap
   * usage: base64.encode(str); base64.decode(base64_str);
   */
  base64: {
    encodeChars : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrs' +
      'tuvwxyz0123456789+/',
    decodeChars : [
  　　-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  　　-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  　　-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
  　　52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
  　　-1,　0,　1,　2,　3,  4,　5,　6,　7,　8,　9, 10, 11, 12, 13, 14,
  　　15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
  　　-1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  　　41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1],

    encodeFunction: function(str) {
    　　var out = '',
        len = str.length,
        i = 0,
        c1,
        c2,
        c3;
    
      while(i < len) {
        c1 = str.charCodeAt(i++) & 0xff;
        if(i === len) {
          out += this.encodeChars.charAt(c1 >> 2);
          out += this.encodeChars.charAt((c1 & 0x3) << 4);
          out += "==";
          break;
        }
        c2 = str.charCodeAt(i++);
        if(i === len) {
          out += this.encodeChars.charAt(c1 >> 2);
          out += this.encodeChars.charAt(((c1 & 0x3)<< 4) | 
              ((c2 & 0xF0) >> 4));
          out += this.encodeChars.charAt((c2 & 0xF) << 2);
          out += "=";
          break;
        }
        c3 = str.charCodeAt(i++);
        out += this.encodeChars.charAt(c1 >> 2);
        out += this.encodeChars.charAt(((c1 & 0x3)<< 4) |
            ((c2 & 0xF0) >> 4));
        out += this.encodeChars.charAt(((c2 & 0xF) << 2) |
            ((c3 & 0xC0) >>6));
        out += this.encodeChars.charAt(c3 & 0x3F);
      }
      return out;
    },

    decodeFunction: function(str) {
      var c1,
        c2,
        c3,
        c4,
        len = str.length,
        out = '',
        i = 0;

      while(i < len) {
        do {
          c1 = this.decodeChars[str.charCodeAt(i++) & 0xff];
        } while(i < len && c1 === -1);
        if(c1 === -1) {
          break;
        }

        do {
          c2 = this.decodeChars[str.charCodeAt(i++) & 0xff];
        } while(i < len && c2 === -1);
        if(c2 === -1) {
          break;
        }
        out += String.fromCharCode((c1 << 2) |
            ((c2 & 0x30) >> 4));
        
        do { 
          c3 = str.charCodeAt(i++) & 0xff;
          if(c3 === 61) {
            return out;
          }
          c3 = this.decodeChars[c3];
        } while(i < len && c3 === -1);
        if(c3 === -1) {
          break;
        }
        out += String.fromCharCode(((c2 & 0XF) << 4) |
            ((c3 & 0x3C) >> 2));

        do { 
          c4 = str.charCodeAt(i++) & 0xff;
          if(c4 === 61) {
            return out;
          }
          c4 = this.decodeChars[c4];
        } while(i < len && c4 === -1);
        if(c4 === -1) {
          break;
        }
        out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
      };
      return out;
    },

    utf16to8: function(str) {
      var out = '',
        len = str.length,
        i,
        c;

      for(i = 0; i < len; i++) {
        c = str.charCodeAt(i);
        if ((c >= 0x0001) && (c <= 0x007F)) {
          out += str.charAt(i);
        } else if (c > 0x07FF) {
          out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
          out += String.fromCharCode(0x80 | ((c >>　6) & 0x3F));
          out += String.fromCharCode(0x80 | ((c >>　0) & 0x3F));
        } else {
          out += String.fromCharCode(0xC0 | ((c >>　6) & 0x1F));
          out += String.fromCharCode(0x80 | ((c >>　0) & 0x3F));
        }
      }
      return out;
    },

    utf8to16: function(str) {
    　　var out = '',
        len = str.length,
        i = 0,
        c,
        char2,
        char3;
    
      while(i < len) {
        c = str.charCodeAt(i++);
        switch(c >> 4) {
        // 0xxxxxxx
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
          out += str.charAt(i - 1);
          break;
        // 110x xxxx　 10xx xxxx
        case 12: case 13:
          char2 = str.charCodeAt(i++);
          out += String.fromCharCode(((c & 0x1F) << 6) |
              (char2 & 0x3F));
          break;
        // 1110 xxxx　10xx xxxx　10xx xxxx
        case 14:
          char2 = str.charCodeAt(i++);
          char3 = str.charCodeAt(i++);
          out += String.fromCharCode(((c & 0x0F) << 12) |
            ((char2 & 0x3F) << 6) | ((char3 & 0x3F) << 0));
          break;
        }
      }
      return out;
    },

    // This is encode/decode wrap, which convert chars between UTF-8
    // and UTF-16;
    encode: function(str) {
      return this.encodeFunction(this.utf16to8(str));
    },

    decode: function(str) {
      return this.utf8to16(this.decodeFunction(str));
    },
  },
}

cntv.run();
