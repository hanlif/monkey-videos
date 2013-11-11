// ==UserScript==
// @name         sohuHTML5
// @version      1.0
// @description  Play Videos with html5 on sohu.com
// @include      http://tv.sohu.com/*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// ==/UserScript==


/**
 * v1.0 -2013.4.26
 * Project intied.
 * Need to enable javascript on web page.
 */

var uw = unsafeWindow,
    log = uw.console.log,
    error = uw.console.error;


var sohu = {
  title: '',
  vid: 0,
  plid: '',
  referer: '',

  p1: {
    done: false,
    json: [],
    su: [],
    clipsURL: [],
    ip: '',
    vid: 0,
    reserveIp: [],
    videos: [],
  },

  p2: {
    done: false,
    json: [],
    su: [],
    vid: 0,
    clipsURL: [],
    ip: '',
    reserveIp: [],
    videos: [],
  },

  p3: {
    done: false,
    json: [],
    su: [],
    clipsURL: [],
    vid: 0,
    ip: '',
    reserveIp: [],
    videos: [],
  },

  run: function() {
    this.getId();
    this.getVideoJSON('p2');
    this.createUI();
  },


  getId: function() {
    log('getId() --');
    this.vid = uw.vid;
    this.p2.vid = uw.vid;
    this.plid = uw.playlistId;
    this.title = uw.document.title.split('-')[0].trim();
    this.referer = uw.escape(uw.location.href);
    log('vid: ', this.vid);
    log('plid: ', this.plid);
    log('title: ', this.title);
    log('referer: ', this.referer);
  },

  /**
   * Get video info.
   * e.g. http://hot.vrs.sohu.com/vrs_flash.action?vid=1109268&plid=5028903&referer=http%3A//tv.sohu.com/20130426/n374150509.shtml
   */
  getVideoJSON: function(fmt) {
    var pref = 'http://hot.vrs.sohu.com/vrs_flash.action',
        url = '',
        that = this;

    /*
    if (this[fmt].vid === 0) {
      this[fmt].done = true;
      return false;
    }
    */

    url = [pref, 
      '?vid=', this[fmt].vid,
      '&plid=', this.plid,
      '&out=0',
      '&g=8',
      '&referer=', this.referer,
      '&r=1',
      ].join('');
    log('video json url: ', url);

    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function(response) {
        log('response: ', response);
        var txt = response.responseText,
            i = 0;

        that[fmt].json = JSON.parse(txt);
        log('that: ', that);
        //that.title = that[fmt].json.data.tvName;
        that[fmt].clipsURL = that[fmt].json.data.clipsURL;
        that[fmt].su = that[fmt].json.data.su;
        that.p1.vid = that[fmt].json.data.norVid;
        that.p2.vid = that[fmt].json.data.highVid;
        that.p3.vid = that[fmt].json.data.superVid;
        that[fmt].ip = that[fmt].json.allot;
        that[fmt].reserveIp = that[fmt].json.reserveIp.split(';');
        that[fmt].done = true;

        for (i in that[fmt].clipsURL) {
          url = [
            'http://', that[fmt].ip,
            '/?prot=', that[fmt].clipsURL[i],
            '&new=', that[fmt].su[i],
            ].join('');

          log('i: ', i);
          log('video url: ', url);
          that[fmt].videos.push(url);
          log('that: ', that);
        }

        if (fmt === 'p2') {
          that.modifyList();
          that.appendPlaylist(fmt);
          if (that.p1.vid > 0) {
            that.appendPlaylist('p1');
            that.getVideoJSON('p1');
          }
          if (that.p1.vid > 0) {
            that.appendPlaylist('p3');
            that.getVideoJSON('p3');
          }
        }
      },
    });
  },

  createUI: function() {
    this.addStyle([
      '.sohu-panel {',
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
      '.sohu-panel:hover {',
        'overflow-y: auto; ',
      '}',
      '.sohu-label {',
        'margin-right: 10px;',
      '}',
      '.video-item {',
        'display: block; ',
        'text-decoration: none;',
      '}',
      '.video-item:hover {',
        'text-decoration: underline;',
      '}',
      'video-item:active {',
        'outline: none;',
      '}',
      ].join(''));

    var panel = uw.document.createElement('div'),
        that = this,
        choice;

    uw.document.body.appendChild(panel);
    panel.className = 'sohu-panel';

    panel.innerHTML = [
      '<form id="choose-format">',
      '</form>',
      '<div id="sohu-playlist"></div>',
      ].join('');

    uw.document.querySelector('#choose-format').addEventListener('change', function() {
      var inputs = this.querySelectorAll('input'),
          input,
          i = 0;
      for (i = 0; input = inputs[i]; i += 1) {
        if (input.checked) {
          that.modifyList(input);
          break;
        }
      }
    }, false);
  },

  appendPlaylist: function(fmt) {
    log('appendPlayList() --');
    log('fmt: ', fmt);
    var labels = {p1: '标清', p2: '高清', p3: '超清'},
        check = '';
    if (fmt === 'p2') {
      check = ' checked="checked" ';
    }
        
    uw.document.querySelector('#choose-format').innerHTML += [
      '<label for="', fmt, '" class="sohu-label">',
        '<input type="radio" id="', fmt, '" name="formatChoice"', check, ' />',
        '<span>', labels[fmt], '</span>',
      '</label>',
      ].join('');
  },

  modifyList: function (input) {
    log('modifyList() --');
    log('input: ', input);
    var fmt = '',
        playlist = uw.document.querySelector('#sohu-playlist'),
        a = '',
        url = '',
        that = this,
        i = 0;

    if (typeof input !== 'undefined') {
      fmt = input.id;
    } else {
      // Set default video reserlution.
      fmt = 'p2';
    }
    log('fmt: ', fmt);
    log('this[fmt]: ', this[fmt]);
    for (i = 0; url = this[fmt].videos[i]; i += 1) {
      a += ['<a href="', url, '" class="video-item">', getTitle(i), '</a>'].join('');
    }

    log('a: ', a);
    playlist.innerHTML = a;

    function getTitle(i) {
      if (i < 9) {
        return that.title + '(0' + String(i + 1) + ')';
      } else {
        return that.title + '(' + String(i + 1) + ')';
      }
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

};

sohu.run();
