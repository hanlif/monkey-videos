(function () {
    $reg("lib.ui", function () {});
    lib.ui.viewCenter = function (a, b) {
        b = b || "absolute";
        if (a) {
            var d = a.offsetWidth,
                e = a.offsetHeight,
                f = lib.box.getViewportWidth(),
                g = lib.box.getViewportHeight();
            if (!d || !e) throw "zero width or height.";
            d = {
                left: (f - d) / 2 + lib.box.getPageScrollLeft(),
                top: (g - e) / 2 + lib.box.getPageScrollTop()
            };
            a.style.position = b;
            $(a).pos(d)
        }
    }
})();
if (!window.JSON) window.JSON = window.JSON || {}, JSON.parse = function (a) {
    return (new Function("return " + a))()
}, JSON.stringify = function () {
    function a(a) {
        /["\\\x00-\x1f]/.test(a) && (a = a.replace(/["\\\x00-\x1f]/g, function (a) {
            var b = d[a];
            if (b) return b;
            b = a.charCodeAt();
            return "\\u00" + Math.floor(b / 16).toString(16) + (b % 16).toString(16)
        }));
        return '"' + a + '"'
    }
    function b(a) {
        return a < 10 ? "0" + a : a
    }
    var d = {
        "\u0008": "\\b",
        "\t": "\\t",
        "\n": "\\n",
        "\u000c": "\\f",
        "\r": "\\r",
        '"': '\\"',
        "\\": "\\\\"
    };
    return function (d) {
        switch (typeof d) {
        case "undefined":
            return "undefined";
        case "number":
            return isFinite(d) ? String(d) : "null";
        case "string":
            return a(d);
        case "boolean":
            return String(d);
        default:
            if (d === null) return "null";
            else if (d instanceof Array) {
                var f = ["["],
                    g = d.length,
                    h, i, j;
                for (i = 0; i < g; i++) switch (j = d[i], typeof j) {
                case "undefined":
                case "function":
                case "unknown":
                    break;
                default:
                    h && f.push(","), f.push(JSON.stringify(j)), h = 1
                }
                f.push("]");
                return f.join("")
            } else if (d instanceof Date) return '"' + d.getFullYear() + "-" + b(d.getMonth() + 1) + "-" + b(d.getDate()) + "T" + b(d.getHours()) + ":" + b(d.getMinutes()) + ":" + b(d.getSeconds()) + '"';
            else {
                h = ["{"];
                g = JSON.stringify;
                for (key in d) if (d.hasOwnProperty(key)) switch (i = d[key], typeof i) {
                case "undefined":
                case "unknown":
                case "function":
                    break;
                default:
                    f && h.push(","), f = 1, h.push(g(key) + ":" + g(i))
                }
                h.push("}");
                return h.join("")
            }
        }
    }
}();
$reg("lib.kit.serverTime", function () {
    lib.kit.serverTime = {
        serverUrl: "http://passport.qiyi.com/apis/external/time.php",
        init: function (a) {
            var a = a || lib.emptyMethod,
                b = this;
            lib.kit.util.jsLoad.request(this.serverUrl, {
                GET: {
                    cb: "cb_" + Math.ceil(Math.random() * 1E5).toString(36)
                },
                onSuccess: function (d) {
                    b.serTime = parseInt(d.time, 10);
                    b.locTime = parseInt(new Date / 1E3, 10);
                    a(b.serTime)
                },
                onError: function () {
                    b.serTime = b.locTime = parseInt(new Date / 1E3, 10);
                    a(b.serTime)
                },
                timeout: 3E3
            })
        },
        now: function (a) {
            if (!isNaN(this.serTime * 1) && !isNaN(this.locTime * 1)) {
                var b = parseInt(new Date / 1E3, 10) - this.locTime * 1 + this.serTime * 1;
                if (a instanceof Function) a(b);
                else return b
            } else this.init(a)
        }
    }
});
(function (a, b, d) {
    function e(a, d, e) {
        lib.eventTarget.call(this);
        this.textInput = typeof a == "string" ? b.getElementById(a) : a;
        this.resultWrapper = null;
        this._dataApi = d;
        this.option = Object.extend(f, e);
        this._state = !1;
        this._timer = null;
        this.keyword = this.oldValue = this._query = "";
        this._dataCache = {};
        this._keySelecting = this._isnaving = !1;
        this._ifrCover = null
    }
    lib.html2Nodes = function (a) {
        var d = b.createElement("div");
        d.innerHTML = a;
        return d.childNodes
    };
    var f = {
        len: 2,
        delayTime: 200,
        isswfWrapper: !1,
        isJsSubmit: !0
    };
    (function (a, b) {
        function d() {}
        d.prototype = b.prototype;
        a.superClass_ = b.prototype;
        a.prototype = new d;
        a.prototype.constructor = a
    })(e, lib.eventTarget);
    Object.extend(e.prototype, {
        _onBlur: function () {
            lib.log("sugest blur");
            this.stop()
        },
        _initTextInput: function () {
            var a = this;
            this.textInput.setAttribute("autocomplete", "off");
            $(this.textInput).on("blur", this._onBlur.bind(this));
            $(this.textInput).on("keydown", function (b) {
                b = lib.fixEvent(b);
                b = b.keyCode;
                b == 27 && (a.stop(), a.close());
                if (b == 40) {
                    if (a.isWrapperHidden()) return;
                    a._keySelecting = !0;
                    a._state && a.stop();
                    a.fire({
                        type: "down"
                    })
                }
                if (b == 38) {
                    if (a.isWrapperHidden()) return;
                    a._keySelecting = !0;
                    a._state && a.stop();
                    a.fire({
                        type: "up"
                    })
                }
                b == 13 && (a.fire({
                    type: "enter"
                }), a.option.isJsSubmit ? (a.textInput.blur(), a._submitForm()) : a._onBlur());
                if (b != 40 && b != 38) a._state || a.start(), a._keySelecting = !1
            })
        },
        init: function () {
            var a = this;
            this._initTextInput();
            this._initDom();
            this._initDataApi();
            this.initWinEvent();
            this.option.isswfWrapper && ($(b).on("click", function (b) {
                b = lib.fixEvent(b);
                b.target != a.textInput && a.close()
            }), $(b).on("keydown", function (b) {
                b = lib.fixEvent(b);
                b.target != a.textInput && b.keyCode == 9 && a.close()
            }))
        },
        _initDataApi: function () {
            var a = this;
            this._dataApi.on("receive", function (b) {
                b.data && b.data.length > 0 ? a.open(a.cacheData(b.data, b.key)) : (a.stop(), a.close(), a.fire({
                    type: "empty"
                }))
            })
        },
        _initDom: function () {
            var a = this;
            this.resultWrapper = b.createElement("div");
            this.resultWrapper.style.width = "500px";
            this.resultWrapper.style.height = "500px";
            this.resultWrapper.style.position = "absolute";
            this.resultWrapper.style.top = "0px";
            this._hideWrapper();
            this.resultWrapper.style.visibility = "hidden";
            b.body.appendChild(this.resultWrapper);
            $(this.resultWrapper).on("mouseover", function () {
                a._keySelecting = !0
            })
        },
        start: function () {
            this._state = !0;
            var a = this;
            this._timer = setTimeout(function () {
                a.upadteContent();
                a._timer = setTimeout(arguments.callee, a.option.delayTime)
            }, this.option.delayTime)
        },
        stop: function () {
            this._state = !1;
            clearInterval(this._timer)
        },
        upadteContent: function () {
            var a = this._query = this.textInput.value;
            if (this.oldValue !== a) a.length < this.option.len && (this.stop(), this.close()), this._state && this._dataCache[a] !== d && !this._keySelecting ? this.open(this._dataCache[a]) : this._state && a.length >= this.option.len && !this._keySelecting && this._dataApi.request(a), this.oldValue = a
        },
        cacheData: function (a, b) {
            return this._dataCache[b] = a
        },
        open: function (a) {
            var b = this;
            this.setPos();
            this.fire({
                type: "show",
                data: a
            });
            try {
                lib._PAGE_EVENT && lib._PAGE_EVENT.on("rerender", function () {
                    b._state = !0;
                    b.setPos()
                })
            } catch (d) {}
        },
        setText: function (a) {
            this._keySelecting = !0;
            this.textInput.value = this.keyword = a
        },
        setWrapperHtml: function (a) {
            this.resultWrapper.innerHTML = a
        },
        reFocus: function () {
            this.textInput.focus();
            this.start()
        },
        setPos: function () {
            this.resultWrapper && this._state && this._setPos()
        },
        _setPos: function () {
            var a = lib.box.getPosition(this.textInput);
            this.resultWrapper.style.zIndex = 1001;
            this.resultWrapper.style.width = this.textInput.offsetWidth + "px";
            this.resultWrapper.style.left = a.left + "px";
            this.resultWrapper.style.top = a.top + this.textInput.offsetHeight + "px";
            this.resultWrapper.style.visibility = ""
        },
        setEmpty: function (a) {
            this.setWrapperHtml(a);
            this._setPos()
        },
        close: function () {
            this.fire({
                type: "close"
            });
            this.stop();
            this._hideWrapper()
        },
        _submitForm: function () {
            var a = this.textInput.parentNode;
            if (a && a.nodeName === "FORM") {
                var d = lib.Element.create("input");
                d.attr("type", "hidden");
                d.attr("name", "from");
                d.val("suggest");
                lib.$(a).append(d);
                b.createEvent ? (d = b.createEvent("MouseEvents"), d.initEvent("submit", !0, !1), a.dispatchEvent(d)) : b.createEventObject && a.fireEvent("onsubmit")
            }
        },
        submitForm: function () {
            this._submitForm()
        },
        iframeCover: function () {
            return lib.html2Nodes('<iframe border="0" frameBorder="0" style="display:none;" ></iframe>')[0]
        },
        initIfr: function () {
            if (lib.IE6 || lib.IE7 || lib.Maxthon) this._ifrCover = this.iframeCover(), b.body.appendChild(this._ifrCover)
        },
        coverIframe: function (a) {
            var b = this._ifrCover.style;
            b.display = "block";
            b.position = "absolute";
            b.left = a.left + "px";
            b.top = a.top + "px";
            b.width = a.width + "px";
            b.height = a.height + "px";
            b.zIndex = 999
        },
        showIfr: function () {
            if (lib.IE6 || lib.IE7 || lib.Maxthon) {
                var a = $(this.resultWrapper).down("ul").box(),
                    b = {};
                b.left = a.left;
                b.top = a.top;
                b.width = a.width;
                b.height = a.height;
                this.coverIframe(b)
            }
        },
        hideIfr: function () {
            if (lib.IE6 || lib.IE7 || lib.Maxthon) this._ifrCover.style.display = "none"
        },
        reSizeWin: function () {
            this.setPos()
        },
        initWinEvent: function () {
            var b = this;
            $(a).on("resize", function () {
                b.reSizeWin()
            })
        },
        _hideWrapper: function () {
            this.resultWrapper.style.visibility = "hidden"
        },
        isWrapperHidden: function () {
            return this.resultWrapper.style.visibility == "hidden"
        },
        setWrapperCss: function (a) {
            this.resultWrapper.style.cssText += ";" + a
        }
    });
    a.lib = a.lib || {};
    lib.kit = lib.kit || {};
    lib.kit.suggest = e
})(window, document);
(function (a, b) {
    function d() {
        lib.eventTarget.call(this);
        this._script = null;
        this.isDirect = 0
    }
    function e(a, b) {
        if (!a) return null;
        return a.nodeName.toLowerCase() == b ? a : e(a.parentNode, b)
    }
    $reg("lib.action", function () {});
    $reg("lib.component", function () {});
    var f = a.document,
        g = f.getElementById("suggestText");
    if (g) {
        if (lib.IE6) lib._PAGE_EVENT.on("loginclose", function () {
            g && g.focus();
            g && g.blur()
        });
        d.inherits(lib.eventTarget);
        Object.extend(d.prototype, {
            request: function (b) {
                var d = /http\:\/\/(.*?)\/(.*?)\//gi.exec(location.href),
                    e = /http\:\/\/(.*?)\./gi.exec(location.href)[1],
                    e = e == "list" ? d && d[2] : e,
                    e = e == "app" || e == "so" || e == "i" || e == "cms" || e == "labs" || e == "index" || e == "top" || e == "fashion" ? "" : e,
                    g = /\\|!|:|\^|\]|\[|\{|\}|\~|\*|\?|\u300a|\u300b|<|>|_/g;
                this.request = lib.IE && !lib.IE9 ?
                function (b) {
                    var d = this,
                        h = f.getElementsByTagName("head")[0],
                        i = null;
                    if (!this._script) i = f.createElement("script"), i.charset = "utf-8", h.insertBefore(i, h.firstChild), this._script = i;
                    this._script.onreadystatechange = function () {
                        (!i || !i.readyState || !(i.readyState != "loaded" && i.readyState != "complete")) && a.suggestResult && d.fire({
                            type: "receive",
                            data: suggestResult.data,
                            key: b
                        })
                    };
                    this._script.src = "http://search.video.qiyi.com/userSuggest/" + encodeURIComponent(b.trim().replace(g, "").toLowerCase()).replace(/\%/gi, "_") + "/10/suggestResult/" + (e || "www") + "/"
                } : function (a) {
                    var b = this;
                    lib.kit.util.jsLoad.request("http://search.video.qiyi.com/userSuggest/" + encodeURIComponent(a.trim().replace(g, "").toLowerCase()).replace(/\%/gi, "_") + "/10/suggestResult/" + (e || "www") + "/", {
                        CACHE: {
                            varname: "suggestResult"
                        },
                        onSuccess: function (d) {
                            b.fire({
                                type: "receive",
                                data: d,
                                key: a
                            })
                        },
                        onError: function () {}
                    })
                };
                return this.request(b)
            }
        });
        lib.component.suggest = function () {
            this._first = !0;
            this._targetitem = 0;
            this._eleSearch = g;
            this._dataRequest = new d;
            this._searchForm = "j-search-form";
            this._suggestList = "j-suggestList";
            this._submitBtn = "searchClick";
            this._noValue = "\u8bf7\u8f93\u5165\u641c\u7d22\u5173\u952e\u8bcd\u2026";
            this.init = function () {
                this._cutRange = parseInt(this._eleSearch.getAttribute("j-cutrange") || "18");
                this.form = $("#" + this._searchForm);
                if (lib.ipad) this.form.on("submit", this._formSubmit.bind(this));
                else this._suggest = new lib.kit.suggest(this._eleSearch, this._dataRequest, {
                    len: 1,
                    isJsSubmit: !1,
                    isswfWrapper: !0
                }), this._suggest.init(), this.initEvent()
            };
            this.initEvent = function () {
                var b = this;
                this._suggest.on("down", this._keyDown.bind(this, "down"));
                this._suggest.on("up", this._keyDown.bind(this, "up"));
                this._suggest.on("enter", this._keyDown_enter.bind(this));
                this._suggest.on("show", this._renderSuggest.bind(this));
                this._suggest.on("close", function () {
                    lib.kit.UnderFrame.hide(b._suggestList)
                });
                this.form.on("submit", this._formSubmit.bind(this));
                var d = $("#" + this._submitBtn);
                if (d) d.on("click", function (d) {
                    d = a.event || d;
                    lib.Event.stop(d);
                    b._formSubmit.call(b, d)
                });
                else lib.kit.slog.log({
                    flag: "search",
                    url: location.href
                });
                var e = $(this._eleSearch);
                e.on("focus", function () {
                    b._noValue == b._eleSearch.value.trim() && e.val("");
                    e.css("color", "")
                });
                lib.$(this._suggest.resultWrapper).on("mousedown", this._mouseDown.bind(this))
            };
            this.close = function () {
                this._suggest.close()
            };
            this._formSubmit = function (d) {
                d = a.event || d;
                lib.Event.stop(d);
                lib._PAGE_EVENT.fire({
                    type: "beforesearch",
                    data: {
                        keyword: this._eleSearch.value.trim()
                    }
                });
                this._curr == -1 || this._curr === b ? this._eleSearch.value.trim() && this._eleSearch.value.trim() != this._noValue ? a.location = ["http://so.qiyi.com/so/q", encodeURIComponent(this._eleSearch.value), "f_2"].join("_") : (this._eleSearch.value = this._noValue, this._eleSearch.style.color = "#a9a9a9", $("#" + this._submitBtn)[0].focus()) : this._result[this._curr]["j-alias"] || this._result[this._curr]["j-link"] ? (location.href = this._result[this._curr]["j-link"], lib.Event.preventDefault(d)) : (d = this._result[this._curr].cname ? "_ctg_" + encodeURIComponent(this._result[this._curr].cname) : "", a.location = ["http://so.qiyi.com/so/q", encodeURIComponent(this._eleSearch.value) + d, "f_1"].join("_"))
            };
            this.submitLog = function (a) {
                lib.log(a);
                lib.log(this.suggestAll);
                lib.log(this.level4cnt);
                lib.log(this.isDirect);
                lib.kit.slog.log({
                    flag: "suggest",
                    suggestAll: this.suggestAll,
                    level4cnt: this.level4cnt,
                    level: a.level,
                    keyword: a.name,
                    isDirect: this.isDirect,
                    cname: encodeURIComponent(a.cname)
                }, "http://msg.video.qiyi.com/sev2.gif")
            };
            this._keyDown = function (a) {
                var b = lib.$("#" + this._suggestList);
                if (b && (b = b.down("a"), b.length > 0)) this._curr = a == "down" ? this._curr + 1 > b.length - 1 ? 0 : this._curr + 1 : this._curr - 1 < 0 ? b.length - 1 : this._curr - 1, this._setSelected(this._curr), this._suggest.setText(this._result[this._curr].name)
            };
            this._keyDown_enter = function () {
                this._curr && this._curr != -1 && this.submitLog(this._result[this._curr])
            };
            this._mouseDown = function (b) {
                b = a.event || b;
                lib.Event.stopPropagation(b);
                b = b.target || b.srcElement;
                b = e(b, "a");
                lib.$(b).attr("_index") !== null && this._setSelected(parseInt(lib.$(b).attr("_index")));
                this._mouseDownEx(b);
                if (b.getAttribute("j-link") && b.getAttribute("j-link") !== "") location.href = b.getAttribute("j-link");
                else {
                    var d = b.getElementsByTagName("span")[0],
                        f = b.getAttribute("title");
                    this._suggest.textInput.value = f !== "" ? f : d.innerHTML;
                    this._setChannelParam(b.getAttribute("j_ctg"));
                    this._suggest.submitForm()
                }
            };
            this._mouseDownEx = function (a) {
                this.submitLog(this._result[a.getAttribute("_index")])
            };
            this._renderSuggest = function (b) {
                var d = this,
                    e = {
                        tv: {
                            first: "\u6700\u65b0\u4e00\u96c6",
                            suffix: "\u5267\u96c6\u9875"
                        },
                        com: {
                            first: "\u6700\u65b0\u4e00\u96c6",
                            suffix: "\u5267\u96c6\u9875"
                        },
                        "var": {
                            first: "\u6700\u65b0\u4e00\u671f",
                            suffix: "\u4e13\u9898"
                        },
                        tr: {
                            first: "\u6700\u65b0\u4e00\u671f",
                            suffix: "\u4e13\u9898"
                        },
                        doc: {
                            first: "\u6700\u65b0\u4e00\u671f",
                            suffix: "\u4e13\u9898"
                        },
                        art: {
                            first: "\u6700\u65b0\u4e00\u96c6",
                            suffix: "\u4e13\u9898"
                        },
                        fasvar: {
                            first: "\u6700\u65b0\u4e00\u671f",
                            suffix: "\u4e13\u9898"
                        }
                    };
                this._curr = -1;
                this._result = b.data;
                var b = [],
                    f = [];
                this.isDirect = 0;
                this.suggestAll = this._result.length;
                for (var g = 0; g < this._result.length; g++) if (this._result[g].level == "4" ? f.push(this.getCurrentContext(g, e)) : b.push(this.getCurrentContext(g, e)), g == 0 && !this._result[0].added && this._addChildList(this._result[0].type), this._result[g]["j-alias"]) this.isDirect = 1;
                this.level4cnt = f.length;
                e = f.length > 0 ? b.length > 0 ? '<div style="border-top:1px solid #ccc; padding-top:5px; margin:5px 0;">' + f.join("") + "</div>" : f.join("") : "";
                f = lib.$(this._suggest.resultWrapper).box().width;
                if (f < 200) this._suggest.resultWrapper.style.width = f + 28 + "px";
                this._suggest.setWrapperHtml("<div id='" + this._suggestList + "' class='suggest_t' style='top:0px;left:0px;width:100%;'>" + b.join("") + e + "</div>");
                lib.kit.UnderFrame.show(this._suggestList);
                if (this._first) $(a).on("resize", function () {
                    lib.$(d._suggest.resultWrapper).css("visibility") != "hidden" && (lib.kit.UnderFrame.show(d._suggestList), lib.log("resize"))
                }), this._first = !1
            };
            this.getCurrentContext = function (a, b) {
                var d = this._result[a],
                    e = 0,
                    f = !! d["j-alias"],
                    g = f ? d["j-alias"] : d.name,
                    h = [];
                if (f) h.push("<a " + (a === this._curr ? 'class="selected otherH"' : 'class="otherH"') + ' _index="' + a + '" j-link="' + d["j-link"] + '" style="cursor:pointer;" ' + (d.cuted ? 'title="' + d.name + (b[d.type].suffix || "\u4e13\u9898") + '"' : "") + ' j_ctg="' + d.cname + '">'), h.push('<p _index="' + a + '" class="fL txtindex"><span _index="' + a + '" style="color:#000;">' + g + "</span></p>");
                else {
                    if (d.cname.length == 2 && (e = g.getLen() >= (this._cutRange - 1) * 2 ? this._cutRange * 2 - 3 : 0, d.type == "en" || d.type == "trail" || d.type == "level4")) e = d.count.length + 5, e = g.getLen() + e >= (this._cutRange - 2) * 2 ? (this._cutRange - 2) * 2 - 2 - e : 0;
                    d.cname.length == 3 && (e = g.getLen() >= (this._cutRange - 1) * 2 ? (this._cutRange - 1) * 2 - 3 : 0);
                    d.cname.length == 4 && (e = d.count.length + 2, e = g.getLen() >= (this._cutRange - 2) * 2 ? (this._cutRange - 2) * 2 - 3 - e : 0);
                    d.cname || (e = g.getLen() >= this._cutRange ? this._cutRange * 2 : 0);
                    d.cname.length > 4 && (e = (this._cutRange - 2) * 2 - d.cname.length);
                    f = "";
                    if (d.adInfo) f = ' href="' + d.adLink + '" j-link="' + d.adLink + '" ', d["j-link"] = d.adLink;
                    h.push("<a " + (a === this._curr ? 'class="selected"' : "") + f + ' _index="' + a + '" style="cursor:default;" title="' + (e > 0 ? g : "") + '" j_ctg="' + d.cname + '">');
                    h.push('<p _index="' + a + '" class="fL"><span _index="' + a + '" style="color:#000;float:left">' + (e == 0 ? g : g.trancate(e, "..")) + "</span>" + (d.cname ? '<span _index="' + a + '" style="float:left">(' + (d.cname == "\u5a31\u4e50" ? "\u5a31\u4e50\u8d44\u8baf" : d.cname) + ")</span>" : "") + (d.type == "en" || d.type == "trail" || d.type == "level4" ? '<span _index="' + a + '" style="float:right; padding-right:6px">' + d.count + "\u4e2a</span>" : "") + "</p>")
                }
                h.push("</a>");
                return h.join("")
            };
            this._trancate = function (a) {
                return a
            };
            this._addChildList = function (a) {
                var b = {
                    tv: {
                        first: "\u6700\u65b0\u4e00\u96c6",
                        suffix: "\u5267\u96c6\u9875"
                    },
                    com: {
                        first: "\u6700\u65b0\u4e00\u96c6",
                        suffix: "\u5267\u96c6\u9875"
                    },
                    "var": {
                        first: "\u6700\u65b0\u4e00\u671f",
                        suffix: "\u4e13\u9898"
                    },
                    tr: {
                        first: "\u6700\u65b0\u4e00\u671f",
                        suffix: "\u4e13\u9898"
                    },
                    doc: {
                        first: "\u6700\u65b0\u4e00\u671f",
                        suffix: "\u4e13\u9898"
                    },
                    art: {
                        first: "\u6700\u65b0\u4e00\u96c6",
                        suffix: "\u4e13\u9898"
                    },
                    fasvar: {
                        first: "\u6700\u65b0\u4e00\u671f",
                        suffix: "\u4e13\u9898"
                    }
                };
                if (this._result[0].link != "" && b[a]) {
                    this.isDirect = 1;
                    var d = this._cloneObject(this._result[0]),
                        e = null,
                        e = d.name,
                        f = e.getLen() >= this._cutRange * 2 ? this._cutRange * 2 - 3 : 0;
                    d["j-alias"] = "<span class='linec'>-</span>" + (f == 0 ? e : e.trancate(f, "..")) + (b[a].suffix || "\u4e13\u9898");
                    d["j-link"] = this._result[0].link + "?key=" + g.value + "&from=suggest&clicked=-" + e + (b[a].suffix || "\u4e13\u9898");
                    d.cuted = f > 0;
                    this._result.splice(1, 0, d);
                    this._result[0].recentLink !== "" && (e = this._cloneObject(this._result[0]), e["j-alias"] = "<span class='linec'>-</span>" + b[a].first +
                    function (a) {
                        var b = [];
                        if (a.type == "var" || a.type == "fasvar") {
                            var d = parseInt(a.tvSeason, 10),
                                e = parseInt(a.tvPhase, 10),
                                f = parseInt(a.update, 10);
                            if (d || e || f) b.push("(\u7b2c"), e ? d ? b.push(d, "\u5b63 \u7b2c", e) : b.push(e) : b.push(function (a) {
                                a = a.match(/.{2}/g);
                                return a[0] + a[1] + (a[2] ? "-" + a[2] : "") + (a[3] ? "-" + a[3] : "")
                            }(a.update)), b.push("\u671f)")
                        } else a.update && b.push("(", a.update, ")");
                        return b.join("")
                    }(this._result[0]), e["j-link"] = this._result[0].recentLink + "?key=" + g.value + "&from=suggest&clicked=-" + b[a].first, this._result.splice(1, 0, e));
                    this._result[0].recentLink === "" && this._result[0].firstLink !== "" && (e = this._cloneObject(this._result[0]), e["j-alias"] = "<span class='linec'>-</span>\u89c2\u770b\u7b2c\u4e00\u96c6", e["j-link"] = this._result[0].firstLink + "?key=" + g.value + "&from=suggest&clicked=-\u89c2\u770b\u7b2c\u4e00\u96c6", this._result.splice(1, 0, e));
                    this._result[0].added = !0
                }
            };
            this._cloneObject = function (a) {
                var b = {};
                Object.extend(b, a);
                return b
            };
            this._setSelected = function (a) {
                var b = f.getElementById(this._suggestList).getElementsByTagName("a");
                lib.$(b[this._targetitem]).removeClass("selected");
                this._targetitem = a;
                lib.$(b[a]).addClass("selected");
                this._curr = a
            };
            this._setChannelParam = function (a) {
                var b = lib.Element.create("input");
                b.attr("type", "hidden");
                b.attr("name", "category");
                this.form.append(b);
                b.val(a)
            }
        };
        var h = new lib.component.suggest;
        h.init();
        a.oldSuggest = h
    }
})(window);
(function (a) {
    var b = $("#suggestText"),
        d = "";
    b && (d = b.attr("suggestWord") || "", $reg("lib.jobs.suggest", function () {
        var e = Object.extend(lib.jobs.suggest, {
            testDefault: function () {
                var e = b.val();
                return (e == d || !e) && !(a.sManager && sManager.oldKey == d)
            },
            setDefault: function () {
                b.val() == "" && (b.css("color", "#a9a9a9"), b.val(d))
            }
        }),
            f = function () {
                e.testDefault() && b.val("");
                b.css("color", "");
                b.un("focus", f)
            };
        b.on("focus", f);
        (new lib.kit.Url(a.location.href)).getParam("key") === "" && e.setDefault()
    }))
})(window, document);
var webEventID, WebEventId = function () {
        this.callback = function () {};
        this.create = function (a) {
            function b() {
                f++;
                e && clearTimeout(e);
                !webEventID && f <= 50 ? e = setTimeout(b, 100) : f > 50 ? d.getWebEventID() : d.callback(webEventID)
            }
            this.callback = a ||
            function () {};
            if (window.postWebEventID) {
                var d = this,
                    e, f = 0;
                e = setTimeout(b, 100)
            } else this.getWebEventID()
        };
        this.getWebEventID = function () {
            this._getFromServer()
        };
        this._getFromServer = function () {
            var a = this;
            lib.kit.util.jsLoad.request("http://data.video.qiyi.com/uid", {
                CACHE: {
                    varname: "uid"
                },
                onSuccess: function (b) {
                    b ? (webEventID = b.uid, a.callback(webEventID)) : a._getFromLocal()
                },
                onError: function () {
                    a._getFromLocal()
                },
                is_timeout: !0,
                timeout: 5E3
            })
        };
        this._getFromLocal = function () {
            for (var a = (new Date).getTime().toString(), b = String(Math.floor(999999999 * Math.random())); b.length < 9;) b = "0" + b;
            webEventID = a.substr(a.length - 10, 10) + b;
            this.callback(webEventID)
        }
    };
