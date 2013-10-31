// ==UserScript==
// @name         youtubeHTML5-needjs
// @description  Adds links to download flv, mp4 and webm from YouTube
// @include      *youtube.com/watch*
// @include      *.youtube.com/*
// @exclude      *.c.youtube.com/*
// @version      1.11
// @license      GPLv3
// @author       LiuLang
// @email        gsushzhsosgsu@gmail.com
// @run-at       document-end
// @grant        none
// ==/UserScript==


/*
 * TODO: Add a <video> player, so that no need the page to enable js.
 * v1.11 - 2013.5.11
 * Replace GM_xmlhttpReuqest() with XMLHttpRequest(), now it can run on
 * chromium and opera.
 * v1.10 - 2013.5.11
 * Metadata changed, port to github.com
 * v1.9 - 2013.5.11
 * Automatically show video description.
 * v1.8 - 2013.5.3
 * Show all the images automatically.
 * v1.7 - 2013.4.11
 * Modify the UI.
 * Disable feathers.
 * v1.6 - 2013.4.6
 * No need the page to enable javascript.
 * Autoload the video thumb.
 * v1.5
 * 2013.1.20
 * 修复了显示为undefined的bug.
 * 为下载链接加入了扩展名.
 * v1.4
 * 2013.1.19
 * 支持新版的youtube.com
 * v1.3
 * 2012.10.8
 * youtube发生了更新, 原来的解析方式失败.
 * v1.2
 * 2012.07.21
 * 增加了文件的扩展名;
 * 修正了无法获取video_title的bug;
 *
 */

var uw = unsafeWindow,
    log = uw.console.log,
    error = uw.console.error;


