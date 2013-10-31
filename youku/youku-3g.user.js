// ==UserScript==
// @name         youku3G
// @description  Get video link from m.youku.com
// @include      http://m.youku.com/*
// @version      1.0
// @license      GPLv3
// @author       LiuLang
// @email        gsushzhsosgsu@gmail.com
// @run-at       document-end
// @grant        none
// ==/UserScript==


/**
 * v1.1 - 2013.6.24
 * Download 3gphd first.
 * v1.0 - 2013.6.24
 * project inited.
 */

var uw = unsafeWindow,
    log = uw.console.log,
    error = uw.console.error;

var yk3g = {
  run: function() {
    this.parse();
  },

  parse: function() {
    log('parse() start');
    var t = uw.document.querySelectorAll('li a');
    log(t);
    for (var i = 0; i < t.length; i += 1) {
      log(t[i]);
      if (i+1 < t.length && t[i].parentElement === t[i+1].parentElement) {
        t[i].parentElement.removeChild(t[i]);
        log(t[i], ' is removed');
        continue;
      }
      t[i].innerHTML = t[i].parentElement.parentElement.children[0].innerHTML;
    }
  },
};
yk3g.run();