$reg("lib.kit.Pager", function () {
    lib.kit.Pager = Class.create({
        initialize: function (a) {
            this.opt = Object.extend({
                currentPage: 1,
                showNum: 10,
                totalNum: 30,
                autoSelect: !0,
                onSelect: function () {},
                onClick: function () {},
                type: "view"
            }, a);
            if (this.opt.showNum > this.opt.totalNum) this.opt.showNum = this.opt.totalNum;
            this.getDValue();
            if (this.opt.type == "view") this.box = a.box ? $(a.box) : $(document.body), this.initEvent();
            this.getPageList(this.opt.autoSelect)
        },
        reDraw: function (a) {
            Object.extend(this.opt, a);
            if (this.opt.showNum > this.opt.totalNum) this.opt.showNum = this.opt.totalNum;
            this.getDValue();
            this.getPageList(this.opt.autoSelect)
        },
        getDValue: function () {
            var a = this.opt.showNum;
            this.dValue = (a % 2 ? a - 1 : a - 2) / 2
        },
        getPageList: function (a) {
            this.pageInfo = {
                up: !1,
                down: !1,
                dotup: !1,
                dotdown: !1,
                start: 0,
                end: 0
            };
            var b = Math.floor((this.opt.currentPage - 1) / this.opt.showNum),
                d = b * this.opt.showNum,
                e = d + this.opt.showNum;
            this.pageInfo.up = this.opt.currentPage == 1 ? !1 : !0;
            this.pageInfo.down = this.opt.currentPage < this.opt.totalNum ? !0 : !1;
            this.opt.currentPage - this.dValue - 1 > 0 && (d = this.opt.currentPage - this.dValue - 1 > 2 ? this.opt.currentPage - this.dValue - 1 : 0, e = this.opt.currentPage + this.dValue > this.opt.totalNum ? this.opt.totalNum : this.opt.currentPage + this.dValue);
            this.opt.currentPage == this.opt.totalNum && (d = this.opt.totalNum - this.opt.showNum, d = d > 2 ? d : 0);
            b > 0 || d > 2 ? (this.pageInfo.dotup = !0, this.pageInfo.dotdown = d + this.opt.showNum < this.opt.totalNum ? !0 : !1) : this.pageInfo.dotdown = this.opt.showNum < this.opt.totalNum ? !0 : !1;
            d > 2 ? this.pageInfo.dotup = !0 : (d = 0, this.pageInfo.dotup = !1);
            if (e >= this.opt.totalNum) this.pageInfo.dotdown = !1;
            else if (e == this.opt.totalNum - 1) e = this.opt.totalNum, this.pageInfo.dotdown = !1;
            this.pageInfo.start = d;
            this.pageInfo.end = e;
            if (a != !1) this.opt.onSelect(this.opt.currentPage);
            this.opt.type == "view" && this.drawList()
        },
        drawList: function () {
            var a = [];
            this.pageInfo.up ? a.push('<a href="#" title="\u8df3\u8f6c\u81f3' + (this.opt.currentPage - 1) + '\u9875" class="a1" data-key="up" >\u4e0a\u4e00\u9875</a>') : a.push('<span class="noPage">\u4e0a\u4e00\u9875</span>');
            this.pageInfo.dotup && (a.push('<a href="#" title="\u8df3\u8f6c\u81f3\u7b2c\u4e00\u9875" data-key="1">1</a>'), a.push('<a href="#" data-key="dotup">...</a>'));
            for (var b = this.pageInfo.start; b < this.pageInfo.end; b++) {
                var d = b + 1;
                d == this.opt.currentPage ? a.push('<span class="curPage" data-key="' + d + '">' + d + "</span>") : a.push('<a href="#" title="\u8df3\u8f6c\u81f3\u7b2c' + d + '\u9875" data-key="' + d + '">' + d + "</a>")
            }
            this.pageInfo.dotdown && (a.push('<a href="#" data-key="dotdown">...</a>'), a.push('<a href="#" title="\u8df3\u8f6c\u81f3\u7b2c\u6700\u540e\u4e00\u9875" data-key="' + this.opt.totalNum + '" >' + this.opt.totalNum + "</a>"));
            this.pageInfo.down ? a.push('<a href="#" title="\u8df3\u8f6c\u81f3' + (this.opt.currentPage + 1) + '\u9875" class="a1" data-key="down">\u4e0b\u4e00\u9875</a>') : a.push('<span class="noPage">\u4e0b\u4e00\u9875</span>');
            this.box.html(a.join(" "))
        },
        initEvent: function () {
            this._clickevent = this.onPageClick.bindEvent(this);
            this.box.on("click", this._clickevent)
        },
        removeEvent: function () {
            this._clickevent && this.box.un("click", this._clickevent)
        },
        forward: function () {
            if (this.opt.currentPage) {
                this.opt.currentPage -= 1;
                if (this.opt.currentPage < 1) return !1;
                this.getPageList();
                return !0
            }
            return !1
        },
        next: function () {
            if (this.opt.currentPage) {
                this.opt.currentPage += 1;
                if (this.opt.currentPage > this.opt.totalNum) return !1;
                this.getPageList();
                return !0
            }
            return !1
        },
        selectByIndex: function (a) {
            this.opt.currentPage = a;
            this.getPageList()
        },
        selectByItem: function (a) {
            if (a = a.getAttribute("data-key")) if (a == "up") this.forward(), this.opt.onClick(this.opt.currentPage);
            else if (a == "down") this.next(), this.opt.onClick(this.opt.currentPage);
            else if (a != "dot") this.opt.currentPage = a == "dotup" ? this.pageInfo.start - 1 : a == "dotdown" ? this.pageInfo.end + 1 : parseInt(a), this.opt.onClick(this.opt.currentPage), this.getPageList()
        },
        onPageClick: function (a) {
            lib.Event.stop(a);
            a = a.srcElement || a.target;
            a.tagName.toLowerCase() == "a" && this.selectByItem(a)
        }
    });
    lib.kit.Pager.init = function (a) {
        return new lib.kit.Pager(a)
    }
});
$reg("lib.kit.Draggable", function () {
    lib.kit.Draggable = Class.create({
        initialize: function (a) {
            this.options = Object.extend({
                handle: null,
                helper: "original",
                containment: !1,
                element: null,
                onDrag: null,
                onStop: null,
                onStart: null
            }, a);
            (this.element = $(this.options.element)) && this._mouseInit()
        },
        _mouseInit: function () {
            var a = this;
            this._mouseDownDelegate = function (b) {
                a._mouseDown(b)
            };
            lib.Event.on(this.element[0], "mousedown", this._mouseDownDelegate);
            a.handle = $(this.options.handle, this.element[0]);
            a.handle.css("cursor", "move")
        },
        _mouseDown: function (a) {
            var b = this;
            if (!a.target) a.target = a.srcElement || document;
            if (!a.which && a.button !== void 0) a.which = a.button & 1 ? 1 : a.button & 2 ? 3 : a.button & 4 ? 2 : 0;
            b._mouseStarted && b._mouseUp(a);
            b._mouseDownEvent = a;
            if (a.which != 1 || !b._getHandle(a)) return !0;
            b._mouseStarted = b._mouseStart(a) !== !1;
            if (!b._mouseStarted) return lib.Event.preventDefault(a), !0;
            b._mouseMoveDelegate = function (a) {
                return b._mouseMove(a)
            };
            b._mouseUpDelegate = function (a) {
                return b._mouseUp(a)
            };
            lib.Event.on(document, "mousemove", b._mouseMoveDelegate).on(document, "mouseup", b._mouseUpDelegate);
            lib.Event.preventDefault(a);
            return !0
        },
        _mouseUp: function (a) {
            lib.Event.un(document, "mousemove", this._mouseMoveDelegate);
            lib.Event.un(document, "mouseup", this._mouseUpDelegate);
            if (this._mouseStarted) this._mouseStarted = !1, this._mouseStop(a);
            return !1
        },
        _getHandle: function (a) {
            var b = this.handle;
            if (!b) return !1;
            a = a.target;
            for (b = b[0]; a && a.nodeType !== 9;) {
                if (a == b) return !0;
                a = a.parentNode
            }
            return !1
        },
        _mouseStart: function (a) {
            var b = this.options.onStart;
            if (a.pageX == null && a.clientX != null) {
                var d = document.documentElement,
                    e = document.body;
                a.pageX = a.clientX + (d && d.scrollLeft || e && e.scrollLeft || 0) - (d && d.clientLeft || e && e.clientLeft || 0);
                a.pageY = a.clientY + (d && d.scrollTop || e && e.scrollTop || 0) - (d && d.clientTop || e && e.clientTop || 0)
            }
            this.helper = this._createHelper(a);
            this._cacheHelperProportions();
            this._cacheMargins();
            this.offset = this.element.pos();
            this.offset = {
                top: this.offset.top - this.margins.top,
                left: this.offset.left - this.margins.left
            };
            Object.extend(this.offset, {
                click: {
                    left: a.pageX - this.offset.left,
                    top: a.pageY - this.offset.top
                },
                parent: this._getParentOffset()
            });
            this.originalPosition = this.position = this._generatePosition(a);
            this.originalPageX = a.pageX;
            this.originalPageY = a.pageY;
            if (b && b.call(this.element[0], a) === !1) return this._mouseUp({}), !1;
            this.helper[0].style.left = this.position.left + "px";
            this.helper[0].style.top = this.position.top + "px";
            return !0
        },
        _getParentOffset: function () {
            this.offsetParent = $(this.helper[0].offsetParent);
            var a = this.offsetParent.pos();
            if (this.offsetParent[0] == document.body || this.offsetParent[0].tagName && this.offsetParent[0].tagName.toLowerCase() == "html" && lib.IE) a = {
                top: 0,
                left: 0
            };
            return {
                top: a.top + (parseInt(this.offsetParent.css("borderTopWidth"), 10) || 0),
                left: a.left + (parseInt(this.offsetParent.css("borderLeftWidth"), 10) || 0)
            }
        },
        _mouseMove: function (a) {
            if (lib.IE && !a.button) return this._mouseUp(a);
            if (this._mouseStarted) return this._mouseDrag(a), lib.Event.preventDefault(a);
            (this._mouseStarted = this._mouseStart(this._mouseDownEvent, a) !== !1) ? this._mouseDrag(a) : this._mouseUp(a);
            return !this._mouseStarted
        },
        _mouseStop: function (a) {
            var b = this.options.onStop;
            b && b.call(this.element[0], a) !== !1 && this._clear();
            return !1
        },
        _createHelper: function () {
            return this.element
        },
        _cacheHelperProportions: function () {
            var a = this.helper.box;
            this.helperProportions = {
                width: a.width,
                height: a.height
            }
        },
        _cacheMargins: function () {
            this.margins = {
                left: parseInt(this.element.css("marginLeft"), 10) || 0,
                top: parseInt(this.element.css("marginTop"), 10) || 0
            }
        },
        _generatePosition: function (a) {
            if (a.pageX == null && a.clientX != null) {
                var b = document.documentElement,
                    d = document.body;
                a.pageX = a.clientX + (b && b.scrollLeft || d && d.scrollLeft || 0) - (b && b.clientLeft || d && d.clientLeft || 0);
                a.pageY = a.clientY + (b && b.scrollTop || d && d.scrollTop || 0) - (b && b.clientTop || d && d.clientTop || 0)
            }
            var b = a.pageX,
                d = a.pageY,
                e = this.options.containment;
            e && (a.pageX - this.offset.click.left < e[0] && (b = e[0] + this.offset.click.left), a.pageY - this.offset.click.top < e[1] && (d = e[1] + this.offset.click.top), a.pageX - this.offset.click.left > e[2] && (b = e[2] + this.offset.click.left), a.pageY - this.offset.click.top > e[3] && (d = e[3] + this.offset.click.top));
            return {
                top: d - this.offset.click.top - this.offset.parent.top,
                left: b - this.offset.click.left - this.offset.parent.left
            }
        },
        _mouseDrag: function (a) {
            this.position = this._generatePosition(a);
            var b = this.options.onDrag;
            if (b && b.call(this.element[0], a) === !1) return this._mouseUp(a), !1;
            this.helper[0].style.left = this.position.left + "px";
            this.helper[0].style.top = this.position.top + "px";
            return !1
        },
        _clear: function () {
            var a = this.helper[0];
            a != this.element[0] && !this.cancelHelperRemoval && a.parentNode.removeChild(a);
            this.helper = null;
            this.cancelHelperRemoval = !1
        },
        destroy: function () {
            if (this.element.hasClass("j-draggable")) return this.element.removeClass("j-draggable"), this.handle.css("cursor", ""), this._mouseDestroy(), this
        },
        _mouseDestroy: function () {
            lib.Event.un(this.element[0], "mousedown", this._mouseDownDelegate)
        }
    })
});
$reg("lib.kit.Dialog", function () {
    lib.kit.Dialog = function (a) {
        lib.eventTarget.call(this);
        this.options = Object.extend({
            autoOpen: !0,
            content: "",
            contentSelector: "",
            modal: !0,
            context: window
        }, a);
        this.options.contextDoc = this.options.context.document;
        this._create()
    };
    lib.kit.Dialog.inherits(lib.eventTarget);
    Object.extend(lib.kit.Dialog.prototype, {
        template: '<div style="display: none;width:${width}px;"class="j-dialog j-widget-content j-corner-all ${dialogClass}" tabindex="-1"><div class="j-dialog-titlebar j-widget-header j-corner-all j-helper-clearfix" unselectable="on"style="-moz-user-select: none;"><span class="j-dialog-title" unselectable="on" style="-moz-user-select: none;">${title}</span><a href="#" class="j-dialog-close j-corner-all" unselectable="on" style="-moz-user-select: none;"><span class="j-icon j-icon-closethick" unselectable="on" style="-moz-user-select: none;"></span></a></div><div class="j-dialog-content j-widget-content"></div><div class="j-dialog-buttonpane j-widget-content j-helper-clearfix"></div></div>',
        buttonTemplate: new lib.Template('<a href="#" class="inputBtn2" onclick="return false;">${text}</a>'),
        _create: function () {
            var a = this,
                b = a.options,
                d, e, f = b.content,
                g = b.contentSelector;
            $(b.contextDoc.body).append(d = a.uiDialog = $(lib.Element.create("div").html((new lib.Template(b.template || a.template)).evaluate(b))[0].firstChild).css("position", "absolute").css("zIndex", b.zIndex || 100).on("keydown", function (d) {
                b.closeOnEscape !== !1 && d.keyCode && d.keyCode === 27 && (a.close(d), lib.Event.preventDefault(d))
            }));
            e = a.content = d.down(".j-dialog-content");
            g ? e.append($(g)) : typeof f == "string" ? e.html(f) : e.append($(f));
            (e = d.down(".j-dialog-close")) && e.on("click", function (b) {
                a.close(b);
                return !1
            });
            a.uiDialogTitlebar = d.down(".j-dialog-titlebar");
            b.draggable !== !1 && lib.kit.Draggable && a._makeDraggable();
            b.buttons && a._createButtons(b.buttons);
            this.onResize();
            a._isOpen = !1;
            b.modal || lib.kit.BgIframe.create(d);
            this.options.autoOpen && this.open()
        },
        onResize: function (a) {
            var b = this,
                a = a || {};
            lib.Event.on(this.options.context || window, "resize", b.onResize = function () {
                b._setPos(a.pos)
            })
        },
        _createButtons: function (a) {
            var b = this,
                d = b.options,
                e = !1,
                f = b.uiDialog,
                g = f[0];
            b.uiDialogButtonPane = f.down(".j-dialog-buttonpane");
            typeof a === "object" && a !== null && lib.each(a, function () {
                return !(e = !0)
            });
            if (e)(f = b.uiDialogButtonPane.down("*")) && f.remove(), a.constructor == Object && (a = [a]), b.buttons = [], lib.each(a, function (a) {
                var e = $(lib.Element.create("div").html((d.buttonTemplate || b.buttonTemplate).evaluate(a))[0].firstChild).on("click", function (d) {
                    var e = a.fn;
                    e && e.constructor == Function && e.apply(g, arguments);
                    a.close && b.close(d)
                });
                b.buttons.push(e);
                b.uiDialogButtonPane.append(e)
            }), b._initButtonEvents()
        },
        open: function () {
            if (!this._isOpen) {
                var a = this.options,
                    b = this.uiDialog;
                this.overlay = a.modal ? lib.kit.Overlay.create({
                    context: a.context,
                    zIndex: a.coverzIndex
                }) : null;
                b.show();
                this._isOpen = !0;
                this._setPos(a.pos);
                (this.buttons || b)[0].focus();
                a.onOpen && a.onOpen.apply(b[0]);
                return this
            }
        },
        close: function (a) {
            if (this._isOpen) {
                var b = this.options,
                    d = b.onBeforeClose,
                    e = b.onClose,
                    f = this.uiDialog[0];
                if (!(d && !1 === d.call(f, a))) return this.overlay && lib.kit.Overlay.destroy(this.overlay), this._isOpen = !1, b.destroyOnClose !== !1 ? this.destroy() : this.uiDialog.hide(), e && e.call(f, a), this.release && this.release(), this
            }
        },
        setContent: function (a) {
            this.content.html(a)
        },
        _setPos: function (a) {
            if (this._isOpen) {
                var b, d = this.uiDialog,
                    e = d.box();
                if (a && a.top) b = a.top;
                else {
                    b = e.height == 0 ? 180 : e.height;
                    var f = lib.box.getViewportHeight(this.options.context),
                        g = lib.box.getPageScrollTop(this.options.context);
                    b = b < f - 30 ? (f - b) / 2 + g : g + 30
                }
                a && a.left ? a = a.left : (a = e.width == 0 ? 180 : e.width, a = (lib.box.getViewportWidth(this.options.context) - a) / 2);
                d.css("top", b + "px");
                d.css("left", a + "px");
                lib.kit.BgIframe.setBox(d);
                return this
            }
        },
        isOpen: function () {
            return this._isOpen
        },
        destroy: function () {
            this.overlay && lib.kit.Overlay.destroy(this.overlay);
            lib.Event.un(this.options.context || window, "resize", this.onResize);
            this.options.contextDoc.body.removeChild(this.uiDialog[0]);
            return this
        },
        _makeDraggable: function () {
            var a = this.options,
                b = this.uiDialog,
                d = b[0],
                e = a.onDragStart,
                f = a.onDrag,
                g = a.onDragStop;
            if (a = this.uiDialogTitlebar) this.draggable = new lib.kit.Draggable({
                element: b,
                handle: a,
                onStart: function (a) {
                    if (typeof e == "function") return e.call(d, a)
                },
                onDrag: function (a) {
                    if (typeof f == "function") return f.call(d, a)
                },
                onStop: function (a) {
                    lib.kit.Overlay.resize();
                    if (typeof g == "function") return g.call(d, a)
                }
            }), b.addClass("j-draggable")
        },
        widget: function () {
            return this.uiDialog
        },
        option: function (a, b) {
            var d = a,
                e = this;
            if (arguments.length === 0) return Object.extend({}, e.options);
            if (typeof a === "string") {
                if (b === void 0) return this.options[a];
                d = {};
                d[a] = b
            }
            lib.each(d, function (a, b) {
                e._setOption(b, a)
            });
            return e
        },
        _setOption: function (a, b) {
            var d = this.uiDialog;
            switch (a) {
            case "buttons":
                this._createButtons(b);
                break;
            case "dialogClass":
                d.removeClass(this.options.dialogClass).addClass(b);
                break;
            case "draggable":
                b ? this._makeDraggable() : this.draggable.destroy();
                break;
            case "position":
                a = "pos";
                this._setPos(b);
                break;
            case "title":
                $(".j-dialog-title", this.uiDialogTitlebar[0]).html("" + (b || "&#160;"))
            }
            this.options[a] = b
        },
        setPos: function (a, b) {
            this._setOption("position", {
                top: a,
                left: b
            })
        },
        release: null
    })
});
$reg("lib.kit.SimpleDialog", function () {
    lib.kit.SimpleDialog = function (a) {
        lib.kit.Dialog.call(this, Object.extend({
            delegates: ["ok", "no"]
        }, a))
    };
    lib.kit.SimpleDialog.inherits(lib.kit.Dialog);
    Object.extend(lib.kit.SimpleDialog.prototype, {
        _create: function () {
            var a = this.options;
            $(a.contextDoc.body).append(this.content = this.uiDialog = lib.Element.create("div").html(a.content).css("position", "absolute").css("zIndex", a.zIndex || "111"));
            this.onResize();
            this._addDelegates();
            a.autoOpen && this.open()
        },
        _setDelegates: function (a) {
            if (a == "") return this.options.delegates;
            this.options.delegates = a.match(/j\-delegate\=[\'|\"](.*?)[\'|\"]/gi).map(function (a) {
                return a.match(/[\'|\"](.*?)[\'|\"]/)[1]
            })
        },
        _addDelegates: function () {
            var a = 0,
                b = this.options.delegates,
                d = b.length;
            this.listDlg = [];
            for (var e = null; a < d; a++) e = this._cbdlg.bind(this, b[a]), this.listDlg.push(e), $(this.uiDialog).delegate(b[a], e)
        },
        _removeDelegates: function () {
            if (this.listDlg) {
                for (var a = 0, b = this.options.delegates, d = b.length, e = null; a < d; a++) e = this.listDlg[a], $(this.uiDialog).undelegate(b[a], e);
                delete this.listDlg
            }
        },
        _cbdlg: function (a, b) {
            this.fire({
                type: a,
                event: b.event
            })
        },
        show: function (a) {
            this.setContent(a);
            this.open()
        },
        release: function () {
            this._removeDelegates()
        }
    })
});
$reg("lib.kit.Overlay", function () {
    lib.kit.Overlay = {
        options: null,
        instances: [],
        oldInstances: [],
        create: function (a) {
            this.options = a = Object.extend({
                color: "#666666",
                opacity: 50,
                context: window
            }, a || {});
            var b = a.context.document;
            if (this.instances.length === 0) lib.Event.on(a.context, "resize", this.resize);
            var d = a.opacity,
                a = (this.oldInstances.pop() || lib.Element.create("div", null, a.context).css("position", "fixed").css("top", "0px").css("left", "0px")).css("width", this._getWidth()).css("height", this._getHeight()).css("backgroundColor", a.color).css("filter", "alpha(opacity=" + d + ")").css("opacity", d / 100).css("zIndex", a.zIndex || 10);
            lib.IE6 && a.css("position", "absolute");
            $(b.body).append(a);
            lib.kit.BgIframe.create(a);
            this.instances.push(a);
            return a
        },
        resize: function () {
            var a = lib.kit.Overlay;
            lib.each(a.instances, function (b) {
                b.css("width", 0).css("height", 0).css("width", a._getWidth()).css("height", a._getHeight());
                lib.kit.BgIframe.setBox(b)
            })
        },
        _getWidth: function () {
            var a = this.options.context.document,
                b;
            if (lib.IE6) return b = Math.max(a.documentElement.scrollWidth, a.body.scrollWidth), a = Math.max(a.documentElement.offsetWidth, a.body.offsetWidth), b < a ? lib.box.getViewportWidth(this.options.context) + "px" : b + "px";
            else {
                if (lib.IE7 || lib.IE8) return Math.max(a.documentElement.clientWidth, a.body.scrollWidth, a.documentElement.scrollWidth, a.body.offsetWidth) - 1 + "px";
                return Math.max(a.documentElement.clientWidth, a.body.scrollWidth, a.documentElement.scrollWidth, a.body.offsetWidth, a.documentElement.offsetWidth) + "px"
            }
        },
        _getHeight: function () {
            var a = this.options.context.document,
                b;
            return lib.IE6 ? (b = Math.max(a.documentElement.scrollHeight, a.body.scrollHeight), a = Math.max(a.documentElement.offsetHeight, a.body.offsetHeight), b < a ? lib.box.getViewportHeight(this.options.context) + "px" : b + "px") : lib.box.getDocumentHeight(this.options.context) + "px"
        },
        destroy: function (a) {
            var b = this.options.context;
            this.oldInstances.push(this.instances.splice(this.instances.index(a), 1)[0]);
            this.instances.length === 0 && lib.Event.un(b, "resize", this.resize);
            a = a[0];
            (b = a.parentNode) && b.removeChild(a)
        }
    }
});
$reg("lib.kit.BgIframe", function () {
    lib.kit.BgIframe = {
        create: function (a) {
            if (!lib.WEBKIT && (lib.IE6 || lib.Maxthon)) a = $(a), a.down("iframe.bgiframe") || this.setBox(a.append(lib.Element.create('<iframe class="bgiframe"frameborder="0" tabindex="-1"src="javascript:false;"style="display:block;position:absolute;z-index:-1;filter:Alpha(Opacity=\'0\');top:0px;left:0px;"/>')))
        },
        setBox: function (a) {
            var a = $(a),
                b = a.down("iframe.bgiframe");
            if (b) {
                var d = a.box();
                lib.each(["width", "height"], function (a) {
                    b.css(a, d[a] + "px")
                })
            }
        }
    }
});
$reg("lib.kit.UnderFrame", function () {
    lib.kit.UnderFrame = {
        _frames: {},
        show: function (a, b) {
            var d = lib.$("#" + a);
            if (d && (b = b || {}, !lib.ipad)) {
                this._frames[a] || (this._frames[a] = lib.Element.create("iframe"), this._frames[a].attr("src", "about:blank"), this._frames[a].attr("frameBorder", "0"), this._frames[a].hide(), lib.$(document.body).append(this._frames[a]));
                var e = d.box();
                this._frames[a].css("position", "absolute");
                this._frames[a].css("zIndex", (b.zIndex || d.css("zIndex") - 1).toString());
                this._frames[a].css("top", (b.top || e.top) + "px");
                this._frames[a].css("left", (b.left || e.left) + "px");
                this._frames[a].css("width", (b.width || e.width) + "px");
                this._frames[a].css("height", (b.height || e.height) + "px");
                this._frames[a].show()
            }
        },
        hide: function (a) {
            lib.$("#" + a) && this._frames[a] && this._frames[a].hide()
        }
    }
});
(function () {
    var a = !1,
        b = null,
        d, e, f, g, h, i, j;
    lib.component.HeaderPopup = {
        init: function () {
            var a = this;
            (new lib.kit.Monitor(function () {
                d = lib.$("#j-username");
                e = lib.$("#j-user-popup");
                f = lib.$("#j-header");
                if (!d || !e || !f) return !1;
                d.on("click", a._clickHandler.bind(a));
                lib.ipad || (d.on("mouseover", a._userOver.bind(a)), d.on("mouseout", a._userOut.bind(a)), e.on("mouseover", a._popupOver.bind(a)), e.on("mouseout", a._popupOut.bind(a)))
            }, {
                time: 100
            })).start()
        },
        destroy: function () {
            d && (d.un("click", this._clickHandler.bind(this)), d.un("mouseover", this._userOver.bind(this)), d.un("mouseout", this._userOut.bind(this)), e.un("mouseover", this._popupOver.bind(this)), e.un("mouseout", this._popupOut.bind(this)))
        },
        _show: function () {
            g = d.box();
            h = f.box();
            i = h.top + h.height;
            j = g.left + g.width;
            e.show();
            e.css("top", i + "px");
            e.css("left", j - e.box().width + 21 + "px");
            lib.kit.UnderFrame.show("j-user-popup")
        },
        _hide: function () {
            e.hide();
            lib.kit.UnderFrame.hide("j-user-popup")
        },
        _clickHandler: function (b) {
            lib.Event.preventDefault(b);
            lib.ipad && (a ? (this._hide(), a = !1, lib.action.ipadPlayer && lib.action.ipadPlayer.showVideo()) : (this._show(), a = !0, lib.action.ipadPlayer && lib.action.ipadPlayer.hideVideo()))
        },
        _userOver: function () {
            b !== null && clearTimeout(b);
            a !== !0 && (this._show(), a = !0)
        },
        _userOut: function () {
            var d = this;
            a === !0 && (b = setTimeout(function () {
                d._hide();
                a = !1
            }, 100))
        },
        _popupOver: function () {
            b !== null && clearTimeout(b)
        },
        _popupOut: function () {
            var d = this;
            a === !0 && (b = setTimeout(function () {
                d._hide();
                a = !1
            }, 100))
        }
    }
})(window);
lib.model.userState = lib.model({
    crossDomain: !0,
    actions: {
        get: {
            method: "get",
            params: ["cid", "platform"],
            format: "json",
            encode: !0,
            passport: !0,
            url: "qv.action"
        }
    },
    url: "http://serv.vip." + lib.SITE_DOMAIN + "/services/"
});
$reg("lib.action.UserState", function () {
    lib.action.UserState = Class.create({
        initialize: function () {},
        isVip: function (a) {
            var b = window.qiyueChannelId,
                d = "11",
                d = lib.realIpad ? "21" : lib.iphone ? "31" : "11";
            lib.model.userState.get(b ? {
                cid: b,
                platform: d
            } : void 0, {
                success: function (b) {
                    a.success && a.success(b)
                },
                failure: function (b) {
                    a.failure && a.failure(b)
                }
            })
        }
    })
});
(function () {
    var a = document.getElementById("j-login-wrapper");
    if (a) {
        $reg("lib.tpl", function () {});
        lib.tpl.menu = ['<div class="head_popup" id="j-user-popup" style="width:92px;display:none;z-index:999;"><ul class="head_ul qitan_UL">', '<li id="j-iqiyi"><a href="http://i.' + lib.SITE_DOMAIN + '" target="_blank">\u6211\u7684\u5947\u827a</a></li>', '<li class="qitan_msg" id="j-notice" style="display:none;"></li><li class="" id="j-qtsns"><a href="http://t.qiyi.com/" target="_blank" j-delegate="startwatcher">\u5947\u8c08\u793e\u533a</a></li><li class="qitan_msg" id="j-qtmsg-wrapper" style="display:none;"></li><li><a href="http://i.iqiyi.com/dingyue?navi" target="_blank">\u6211\u7684\u8ba2\u9605</a></li>', '<li id="j-member"><a href="http://serv.vip.' + lib.SITE_DOMAIN + '/order/guide.action?pid=a0226bd958843452&cid=afbe8fd3d73448c9&platform=b6c13e26323c537d&fc=a988b1d4503873af">\u5f00\u901a\u4f1a\u5458</a></li>', '<li><a href="http://i.' + lib.SITE_DOMAIN + '/shezhi" target="_blank">\u5e10\u53f7\u8bbe\u7f6e</a></li>', '<li class="liLast"><a j-delegate="logout" href="http://passport.' + lib.SITE_DOMAIN + '/user/logout.php">\u5b89\u5168\u9000\u51fa</a></li>', '</ul><span class="arraw"></span></div>'].join("");
        lib._PAGE_EVENT.on("checkvip", function () {
            if (lib.component.login.vipInfo) {
                var a = lib.$("#j-member a");
                a && lib.$(a[0]).html("\u7eed\u8d39\u4f1a\u5458")
            }
        });
        $reg("lib.component", function () {});
        $reg("lib.__callbacks__", function () {});
        lib.component.login = {};
        var b = null;
        Object.extend(lib.component.login, {
            renderTopbar: function () {
                var d = this.getUserInfo(),
                    e = "";
                if (this.isLogin()) {
                    if (!lib.$("#j-username")) e = d.nickname || "", e = e == "" ? d.uid || "" : e.getLen() > 8 ? e.trancate(8, "") + ".." : e, a.innerHTML = '<a href="http://vip.qiyi.com" target="_blank" onfocus="this.blur();"><img id="j-usericon" style="display:inline;margin-top:-2px;*margin-top:0;" src="http://www.qiyipic.com/common/fix/qiyue_images/userInfo.png"/></a><a id="j-username" class="head_more" href="#"><span>' + e + "</span></a>&nbsp;", b = document.getElementById("j-usericon"), b.title = "\u60a8\u8fd8\u6ca1\u6709\u5f00\u901a\u5947\u827a\u4f1a\u5458\uff0c\u7acb\u5373\u5f00\u901a\u4eab\u53d7\u4f1a\u5458\u5c0a\u8d35\u7279\u6743\u3002", this._createMenuHTML(d), this._checkVip()
                } else document.getElementById("j-username") && ($("#j-username").un("mouseover", this.createHTML), lib.component.HeaderPopup.destroy()), a.innerHTML = '<a href="http://passport.' + lib.SITE_DOMAIN + "/register/reg.php?url=" + (lib.PROJECT_REG_URL || "") + '" target="_blank">\u6ce8\u518c</a> | <a j-delegate="login" href="http://passport.' + lib.SITE_DOMAIN + '/user/login.php">\u767b\u5f55</a> |', a.className = "color55"
            },
            _createMenuHTML: function (a) {
                if (!document.getElementById("j-user-popup")) {
                    var b = new lib.Template(lib.tpl.menu);
                    $(document.body).html("beforeend", b.evaluate({
                        uid: a.uid
                    }));
                    lib.component.HeaderPopup.init()
                }
            },
            removeUserMenu: function () {
                var a = $("#j-user-popup");
                a && a.remove()
            },
            _checkVip: function () {
                if (lib.action && lib.action.UserState) {
                    var a = this;
                    (new lib.action.UserState).isVip({
                        success: function (e) {
                            (a.vipCB ||
                            function () {}).call(this, e);
                            b.src = "http://www.qiyipic.com/common/fix/qiyue_images/huiyuanInfo.png";
                            b.title = e.type == "prepay" ? "\u60a8\u5df2\u662f\u5947\u827a\u4f1a\u5458(\u6709\u6548\u671f\u81f3" + e.deadline + ")" : "\u60a8\u5df2\u662f\u5947\u827a\u4f1a\u5458(\u624b\u673a\u5305\u6708\u4f1a\u5458)";
                            a.vipInfo = e;
                            a.isExpire = !1;
                            lib._PAGE_EVENT.fire({
                                type: "checkvip"
                            })
                        },
                        failure: function (e) {
                            (a.notVipCB ||
                            function () {}).call(this);
                            e.code == "Q00324" ? (a.isExpire = !0, a.vipInfo = e.data, b.src = "http://www.qiyipic.com/common/fix/qiyue_images/huiyuanOverdueInfo.png", b.title = "\u60a8\u7684\u5947\u827a\u4f1a\u5458\u5df2\u8fc7\u671f\uff0c\u65e0\u6cd5\u7ee7\u7eed\u4eab\u53d7\u4f1a\u5458\u7684\u7279\u6743\u3002") : a.vipInfo = !1;
                            lib._PAGE_EVENT.fire({
                                type: "checkvip"
                            })
                        }
                    })
                }
            }
        })
    }
})(window);
lib.reg("lib.model", function () {});
lib.Class("Model", {
    ns: lib.model,
    properties: {
        _data: {}
    },
    construct: function () {
        this._data = {}
    },
    methods: {
        init: lib.emptyMethod,
        get: function () {
            return this._data
        },
        set: function (a) {
            return Object.extend(this._data, a)
        }
    }
});
lib.reg("lib.view", function () {});
lib.Class("View", {
    ns: lib.view,
    methods: {
        init: lib.abstractMethod,
        update: lib.abstractMethod
    }
});
(function () {
    lib.Class("Adapter", {
        ns: lib.action,
        construct: function (a, b) {
            if (a instanceof lib.model.Model) this._model = a, this._model.init(this);
            if (b instanceof lib.view.View) this._view = b, this._view.init(this)
        },
        methods: {
            syncGet: function (a) {
                if (this._model) var b = this._model.get(a);
                this._view && this._view.update(b)
            },
            asyncGet: function (a) {
                if (!this._model) return !1;
                var b = this;
                this._model.get(a, function (a) {
                    b._view && b._view.update(a)
                })
            },
            syncSet: function (a) {
                if (this._model) var b = this._model.set(a);
                this._view && this._view.update(b)
            },
            asyncSet: function (a) {
                if (!this._model) return !1;
                var b = this;
                this._model.set(a, function (a) {
                    b._view && b._view.update(a)
                })
            }
        }
    })
})();
(function () {
	//TODO:
    lib.Class("WmodeSp", {
        ns: lib.kit,
        extend: lib.action.Adapter,
        construct: function () {
            this.videostatus = "visible"
        },
        methods: {
            show: function () {
                if (!lib.ipad && !lib.IE && this.check()) this.videostatus = "hidden", this.videoplayer.css("visibility", "hidden")
            },
            hide: function () {
                !lib.ipad && !lib.IE && this.videostatus == "hidden" && this.videoplayer && this.videoplayer.css("visibility", "visible")
            },
            check: function () {
                if (this.videoplayer = lib.$("#flash")) {
                    var a = navigator.appVersion.toLowerCase().indexOf("win") != -1 ? !0 : !1,
                        b = "";
                    lib.IE && a && !lib.OPERA ? this.videoplayer[0].wmode && (b = this.videoplayer[0].wmode.toLocaleLowerCase() == "direct" || this.videoplayer[0].wmode.toLocaleLowerCase() == "window") : this.videoplayer.attr("wmode") && (b = this.videoplayer.attr("wmode").toLocaleLowerCase() == "direct" || this.videoplayer.attr("wmode").toLocaleLowerCase() == "window");
                    return this.videoplayer && b ? !0 : !1
                } else return !1
            }
        }
    });
    lib._PLAYER_WMODE_SP = new lib.kit.WmodeSp
})();
(function (a) {
    a.kit = a.kit || {};
    kit.dialog = function (a) {
        lib.eventTarget.call(this);
        this._option = {
            model: !0,
            delegates: ["ok", "no"]
        };
        this.setOption(a)
    };
    kit.dialog.inherits(lib.eventTarget);
    Object.extend(kit.dialog.prototype, {
        show: function (a) {
            lib.ipad || lib._PLAYER_WMODE_SP && lib._PLAYER_WMODE_SP.show();
            if (this._option.model && !this._cover) this._cover = lib.kit.Overlay.create({
                color: "#000",
                zIndex: 400
            });
            this.box || (a.html ? this.renderHTML(a.html) : (a.src && this.renderIfr(a), this.fire({
                type: "show"
            })))
        },
        setOption: function (a) {
            Object.extend(this._option, a || {})
        },
        renderHTML: function (a) {
            var d = this._tempId = "j-" + (new Date).getTime();
            $(document.body).html("beforeend", "<div id=" + d + ">" + a + "</div>");
            this.box = $("#" + d)[0].firstChild;
            this._addDelegates()
        },
        _addDelegates: function () {
            var a = 0,
                d = this._option.delegates,
                e = d.length;
            this.listDlg = [];
            for (var f = null; a < e; a++) f = this._cbdlg.bind(this, d[a]), this.listDlg.push(f), $(this.box).delegate(d[a], f)
        },
        _removeDelegates: function () {
            if (this.listDlg) {
                for (var a = 0, d = this._option.delegates, e = d.length, f = null; a < e; a++) f = this.listDlg[a], $(this.box).undelegate(d[a], f);
                this.listDlg = null
            }
        },
        _cbdlg: function (a) {
            this.fire({
                type: a
            })
        },
        setCenter: function () {
            lib.ui.viewCenter(this.box)
        },
        renderIfr: function (b) {
            var d = {
                src: "about:blank",
                width: 520,
                height: 365
            },
                e = document.getElementById("j-dialog"),
                f = this._tempId = "j-" + (new Date).getTime();
            $(document.body).html("beforeend", "<div id=" + f + "></div>");
            Object.extend(d, b);
            e ? (e.width = d.width, e.height = d.height, e.src = d.src) : ($(document.body).html("beforeend", '<iframe allowtransparency="true" id="j-dialog" src="' + d.src + '" frameborder="0" scrolling="no" width="' + d.width + '" height="' + d.height + '" style="z-index:9999;"></iframe>'), e = document.getElementById("j-dialog"));
            this.box = e;
            lib.ui.viewCenter(this.box);
            this.__setCenter = this.setCenter.bind(this);
            var g = this;
            (lib.IE6 || lib.IE7) && lib._PAGE_EVENT && lib._PAGE_EVENT.on("rerender", function () {
                if (lib.$("#j-dialog") && g._cover) lib.$("#j-dialog")[0].style.display = "block", lib.$("#j-dialog")[0].style.display = ""
            });
            $(a).on("resize", this.__setCenter);
            if (lib.IE6) $(a).on("scroll", this.__setCenter)
        },
        hide: function () {
            this.box.hide();
            this._cover && lib.kit.Overlay.destroy(this._cover);
            this._cover = null
        },
        close: function () {
            lib.ipad || lib._PLAYER_WMODE_SP && lib._PLAYER_WMODE_SP.hide();
            lib._PAGE_EVENT && lib._PAGE_EVENT.fire({
                type: "loginclose"
            });
            var b = document.getElementById("" + this._tempId);
            if (b) this._cover && lib.kit.Overlay.destroy(this._cover), $(this.box).remove(), this._removeDelegates(), this.fire({
                type: "close"
            }), this._cover = this.box = null, b && $(b).remove(), this.__setCenter && $(a).un("resize", this.__setCenter), lib.IE6 && $(a).un("scroll", this.__setCenter)
        }
    })
})(window);
(function (a, b) {
    $reg("lib.component", function () {});
    $reg("lib.__callbacks__", function () {});
    var d = lib.component.login = lib.component.login || {};
    Object.extend(lib.component.login, {
        _loginList: [],
        _logoutList: [],
        dialog: null,
        show: function (a, d) {
            var g = {
                showClose: !0,
                regUrl: ""
            };
            Object.extend(g, d || {});
            var h = "",
                h = "",
                h = function () {};
            h.isTemp = !0;
            a = a || h;
            if (this.isLogin()) a();
            else {
                try {
                    this.isExpire = this.vipInfo = b
                } catch (i) {}
                this.clearTempCb();
                this.setCallback("login", a);
                h = g.regUrl || lib.PROJECT_REG_URL;
                this.dialog.show({
                    src: g.loginUrl || "http://passport." + lib.SITE_DOMAIN + "/user/loginiframe.php" + (h ? "?url=" + h + "&showclose=" : "?showclose=") + g.showClose
                })
            }
        },
        showOnce: function (a, b) {
            a.isTemp = !0;
            this.show(a, b)
        },
        isLogin: function () {
            return lib.net.isLogin()
        },
        getUserInfo: function () {
            return lib.net.getUserInfo()
        },
        setCallback: function (a, b) {
            a == "login" ? this._loginList.indexOf(b) == -1 && this._loginList.push(b) : this._logoutList.push(b)
        },
        runCallbacks: function (a, b) {
            var d = this.getUserInfo();
            if ({
                login: !0,
                logout: !0
            }[a]) {
                for (var h = this["_" + a + "List"].length, i = null, j = 0; j < h; j++) {
                    i = this["_" + a + "List"][j];
                    try {
                        i(d, b)
                    } catch (k) {}
                }
                this.clearTempCb()
            }
        },
        logout: function () {
            $(document.body).html("beforeend", '<iframe id="j_logout_" src="http://passport.' + lib.SITE_DOMAIN + '/user/logout.php?noredirect=1&logoutcb=lib.__callbacks__.logout_callback" style="display:none;"></iframe>')
        },
        _dlgLogout: function (a) {
            try {
                this.isExpire = this.vipInfo = b
            } catch (d) {}
            lib.Event.preventDefault(a.event);
            lib.PROJECT_LOGOUT_ACTION ? lib.go(lib.PROJECT_LOGOUT_ACTION) : this.logout()
        },
        _dlgLogin: function (a) {
            lib.Event.preventDefault(a.event);
            a = a.target;
            this.isLogin() ? this.runCallbacks("login") : lib.component.login.show(null, {
                regUrl: a.getAttribute("data-regurl") || ""
            })
        },
        clearTempCb: function () {
            for (var a = this._loginList.length, b = null, d = 0; d < a; d++) b = this._loginList[d], b.isTemp && b.isTemp === !0 && this._loginList.splice(d, 1)
        },
        init: function () {
            this.dialog = new kit.dialog;
            lib.PROJECT_LOGIN_COMPONENT = lib.component.login;
            this.renderTopbar && this.renderTopbar();
            $(document).delegate("login", this._dlgLogin.bind(this));
            $(document).delegate("logout", this._dlgLogout.bind(this))
        }
    });
    d.init();
    d.setCallback("login", function () {
        d.dialog.close();
        lib.PROJECT_LOGIN_RELOAD ? lib.go(location.href) : (d.renderTopbar && d.renderTopbar(), lib._PAGE_EVENT.fire({
            type: "login"
        }))
    });
    d.setCallback("logout", function () {
        d.renderTopbar && d.renderTopbar();
        lib.PROJECT_LOGOUT_RELOAD ? lib.go(location.href) : (lib.kit.UnderFrame.hide("j-user-popup"), setTimeout(function () {
            $("#j_logout_") && $("#j_logout_").remove();
            d.removeUserMenu && d.removeUserMenu()
        }, 100), lib._PAGE_EVENT.fire({
            type: "logout"
        }))
    });
    lib.__callbacks__.login_success = function (a) {
        var b = null;
        if (a.relogin) {
            $(document.body).html("beforeend", '<iframe id="j_reLogin_" style="display:none;"></iframe>');
            var b = $("#j_reLogin_"),
                g = setTimeout(function () {
                    try {
                        lib.kit.slog.log({
                            flag: "rl"
                        })
                    } catch (g) {}
                    d.runCallbacks("login", a);
                    try {
                        b.remove()
                    } catch (i) {}
                }, 5E3);
            b && (b.on("load", function () {
                g && clearTimeout(g);
                d.runCallbacks("login", a);
                setTimeout(function () {
                    try {
                        b.remove()
                    } catch (a) {}
                }, 0)
            }), b.attr("src", a.relogin))
        } else d.runCallbacks("login", a)
    };
    lib.__callbacks__.login_error = function () {};
    lib.__callbacks__.logout_callback = function () {
        d.runCallbacks("logout")
    }
})(window);
$reg("lib.ui.Anim", function () {
    var a = {
        Linear: function (a, d, e, f) {
            return e * a / f + d
        },
        Quad: {
            easeIn: function (a, d, e, f) {
                return e * (a /= f) * a + d
            },
            easeOut: function (a, d, e, f) {
                return -e * (a /= f) * (a - 2) + d
            },
            easeInOut: function (a, d, e, f) {
                if ((a /= f / 2) < 1) return e / 2 * a * a + d;
                return -e / 2 * (--a * (a - 2) - 1) + d
            }
        },
        Cubic: {
            easeIn: function (a, d, e, f) {
                return e * (a /= f) * a * a + d
            },
            easeOut: function (a, d, e, f) {
                return e * ((a = a / f - 1) * a * a + 1) + d
            },
            easeInOut: function (a, d, e, f) {
                if ((a /= f / 2) < 1) return e / 2 * a * a * a + d;
                return e / 2 * ((a -= 2) * a * a + 2) + d
            }
        },
        Quart: {
            easeIn: function (a, d, e, f) {
                return e * (a /= f) * a * a * a + d
            },
            easeOut: function (a, d, e, f) {
                return -e * ((a = a / f - 1) * a * a * a - 1) + d
            },
            easeInOut: function (a, d, e, f) {
                if ((a /= f / 2) < 1) return e / 2 * a * a * a * a + d;
                return -e / 2 * ((a -= 2) * a * a * a - 2) + d
            }
        },
        Quint: {
            easeIn: function (a, d, e, f) {
                return e * (a /= f) * a * a * a * a + d
            },
            easeOut: function (a, d, e, f) {
                return e * ((a = a / f - 1) * a * a * a * a + 1) + d
            },
            easeInOut: function (a, d, e, f) {
                if ((a /= f / 2) < 1) return e / 2 * a * a * a * a * a + d;
                return e / 2 * ((a -= 2) * a * a * a * a + 2) + d
            }
        },
        Sine: {
            easeIn: function (a, d, e, f) {
                return -e * Math.cos(a / f * (Math.PI / 2)) + e + d
            },
            easeOut: function (a, d, e, f) {
                return e * Math.sin(a / f * (Math.PI / 2)) + d
            },
            easeInOut: function (a, d, e, f) {
                return -e / 2 * (Math.cos(Math.PI * a / f) - 1) + d
            }
        },
        Expo: {
            easeIn: function (a, d, e, f) {
                return a == 0 ? d : e * Math.pow(2, 10 * (a / f - 1)) + d
            },
            easeOut: function (a, d, e, f) {
                return a == f ? d + e : e * (-Math.pow(2, -10 * a / f) + 1) + d
            },
            easeInOut: function (a, d, e, f) {
                if (a == 0) return d;
                if (a == f) return d + e;
                if ((a /= f / 2) < 1) return e / 2 * Math.pow(2, 10 * (a - 1)) + d;
                return e / 2 * (-Math.pow(2, -10 * --a) + 2) + d
            }
        },
        Circ: {
            easeIn: function (a, d, e, f) {
                return -e * (Math.sqrt(1 - (a /= f) * a) - 1) + d
            },
            easeOut: function (a, d, e, f) {
                return e * Math.sqrt(1 - (a = a / f - 1) * a) + d
            },
            easeInOut: function (a, d, e, f) {
                if ((a /= f / 2) < 1) return -e / 2 * (Math.sqrt(1 - a * a) - 1) + d;
                return e / 2 * (Math.sqrt(1 - (a -= 2) * a) + 1) + d
            }
        },
        Elastic: {
            easeIn: function (a, d, e, f, g, h) {
                if (a == 0) return d;
                if ((a /= f) == 1) return d + e;
                h || (h = f * 0.3);
                !g || g < Math.abs(e) ? (g = e, e = h / 4) : e = h / (2 * Math.PI) * Math.asin(e / g);
                return -(g * Math.pow(2, 10 * (a -= 1)) * Math.sin((a * f - e) * 2 * Math.PI / h)) + d
            },
            easeOut: function (a, d, e, f, g, h) {
                if (a == 0) return d;
                if ((a /= f) == 1) return d + e;
                h || (h = f * 0.3);
                if (!g || g < Math.abs(e)) var g = e,
                    i = h / 4;
                else i = h / (2 * Math.PI) * Math.asin(e / g);
                return g * Math.pow(2, -10 * a) * Math.sin((a * f - i) * 2 * Math.PI / h) + e + d
            },
            easeInOut: function (a, d, e, f, g, h) {
                if (a == 0) return d;
                if ((a /= f / 2) == 2) return d + e;
                h || (h = f * 0.3 * 1.5);
                if (!g || g < Math.abs(e)) var g = e,
                    i = h / 4;
                else i = h / (2 * Math.PI) * Math.asin(e / g);
                if (a < 1) return -0.5 * g * Math.pow(2, 10 * (a -= 1)) * Math.sin((a * f - i) * 2 * Math.PI / h) + d;
                return g * Math.pow(2, -10 * (a -= 1)) * Math.sin((a * f - i) * 2 * Math.PI / h) * 0.5 + e + d
            }
        },
        Back: {
            easeIn: function (a, d, e, f, g) {
                g == void 0 && (g = 1.70158);
                return e * (a /= f) * a * ((g + 1) * a - g) + d
            },
            easeOut: function (a, d, e, f, g) {
                g == void 0 && (g = 1.70158);
                return e * ((a = a / f - 1) * a * ((g + 1) * a + g) + 1) + d
            },
            easeInOut: function (a, d, e, f, g) {
                g == void 0 && (g = 1.70158);
                if ((a /= f / 2) < 1) return e / 2 * a * a * (((g *= 1.525) + 1) * a - g) + d;
                return e / 2 * ((a -= 2) * a * (((g *= 1.525) + 1) * a + g) + 2) + d
            }
        },
        Bounce: {
            easeIn: function (b, d, e, f) {
                return e - a.Bounce.easeOut(f - b, 0, e, f) + d
            },
            easeOut: function (a, d, e, f) {
                return (a /= f) < 1 / 2.75 ? e * 7.5625 * a * a + d : a < 2 / 2.75 ? e * (7.5625 * (a -= 1.5 / 2.75) * a + 0.75) + d : a < 2.5 / 2.75 ? e * (7.5625 * (a -= 2.25 / 2.75) * a + 0.9375) + d : e * (7.5625 * (a -= 2.625 / 2.75) * a + 0.984375) + d
            },
            easeInOut: function (b, d, e, f) {
                return b < f / 2 ? a.Bounce.easeIn(b * 2, 0, e, f) * 0.5 + d : a.Bounce.easeOut(b * 2 - f, 0, e, f) * 0.5 + e * 0.5 + d
            }
        }
    };
    lib.ui._anim = Class.create({
        initialize: function (a) {
            this.opt = Object.extend({
                duration: 1E3,
                onStart: function () {},
                onDone: function () {},
                onCompute: function () {},
                interval: 10,
                ease: "",
                el: null
            }, a || {});
            this.ease();
            this.counter = 0;
            this.el = this.opt.el ? $(this.opt.el) : null;
            this.info = {}
        },
        getAnim: function (a, d, e) {
            for (var f = [], g = 0; g < a; g++) f.push(this.tweenFunc(g, d, e, a));
            return f
        },
        getAnimInfo: function () {
            this.interval = this.opt.duration / this.opt.interval;
            for (var a in this.info) {
                if (this.info[a].from == void 0) this.info[a].from = this.getDefaultFrom(this.el, a);
                this.info[a].unit = a == "opacity" ? "" : "px";
                this.info[a].animArray = this.getAnim(this.interval, this.info[a].from, this.info[a].to - this.info[a].from)
            }
        },
        getDefaultFrom: function (a, d) {
            if (d == "scroll") return lib.box.getPageScrollTop();
            return parseInt(a.css(d)) || 0
        },
        onCompute: function () {
            for (var a in this.info) a == "scroll" ? window.scrollTo(0, this.info[a].animArray[this.counter]) : this.el.css(a, this.info[a].animArray[this.counter] + this.info[a].unit);
            this.counter++
        },
        compute: function () {
            this.counter >= this.interval ? (clearTimeout(this.iTimer), this.done(), this.counter = 0) : (this.onCompute(), this.iTimer = setTimeout(function () {
                this.compute()
            }.bind(this), this.opt.interval))
        },
        ease: function (b) {
            if (!b) return this.tweenFunc = a.Linear, this;
            b = b.split(".");
            this.tweenFunc = b.length != 2 ? a.Linear : a[b[0]][b[1]];
            return this
        },
		// TODO:
        duration: function (a) {
            this.opt.duration = a;
            return this
        },
        delay: function (a) {
            this.opt.interval = a;
            return this
        },
        done: function () {
            for (var a in this.info) a == "scroll" ? window.scrollTo(0, this.info[a].to) : this.el.css(a, this.info[a].to + this.info[a].unit);
            if (this.opt.onDone) this.opt.onDone();
            this.info = {}
        },
        from: function (a, d) {
            this.info[a] || (this.info[a] = {});
            this.info[a].from = d;
            return this
        },
        to: function (a, d) {
            this.info[a] || (this.info[a] = {});
            this.info[a].to = d;
            return this
        },
        scrollTo: function (a) {
            this.info.scroll || (this.info.scroll = {});
            this.info.scroll.to = a;
            return this
        },
        go: function () {
            this.getAnimInfo();
            this.inAnim = !0;
            this.iTimer && clearTimeout(this.iTimer);
            this.compute();
            return this
        },
        stop: function () {
            this.pause();
            this.counter = 0
        },
        pause: function () {
            this.inAnim && clearTimeout(this.iTimer);
            this.getAnimInfo()
        },
        resume: function () {
            this.compute()
        },
        onDone: function (a) {
            this.opt.onDone = a;
            return this
        }
    });
    lib.ui.Anim = function (a) {
        return new lib.ui._anim({
            el: a
        })
    }
});
$reg("kit.tips", function () {
    var a = {
        panelTpl: '<table cellspacing="0" cellpadding="0" class="conformPop"><tbody><tr><td style="height: 4px; overflow: hidden; font-size: 4px; line-height: 4px;" class="conformPop_Bg" colspan="3"></td></tr><tr><td style="width: 4px; overflow: hidden;" class="conformPop_Bg"></td><td><div class="conformPop_con" id="j-tips-cnt"><p class="j-tip-content">${content}</p><p class="j-tip-foot">${foot}</p></div></td><td style="width: 4px; overflow: hidden;" class="conformPop_Bg"></td></tr><tr><td style="height: 4px; overflow: hidden; font-size: 4px; line-height: 4px;" class="conformPop_Bg" colspan="3"></td></tr></tbody></table>',
        buttonTag: "a",
        buttonTpl: '<a class="btnBg btn3" data-close="${close}" data-key="${key}" href="javascript:void(0)">${name}</a>'
    },
        b = {
            ASK: '<img style="vertical-align: middle;" src="http://www.qiyipic.com/common/fix/hudong2_images/img3.jpg">&nbsp;',
            WARNING: '<img style="vertical-align: middle;" src="' + (lib.TIPS_ICON_CONFIRM || "http://www.qiyipic.com/common/fix/hudong2_images/img2.jpg") + '">&nbsp;',
            DELETE: '<img style="vertical-align: middle;" src="http://www.qiyipic.com/common/fix/hudong2_images/img4.jpg">&nbsp;',
            SUCCESS: '<img style="vertica<img style="vertical-align: middle;" src="' + (lib.TIPS_ICON_NOTICE || "http://www.qiyipic.com/common/fix/hudong2_images/img1.jpg") + '">&nbsp;'
        };
    kit.tips = Class.create({
        initialize: function (d) {
            this.event = {};
            this.opt = Object.extend({
                parent: "",
                buttons: [],
                content: "",
                buttonTpl: a.buttonTpl,
                panelTpl: a.panelTpl,
                icon: "ASK",
                isMiddle: !1
            }, d);
            this._iconClass = b[this.opt.icon] || "";
            this.initElement();
            this.initEvent();
            this.setContent(this.opt.content);
            this.setButtons(this.opt.buttons);
            this.setPos(this.opt.pos)
        },
        on: function (a, b) {
            this.event[a] || (this.event[a] = []);
            this.event[a].push(b)
        },
        fire: function (a, b) {
            lib.log([a, b]);
            var f = this.event[a],
                g = [];
            if (f) {
                for (var h = 1, i = arguments.length; h < i; h++) g.push(arguments[h]);
                f.each(function (a) {
                    a && a.apply(null, g)
                })
            }
        },
        un: function (a, b) {
            for (var f = this.event[a], g = f.length, h = 0; h < g; h++) f[h] == b && (this.event[a] = f.splice(h, 1))
        },
        initElement: function () {
            this.parent = $(this.opt.parent || document.body);
            var a = lib.Element.create("div");
            a.addClass("j-noticeTips");
            a.css("position", "absolute");
            a.css("zIndex", 2E3);
            a.css("over-flow", "visible");
            a.html(this.opt.panelTpl);
            var b = a[0].getElementsByTagName("table")[0];
            this.parent.append(a);
            var f = $(b).box().width,
                b = $(b).box().height;
            a[0].style.width = f + "px";
            a[0].style.height = b + "px";
            this._createIframe(a);
            this.panel = a
        },
        _createIframe: function (a) {
            var b = document.createElement("iframe");
            b.style.position = "absolute";
            b.style.zIndex = "-1";
            b.style.filter = "alpha(opacity=0)";
            b.style.opacity = "0";
            b.style.left = 0;
            b.style.top = 0;
            var f = a.box(),
                g = f.height;
            b.style.width = f.width + "px";
            b.style.height = g + "px";
            a[0].appendChild(b)
        },
        initEvent: function () {
            this.panel.on("click", this._onClick.bindEvent(this))
        },
        setContent: function (a) {
            this.panel.down(".j-tip-content").html(this._iconClass + a)
        },
        setButtons: function (a) {
            var b = a.length,
                f = new lib.Template(this.opt.buttonTpl),
                g = [],
                h = this.panel.down(".j-tip-foot");
            if (b > 0) for (var i = 0; i < b; i++) g = g.concat(f.evaluate(a[i]));
            h.html(g.join(" "));
            for (a = 0; a < b; a++);
        },
        setPos: function (a) {
            if (this.opt.isMiddle) a = {
                left: (lib.box.getViewportWidth() - this.panel[0].offsetWidth) / 2 + lib.box.getPageScrollLeft(),
                top: (lib.box.getViewportHeight() - this.panel[0].offsetHeight) / 2 + lib.box.getPageScrollTop()
            }, this.panel.pos(a);
            else if (a && a.left) a.top = a.top < 20 ? 20 : a.top, this.opt.isMiddle && (a = {
                left: (lib.box.getViewportWidth() - 232) / 2,
                top: (lib.box.getViewportHeight() - 82) / 2
            }), this.panel.pos(a)
        },
        show: function () {
            this.panel.show()
        },
        close: function () {
            this.panel.hide();
            this.panel.remove()
        },
        _onClick: function (a) {
            var b = a.srcElement || a.target,
                a = b.getAttribute("data-key"),
                b = b.getAttribute("data-close");
            a && (b != "false" && this.close(), this.fire(a))
        }
    });
    kit.tips.Anim = function (a, b) {
        if (b.pos) a.setPos(b.pos);
        else if (b.element) {
            var f = $(b.element),
                g = f.pos(),
                h = a.panel.box(),
                i = lib.ui.Anim(a.panel).duration(400).ease("Circ.easeOut");
            g.left = g.left - h.width / 2 + f.box().width / 2;
            a.setPos(g);
            if (!b.direction) b.direction = "top";
            b.direction == "top" && i.to("top", g.top - h.height - 10).go();
            b.direction == "bottom" && i.to("top", g.top + f.box().height + 5).go()
        }
    };
    kit.tips.alert = function (a, b) {
        b = b || {};
        kit.tips._alert && kit.tips._alert.close();
        var f = new kit.tips({
            content: a || "\u7cfb\u7edf\u7e41\u5fd9",
            buttons: [{
                name: "\u786e\u5b9a",
                focus: !0,
                key: "ok",
                close: !0
            }],
            icon: b.icon || "WARNING",
            isMiddle: !b.element
        });
        f.on("ok", b.yes);
        kit.tips.Anim(f, b);
        return kit.tips._alert = f
    };
    kit.tips.confirm = function (b, e) {
        e = e || {};
        kit.tips._confirm && kit.tips._confirm.close();
        e.btnText = e.btnText || ["\u786e\u5b9a", "\u53d6\u6d88"];
        var f = new kit.tips({
            content: b || "\u7cfb\u7edf\u7e41\u5fd9",
            buttons: e.buttons ? e.buttons : [{
                name: e.btnText[0],
                key: "ok",
                focus: !0,
                close: !0
            }, {
                name: e.btnText[1],
                key: "cancel",
                close: !0
            }],
            icon: e.icon || "ASK",
            buttonTpl: e.buttonTpl || a.buttonTpl,
            isMiddle: !e.element
        });
        f.on("ok", e.yes);
        f.on("cancel", e.no);
        kit.tips.Anim(f, e);
        return kit.tips._confirm = f
    };
    kit.tips.notice = function (a, b) {
        function f() {
            clearTimeout(l);
            if (lib.IE) {
                var a = $("#j-tips-cnt");
                lib.ui.Anim(a).duration(100).ease("Circ.easeIn").to("opacity", 0).onDone(function () {
                    g.close();
                    k()
                }).go()
            } else lib.ui.Anim(g.panel).duration(300).to("opacity", 0).onDone(function () {
                g.close();
                k()
            }).go()
        }
        var b = b || {},
            g = new kit.tips({
                content: a || "\u7cfb\u7edf\u7e41\u5fd9",
                icon: b.icon || "SUCCESS",
                isMiddle: !b.element,
                panelTpl: '<table cellspacing="0" cellpadding="0" class="successPop"><tbody><tr><td style="height: 4px; overflow: hidden; font-size: 4px; line-height: 4px;" class="successPop_Bg" colspan="3"></td></tr><tr><td style="width: 4px; overflow: hidden;" class="successPop_Bg"></td><td><div class="successPop_con" id="j-tips-cnt"><p ><\!--img src="http://www.qiyipic.com/common/fix/hudong2_images/ok2.png"--\> <span class="j-tip-content">${content}</span></p><div class="j-tip-foot" style="display:none"></div></div></td><td style="width: 4px; overflow: hidden;" class="successPop_Bg"></td></tr><tr><td style="height: 4px; overflow: hidden; font-size: 4px; line-height: 4px;" class="successPop_Bg" colspan="3"></td></tr></tbody></table>'
            }),
            h = b.element ? $(b.element) : null,
            i = b.pos ? b.pos : h ? h.pos() : {},
            j = g.panel.box(),
            k = b.onHide ||
        function () {};
        h ? (i.left = i.left - j.width / 2 + h.box().width / 2, g.setPos(i), lib.ui.Anim(g.panel).duration(400).ease("Circ.easeIn").onDone(function () {
            l = setTimeout(f, b.hideTime || 800)
        }).to("top", i.top - j.height - 5).go()) : l = setTimeout(f, b.hideTime || 800);
        var l;
        g.tipHide = f;
        return g
    }
});
(function () {
    if (lib.ipad && lib.noFlashAndroid) {
        lib.action.ipadPlayer = {
            hideVideo: function () {
                var a = this,
                    d = setInterval(function () {
                        var e = document.getElementById("video");
                        if (e && e.parentNode.id == "flashbox") e.pause(), e.style.display = "none", clearInterval(d), document.getElementById("j-ipadhistoryshowcover") ? document.getElementById("j-ipadhistoryshowcover").style.display = "" : a._createCanvas()
                    }, 10)
            },
            showVideo: function () {
                var a = setInterval(function () {
                    var d = document.getElementById("video");
                    if (d && d.parentNode.id == "flashbox") {
                        if (document.getElementById("j-ipadhistoryshowcover")) document.getElementById("j-ipadhistoryshowcover").style.display = "none";
                        d.play();
                        document.getElementById("video").style.display = "";
                        clearInterval(a)
                    }
                }, 10)
            },
            _createCanvas: function () {
                var a = document.getElementById("video"),
                    d = document.createElement("img");
                d.id = "j-ipadhistoryshowcover";
                d.width = a.width;
                d.height = a.height;
                d.src = a.width == 640 ? "http://www.qiyipic.com/common/fix/ipadcovernormal.png" : "http://www.qiyipic.com/common/fix/ipadcoverwide.png";
                document.getElementById("flashbox").appendChild(d)
            }
        };
        try {
            lib.component.login.dialog.on("show", function () {
                lib.action.ipadPlayer.hideVideo()
            }), lib.component.login.dialog.on("close", function () {
                lib.action.ipadPlayer.showVideo()
            })
        } catch (a) {}
    }
})(window);
(function () {
    lib.$("#j-chMore") && lib.$("#j-ch-popup") && {
        init: function () {
            this._btn = lib.$("#j-chMore");
            this._list = lib.$("#j-ch-popup");
            this._list.show();
            this._listWidth = this._list.box().width;
            this._initPosition();
            this._list.hide();
            this._initEvent()
        },
        update: function () {
            this._list.css("top", this._top + "px");
            this._list.css("left", this._left + "px")
        },
        _initPosition: function () {
            var a = this._btn.box(),
                b = lib.$("#j-header").box();
            this._top = b.top + b.height;
            this._left = a.left + a.width - this._listWidth + 21
        },
        _initEvent: function () {
            var a = this,
                b = !1;
            if (lib.ipad) this._btn.on("click", function (b) {
                lib.Event.stop(b);
                a._list.css("display") == "none" ? (a._initPosition(), a.update(), a._list.show(), lib.kit.UnderFrame.show("j-ch-popup"), lib.action.ipadPlayer.hideVideo()) : (a._list.hide(), lib.kit.UnderFrame.hide("j-ch-popup"), lib.action.ipadPlayer.showVideo())
            });
            else this._btn.on("mouseover", function () {
                a._timer && clearTimeout(a._timer);
                b || (a._initPosition(), a.update(), a._list.show(), lib.kit.UnderFrame.show("j-ch-popup"), b = !0)
            }), this._btn.on("mouseout", function () {
                if (b) a._timer = setTimeout(function () {
                    a._list.hide();
                    lib.kit.UnderFrame.hide("j-ch-popup");
                    b = !1
                }, 100)
            }), this._list.on("mouseover", function () {
                a._timer && clearTimeout(a._timer)
            }), this._list.on("mouseout", function () {
                if (b) a._timer = setTimeout(function () {
                    a._list.hide();
                    lib.kit.UnderFrame.hide("j-ch-popup");
                    b = !1
                }, 100)
            });
            lib.$(window).on("resize", function () {
                a._initPosition();
                a.update()
            })
        }
    }.init()
})();
var Interface = function (a, b) {
        this.url = a;
        this.type = b || "ijax"
    };
Interface.prototype = {
    url: null,
    request: function (a) {
        var b = this.url.toString();
        switch (this.type) {
        case "jsload":
            lib.kit.util.jsLoad.request(b, a);
            break;
        default:
            Ijax.request(b, a)
        }
    }
};
var ReqUrl = {
	//TODO:
    mark: "http://score.video.qiyi.com/v/",
    initMark: "http://score.video.qiyi.com/f/",
    playList: "http://cache.video.qiyi.com/l",
    ctgInfo: "http://cache.video.qiyi.com/a",
    keySearch: "http://search.video.qiyi.com",
    relevanceSearch: "http://search.video.qiyi.com/searchRelevance",
    musicRelevance: "http://search.video.qiyi.com/searchRelevanceMusic",
    search: "http://search.video." + lib.SITE_DOMAIN + "/",
    rank: "http://top.qiyi.com/",
    artist: "http://cache.video.qiyi.com/ar/",
    works: "http://cache.video.qiyi.com/arl/",
    initList: "http://cache.video.qiyi.com/arvlv/",
    playlist: "http://cache.video.qiyi.com/arvl/",
    discs: "http://cache.video.qiyi.com/arvpl/",
    douban: "http://dispatcher.video.qiyi.com/dp/douban/",
    baike: "http://dispatcher.video.qiyi.com/dp/baike/",
    playCount: "http://cache.video.qiyi.com/p/"
};
$reg("lib.res.DomainSet", function () {
    lib.res.DomainSet = ["www", "vip.tj", "vip", "tj", "hd.tianyi", "tianyi", "ln", "henan", "cqhd"]
});
(function (a, b) {
    $reg("lib.action", function () {});
    lib.action.getDomainName = function () {
        for (var a = b.location.href, e = 0; e < lib.res.DomainSet.length; e++) {
            if (-1 != b.location.hostname.indexOf(lib.res.DomainSet[e])) return lib.res.DomainSet[e];
            else if (b.location.hostname == "list." + lib.SITE_DOMAIN) return a.match(/\/([a-z]+)\//i), RegExp.$1 || "www";
            if (e == lib.res.DomainSet.length - 1) return lib.res.DomainSet[0]
        }
    }
})(window, document);
(function (a, b) {
    function d(a, d) {
        lib.eventTarget.call(this);
        this.defaultConfig = {
            tag: "li",
            selectClass: "select"
        };
        this.option = Object.extend(this.defaultConfig, d);
        this.ele = typeof a == "string" ? b.getElementById(a) : a;
        this.tabs = [];
        this.tabsList = {};
        this.curTab = null
    }
    d.inherits(lib.eventTarget);
    Object.extend(d.prototype, {
        init: function () {
            this.tabs.length == 0 && this.initTabNavs(this.ele);
            for (var b = this, d = this.tabs, g = function (d, f) {
                    return function (g) {
                        lib.Event.preventDefault(a.event || g);
                        b.curTab && b._cancelSelect();
                        b.fire({
                            type: "beforeselect",
                            target: d,
                            index: f,
                            eventObj: g
                        });
                        b.curTab = d;
                        b._select();
                        b.fire({
                            type: "select",
                            target: d,
                            index: f,
                            eventObj: g
                        })
                    }
                }, h = 0, i = d.length; h < i; h++) $(d[h]).on("click", g(d[h], h))
        },
        initTabNavs: function (a) {
            tag = this.option.tag;
            for (var b = this.option.selectClass, a = a.getElementsByTagName(tag), d = [], h = 0, i = a.length; h < i; h++) {
                var j = a[h],
                    k = j.getAttribute("j-tab");
                if (j.className.indexOf(b) != -1) this.curTab = j;
                k && (d.push(j), this.tabsList[k] = j)
            }
            this.tabs = d
        },
        select: function (a) {
            this.tabs.length == 0 && this.initTabNavs(this.ele);
            var b = this.tabsList,
                a = b[a] ? b[a] : this.tabs[0];
            this.curTab && this._cancelSelect();
            this.fire({
                type: "beforeselect",
                target: a
            });
            this.curTab = a;
            this._select();
            this.fire({
                type: "select",
                target: a
            })
        },
        _select: function () {
            this.curTab.className += " " + this.option.selectClass
        },
        _cancelSelect: function () {
            this.curTab.className = this.curTab.className.replace(this.option.selectClass, "")
        }
    });
    a.lib = a.lib || {};
    lib.kit = lib.kit || {};
    lib.kit.Tab = d
})(window, document);
(function (a, b) {
    function d(a, d, g) {
        this.defaultConfig = {
            tag: "div"
        };
        this.option = Object.extend(this.defaultConfig, g);
        this.wrapper = typeof a == "string" ? b.getElementById(a) : a;
        this.list = this._getNodeList();
        this.curTab = this.getCurTab(d);
        this.curTab.style.display = ""
    }
    d.prototype._getNodeList = function () {
        if (this.wrapper) {
            for (var a = [], b = this.wrapper.childNodes, d = 0, h = b.length; d < h; d++) if (b[d].nodeName == this.option.tag.toUpperCase() && b[d].getAttribute("j-tab-cnt")) a.push(b[d]), b[d].style.display = "none";
            return a
        }
    };
    d.prototype.show = function (a) {
        this.curTab.style.display = "none";
        for (var b = 0, d = this.list.length; b < d; b++) if (this.list[b].getAttribute("j-tab-cnt") == a) this.list[b].style.display = "", this.curTab = this.list[b]
    };
    d.prototype.getCurTab = function (a) {
        for (var b = this.wrapper.childNodes, d = 0, h = b.length; d < h; d++) if (b[d].nodeName == this.option.tag.toUpperCase() && b[d].getAttribute("j-tab-cnt") == a) return b[d]
    };
    a.lib = a.lib || {};
    lib.kit = lib.kit || {};
    lib.kit.tabContent = d
})(window, document);
(function () {
    function a(a) {
        this._defaultOption = {
            selectClass: "selected",
            tag: "h2",
            cntTag: "div"
        };
        this.option = Object.extend(this._defaultOption, a);
        this.tabWrapper = this.option.tabWrapper;
        this.cntWrapper = this.option.cntWrapper;
        this.defaultView = this.option.defaultView;
        this.tab = null;
        this._initTabAction();
        this._setContentAction()
    }
    $reg("lib.kit", function () {});
    a.prototype._initTabAction = function () {
        this.tab = new lib.kit.Tab(this.tabWrapper, {
            selectClass: this.option.selectClass,
            tag: this.option.tag
        });
        this.tab.init()
    };
    a.prototype._setContentAction = function () {
        var a = new lib.kit.tabContent(this.cntWrapper, this.defaultView, {
            tag: this.option.cntTag
        });
        this.tab.on("select", function (d) {
            d = d.target.getAttribute("j-tab");
            a.show(d)
        })
    };
    a.prototype.init = function () {
        this.tab.select(this.defaultView)
    };
    lib.kit.renderTabs = a
})(window, document);
Object.extend(lib.msg, {
    A00000: "\u64cd\u4f5c\u6210\u529f",
    A00001: "\u7528\u6237\u672a\u767b\u5f55",
    T00002: "\u60a8\u7684\u64cd\u4f5c\u8fc7\u4e8e\u9891\u7e41\uff5e\u4f11\u606f\u4e00\u4f1a",
    T00135: "\u6536\u5165\u586b\u5199\u6709\u8bef",
    T00136: "\u804c\u4e1a\u586b\u5199\u6709\u8bef",
    A00002: "\u7528\u6237\u672a\u5f00\u901a\u5947\u8c08",
    T00823: "\u8d44\u6e90feed\u68c0\u6d4b\u7f3a\u5c11lastTime",
    A00003: '\u5bf9\u4e0d\u8d77\uff0c\u60a8\u88ab\u7981\u6b62\u53d1\u8a00\u3002<br /><span style="color:#AAAAAA;font-size:12px">\u5982\u6709\u7591\u95ee\uff0c\u8bf7\u8054\u7cfbqitan@qiyi.com</span>',
    A00004: "\u5f00\u901a\u5947\u8c08\u5931\u8d25",
    A00005: "\u8bf7\u6c42\u5931\u8d25",
    A00010: "\u7cfb\u7edf\u5347\u7ea7",
    T00102: "\u7f3a\u5c11\u53c2\u6570",
    T00104: '\u6b64\u90ae\u7bb1\u5df2\u88ab\u6ce8\u518c\uff0c\u76f4\u63a5<a href="/user/login.php">\u767b\u5f55</a>',
    T00113: "\u8bf7\u4e0a\u4f20jpg\u3001gif\u3001png\u683c\u5f0f\u7684\u56fe\u7247",
    T00114: "\u8bf7\u4e0a\u4f20\u5c3a\u5bf8\u5927\u4e8e200\u00d7200\u50cf\u7d20\u7684\u56fe\u7247",
    T00115: "\u8bf7\u4e0a\u4f205M\u4ee5\u5185\u7684\u56fe\u7247",
    T00131: "\u8bf7\u8bbe\u7f6e\u751f\u65e5",
    T00132: "\u8bf7\u8bbe\u7f6e\u6027\u522b",
    T00134: "\u8bf7\u8bbe\u7f6e\u6240\u5728\u5730",
    T00161: "\u5f53\u524d\u5bc6\u7801\u4e0d\u6b63\u786e\uff0c\u8bf7\u91cd\u8bd5",
    T00162: "\u5bc6\u7801\u987b\u4e3a6-16\u4f4d\u5b57\u6bcd\u6216\u6570\u5b57",
    T00163: "\u62b1\u6b49\uff01\u4fee\u6539\u5bc6\u7801\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5",
    T00122: "\u5bc6\u7801\u987b\u4e3a6-16\u4f4d\u5b57\u6bcd\u6216\u6570\u5b57",
    T00121: "\u8bf7\u8f93\u5165\u6b63\u786e\u7684\u90ae\u7bb1",
    T00124: "\u9080\u8bf7\u94fe\u63a5\u5931\u6548",
    A00123: "\u6ce8\u518c\u5931\u8d25",
    T00107: "\u6700\u5c114\u4e2a\u5b57\u7b26\uff08\u62162\u4e2a\u6c49\u5b57\uff09",
    T00108: "\u6635\u79f0\u5df2\u88ab\u5360\u7528\uff0c\u6362\u4e00\u4e2a\u8bd5\u8bd5\uff1f",
    A00113: "\u7528\u6237\u4fe1\u606f\u8bbe\u7f6e\u5931\u8d25",
    A00133: "\u7528\u6237\u4fe1\u606f\u8bbe\u7f6e\u5931\u8d25",
    T00141: "\u8bf7\u9009\u62e91\u90e8\u4ee5\u4e0a\u559c\u597d\u5f71\u7247",
    A00142: "\u559c\u597d\u8bbe\u7f6e\u5931\u8d25",
    T00172: "\u8bf7\u4f7f\u7528\u4f60\u7684\u6ce8\u518c\u90ae\u7bb1\u6536\u53d6\u627e\u56de\u5bc6\u7801\u90ae\u4ef6",
    T00181: "\u627e\u56de\u5bc6\u7801\u94fe\u63a5\u5931\u6548",
    A00183: "\u91cd\u7f6e\u5bc6\u7801\u5931\u8d25",
    A00192: "\u83b7\u53d6\u7528\u6237\u4fe1\u606f\u5931\u8d25",
    T00111: "\u8bf7\u4e0a\u4f20\u5934\u50cf",
    A00112: "\u62b1\u6b49\uff01\u4e0a\u4f20\u5934\u50cf\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5",
    A00114: "\u62b1\u6b49\uff01\u5904\u7406\u5934\u50cf\u56fe\u7247\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5",
    T00154: "\u90ae\u7bb1\u6216\u5bc6\u7801\u9519\u8bef\uff0c\u8bf7\u91cd\u8bd5",
    T00153: '\u8be5\u5e10\u53f7\u5c1a\u672a\u6fc0\u6d3b\uff0c<a href="{0}">\u91cd\u53d1\u6fc0\u6d3b\u90ae\u4ef6</a>',
    A01002: "\u4e0a\u4f20\u56fe\u7247\u5931\u8d25",
    T00135: "\u6536\u5165\u586b\u5199\u6709\u8bef",
    T00136: "\u804c\u4e1a\u586b\u5199\u6709\u8bef",
    T00155: "\u62b1\u6b49\uff0c\u4f60\u88ab\u5c01\u7981\u767b\u5f55",
    T00137: "passport\u540c\u6b65\u7528\u6237\u4fe1\u606f\u5931\u8d25",
    T00198: "\u8be5\u7528\u6237\u56e0\u4e3a\u4e0d\u5f53\u884c\u4e3a\uff0c\u5df2\u88ab\u7cfb\u7edf\u5c01\u7981",
    T00199: "\u79c1\u4fe1\u5185\u5bb9\u592a\u957f\u4e86",
    T00197: "\u53d1\u79c1\u4fe1\u5931\u8d25",
    T00196: "\u5bf9\u4e0d\u8d77\uff0cTa\u8fd8\u6ca1\u6709\u5173\u6ce8\u4f60\uff0c<br/>\u4f60\u8fd8\u4e0d\u80fd\u7ed9Ta\u53d1\u79c1\u4fe1",
    T00195: "\u5bf9\u4e0d\u8d77\uff0c\u4f60\u4e0d\u80fd\u7ed9\u81ea\u5df1\u53d1\u79c1\u4fe1",
    T00194: "\u4f60\u5df2\u7ecf\u53d1\u9001\u8fc7\u8be5\u6761\u79c1\u4fe1",
    T00191: "\u6536\u4fe1\u4eba\u4e0d\u5b58\u5728",
    T00192: "\u4f60\u7684\u79c1\u4fe1\u5185\u5bb9\u53ef\u80fd\u5305\u542b\u654f\u611f\u8bcd",
    T00401: "\u6570\u636e\u83b7\u53d6\u5931\u8d25\uff0c\u8bf7\u7a0d\u5019\u518d\u8bd5\u3002",
    T00116: "\u56fe\u7247\u5c3a\u5bf8\u8fc7\u5927\uff0c\u8bf7\u91cd\u65b0\u9009\u62e9",
    A00200: "\u6dfb\u52a0\u8bc4\u8bba\u5931\u8d25",
    T00201: "\u63d0\u4ea4\u7684\u53c2\u6570\u6709\u8bef",
    T00202: "\u8bf7\u8f93\u5165\u56de\u590d\u5185\u5bb9",
    T00203: "\u539f\u5206\u4eab\u5df2\u88ab\u5220\u9664\uff0c\u65e0\u6cd5\u56de\u590d",
    A00204: "\u8bc4\u8bba\u53d1\u5e03\u8fc7\u4e8e\u9891\u7e41",
    T00205: "\u8bc4\u8bbaID\u4e0d\u80fd\u4e3a\u7a7a",
    T00206: "\u8bc4\u8bba\u5df2\u88ab\u5220\u9664",
    T00207: "\u65e0\u6743\u5220\u9664\u6b64\u8bc4\u8bba",
    A00206: "\u8bc4\u8bba\u5df2\u88ab\u5220\u9664",
    T00208: "\u62b1\u6b49\uff5e\u5185\u5bb9\u4e0d\u548c\u8c10",
    A00300: "\u6dfb\u52a0\u5f71\u8bc4\u5931\u8d25",
    T00301: "\u63d0\u4ea4\u7684\u53c2\u6570\u6709\u8bef",
    T00302: "\u7ed9\u5f71\u8bc4\u8d77\u4e2a\u5438\u5f15\u4eba\u7684\u6807\u9898\u5427",
    T00303: "\u5f71\u8bc4\u6807\u9898\u957f\u5ea6\u4e0d\u7b26",
    T00304: "\u5f71\u8bc4\u5185\u5bb9\u4e0d\u80fd\u4e3a\u7a7a",
    T00305: "\u5f71\u8bc4\u5185\u5bb9\u957f\u5ea6\u4e0d\u7b26",
    T00308: "\u5f71\u8bc4\u6253\u5206\u6709\u8bef",
    A00309: "\u5f71\u7247\u5df2\u4e0d\u5b58\u5728",
    A00310: "\u5f71\u8bc4\u5df2\u4e0d\u5b58\u5728",
    T00311: "\u65e0\u6743\u7f16\u8f91\u5f71\u8bc4",
    T00312: "\u65e0\u6743\u5220\u9664\u5f71\u8bc4",
    T00313: "\u62b1\u6b49\uff5e\u5f71\u8bc4\u4e0d\u548c\u8c10",
    T00503: "\u6807\u7b7e\u8d85\u957f",
    T00501: "\u8d44\u6599\u5e93ID\u4e0d\u5408\u6cd5",
    T00502: "\u975e\u6cd5\u89c2\u770b\u72b6\u6001",
    T00504: "\u6807\u7b7e\u4e2d\u542b\u6709\u654f\u611f\u8bcd",
    T00505: "\u9644\u8a00\u592a\u957f",
    T00506: "\u9644\u8a00\u4e2d\u542b\u6709\u654f\u611f\u8bcd",
    T00507: "\u6253\u5206\u6570\u503c\u5f02\u5e38",
    A00500: "\u8bf7\u6c42\u64cd\u4f5c\u5931\u8d25",
    A00501: "\u8d44\u6599\u4e0d\u5b58\u5728",
    T00601: "\u53c2\u6570\u9519\u8bef",
    T00603: "\u5173\u6ce8\u5bf9\u8c61\u4e0d\u5b58\u5728",
    A00600: "\u52a0\u5173\u6ce8\u5931\u8d25",
    A00610: "\u53d6\u6d88\u5173\u6ce8\u5931\u8d25",
    A00620: "\u79fb\u9664\u7c89\u4e1d\u5931\u8d25",
    T00604: "\u6700\u591a\u53ea\u80fd\u5173\u6ce82000\u4eba",
    A00700: "\u8bf7\u6c42\u64cd\u4f5c\u5931\u8d25",
    A00701: "\u8d44\u6599\u5e93ID\u4e0d\u5408\u6cd5",
    T00702: "\u975e\u6cd5\u67e5\u8be2\u6765\u6e90",
    T00703: "\u8d44\u6599\u540d\u79f0\u4e3a\u7a7a",
    T00704: '\u62b1\u6b49,\u6ca1\u6709\u627e\u5230\u540d\u4e3a"{movieName}"\u7684\u5f71\u7247',
    A00811: "\u521b\u5efa\u5931\u8d25",
    T00812: "\u5185\u5bb9\u4e0d\u80fd\u4e3a\u7a7a",
    T00813: "\u5185\u5bb9\u8d85\u8fc7\u9650\u5236\u957f\u5ea6",
    T00814: "\u5185\u5bb9\u53ef\u80fd\u5305\u542b\u654f\u611f\u8bcd",
    T00815: "\u9519\u8bef\u7684albumId",
    T00816: "\u9519\u8bef\u7684picId",
    T00817: "\u9519\u8bef\u7684\u6253\u5206\u5206\u6570",
    T00819: "\u9519\u8bef\u7684userId",
    T00801: "\u9519\u8bef\u7684\u7528\u6237id",
    T00802: "\u9519\u8bef\u7684feed id",
    T00803: "\u53c2\u6570userId\u975e\u5f53\u524d\u767b\u5f55\u7528\u6237userId",
    T00821: "\u53c2\u6570feed id\u4e0d\u5c5e\u4e8e\u53c2\u6570userId\u6240\u53d1\u8868\u7684feed\uff0c\u53c2\u6570userId\u65e0\u6743\u5220\u9664",
    T02202: "\u4f60\u5df2\u7ecf\u8d5e\u540c\u8fc7\u5566",
    T02203: "\u4f60\u5df2\u7ecf\u53cd\u5bf9\u8fc7\u5566",
    T02603: "\u559c\u6b22\u8fc7\u4e86\u54e6",
    A00822: "\u4e0d\u80fd\u5220\u9664\u5f71\u8bc4feed",
    A00831: "\u8f6c\u53d1\u5931\u8d25",
    T00832: "\u5f53\u524d\u8f6c\u53d1feed id\u4e0d\u80fd\u4e3a\u7a7a",
    T00833: "\u6839feed id\u4e0d\u80fd\u4e3a\u7a7a",
    T00820: "\u4f60\u5df2\u7ecf\u8bf4\u8fc7\u8fd9\u53e5\u5566...",
    T00824: "feed\u5df2\u5220\u9664\uff0c\u4e0d\u80fd\u8f6c\u53d1",
    T00818: "\u9519\u8bef\u7684viewRecord",
    T00822: "\u8d44\u6e90feed\u68c0\u6d4b\u592a\u9891\u7e41",
    T00825: "\u8d44\u6e90feed\u68c0\u6d4b\u7f3a\u5c11fid",
    T00902: "\u62b1\u6b49\uff0c\u4e0d\u652f\u6301\u8be5\u94fe\u63a5\uff0c\u8bf7\u91cd\u65b0\u8f93\u5165\u5730\u5740",
    A01000: "\u8bf7\u6c42\u64cd\u4f5c\u5931\u8d25",
    T01001: "\u8d44\u6599\u5e93ID\u4e0d\u5408\u6cd5",
    T01002: "\u8ba2\u9605\u6570\u91cf\u8d85\u8fc7\u4e0a\u9650",
    A01100: "\u5206\u4eab\u5931\u8d25",
    T01103: "\u5206\u4eab\u5185\u5bb9\u4e0d\u548c\u8c10",
    T01102: "\u5206\u4eab\u5185\u5bb9\u4e0d\u80fd\u4e3a\u7a7a",
    A01810: "\u4f60\u5df2\u7ecf\u8bf4\u8fc7\u8fd9\u53e5\u5566...",
    A01804: "\u5185\u5bb9\u4e0d\u548c\u8c10",
    A02301: "\u5185\u5bb9\u4e0d\u80fd\u4e3a\u7a7a",
    T02302: "\u5185\u5bb9\u8d85\u8fc7\u9650\u5236\u957f\u5ea6",
    T02303: "\u5185\u5bb9\u53ef\u80fd\u5305\u542b\u654f\u611f\u8bcd",
    T02304: "\u9519\u8bef\u7684\u7528\u6237ID",
    T02305: "\u9519\u8bef\u7684\u8ba8\u8bbaID",
    T02306: "\u65e0\u6743\u5220\u9664",
    T02307: "\u4f60\u5df2\u7ecf\u8bf4\u8fc7\u8fd9\u53e5\u5566...",
    T02308: "\u8ba8\u8bba\u5df2\u7ecf\u5220\u9664",
    T02309: "\u8d44\u6e90\u68c0\u6d4b\u592a\u9891\u7e41",
    T02310: "\u63d0\u4ea4\u7684\u53c2\u6570\u6709\u8bef",
    T02311: "\u63d0\u4ea4\u7684\u53c2\u6570\u6709\u8bef",
    T02312: "\u62b1\u6b49\uff5e\u8ba8\u8bba\u4e0d\u548c\u8c10",
    T02313: "\u6765\u6e90\u9519\u8bef",
    T02314: "\u9519\u8bef\u7684\u56fe\u7247ID",
    T02315: "\u9519\u8bef\u7684\u89c6\u9891ID",
    A02300: "\u521b\u5efa\u5931\u8d25",
    T01109: "\u5206\u4eab\u622a\u5c4f\u56fe\u7247\u5931\u8d25",
    T01110: "\u5206\u4eab\u622a\u5c4f\u56fe\u7247\u6709\u8bef"
});
lib.model.Bubble = lib.model({
    actions: {
        get: {
            method: "get",
            params: [],
            format: "json",
            encode: !0,
            passport: !1,
            url: "new_msg.php"
        },
        clear: {
            method: "get",
            params: [],
            format: "json",
            encode: !0,
            passport: !1,
            url: "clean_new_msg.php"
        }
    },
    url: "http://api.t." + lib.SITE_DOMAIN + "/api/common/"
});
(function () {
    function a() {
        this._timer = null;
        this.isRunning = !1;
        this.delay = 3E5
    }
    lib.action.watcher = a;
    Object.extend(a.prototype, {
        run: function () {
            throw "abstract method";
        },
        start: function () {
            (this._timer || this.isRunning) && this.stop();
            this.isRunning = !0;
            this._timer = setInterval(this.run.bind(this), this.delay)
        },
        stop: function () {
            clearInterval(this._timer);
            this.isRunning = !1;
            this._timer = null
        }
    })
})(this);
(function () {
    function a() {
        lib.action.watcher.call(this);
        $(document).delegate("startwatcher", this._startWatcher.bind(this));
        lib.component.login.setCallback("login", this._login.bind(this));
        lib.component.login.setCallback("logout", this.stop.bind(this))
    }
    if (lib.component && lib.component.login) {
        a.inherits(lib.action.watcher);
        Object.extend(a.prototype, {
            run: function () {
                lib.model.Bubble.get(null, {
                    success: this._success.bind(this),
                    failure: this._error.bind(this)
                })
            },
            _login: function () {
                this.run();
                this.start()
            },
            _startWatcher: function () {
                this.isRunning || (this._resetState(), this.start())
            },
            _resetState: function () {
                try {
                    lib._PAGE_EVENT.fire({
                        type: "hasnewmsg",
                        target: {}
                    })
                } catch (a) {}
                var b = $("#j-username span");
                if (b[0].className.indexOf("newMessage") != -1) $("#j-notice").css("display", "none"), $("#j-iqiyi")[0].className = "", b[0].className = "", $("#j-qtmsg-wrapper").css("display", "none"), $("#j-qtsns")[0].className = "", document.getElementById("j-user-popup").getElementsByTagName("li")[0].className = ""
            },
            _success: function (a) {
                if ($("#j-username")) {
                    var b = $("#j-username span"),
                        f = [],
                        g = lib.component.login.getUserInfo().uid,
                        h = 0,
                        i = 0,
                        j = 0,
                        k = 0,
                        l = 0;
                    try {
                        setTimeout(function () {
                            lib._PAGE_EVENT.fire({
                                type: "hasnewmsg",
                                target: a
                            })
                        }, 5E3)
                    } catch (m) {}
                    if (a.comment || a.atme || a.attention || a.msg || a.notice) {
                        if (this.stop(), b[0].className.indexOf("newMessage") == -1) {
                            b[0].className = "newMessage";
                            h = parseInt(a.msg);
                            i = parseInt(a.atme);
                            j = parseInt(a.comment);
                            l = parseInt(a.attention);
                            k = parseInt(a.notice);
                            h > 0 && f.push('<p><a href="http://t.qiyi.com/' + g + '/msg" target="_blank" j-delegate="startwatcher">-\u65b0\u79c1\u4fe1(<em>' + this.parseNum(h) + "</em>)</a></p>");
                            i > 0 && f.push('<p><a href="http://t.qiyi.com/' + g + '/atme" target="_blank" j-delegate="startwatcher">-@\u6211\u7684(<em>' + this.parseNum(i) + "</em>)</a></p>");
                            j > 0 && f.push('<p><a href="http://t.qiyi.com/' + g + '/comment" target="_blank" j-delegate="startwatcher">-\u65b0\u56de\u590d(<em>' + this.parseNum(j) + "</em>)</a></p>");
                            l > 0 && f.push('<p><a href="http://t.qiyi.com/' + g + '/fans" target="_blank" j-delegate="startwatcher">-\u65b0\u7c89\u4e1d(<em>' + this.parseNum(l) + "</em>)</a></p>");
                            if (k > 0) $("#j-notice").html('<p><a href="http://i.' + lib.SITE_DOMAIN + '/tongzhi" target="_blank" j-delegate="startwatcher">-\u901a\u77e5(<em>' + this.parseNum(k) + "</em>)</a></p>"), $("#j-notice").css("display", ""), $("#j-iqiyi")[0].className = "liLast";
                            if (a.comment || a.atme || a.attention || a.msg) $("#j-qtmsg-wrapper").html(f.join("")), $("#j-qtmsg-wrapper").css("display", ""), $("#j-qtsns")[0].className = "liLast"
                        }
                    } else $("#j-qtmsg-wrapper").html(""), $("#j-qtmsg-wrapper").css("display", "none"), $("#j-qtsns")[0].className = ""
                }
            },
            parseNum: function (a) {
                return a > 99 ? "99" : a
            },
            _error: function (a) {
                this.isRunning && this.stop();
                var b = $("#j-qtmsg-wrapper");
                b && b.css("display", "none");
                lib.msg && lib.log("newmsg" + (lib.msg[a.code] || ""))
            }
        });
        var b = new a;
        lib.component.login.isLogin() && (b.run(), b.start())
    }
})(this);
(function () {
    lib.Class("NewPlayHistoryView", {
        ns: lib.view,
        extend: lib.view.View,
        properties: {
            TERMINAL: {
                11: "\u7535\u8111",
                12: "\u7535\u8111",
                21: "\u5e73\u677f",
                22: "\u5e73\u677f",
                31: "\u624b\u673a",
                32: "\u624b\u673a",
                51: "\u7535\u89c6"
            },
            boxTpl: ['<div id="j-clearing" class="bd ptop" style="background:#fff; width:268px; height:255px; position:absolute; top:15px; left:0; display:none; z-index:1;" ><div style="display:block" class="ui_loading"><img src="http://www.qiyipic.com/common/images/load.gif"><br /><br /><span>\u6b63\u5728\u4e3a\u60a8\u6e05\u7a7a\u64ad\u653e\u8bb0\u5f55</span></div></div><div id="j-clearWindow" class="bd ptop" style="background:#fff; width:268px; height:255px; position:absolute; top:15px; left:0; display:none; z-index:1;" ><div class="wrap-bg0"><div class="wrap-wid"><p>\u662f\u5426\u6e05\u7a7a\u60a8\u5728\u7535\u8111\u3001\u5e73\u677f\u7535\u8111\u3001\u624b\u673a\u3001\u7535\u89c6\u4e0a\u89c2\u770b\u7231\u5947\u827a\u7684\u5168\u90e8\u64ad\u653e\u8bb0\u5f55\uff1f</p><p class="tip"><input id="j-clearBtnOk" type="button" class="btn00 mr15" value="\u786e\u5b9a"><input id="j-clearBtnCancel" type="button" class="btn00" value="\u53d6\u6d88"></p></div></div></div><div class="hd"><a j-delegate="historyClose" class="close" onclick="return false" href="#">\u5173\u95ed</a><div id="j-historyClear" style="text-align:right; float:right; line-height:47px;"><a style="" j-delegate="clearHistory" onclick="return false" href="#">\u6e05\u7a7a\u8bb0\u5f55</a><span style="padding-left:5px; padding-right:8px;">|</span></div></div><div class="bd"><div id="j-historyNothing" class="none_jilu" style="display:none"><p>\u60a8\u6682\u65f6\u6ca1\u6709\u64ad\u653e\u8bb0\u5f55</p><ul>', '<li id="j-readme"><span><a target="_blank" class="zhuce" href="http://passport.' + lib.SITE_DOMAIN + "/register/reg.php?url=" + (lib.PROJECT_REG_URL || "") + '">\u6ce8\u518c</a>\u6210</span>\u7231\u5947\u827a\u7528\u6237\uff0c<span><a j-delegate="loginAndClose" class="denglu" href="http://passport.' + lib.SITE_DOMAIN + '/user/login.php">\u767b\u5f55</a>\u540e</span>\u5c06\u80fd\u6c38\u4e45\u4fdd\u5b58\u64ad\u653e\u8bb0\u5f55\u3002</li>', '<li>\u64ad\u653e\u8bb0\u5f55\u5728\u7535\u8111\u3001\u5e73\u677f\u7535\u8111\u3001\u624b\u673a\u3001\u7535\u89c6\u4e0a\u89c2\u770b\u7231\u5947\u827a\u5185\u5bb9\u65f6\u4e92\u901a\u3002</li></ul><div id="j-wrongHelp" class="jilu_help">', '<a href="http://www.' + lib.SITE_DOMAIN + '/common/helpandsuggest.html?entry=yedi#wenti16">\u64ad\u653e\u8bb0\u5f55\u603b\u8bb0\u5f55\u4e0d\u4e0a\u600e\u4e48\u529e\uff1f</a>', '</div></div><div style="position:relative;overflow: hidden;"><ul id="j-historyUl"></ul><div id="j-historyMaskLoading" class="ui_loading" style="width:100%;height:100%;position:absolute;top:0;left:0;background-color:#ffffff;opacity:0.8;filter:alpha(opacity=80);display:none;"><img src="http://www.qiyipic.com/common/images/load.gif"><br /><span>\u6b63\u5728\u52aa\u529b\u83b7\u53d6\u5185\u5bb9..</span></div></div><div id="j-historyMiddleLoading" class="ui_loading"><img src="http://www.qiyipic.com/common/images/load.gif"><br /><span>\u6b63\u5728\u52aa\u529b\u83b7\u53d6\u5185\u5bb9..</span></div></div><div class="ft"><div id="j-historyImport" class="loaded" style="display:none"><a j-delegate="historyImportClose" title="\u5173\u95ed" href="#" onclick="return false" class="close">\u5173\u95ed</a><a j-delegate="historyImport" href="#" onclick="return false" class="nologin">\u70b9\u51fb\u5bfc\u5165\u672a\u767b\u5f55\u65f6\u7684\u64ad\u653e\u8bb0\u5f55</a><div style="display:none"><span class="daoru">\u5bfc\u5165\u5b8c\u6210</span>', '<a href="http://i.' + lib.SITE_DOMAIN + '/bofangjilu" target="_blank">\u67e5\u770b\u5b8c\u6574\u64ad\u653e\u8bb0\u5f55>></a>', '</div><div id="j-historyFootLoading" class="ui_loading" style="display:none"><img src="http://www.qiyipic.com/common/images/load.gif"><span>\u6b63\u5728\u52aa\u529b\u83b7\u53d6\u5185\u5bb9..</span></div></div><div id="j-readme2" class="loaded" style="display:none"><div><a j-delegate="readme2Close" class="close" onclick="return false" href="#" title="\u5173\u95ed">\u5173\u95ed</a>', '<a j-delegate="loginAndClose" href="http://passport.' + lib.SITE_DOMAIN + '/user/login.php">\u767b\u5f55</a>\u540e\u5c06\u80fd\u6c38\u4e45\u4fdd\u5b58\u64ad\u653e\u8bb0\u5f55<span class="fgx_line">|</span>', '<a target="_blank" href="http://passport.' + lib.SITE_DOMAIN + "/register/reg.php?url=" + (lib.PROJECT_REG_URL || "") + '">\u514d\u8d39\u6ce8\u518c</a>', '</div><div><a j-delegate="readme2Close" class="close" onclick="return false" href="#" title="\u5173\u95ed">\u5173\u95ed</a>\u7231\u5947\u827a\u7528\u6237\u5c06\u80fd\u6c38\u4e45\u4fdd\u5b58\u64ad\u653e\u8bb0\u5f55</div></div></div><div style="height:50px;width:100%;opacity:0;filter:alpha(opacity=0);background-color:#000000"></div>'].join(""),
            listTpl: '<li class="${on}"><div class="row"><h2 class="tit_other"><a tvid="${tvId}" href="${videoUrl}" title="${videoName}">${videoTrancateName}</a></h2><a j-delegate="historyDel" title="${remove}" href="#" onclick="return false" class="close">${remove}</a></div><div class="row row_new"><span class="info">${playState}</span><span class="info_R_New"><a title="${playCtl}" href="${videoPlayUrl}" class="continue">${playCtl}</a><em>${spliter}</em><a title="${playNext}" href="${videoPlayNextUrl}" class="continue">${playNext}</a></span></div></li>',
            list2centerTpl: ['<li class="add-tips">', '<a href="http://i.' + lib.SITE_DOMAIN + '/bofangjilu" target="_blank">', "\u8fdb\u5165\u6211\u7684\u7231\u5947\u827a\u67e5\u770b\u5b8c\u6574\u64ad\u653e\u8bb0\u5f55&gt;&gt;</a></li>"].join(""),
            listBtn: $("#topT1"),
            listWrapper: lib.Element.create("div"),
            listWrapperId: "j-playHistoryWrapper",
            listWrapperStyle: "gui-PlayLogSuggest",
            showCurrent: !0,
            _ctrl: null,
            hideTimer: !1,
            isOpen: !1,
            importCloseTime: 5E3,
            urlEx: {},
            pingbackEx: {},
            _haveData: !1,
            _hasOnEvent: !1
        },
        methods: {
            init: function (a) {
                this._ctrl = a;
                if (this.listBtn) {
                    if (!this._ctrl.isFinalPlayer()) this.showCurrent = !1;
                    var a = "?" + ["pltfm=" + (lib.ipad ? "21" : "11"), "furl=" + (window.location.protocol + "//" + window.location.host + window.location.pathname)].join("&"),
                        b = "http://msg.video.qiyi.com/phtr.gif" + a;
                    this.urlEx = {
                        nxtep: a + "&type=fltl&area=phtr&pos=nxtep",
                        ctnvw: a + "&type=fltl&area=phtr&pos=ctnvw",
                        revw: a + "&type=fltl&area=phtr&pos=revw",
                        title: a + "&type=fltl&area=phtr&pos=title",
                        enrperc: a + "&type=fltl&area=phtr&pos=enrperc"
                    };
                    this.pingbackEx = {
                        show: b + "&act=show&type=fltl&url=",
                        close: b + "&act=close&type=fltl&url=",
                        dlt: b + "&act=dlt&type=fltl&url=",
                        emy: b + "&act=emy&type=fltl&url=",
                        imt: b + "&act=imt&type=fltl&url="
                    };
                    this._initWrapper();
                    this._initMenuBox();
                    this._initBindEvent();
                    this._initEvent();
                    this._initDelegate();
                    this._initElement();
                    this._initClearBox();
                    this.listWrapper[0].attachEvent && this.listWrapper[0].attachEvent("onmousewheel", function () {
                        window.event.returnValue = !1
                    });
                    lib.swf.qiyiClearOK = this.initPlayerEvent.bind(this)
                }
            },
            initPlayerEvent: function () {
                var a = this,
                    b = function () {
                        var b = lib.component.login.getUserInfo().uid;
                        arguments.length > 0 && (a.isOpen ? a._ctrl.readHistory.call(a._ctrl, !0) : a._ctrl.clearLastLoadTime(), lib.cookie.remove(a._ctrl.cookieName, "/", lib.SITE_DOMAIN), a._ctrl.notice2swf(b));
                        b && a._ctrl.getLocalHistory.call(a._ctrl).length > 0 && lib.cookie.get(a._ctrl.cookieName) != b ? a._ctrl.openImport.call(a._ctrl) : a._ctrl.closeImport.call(a._ctrl)
                    };
                b();
                lib._PAGE_EVENT.on("logout", b);
                lib._PAGE_EVENT.on("login", b);
                window.onerror = function () {
                    return !0
                }
            },
            update: function (a) {
                if (a.update === !0 && this[a.type] instanceof Function) this[a.type](a)
            },
            _initBindEvent: function () {
                this._listBtnOverBinded = this._listBtnOver.bind(this);
                this._listBtnOutBinded = this._listBtnOut.bind(this);
                this._listWrapperOverBinded = this._listWrapperOver.bind(this);
                this._listWrapperOutBinded = this._listWrapperOut.bind(this);
                this._listWrapperOutBinded = this._listWrapperOut.bind(this);
                this._setPosBinded = this._setPos.bind(this)
            },
            _initEvent: function () {
                this.onEvent()
            },
            onEvent: function () {
                this.listBtn.on("mouseover", this._listBtnOverBinded);
                this.listBtn.on("mouseout", this._listBtnOutBinded);
                this.listWrapper.on("mouseover", this._listWrapperOverBinded);
                this.listWrapper.on("mouseout", this._listWrapperOutBinded);
                this._hasOnEvent = !0
            },
            unEvent: function () {
                this.listBtn.un("mouseover", this._listBtnOverBinded);
                this.listBtn.un("mouseout", this._listBtnOutBinded);
                this.listWrapper.un("mouseover", this._listWrapperOverBinded);
                this.listWrapper.un("mouseout", this._listWrapperOutBinded);
                this._hasOnEvent = !1
            },
            _initDelegate: function () {
                this.listWrapper.delegate("historyClose", this._closeMenu.bind(this));
                this.listWrapper.delegate("clearHistory", this._openClearWindow.bind(this));
                this.listWrapper.delegate("historyDel", this._deleteHistory.bind(this));
                this.listWrapper.delegate("historyImportClose", this.closeImport.bind(this));
                this.listWrapper.delegate("historyImport", this.importHistory.bind(this));
                this.listWrapper.delegate("readme2Close", this.closeReadme2.bind(this));
                this.listWrapper.delegate("loginAndClose", function (a) {
                    lib.Event.stop(a.event);
                    this._closeMenu.call(this);
                    lib.component.login.show()
                }.bind(this))
            },
            _initElement: function () {
                this._maskLoading = $("#j-historyMaskLoading");
                this._middleLoading = $("#j-historyMiddleLoading");
                this._footLoading = $("#j-historyFootLoading");
                this._nodata = $("#j-historyNothing");
                this._unorderedList = $("#j-historyUl");
                this._importBlock = $("#j-historyImport");
                this._helpTip = $("#j-wrongHelp");
                this._regTip = $("#j-readme").down("span");
                this._regTip2 = $("#j-readme2");
                this._clearBtnWarrper = $("#j-historyClear");
                this._clearing = $("#j-clearing");
                this._clearWindow = $("#j-clearWindow");
                this._clearBtnOk = $("#j-clearBtnOk");
                this._clearBtnCancel = $("#j-clearBtnCancel")
            },
            _initClearBox: function () {
                var a = this;
                this._clearBtnOk.on("click", function () {
                    (new Image).src = a.pingbackEx.emy;
                    a._clearWindow.hide();
                    a._clearing.show();
                    a._ctrl.clearHistory.call(a._ctrl)
                });
                this._clearBtnCancel.on("click", function () {
                    a._clearWindow.hide();
                    a.onEvent()
                })
            },
            listReady: function (a) {
                this._clearLoading();
                this._setItem(a);
                if (!this._hasOnEvent) this.onEvent()
            },
            listError: function () {
                this._clearLoading();
                if (!this._hasOnEvent) this.onEvent()
            },
            delReady: function () {
                this._clearLoading();
                this._ctrl.readHistory(!0)
            },
            delError: function () {
                this._clearLoading()
            },
            clearReady: function () {
                this._clearLoading();
                this._ctrl.readHistory(!0)
            },
            clearError: function () {
                this._clearLoading()
            },
            importReady: function () {
                var a = this;
                this._clearLoading("Foot");
                this._importBlock.down("a")[1].style.display = "none";
                this._importBlock.down("div")[0].style.display = "";
                this._ctrl.readHistory(!0);
                lib.cookie.set(this._ctrl.cookieName, lib.component.login.getUserInfo().uid, 0, "/", lib.SITE_DOMAIN);
                setTimeout(function () {
                    a.closeImport.call(a)
                }, a.importCloseTime)
            },
            importError: function () {
                this._clearLoading("Foot");
                this._importBlock.down("a")[0].style.display = "";
                this._importBlock.down("a")[1].style.display = "";
                this._importBlock.down("a")[1].innerHTML = "\u672a\u80fd\u6210\u529f\u5bfc\u5165\u64ad\u653e\u8bb0\u5f55\u8bf7\u91cd\u8bd5"
            },
            openImport: function () {
                this._importBlock.down("a")[0].style.display = "";
                this._importBlock.down("a")[1].style.display = "";
                this._importBlock.down("a")[1].innerHTML = "\u70b9\u51fb\u5bfc\u5165\u672a\u767b\u5f55\u65f6\u7684\u64ad\u653e\u8bb0\u5f55";
                this._importBlock.down("div")[0].style.display = "none";
                this._importBlock.show();
                this.isOpen && this._setIframePos()
            },
            importHistory: function () {
                (new Image).src = this.pingbackEx.imt;
                this._importBlock.down("a")[0].style.display = "none";
                this._importBlock.down("a")[1].style.display = "none";
                this._ctrl.importHistory()
            },
            closeReadme2: function () {
                this._regTip2.down("div")[0].style.display == "none" ? lib.cookie.set(this._ctrl.loginedFlag, "1", 0, "/", lib.SITE_DOMAIN) : lib.cookie.set(this._ctrl.unloginFlag, "1", 0, "/", lib.SITE_DOMAIN);
                this._regTip2.hide();
                this.isOpen && this._setIframePos()
            },
            closeImport: function () {
                this._importBlock.hide();
                this.isOpen && this._setIframePos();
                this._changeBottomTipMsg()
            },
            _clearLoading: function (a) {
                if (a) this["_set" + a + "Loading"]("", !1);
                else this._setMaskLoading("", !1), this._setMiddleLoading("", !1), this._setFootLoading("", !1), this._setAllLoading("", !1)
            },
            setLoading: function (a) {
                a = a.loading;
                this["_set" + a.position + "Loading"](a.loadMsg, a.ing)
            },
            _setItem: function (a) {
                var b, d, e = new lib.Template(this.listTpl),
                    f = [],
                    g = a.list.length;
                this._unorderedList[0].className = g > 4 ? "max" : "";
                b = this._ctrl.getCurrentInfo.call(this._ctrl);
                this.showCurrent && b.videoName && f.push(e.evaluate(this._getInfo(b)));
                for (var h = 0; h < g; h++) this._ctrl.isFinalPlayer() && a.list[h].tvId == b.tvId || (d = this._getInfo(a.list[h]), f.push(e.evaluate(d)));
                g > 9 && lib.component.login.isLogin() && f.push(this.list2centerTpl.replace("bofangjilu", "bofangjilu" + this.urlEx.enrperc));
                g > 1 ? this._clearBtnWarrper.css("display", "") : this._clearBtnWarrper.css("display", "none");
                f.join("") == "" ? (this._changeNodataMsg(), this._haveData = !1, this._nodata.css("display", "")) : (this._haveData = !0, this._nodata.css("display", "none"));
                this._changeBottomTipMsg();
                this._unorderedList.html(f.join(""));
                this._itemInitEvent();
                this._unorderedList[0].scrollTop = 0;
                this.isOpen && this._setIframePos()
            },
            _itemInitEvent: function () {
                var a = this._unorderedList.down("li"),
                    b = this;
                a && a.each(function (a) {
                    if (a.attr("class") != "add-tips") a.on("mouseenter", b._itemOver.bind(b)).on("mouseleave", b._itemOut.bind(b))
                })
            },
            _changeNodataMsg: function () {
                lib.component.login.isLogin() ? this._regTip.hide() : this._regTip.css("display", "");
                this._ctrl.isOpenFlashCookie.call(this._ctrl) ? this._helpTip.hide() : this._helpTip.css("display", "")
            },
            _changeBottomTipMsg: function () {
                var a = this._regTip2.down("div"),
                    b = !1;
                a.hide();
                if (this._haveData) lib.component.login.isLogin() ? (a[1].style.display = "", lib.cookie.get(this._ctrl.loginedFlag) || (b = !0), this._importBlock.css("display") != "none" && (b = !1)) : (a[0].style.display = "", lib.cookie.get(this._ctrl.unloginFlag) || (b = !0));
                b ? this._regTip2.show() : this._regTip2.hide();
                this.isOpen && this._setIframePos()
            },
            _getInfo: function (a) {
                a.videoUrl = a.videoUrl || window.location.protocol + "//" + window.location.host + window.location.pathname;
                var b = this._ctrl.getCurrentInfo.call(this._ctrl),
                    d = isNaN(a.videoPlayTime) ? -1 : parseInt(a.videoPlayTime, 10),
                    e = Math.floor(d / 60),
                    f = "",
                    g = "",
                    h = "",
                    i = a.videoUrl,
                    j = a.tvId;
				// TODO:
                this.showCurrent && j == b.tvId ? (f = "\u6b63\u5728\u64ad\u653e...", g = "", h = "\u5173\u95ed") : (f = this.TERMINAL[a.terminalId] ? "[" + this.TERMINAL[a.terminalId] + "]" : "", h = "\u5220\u9664", d < 60 && d != 0 ? (f += "\u89c2\u770b\u4e0d\u8db31\u5206\u949f", i += this.urlEx.ctnvw, g = "\u7ee7\u7eed\u89c2\u770b") : d == 0 ? (f += "\u5df2\u770b\u5b8c", g = "\u91cd\u65b0\u89c2\u770b", i += this.urlEx.revw) : (f += "\u89c2\u770b\u81f3", e && (f += e + "\u5206\u949f"), i += this.urlEx.ctnvw, g = "\u7ee7\u7eed\u89c2\u770b"), (a.channelId == 2 || a.channelId == 4) && a.nextTvid && a.nextVideoUrl ? (a.playNext = "\u4e0b\u4e00\u96c6", a.spliter = "|", a.videoPlayNextUrl = a.nextVideoUrl + this.urlEx.nxtep) : (a.spliter = "", a.playNext = "", a.videoPlayNextUrl = "#"));
                a.videoTrancateName = a.videoName.trancate(32, "..");
                a.videoPlayUrl = i;
                a.playState = f;
                a.playCtl = g;
                a.videoUrl += this.urlEx.title;
                a.remove = h;
                a.tvId = j;
                return a
            },
            _initMenuBox: function () {
                new lib.Template(this.listTpl);
                var a = this.boxTpl.replace("bofangjilu", "bofangjilu" + this.urlEx.enrperc);
                this.listWrapper.css("overflow", "visible");
                this.listWrapper.html(a)
            },
            _initWrapper: function () {
                var a = this.listBtn.box();
                this.listWrapper[0].id = this.listWrapperId;
                this.listWrapper[0].className = this.listWrapperStyle;
                this.listWrapper.css("position", "absolute").css("top", a.bottom - 2 + "px").css("left", a.left + 12 + "px").css("zIndex", 99999).css("visibility", "hidden");
                document.body.insertBefore(this.listWrapper[0], null)
            },
            _setMiddleLoading: function (a, b) {
                this._setLoading(this._middleLoading, a, b)
            },
            _setMaskLoading: function (a, b) {
                this._setLoading(this._maskLoading, a, b)
            },
            _setFootLoading: function (a, b) {
                this._setLoading(this._footLoading, a, b)
            },
            _setAllLoading: function (a, b) {
                this._setLoading(this._clearing, a, b)
            },
            _setLoading: function (a, b, d) {
                a.css("display", d ? "" : "none");
                a.down("span").html(b)
            },
            _openClearWindow: function () {
                this.unEvent();
                this._clearWindow.show()
            },
            _showMenu: function () {
                (new Image).src = this.pingbackEx.show;
                this._ctrl.readHistory();
                this.listWrapper.css("visibility", "");
                this._setPos();
                lib._PAGE_EVENT.on("rerender", this._setPosBinded)
            },
            _setPos: function () {
                var a = this.listBtn.box();
                this.listWrapper.css("top", a.bottom - 2 + "px").css("left", a.left + 12 + "px");
                this._setIframePos()
            },
            _setIframePos: function () {
                var a = this.listWrapper.box();
                try {
                    lib.kit.UnderFrame.show("j-playHistoryWrapper", {
                        top: a.top + 8,
                        left: a.left,
                        width: a.width,
                        height: a.height - 58
                    })
                } catch (b) {}
            },
            _closeMenu: function () {
                if (arguments.length > 0)(new Image).src = this.pingbackEx.close;
                lib._PAGE_EVENT.un("rerender", this._setPosBinded);
                this.listWrapper.css("visibility", "hidden");
                lib.kit.UnderFrame.hide("j-playHistoryWrapper")
            },
            _listBtnOver: function () {
                if (this.hideTimer !== null) clearTimeout(this.hideTimer), this.hideTimer = null;
                if (this.isOpen !== !0) this._showMenu(), this.isOpen = !0
            },
            _listBtnOut: function () {
                var a = this;
                if (a.isOpen === !0) a.hideTimer = setTimeout(function () {
                    a._closeMenu.call(a);
                    a.isOpen = !1
                }, 100)
            },
            _listWrapperOver: function () {
                if (this.hideTimer !== null) clearTimeout(this.hideTimer), this.hideTimer = null
            },
            _listWrapperOut: function () {
                var a = this;
                if (a.isOpen === !0) a.hideTimer = setTimeout(function () {
                    a._closeMenu.call(a);
                    a.isOpen = !1
                }, 100)
            },
            _itemOver: function (a) {
                a = a || window.event;
                (a.currentTarget || a.srcElement).className = "on"
            },
            _itemOut: function (a) {
                a = a || window.event;
                (a.currentTarget || a.srcElement).className = ""
            },
            _deleteHistory: function (a) {
                var b = $(a.target).parent("li"),
                    a = $(a.target).parent().down("h2").down("a");
                this._setMaskLoading("\u6b63\u5728\u4e3a\u60a8\u5220\u9664\u64ad\u653e\u8bb0\u5f55..", !0);
                b.un("mouseover").un("mouseenter").un("mouseleave").un("mouseout");
                (new Image).src = this.pingbackEx.dlt + (a[0].protocol + "//" + a[0].host + a[0].pathname);
                a.attr("tvid") == this._ctrl.getCurrentInfo.call(this._ctrl).tvId && this._ctrl.isFinalPlayer() ? (this.showCurrent = !1, this._ctrl.refreshHistory()) : this._ctrl.deleteHistory(a.attr("tvid"))
            },
            getClear: function () {
                return lib.action.ClearSwf.get()
            },
            getPlayer: function () {
                var a = $("#" + this._ctrl.PLAYER_ID);
                return a && a[0]
            }
        }
    })
})();
(function () {
    lib.Class("NewIpadPlayHistoryView", {
        ns: lib.view,
        extend: lib.view.NewPlayHistoryView,
        methods: {
            init: function () {
                var a = this;
                this.superclass.prototype.init.apply(this, arguments);
                this._player = this._ctrl.isFinalPlayer() && lib.$("#video") ? lib.$("#video") : {
                    on: function () {}
                };
                lib.kit.serverTime.init(function () {
                    a._ctrl.loadCrossdomainSrorage.call(a._ctrl, a.initPlayerEvent.bind(a))
                })
            },
            initPlayerEvent: function () {
                this.superclass.prototype.initPlayerEvent.apply(this);
                this._ctrl.readCurrent.call(this._ctrl)
            },
            _initBindEvent: function () {
                this.listBtnBinded = function (a) {
                    this.isOpen ? this._closeMenu.call(this, a) : this._showMenu.call(this, a)
                }.bind(this)
            },
            currentReady: function () {
                this._player.on("timeupdate", this._ctrl.getLastTime.bind(this._ctrl));
                this._player.on("ended", this._ctrl.playEnd.bind(this._ctrl))
            },
            onEvent: function () {
                this.listBtn.on("click", this.listBtnBinded)
            },
            unEvent: function () {
                this.listBtn.on("click", this.listBtnBinded)
            },
            _showMenu: function (a) {
                this.isOpen = !this.isOpen;
                lib.Event.stop(a);
                lib.action.ipadPlayer.hideVideo();
                this.superclass.prototype._showMenu.apply(this)
            },
            _closeMenu: function () {
                this.isOpen = !this.isOpen;
                lib.action.ipadPlayer.showVideo();
                this.superclass.prototype._closeMenu.apply(this)
            },
            _itemInitEvent: function () {
                return "i'm html5"
            },
            _getInfo: function (a) {
                a = this.superclass.prototype._getInfo.apply(this, arguments);
                a.on = "on";
                return a
            }
        }
    })
})();
(function () {
    lib.Class("NewPlayHistoryModel", {
        ns: lib.model,
        extend: lib.model.Model,
        construct: function () {
            this.callsuper()
        },
        properties: {
            _lastTime: 0,
            _timeout: 5E3,
            _serverInterval: 120,
            _ctrl: null,
            _MSG: {
                READ: "\u6b63\u5728\u4e3a\u60a8\u8bfb\u53d6\u64ad\u653e\u8bb0\u5f55..",
                WRITE: "\u6b63\u5728\u4e3a\u60a8\u5199\u5165\u64ad\u653e\u8bb0\u5f55..",
                DEL: "\u6b63\u5728\u4e3a\u60a8\u5220\u9664\u64ad\u653e\u8bb0\u5f55..",
                CLEAR: "\u6b63\u5728\u4e3a\u60a8\u6e05\u7a7a\u64ad\u653e\u8bb0\u5f55..",
                IMPORT: "\u6b63\u5728\u5bfc\u5165\u4e2d.."
            },
            _isFirst: !0,
            _defaultLogined: !1,
            _maxSaved: 10
        },
        methods: {
            init: function (a) {
                var b = this;
                this.logined = lib.component.login.isLogin;
                this._ctrl = a;
                this._data.list = [];
                this._initInfo();
                this._serverInterface = lib.model({
                    crossDomain: !0,
                    actions: {
                        write: {
                            method: "post",
                            params: ["tvId", "videoId", "videoName", "videoUrl", "videoPlayTime", "videoDuration", "albumId", "albumName", "albumUrl", "terminalId", "channelId", "allSet", "nextTvid", "nextVideoUrl", "addtime"],
                            format: "json",
                            encode: !0,
                            url: "setrc.php",
                            timeout: b._timeout
                        },
                        del: {
                            method: "get",
                            params: ["tvId"],
                            format: "json",
                            encode: !0,
                            url: "delrc.php",
                            timeout: b._timeout
                        },
                        read: {
                            method: "get",
                            params: ["limit"],
                            format: "json",
                            encode: !0,
                            url: "getrc.php",
                            timeout: b._timeout
                        },
                        sync: {
                            method: "post",
                            params: ["importData"],
                            format: "json",
                            encode: !0,
                            url: "import.php",
                            timeout: b._timeout
                        },
                        delAll: {
                            method: "get",
                            params: [],
                            format: "json",
                            encode: !0,
                            url: "delall.php",
                            timeout: b._timeout
                        },
                        readCurrent: {
                            method: "get",
                            params: ["tvId"],
                            format: "json",
                            encode: !0,
                            url: "getdetail.php",
                            timeout: b._timeout
                        },
                        readAlbum: {
                            method: "get",
                            params: ["albumId"],
                            format: "json",
                            encode: !0,
                            url: "getalbumrc.php",
                            timeout: b._timeout
                        }
                    },
                    url: "http://passport." + lib.SITE_DOMAIN + "/apis/qiyirc/"
                });
                lib._PAGE_EVENT.on("videoPlayStart", function (a) {
                    b._ctrl.isFinalPlayer() && !b._ctrl.haveNextVideo && !b._isFirst && b.refreshCurrent.apply(b, a.target);
                    b._isFirst = !1
                });
                $(window).on("beforeunload", this._closePage.bind(this))
            },
            _closePage: function () {
                try {
                    this._ctrl.isFinalPlayer() && this._ctrl.getPlayer().windowClose()
                } catch (a) {}
            },
            _initInfo: function () {
                var a = this._ctrl.INFO || {};
                this.currentCache = {
                    tvId: a.tvId,
                    videoId: a.videoId,
                    videoName: a.title,
                    videoUrl: a.url || window.location.protocol + "//" + window.location.host + window.location.pathname,
                    albumId: a.albumId,
                    terminalId: "11"
                }
            },
            _notice: function (a, b) {
                var d = JSON.stringify({
                    type: a,
                    data: b || {}
                }),
                    d = this._ctrl.getClear().notice(d),
                    e;
                try {
                    d = window.JSON.parse(d), e = d.code == "A00000" ? d.data : !1
                } catch (f) {
                    e = !1
                }
                return e
            },
            _getItem: function (a, b) {
                for (var d = b.length, e = 0; e < d; e++) if (b[e].tvId == a) return e;
                return null
            },
            _getLocalJSON: function (a) {
                var b = this._notice("readHistory");
                a && (b = window.JSON.stringify(b));
                return b
            },
            _delLocal: function (a) {
                return this._notice("deleteHistory", {
                    tvId: a
                })
            },
            _localClear: function () {
                return this._delLocal("-1")
            },
            _localAlbum: function (a) {
                var b = this._getLocalJSON(),
                    b = b.filter(function (b) {
                        if (a == b.albumId) return !0
                    });
                return b.length > 0 ? (b.sort(function (a, b) {
                    a = parseInt(a.addtime, 10);
                    b = parseInt(b.addtime, 10);
                    return c = a > b ? -1 : 1
                }), b[0]) : !1
            },
            _serverReadAll: function () {
                this._serverInterface.read({
                    limit: this._maxSaved
                }, {
                    success: this.listReady.bind(this),
                    failure: this.listError.bind(this)
                })
            },
            _serverDel: function (a) {
                this._serverInterface.del({
                    tvId: a
                }, {
                    success: this.delReady.bind(this, a),
                    failure: this.delError.bind(this)
                })
            },
            _serverClear: function () {
                this._serverInterface.delAll({}, {
                    success: this.clearReady.bind(this),
                    failure: this.clearError.bind(this)
                })
            },
            _serverSync: function () {
                this._serverInterface.sync({
                    importData: this._getLocalJSON(!0)
                }, {
                    success: this.importReady.bind(this),
                    failure: this.importError.bind(this)
                })
            },
            _serverAlbum: function (a, b) {
                this._serverInterface.readAlbum({
                    albumId: a
                }, {
                    success: b,
                    failure: b
                })
            },
            deleteSameItems: function (a, b) {
                for (var d = {}, e = [], f = 0, g = a.length; f < glayHistoryModel;
        d = new lib.view.NewIpadPlayHistoryView;
        new lib.action.NewIpadPlayHistory(b, d);
        return !0
; f++) if (d[a[f]] == void 0 || b[f].channelId != "2" && b[f].channelId != "4") e.push(b[f]), d[a[f]] = 1;
                return e
            },
            _swfDataAdapter: function (a) {
                for (var b = [], d = 0, e = a.length; d < e; d++) b.push({
                    tvId: a[d].tvId,
                    videoId: a[d].videoId || a[d].vid,
                    videoName: a[d].videoName || a[d].title,
                    videoUrl: a[d].videoUrl || a[d].url,
                    videoPlayTime: a[d].videoPlayTime || a[d].time,
                    videoDuration: a[d].videoDuration,
                    albumId: a[d].albumId,
                    albumName: a[d].albumName,
                    albumUrl: a[d].albumUrl,
                    terminalId: a[d].terminalId,
                    channelId: a[d].channelId,
                    allSet: a[d].allSet,
                    nextTvid: a[d].nextTvid,
                    nextVideoUrl: a[d].nextVideoUrl || a[d].nextUrl
                });
                return b
            },
            _dataFilter: function (a) {
                for (var b = [], d = 0, e = a.length; d < e; d++) b.push(a[d].albumId);
                return this.deleteSameItems(b, a)
            },
            listReady: function (a) {
                a = typeof a == "string" ? eval(a) : this._dataFilter(a);
                a = this._swfDataAdapter(a);
                this.listReadyEvent(a);
                this._lastTime = parseInt(new Date / 1E3);
                this._ctrl.syncSet({
                    list: a,
                    type: "listReady",
                    update: !0
                })
            },
            listReadyEvent: function (a) {
                lib._PAGE_EVENT.fire({
                    type: "playHistoryLoaded",
                    target: a
                });
                return a
            },
            listError: function (a) {
                this.listErrorEvent(a);
                this._ctrl.syncSet({
                    list: a,
                    type: "listError",
                    update: !0
                })
            },
            listErrorEvent: function () {
                lib._PAGE_EVENT.fire({
                    type: "playHistoryLoaded",
                    target: []
                })
            },
            delReady: function (a) {
                lib._PAGE_EVENT.fire({
                    type: "playHistoryDel",
                    target: a
                });
                this._ctrl.syncSet({
                    type: "delReady",
                    update: !0
                })
            },
            delError: function () {
                lib._PAGE_EVENT.fire({
                    type: "playHistoryDel",
                    target: !1
                });
                this._ctrl.syncSet({
                    type: "delError",
                    update: !0
                })
            },
            importReady: function () {
                lib._PAGE_EVENT.fire({
                    type: "playHistoryImport",
                    target: !0
                });
                this._ctrl.syncSet({
                    type: "importReady",
                    update: !0
                })
            },
            importError: function () {
                lib._PAGE_EVENT.fire({
                    type: "playHistoryImport",
                    target: !1
                });
                this._ctrl.syncSet({
                    type: "importError",
                    update: !0
                })
            },
            clearReady: function () {
                lib._PAGE_EVENT.fire({
                    type: "playHistoryClear",
                    target: !0
                });
                this._ctrl.syncSet({
                    type: "clearReady",
                    update: !0
                })
            },
            clearError: function () {
                lib._PAGE_EVENT.fire({
                    type: "playHistoryClear",
                    target: !1
                });
                this._ctrl.syncSet({
                    type: "clearError",
                    update: !0
                })
            },
            refreshCurrent: function (a, b, d) {
                this.currentCache.videoId = a;
                this.currentCache.videoName = b;
                this.currentCache.tvId = d;
                this.readHistory(!0)
            },
            rerfeshHistory: function () {
                this._ctrl.syncSet({
                    type: "listReady",
                    update: !0
                })
            },
            readHistory: function (a) {
                this._ctrl.setLoading(this._MSG.READ, "Mask", !0);
                a && this.clearLastLoadTime();
                if (this.logined()) if (parseInt(new Date / 1E3) - this._lastTime > this._serverInterval) {
                    this._lastTime = parseInt(new Date / 1E3);
                    try {
                        this._serverReadAll()
                    } catch (b) {}
                } else this._ctrl.setLoading("", "Mask", !1);
                else this.listReady(this._getLocalJSON())
            },
            deleteHistory: function (a) {
                this._ctrl.setLoading(this._MSG.DEL, "Mask", !0);
                this.logined() ? this._serverDel(a) : (this._delLocal(a), this.delReady())
            },
            clearHistory: function () {
                this._ctrl.setLoading(this._MSG.CLEAR, "All", !0);
                this.logined() ? this._serverClear() : (this._localClear(), this.clearReady())
            },
            importHistory: function () {
                this.logined() && (this._ctrl.setLoading(this._MSG.IMPORT, "Foot", !0), this._serverSync())
            },
            isOpenFlashCookie: function () {
                return !!this._notice("isOpenedCookie")
            },
            albumHistory: function (a, b) {
                this.logined() ? this._serverAlbum(a, b) : b(this._localAlbum(a))
            },
            clearLastLoadTime: function () {
                this._lastTime = 0
            }
        }
    })
})();
$reg("lib.action.CrossdomainStorage", function () {
    lib.action.CrossdomainStorage = Class.create({
        initialize: function (a) {
            this.fn = a || lib.emptyMethod;
            this._url = "http://www.qiyi.com/common/newacross.html";
            this._localStrorage = null;
            this._instance = lib.action.CrossdomainStorage;
            this._createFrame()
        },
        _createFrame: function () {
            var a = this,
                b;
            this._url.indexOf(location.host) == -1 ? this._instance._iframe ? (this._localStrorage = this._instance._iframe[0].contentWindow.localStorage, setTimeout(this.fn, 0)) : (b = lib.Element.create("iframe"), this._instance._iframe = b, b.css("height", "0px").css("width", "0px").attr("frameBorder", "0").attr("src", this._url).on("load", function () {
                a._localStrorage = b[0].contentWindow.localStorage;
                a.fn()
            }), $(document.body).append(b)) : (this._localStrorage = window.localStorage, setTimeout(this.fn, 0))
        },
        removeItem: function (a) {
            this._localStrorage.removeItem(a)
        },
        setItem: function (a, b) {
            this._localStrorage.removeItem(a);
            this._localStrorage[a] = b
        },
        getItem: function (a) {
            return this._localStrorage[a]
        },
        length: function () {
            return this._localStrorage.length
        },
        getAll: function () {
            return Object.Extend({}, this._localStrorage)
        },
        getStorage: function () {
            return this._localStrorage
        },
        state: function () {
            return !!this._localStrorage
        }
    })
});
(function () {
    lib.Class("NewIpadPlayHistoryModel", {
        ns: lib.model,
        extend: lib.model.NewPlayHistoryModel,
        construct: function () {
            this.callsuper()
        },
        properties: {
            _newTime: 0,
            _lastTime: 0,
            _continued: !1,
            localInterval: 30,
            _storage: null,
            _localKey: "localHistory",
            _saveStamp: -1
        },
        methods: {
            _closePage: function () {
                try {
                    if (this._ctrl.isFinalPlayer() && lib.$("#video")) this._saveStamp = this._serverInterval / this.localInterval, this.writeHistory.apply(this)
                } catch (a) {}
            },
            _getStorage: function (a) {
                this._storage = new lib.action.CrossdomainStorage(a)
            },
            _initInfo: function () {
                this.superclass.prototype._initInfo.apply(this);
                var a = this._ctrl.INFO;
                try {
                    this.currentCache.videoDuration = this._getSecond(a.data.playLength), this.currentCache.terminalId = "21", this.currentCache.nextVideoUrl = a.ipad.nextVideoUrl, this.currentCache.channelId = a.ipad.categoryId
                } catch (b) {}
            },
            _getSecond: function (a) {
                a = a.split(":");
                return parseInt(a[0], 10) * 3600 + parseInt(a[1], 10) * 60 + parseInt(a[2], 10) * 1
            },
            _addItem: function (a, b) {
                b.splice(this._maxSaved - 1);
                b.unshift(a)
            },
            _delItem: function (a, b) {
                a.splice(b, 1)
            },
            _updateItem: function (a, b, d) {
                b[d] = a
            },
            _getLocalJSON: function (a) {
                var b = this._storage.getItem(this._localKey) || "[]";
                a || (b = window.JSON.parse(b));
                return b
            },
            _syncLocal: function (a) {
                this._storage.setItem(this._localKey, window.JSON.stringify(a))
            },
            _writeLocal: function () {
                var a = this._getLocalJSON(),
                    b = this._getItem(this.currentCache.tvId, a);
                b === null ? this._addItem(Object.extend({
                    addtime: lib.kit.serverTime.now()
                }, this.currentCache), a) : this._updateItem(Object.extend({
                    addtime: lib.kit.serverTime.now()
                }, this.currentCache), a, b);
                this._syncLocal(a)
            },
            _delLocal: function (a) {
                var b = this._getLocalJSON(),
                    a = this._getItem(a, b);
                a !== null && (this._delItem(b, a), this._syncLocal(b))
            },
            _localClear: function () {
                this._syncLocal(this._localKey, [])
            },
            _readCurrent: function (a) {
                var b;
                this.logined() ? this._serverReadCurrent(a) : (b = this._getLocalJSON(), index = this._getItem(this.currentCache.tvId, b), index !== null ? a(b[index]) : a({}))
            },
            _serverWrite: function () {
                this._serverInterface.write(this.currentCache, {
                    success: this.writeReady.bind(this),
                    failure: this.writeError.bind(this)
                })
            },
            _serverReadCurrent: function (a) {
                this._serverInterface.readCurrent({
                    tvId: this.currentCache.tvId
                }, {
                    success: a,
                    failure: a
                })
            },
            moveItem2First: function () {
                var a;
                a = this.logined() ? this._data.list : this._getLocalJSON();
                index = this._getItem(this.currentCache.tvId, a);
                index !== null && (this._delItem(a, index), this._addItem(Object.extend({
                    addtime: lib.kit.serverTime.now()
                }, this.currentCache), a));
                this.logined() || this._syncLocal(a)
            },
            getHistory2Cache: function () {
                var a = this;
                this._readCurrent(function (b) {
                    a.currentCache.videoPlayTime = b.videoPlayTime || -1;
                    a.currentReady()
                })
            },
            writeHistoryCache: function (a) {
                this.currentCache.videoPlayTime = a;
                this.writeHistory()
            },
            writeHistory: function () {
                if (this.logined()) {
                    if (this._saveStamp++, this._saveStamp == this._serverInterval / this.localInterval || this.currentCache.videoPlayTime == 0 || this.currentCache.videoPlayTime == -1 || this._saveStamp == -1) this._serverWrite(), this._saveStamp = 0
                } else this._writeLocal()
            },
            writeReady: function () {
                this._ctrl.syncSet({
                    type: "writeReady",
                    update: !0
                })
            },
            writeError: function () {
                this._ctrl.syncSet({
                    type: "writeError",
                    update: !0
                })
            },
            currentReady: function () {
                this._ctrl.syncSet({
                    type: "currentReady",
                    update: !0
                })
            },
            isOpenFlashCookie: function () {
                return !0
            }
        }
    })
})();
(function () {
    lib.Class("NewPlayHistory", {
        ns: lib.action,
        extend: lib.action.Adapter,
        construct: function (a, b) {
            this.callsuper(a, b);
            lib.action.NewPlayHistory.instance = this;
            this.playNextVideoStatic = this.playNextVideo.bind(this);
            this.history2stringStatic = this.history2string.bind(this);
            this.getClearStatic = this.getClear.bind(this)
        },
        properties: {
            PLAYER_ID: "flash",
            INFO: window.info || {},
            haveNextVideo: !1,
            cookieName: "hasImportHistory",
            loginedFlag: "loginedTip",
            unloginFlag: "unloginTip"
        },
        methods: {
            playNextVideo: function (a, b, d) {
                this.haveNextVideo = !0;
                this.refreshCurrent(a, b, d)
            },
            history2string: function () {
                for (var a = this._model._data.list, b = a.length, d = [], e = 0; e < b; e++) d.push([a[e].videoName, a[e].videoPlayUrl, a[e].videoPlayTime, a[e].videoId].join("*"));
                return d.join("|")
            },
            initized: function () {
                this._model.initizedSwf.apply(this._model)
            },
            refreshHistory: function () {
                this._model.rerfeshHistory.apply(this._model)
            },
            refreshCurrent: function () {
                this._model.refreshCurrent.apply(this._model, arguments)
            },
            readHistory: function (a) {
                this._model.readHistory(a)
            },
            deleteHistory: function (a) {
                this._model.deleteHistory(a)
            },
            importHistory: function () {
                this._model.importHistory()
            },
            clearHistory: function () {
                this._model.clearHistory()
            },
            setLoading: function (a, b, d) {
                this.syncSet({
                    loading: {
                        position: b,
                        ing: d,
                        loadMsg: a,
                        update: !0
                    },
                    type: "setLoading"
                })
            },
            getClear: function () {
                return this._view.getClear()
            },
            getPlayer: function () {
                return this._view.getPlayer()
            },
            getCurrentInfo: function () {
                return Object.extend({}, this._model.currentCache)
            },
            isFinalPlayer: function () {
                return !!$("#flashArea")
            },
            getAlbum: function (a, b) {
                this._model.albumHistory(a, b)
            },
            isOpenFlashCookie: function () {
                return this._model.isOpenFlashCookie.call(this._model)
            },
            getLocalHistory: function () {
                return this._model._getLocalJSON.call(this._model)
            },
            openImport: function () {
                this.syncSet({
                    type: "openImport",
                    update: !0
                })
            },
            closeImport: function () {
                this.syncSet({
                    type: "closeImport",
                    update: !0
                })
            },
            clearLastLoadTime: function () {
                this._model.clearLastLoadTime()
            },
            notice2swf: function (a) {
                a && this._model._notice("userLogined", {
                    uid: a
                });
                this.getPlayer() && this.getPlayer().userLogined && this.getPlayer().userLogined(lib.component.login.isLogin(), a || "-1")
            }
        }
    })
})();
(function () {
    lib.Class("NewIpadPlayHistory", {
        ns: lib.action,
        extend: lib.action.NewPlayHistory,
        construct: function (a, b) {
            this.callsuper(a, b)
        },
        methods: {
            recordInterval: function (a) {
                var a = Math.round(a.target.currentTime),
                    b = this._model,
                    d = a % b.localInterval;
                b._newTime = a;
                if (a != 0 && b._newTime != b._lastTime && d == 0) b._lastTime = a, b.currentCache.videoDuration - a <= 30 ? b.writeHistoryCache(0) : b.writeHistoryCache(a)
            },
            getLastTime: function (a) {
                var b = this._model;
                $(a.target).un("timeupdate").on("timeupdate", this.recordInterval.bind(this));
                b.continued || this.continuePlay(a)
            },
            continuePlay: function (a) {
                var b = this._model,
                    d = a.target,
                    e, f = function () {
                        try {
                            clearTimeout(e), d.currentTime = b.currentCache.videoPlayTime
                        } catch (a) {
                            e = setTimeout(f, 0)
                        }
                    };
                b.currentCache.videoPlayTime && b.currentCache.videoPlayTime > 0 ? (f(), b.continued = !0, b.moveItem2First()) : this._playStart()
            },
            readCurrent: function () {
                this._model.getHistory2Cache()
            },
            _playStart: function () {
                this._model.writeHistoryCache(-1)
            },
            playEnd: function () {
                this._model.writeHistoryCache(0)
            },
            loadCrossdomainSrorage: function (a) {
                this._model._getStorage.call(this._model, a)
            },
            notice2swf: function () {
                return "i'm html5"
            }
        }
    })
})();
(function () {
    var a, b, d, e;
    try {
        e = !! top.lib.action.NewPlayHistory.instance
    } catch (f) {
        e = !1
    }
    $("#topT1") && !e && (lib.ipad || lib.noFlashAndroid ? (e = new lib.kit.Monitor(function () {
        if ($("#flashArea")) try {
            if (a = lib.$("#video")[0], !a) return !1
        } catch (e) {
            return !1
        }
        b = new lib.model.NewIpadPlayHistoryModel;
        d = new lib.view.NewIpadPlayHistoryView;
        new lib.action.NewIpadPlayHistory(b, d);
        return !0
    }, {
        time: 200
    }), e.start()) : (b = new lib.model.NewPlayHistoryModel, d = new lib.view.NewPlayHistoryView, new lib.action.NewPlayHistory(b, d)))
})();
lib.Class("ClearSwf", {
    ns: lib.action,
    statics: {
        CLEAR_URL: ((new lib.kit.Url(window.location.href)).getParam("clear") || "http://www.qiyi.com/player/20120312171446/clear.swf") + "?ran=" + Math.random(),
        CLEAR_ID: "clearSwf",
        get: function () {
            var a = lib.action.ClearSwf.CLEAR_ID;
            return window[a] || document[a] || document.getElementById(a)
        },
        getId: function () {
            return lib.action.ClearSwf.CLEAR_ID
        },
        load: function () {
            if (!$("#qiyiClearSwf")) {
                var a = document.createElement("div");
                Object.extend(a.style, {
                    left: "-10000px",
                    position: "absolute"
                });
                document.body.insertBefore(a, null);
                a.setAttribute("id", "qiyiClearSwf");
                a.innerHTML = lib.kit.video.render("width", 1, "height", 1, "src", lib.action.ClearSwf.CLEAR_URL, "id", lib.action.ClearSwf.CLEAR_ID, "movie", lib.action.ClearSwf.CLEAR_URL, "align", "middle", "isstr", !0, "FlashVars", "UUIDDuration=8000")
            }
            lib._PAGE_EVENT.on("tempclearload", function () {
                lib._PAGE_EVENT.fire({
                    type: "clearload"
                })
            });
            this.loadTempClear()
        },
        loadTempClear: function () {
            if (!$("#qiyiTempClearSwf")) {
                var a = document.createElement("div");
                Object.extend(a.style, {
                    left: "-10000px",
                    position: "absolute"
                });
                document.body.insertBefore(a, null);
                var b = lib.action.ClearSwf.CLEAR_URL.replace(/www.qiyi.com/, "www.iqiyi.com");
                a.setAttribute("id", "qiyiTempClearSwf");
                a.innerHTML = lib.kit.video.render("width", 1, "height", 1, "src", b, "id", "tempClearSwf", "movie", b, "align", "middle", "isstr", !0, "FlashVars", "UUIDDuration=8000");
                (new lib.kit.Monitor(function () {
                    if (!lib.$("#tempClearSwf")[0].notice) return !1;
                    lib._PAGE_EVENT.fire({
                        type: "tempclearload"
                    })
                })).start()
            }
        }
    }
});
(function () {
    lib.swf.postServerUID = function (a) {
        lib.qa_postServerUID = a
    };
    lib.ipad || lib.action.ClearSwf.load()
})();
(function () {
    lib.Class("FloaterModel", {
        ns: lib.model,
        extend: lib.model.Model,
        methods: {
            init: function () {
                this._data = {
                    display: !1
                }
            }
        }
    })
})();
(function () {
    lib.Class("FloaterView", {
        ns: lib.view,
        extend: lib.view.View,
        construct: function (a) {
            this.callsuper(a);
            this.doOnresize(a)
        },
        methods: {
            init: function (a) {
                this._ctrl = a;
                this._elem = lib.Element.create("div");
                this._elem.css("position", "absolute");
                this._elem.css("zIndex", "100");
                this._elem.css("overflow", "hidden");
                this._elem.css("visibility", "hidden");
                lib.$(document.body).append(this._elem)
            },
            update: function (a) {
                a.display ? (this.build(a), this.show(), this.showCover(), this.adjustPosition(), this.playAnim()) : (this.hide(), this.hideCover())
            },
            getFloater: function () {
                return this._elem
            },
            build: function (a) {
                if (a.id) {
                    if (a = lib.$("#" + a.id)) this._elem.append(a), a.show()
                } else a.html && this._elem.html(a.html)
            },
            pos: function (a) {
                this._elem.pos(a)
            },
            show: function () {
                this._elem.css("visibility", "visible");
                this.hidePlayer()
            },
            hide: function () {
                this._elem.css("visibility", "hidden");
                this.showPlayer()
            },
            showPlayer: function () {
                lib.ipad || lib._PLAYER_WMODE_SP && lib._PLAYER_WMODE_SP.hide()
            },
            hidePlayer: function () {
                lib.ipad || lib._PLAYER_WMODE_SP && lib._PLAYER_WMODE_SP.show()
            },
            destroy: function () {
                this._removeEvent();
                this._removeDom()
            },
            adjustPosition: function () {
                var a = this;
                setTimeout(function () {
                    lib.ui.viewCenter(a._elem[0]);
                    a._elem.box().top < 0 && a._elem.css("top", "30px")
                }, 0)
            },
            showCover: function () {
                this._cover = lib.kit.Overlay.create({
                    color: "#000"
                })
            },
            hideCover: function () {
                lib.kit.Overlay.destroy(this._cover)
            },
            playAnim: function () {},
            _removeDom: function () {
                this._elem.remove()
            },
            _removeEvent: function () {
                if (this.winObj) this.winObj.un("resize", this.adjustPosition), this.winObj = null
            },
            isOpen: function () {
                return this._elem.css("visibility") == "visible"
            },
            doOnresize: function (a) {
                if (a && a.isResize) this.winObj = lib.$(window), this.winObj.on("resize", this.adjustPosition.bind(this))
            }
        }
    })
})();
(function () {
    lib.Class("Floater", {
        ns: lib.action,
        extend: lib.action.Adapter,
        construct: function (a, b) {
            a = a || new lib.model.FloaterModel;
            b = b || new lib.view.FloaterView;
            this.callsuper(a, b);
            this._valid = !0
        },
        methods: {
            show: function (a) {
                a = a || {};
                Object.extend(a, {
                    display: !0
                });
                this._model.set(a);
                this.syncGet()
            },
            hide: function () {
                this._model.set({
                    display: !1
                });
                this.syncGet()
            },
            pos: function (a) {
                this._view.pos(a)
            },
            getFloater: function () {
                return this._view.getFloater()
            },
            destroy: function () {
                this.hide();
                if (this._valid) this._model.destroy && this._model.destroy(), this._view.destroy && this._view.destroy(), this._valid = !1
            },
            isValid: function () {
                return this._valid
            },
            isOpen: function () {
                return this._view.isOpen()
            }
        }
    })
})();
(function () {
    lib.Class("RightBottomFloaterView", {
        ns: lib.view,
        extend: lib.view.FloaterView,
        methods: {
            init: function () {
                this.superclass.prototype.init.apply(this, arguments);
                this._loadedForFirstTime = !1;
                this._initEvent()
            },
            build: function () {
                this.superclass.prototype.build.apply(this, arguments);
                this._viewWidth = lib.box.getDocumentWidth()
            },
            adjustPosition: function () {
                var a = lib.box.getViewportHeight();
                this._elem.box();
                this._srcPos = {
                    right: 0,
                    top: a + lib.box.getPageScrollTop()
                };
                this._elem.pos(this._srcPos);
                this.showAnim()
            },
            showAnim: function () {
                if (this._srcPos) {
                    var a = this._elem;
                    a.box();
                    this._destPos = {
                        top: this._srcPos.top - a.box().height,
                        right: this._srcPos.right
                    };
                    a = lib.ui.Anim(a);
                    a.duration(500);
                    a.ease("Expo.easeOut");
                    !this._loadedForFirstTime && (a.from("top", this._srcPos.top).to("top", this._destPos.top).go(), 1) || this._elem.pos(this._destPos);
                    this._loadedForFirstTime = !0
                }
            },
            hideAnim: function () {
                if (this._srcPos && this._destPos) {
                    var a = lib.ui.Anim(this._elem);
                    a.duration(500);
                    a.ease("Expo.easeOut");
                    a.from("top", this._destPos.top).to("top", this._srcPos.top).go().onDone(function () {})
                }
            },
            showCover: function () {},
            hideCover: function () {},
            _initEvent: function () {
                var a = this.adjustPosition.bind(this);
                $(window).on("resize", a);
                $(window).on("scroll", a)
            }
        }
    })
})();
(function () {
    lib.Class("DueVipFloater", {
        ns: lib.action,
        extend: lib.action.Floater,
        construct: function (a) {
            this.callsuper(a, new lib.view.RightBottomFloaterView)
        },
        methods: {
            initInfo: function () {
                var a = [];
                a.push('<div style="width:275px; height:95px; border:4px solid #dbdbdb; background-color:#fff; padding:15px; color:#6c6c6c;">');
                a.push('  <div style="height:16px; margin-bottom:15px;">');
                a.push("      <div style=\"float:left; color:#58a800; font:bold 14px/16px '\u5b8b\u4f53'\">\u4f1a\u5458\u5230\u671f\u63d0\u9192</div>");
                a.push('      <a id="dueVip_closeBut" href="#" style="float:right; display:block;"><img style="border:none;" src="http://www.qiyipic.com/vip/fix/popClose.gif" /></a>');
                a.push("  </div>");
                this.vipInfo.isExpire ? a.push('  <div style="font-size:12px; clear:both;">\u60a8\u7684\u5947\u827a\u4f1a\u5458<font style="color:#f26700; font-weight:bold;">\u5df2\u8fc7\u671f</font>\uff0c\u65e0\u6cd5\u7ee7\u7eed\u4f7f\u7528\u4f1a\u5458\u7279\u6743\u3002</div>') : a.push('  <div style="font-size:12px; clear:both;">\u60a8\u7684\u5947\u827a\u4f1a\u5458\u5c06\u4e8e<font style="color:#f26700; font-weight:bold;">' + this.vipInfo.vipInfo.deadline.replace("\u5e74", "/").replace("\u6708", "/").replace("\u65e5", "") + "</font>\u8fc7\u671f\uff0c\u8bf7\u53ca\u65f6\u7eed\u8d39\u3002</div>");
                a.push('  <div style="padding-top:20px;font-size:12px;height:26px;">');
                a.push('    <span style="float:left; line-height:21px; margin-top:5px;"><input id="j-continueNotice" style="vertical-align:middle;margin-top:-2px;*margin-top:-1px;_margin-top:-3px;margin-right:3px; margin-left:0; width:12px;" type="checkbox" />\u4e0d\u518d\u63d0\u9192</span>');
                a.push('    <a id="j-noticeVip" href="http://serv.vip.iqiyi.com/order/guide.action?pid=a0226bd958843452&cid=afbe8fd3d73448c9&platform=b6c13e26323c537d&fr=IQY-VIP-0101&fc=b780b6da8588dd48" style="background:url(http://www.qiyipic.com/common/fix/dingyue_images/dingyueIcon.png) no-repeat 0 -46px; width:75px; height:26px; line-height:26px; display:inline-block; text-align:center; color:#fff; font-size:12px; text-decoration:none;float:right;">\u7acb\u5373\u7eed\u8d39</a>');
                a.push("  </div>");
                a.push("</div>");
                this.show({
                    html: a.join("")
                });
                this.bindEvent()
            },
            bindEvent: function () {
                this.closeBut = lib.$("#dueVip_closeBut");
                this.closeBut.on("click", this.closeButClick.bind(this));
                this.continueNoticeCheckbox = lib.$("#j-continueNotice");
                this.continueNoticeCheckbox.on("click", this.checkContinueNotice.bind(this))
            },
            closeButClick: function (a) {
                this.destroy();
                lib.Event.stop(a)
            },
            checkContinueNotice: function () {
                var a = this.continueNoticeCheckbox[0].checked,
                    b = lib.component.login.getUserInfo();
                a ? lib.cookie.set("vip-contNoti" + b.uid, "false", 8640, "/", lib.SITE_DOMAIN) : lib.cookie.set("vip-contNoti" + b.uid, "true", 8640, "/", lib.SITE_DOMAIN)
            },
            setVipInfo: function (a) {
                this.vipInfo = a
            }
        }
    })
})();
(function () {
    function a() {
        (new lib.kit.Monitor(function () {
            if (lib.component.login.vipInfo === void 0) return !1;
            if (lib.component.login.vipInfo && lib.component.login.vipInfo.remind == 1 && lib.component.login.vipInfo.type == "prepay") {
                var a = lib.component.login.getUserInfo();
                lib.cookie.get("vip-contNoti" + a.uid) != "false" && (a = new lib.action.DueVipFloater, a.setVipInfo(lib.component.login), a.initInfo())
            }
        })).start()
    }
    lib.component.login.isLogin() && a();
    lib.component.login.setCallback("login", function () {
        a()
    })
})();
(function (a) {
    function b(a) {
        lib.eventTarget.call(this);
        this._initEvent();
        this.box = a
    }
    function d(a) {
        b.call(this, a.parent());
        this.ele = a
    }
    function e(a, d) {
        b.call(this, a);
        this.ele = a;
        this.path = d;
        this.tempImg = null
    }
    function f() {
        this._allImgs = [];
        this._check = this.check.bind(this)
    }
    function g(a, d) {
        b.call(this, a);
        this.ele = a;
        this.fn = d
    }
    lib.action.lazyLoad = b;
    b.inherits(lib.eventTarget);
    Object.extend(b.prototype, {
        _initEvent: function () {
            this._check = this.check.bind(this);
            $(a).on("scroll", this._check);
            $(a).on("resize", this._check);
            document.addEventListener && document.addEventListener("DOMContentLoaded", this._check, !1);
            $(a).on("load", this._check)
        },
        release: function () {
            this._check && ($(a).un("scroll", this._check), $(a).un("resize", this._check), document.removeEventListener && document.removeEventListener("DOMContentLoaded", this._check, !1), $(a).un("load", this._check))
        },
        check: function () {
            var a = lib.box.getViewportHeight() + lib.box.getPageScrollTop();
            this.box.pos().top <= a ? (this.fire({
                type: "within"
            }), this.within()) : (this.fire({
                type: "without"
            }), this.without())
        },
        within: function () {},
        without: function () {}
    });
    lib.action.lazyRender = d;
    d.inherits(b);
    Object.extend(d.prototype, {
        within: function () {
            var a = this.ele.val();
            a && this.box.html(a);
            this.release()
        }
    });
    e.inherits(b);
    Object.extend(e.prototype, {
        within: function () {
            this.tempImg = new Image;
            this.tempImg.onload = this._imgOnload.bind(this);
            this.tempImg.src = this.path;
            this.release()
        },
        _imgOnload: function () {
            this.tempImg = this.tempImg.onload = null
        }
    });
    Object.extend(f.prototype, {
        init: function (b) {
            if (b != null) {
                for (var b = b.elements(), d = 0, e = b.length; d < e; d++) {
                    var f = b[d];
                    if (!f.getAttribute("src")) {
                        f._pos = $(f).pos();
                        var g = f.getAttribute("data-lazy"),
                            m = lib.$(f).box(),
                            n = m.right;
                        (m.left > 0 || n > 0) && g.indexOf("cache") === -1 && this._allImgs.push(f)
                    }
                }
                this.check();
                if (this._allImgs.length > 0) {
                    if (!this._scroll) $(a).on("scroll", this._check), $(a).on("resize", this._check), this._scroll = !0
                } else $(a).un("scroll", this._check), $(a).un("resize", this._check), this._scroll = !1
            }
        },
        showImg: function (b) {
            var d = b.getAttribute("data-lazy");
            if (d && (b.src = d, a.location.href.indexOf("debug=lazyload") !== -1)) b.style.border = "1px solid #f00";
            this._allImgs.del(b)
        },
        check: function () {
            if (this._allImgs.length == 0) $(a).un("scroll", this._check), $(a).un("resize", this._check), this._scroll = !1;
            var b = this._allImgs;
            lib.box.getPageScrollTop();
            lib.box.getViewportHeight();
            for (len = b.length; len > 0; len--) {
                var d = b[len - 1],
                    e = lib.$(d).box(),
                    f = e.right;
                (e.left > 0 || f > 0) && this.showImg(d)
            }
        }
    });
    g.inherits(b);
    Object.extend(g.prototype, {
        within: function () {
            this.fn();
            this.release()
        }
    });
    lib.action.lazy = lib.action.lazy || {
        init: function (a, b) {
            switch (a) {
            case "render":
                this._render();
                break;
            case "cache":
                this._cache();
                break;
            case "cb":
                this._callback(b);
                break;
            default:
                this._loadImg()
            }
        },
        _render: function () {
            var a = $("textarea[data-lazy='render']");
            if (a) for (var b = 0; b < a.length; b++) new d($(a[b]))
        },
        _cache: function () {
            var a = $("img[data-lazy]"),
                b = "";
            if (a) for (var d = 0; d < a.length; d++) b = a[d].getAttribute("data-lazy"), b.indexOf("cache") === 0 && b.slice(6).trim() !== "" && new e($(a[d]), b.slice(6).trim())
        },
        _loadImg: function () {
            var a = lib.$("img[data-lazy]");
            this._LazyImg = new f;
            a && this._LazyImg.init(a)
        },
        add: function () {
            var a = lib.$("img[data-lazy]");
            this._LazyImg && a && this._LazyImg.init(a)
        },
        _callback: function (a) {
            a.cb && a.ele && new g(a.ele, a.cb)
        }
    }
})(this);
(function () {
    lib.action.lazy.init();
    lib.action.lazy.init("render");
    lib._PAGE_EVENT.on("rerender", function () {
        lib.action.lazy.add()
    })
})();
lib.kit.newJob("relogin", function () {
    if (lib.component.login.isLogin()) {
        $(document.body).html("beforeend", '<iframe id="j_checkLogin_" style="display:none;"></iframe>');
        var a = $("#j_checkLogin_"),
            b = setTimeout(function () {
                try {
                    a.remove()
                } catch (b) {}
            }, 5E3);
        a && (a.on("load", function () {
            b && clearTimeout(b);
            setTimeout(function () {
                try {
                    a.remove()
                } catch (b) {}
            }, 0)
        }), a.attr("src", "http://passport." + lib.SITE_DOMAIN + "/user/doublelogin.php"))
    }
});
lib._PAGE_JOB.add("relogin");
(function () {
    lib.kit.newJob("derestrict", function () {
        lib._PAGE_EVENT.on("beforesearch", function (a) {
            a.data.keyword == "QIYICOM" && (lib.kit.FlashCall({
                flashID: "clearSwf",
                functionName: "notice",
                parameter: JSON.stringify({
                    type: "derestrict"
                })
            }), lib.cookie.set("iplimit", "0", 720, "/", lib.SITE_DOMAIN))
        })
    });
    lib._PAGE_JOB.add("derestrict")
})();
(function () {})();