var y2b = {
  videoId: '',
  videoInfoUrl: '',
  videotitle: '',
  stream: '',
  urlInfo: false,

  run: function() {
    this.getURLInfo();
    //this.disableFeather();
    this.hideAlert();
    this.showThumb();
    this.getVideo();
    this.showVideoDescription();
  },

  showVideoDescription: function() {
    log('showVideoDescription() --');
    /*
    var div = uw.document.querySelector('#watch-description-content');

    log('div: ', div);
    if (div != null) {
      div.style.height = "100%";
    }
    */
    this.addStyle([
        '#watch-description-content {',
          'height: 100% !important; ',
        '}',
        '#watch-description-toggle {',
          'display: none !important; ',
        '}',
        ].join(''));
  },

  /**
   * parse location.href
   */
  getURLInfo: function() {
    this.urlInfo = this.parseURI(uw.location.href);
    //log('urlInfo: ', this.urlInfo);
    //log('href: ', uw.location.href);
  },

  /**
   * Disable new Youtube feathers.
   */
  disableFeather: function() {
    if (!this.urlInfo.params.nofeather) {
      uw.location.href = uw.location.href + '&nofeather=True';
    }
  },

  /**
   * Show image thumb of videos.
   */
  showThumb: function() {
    log('showThumb() --');
    //var imgs = uw.document.querySelectorAll('img'),
    var imgs = uw.document.querySelectorAll('img'),
        watchMore = uw.document.querySelector('#watch-more-related'),
        img,
        i = 0;

    if (watchMore) {
      watchMore.style.display = 'block';
    }
    for (i = 0; img = imgs[i]; i += 1) {
      if (img.hasAttribute('data-thumb')) {
        img.src = img.getAttribute('data-thumb');
      }
    } 
  }, 

  /**
   * Hide the alert info.
   */
  hideAlert: function() {
    var alerts = uw.document.querySelectorAll('.yt-alert'),
        oo = uw.document.querySelector('#oo'),
        alert,
        i;
    //log('alerts:', alerts);
    for (i = 0; alert = alerts[i]; i += 1) {
      alert.style.display = 'none';
    }
    //log('oo: ', oo);
    if (oo) {
      oo.style.display = 'none';
    }
  },

  /**
   * Get video url info:
   */
  getVideo: function () {
    log('getVideo()--');
    var that = this,
        xhr = new XMLHttpRequest();

    //log('that: ', that);
    if (this.urlInfo.params['v']) {
      this.videoId = this.urlInfo.params['v'];
    } else {
      return false;
    }
    //log('videoId: ', this.videoId);
    this.videoInfoUrl = '/get_video_info?video_id=' + this.videoId;
    //log('videoInfoUrl: ' , this.videoInfoUrl);
    this.videoTitle = uw.document.title.substr(0,
        uw.document.title.length - 10);
    //log('videoTitle: ', this.videoTitle);

    xhr.open('GET', this.videoInfoUrl);
    xhr.onreadystatechange = function() {
      log('xhr: ', xhr);
      if (xhr.readyState === 4 && xhr.status === 200) {
        that.parseStream(xhr.response);
      }
    };
    xhr.send();
    /*
    GM_xmlhttpRequest({
      method: 'GET',
      url: this.videoInfoUrl,
      onload: function(response) {
        log('xhr response: ', response);
        that.parseStream(response.responseText);
      },
    });
    */
  },

  /**
   * Parse stream info from xhr text:
   */
  parseStream: function(rawVideoInfo) {
    log('parseStream() ---');
    var that = this;

    /**
     * Parse the stream text to Object
     */
    function _parseStream(rawStream){
      var a = decodeURIComponent(rawStream).split(',');
      return a.map(that.urlHashToObject);
    }

    this.videoInfo = this.urlHashToObject(rawVideoInfo);
    this.stream = _parseStream(this.videoInfo.url_encoded_fmt_stream_map);
    //log('video parsed --');
    log('stream: ', this.stream);
    this.createUI();
  },

  /**
   * Parse URL hash and convert to Object.
   */
  urlHashToObject: function(hashText) {
    var list = hashText.split('&'),
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
   * Create download list:
   */
  createUI: function() {
    log('createUI() --');
    var div = uw.document.createElement('div'),
        a,
        i = 0,
        types = {
          'video%2Fwebm%3B+codecs%3D%22vp8.0%2C+vorbis%22': 'webm',
          'video%2Fwebm%3B+codecs%3D%22vp8.0%2C+vorbis%22': 'webm',
          'video%2Fwebm%3B+codecs%3D%22vp8.0%2C+vorbis%22': 'webm',
          'video%2Fmp4%3B+codecs%3D%22avc1.64001F%2C+mp4a.40.2%22': 'mp4',
          'video%2Fmp4%3B+codecs%3D%22avc1.42001E%2C+mp4a.40.2%22': 'mp4',
          'video%2Fx-flv': 'flv',
          'video%2F3gpp%3B+codecs%3D%22mp4v.20.3%2C+mp4a.40.2%22': '3gp',
        };
        
    if (this.stream.length < 2) {
      a = uw.document.createElement('span');
      a.innerHTML = 'This video does not allowed to download';
      div.appendChild(a);
    } else {
      for (i = 0; i < this.stream.length; i += 1) {
        a = uw.document.createElement('a');
        a.href = decodeURIComponent(this.stream[i].url) + '&signature=' + 
          this.stream[i].sig;
        a.className = 'y2b-video-item';
        //log(this.stream[i].type);
        a.innerHTML = this.videoTitle + '(' + types[this.stream[i].type] +
          '-' + this.stream[i].quality + ')' + '.' + 
          types[this.stream[i].type];
        div.appendChild(a);
      }
    }

    this.addStyle([
        '.y2b-panel {',
          'position: fixed;',
          'left: 10px;', 
          'bottom: 10px;', 
          'border: 2px solid #ccc;', 
          'border-top-right-radius: 20px;', 
          'border-bottom-left-radius: 20px;',
          'margin: 0;',
          'padding: 10px;',
          'background-color: #fff;',
          'z-index: 9999;',
          '}',
        '.y2b-video-item {',
          'display: block;',
          'margin: 5px;',
        '}',
        ].join(''));

    div.className = 'y2b-panel';
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
   * FROM: http://james.padolsey.com/javascript/parsing-urls-with-the-dom/
   * This function creates a new anchor element and uses location
   * properties (inherent) to get the desired URL data. Some String
   * operations are used (to normalize results across browsers).
   * v1.0 - 2013.4.11
   */
  parseURI: function(url) {
    var a =  uw.document.createElement('a');
    a.href = url;
    return {
      source: url,
      protocol: a.protocol.replace(':',''),
      host: a.hostname,
      port: a.port,
      query: a.search,
      params: (function(){
        var ret = {},
            seg = a.search.replace(/^\?/,'').split('&'),
            len = seg.length,
            i = 0,
            s;

        for (i = 0; i< len; i += 1) {
          if (seg[i]) {
            s = seg[i].split('=');
            ret[s[0]] = s[1];
          }
        }
        return ret;
      })(),
      file: (a.pathname.match(/\/([^\/?#]+)$/i) || [,''])[1],
      hash: a.hash.replace('#',''),
      path: a.pathname.replace(/^([^\/])/,'/$1'),
      relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [,''])[1],
      segments: a.pathname.replace(/^\//,'').split('/')
    };
  },

};

y2b.run();
