!function(e){"use strict";e.fn.scrollTree=function(s){var a,n={contextPath:"/",css:{ancestor:"active",current:"active",leaf:"leaf",loading:"sp-loading",collapsed:"sp-collapsed",expanded:"sp-expanded",error:"sp-error"},renderChildrenUl:function(){return'<ul class="nav"></ul>'},renderChildLi:function(e,s){return'<li class="'+s.css[e.type]+'"><span class="sp-toggle"></span><a href="'+e.link+'">'+SCROLL_WEBHELP.escapeHtml(e.title)+"</a></li>"}},t=e(this).data("viewportId"),l=e(this).data("root"),r=e(this).data("current"),d=e(this).data("confluenceid"),c=e(this).data("currenttitle"),i=isDevModelSwitcherSupported();if(i){var o=getCurrentDevModel();0===o.indexOf("all|")&&(o=o.split("|")[1]),a="mvc"===o?"pe":"mvc"}var p=e.extend(!0,n,s);return this.each((function(){var s=e(this);return f(s,l,c,r),function(s){s.on("click",".sp-toggle",(function(){var s=e(this).parent("li");s.is("."+p.css.collapsed)?function(s){if(s.has("ul").length)s.removeClass(p.css.collapsed).addClass(p.css.expanded);else{var n=e(p.renderChildrenUl()).appendTo(s);i?function(s,n,t){var l=s.closest("li");l&&l.removeClass(p.css.collapsed).addClass(p.css.loading);e.get(p.contextPath+"/rest/treefilter/1.0/getchildren",{spaceId:d,parent:n||l.find("> a").text(),parentLink:l.find("> a").attr("href"),label:a}).done((function(e){C(s,e),l.removeClass(p.css.loading).addClass(p.css.expanded)})).fail((function(e,s,a){l.removeClass(p.css.loading).addClass(p.css.error)}))}(n):f(n)}}(s):s.is("."+p.css.expanded)&&function(e){e.removeClass(p.css.expanded).addClass(p.css.collapsed)}(s)}))}(s),this}));function f(s,n,r,c){var o=s.closest("li");o&&o.removeClass(p.css.collapsed).addClass(p.css.loading),i?e.get(p.contextPath+"/rest/treefilter/1.0/getchildrenrecursive",{spaceId:d,parent:n||o.find("> a").text(),current:r||"",label:a,isLatest:CONFIG.CONFLUENCE_SPACE_KEY===CONFIG.DOC_ROOT_URL_SPACE_KEY}).done((function(e){C(s,e),o.removeClass(p.css.loading).addClass(p.css.expanded)})).fail((function(e,s,a){o.removeClass(p.css.loading).addClass(p.css.error)})):e.get(p.contextPath+"/rest/scroll-viewport/1.0/tree/children",{viewportId:t,root:l,parent:n||o.find("> a").attr("href"),current:c||""}).done((function(e){C(s,e),o.removeClass(p.css.loading).addClass(p.css.expanded)})).fail((function(e,s,a){o.removeClass(p.css.loading).addClass(p.css.error)}))}function C(s,a){s.html(""),e.each(a,(function(a,n){var t=e(p.renderChildLi(n,p)).appendTo(s);n.children?n.children.length?(t.addClass(p.css.expanded),C(e(p.renderChildrenUl()).appendTo(t),n.children)):t.addClass(p.css.collapsed):t.addClass(p.css.leaf)}))}}}($);