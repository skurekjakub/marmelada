function _typeof2(t){return _typeof2="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},_typeof2(t)}function _typeof(t){return _typeof="function"==typeof Symbol&&"symbol"==_typeof2(Symbol.iterator)?function(t){return _typeof2(t)}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":_typeof2(t)},_typeof(t);
/*!
   * Snackbar v0.1.14
   * http://polonel.com/Snackbar
   *
   * Copyright 2018 Chris Brame and other contributors
   * Released under the MIT license
   * https://github.com/polonel/Snackbar/blob/master/LICENSE
   */}!function(t,e){"use strict";"function"==typeof define&&define.amd?define([],(function(){return t.Snackbar=e()})):"object"===("undefined"==typeof module?"undefined":_typeof(module))&&module.exports?module.exports=t.Snackbar=e():t.Snackbar=e()}(this,(function(){var t={current:null},e={text:"Default Text",textColor:"#FFFFFF",width:"auto",showAction:!0,actionText:"Dismiss",actionTextAria:"Dismiss, Description for Screen Readers",alertScreenReader:!1,actionTextColor:"#4CAF50",showSecondButton:!1,secondButtonText:"",secondButtonAria:"Description for Screen Readers",secondButtonTextColor:"#4CAF50",backgroundColor:"#323232",pos:"bottom-left",duration:5e3,customClass:"",onActionClick:function(t){t.style.opacity=0},onSecondButtonClick:function(t){},onClose:function(t){}};t.show=function(n){var r=o(!0,e,n);t.current&&(t.current.style.opacity=0,setTimeout(function(){var t=this.parentElement;t&&t.removeChild(this)}.bind(t.current),500)),t.snackbar=document.createElement("div"),t.snackbar.className="snackbar-container "+r.customClass,t.snackbar.style.width=r.width;var c=document.createElement("p");if(c.style.margin=0,c.style.padding=0,c.style.color=r.textColor,c.style.lineHeight="1em",c.innerHTML=r.text,t.snackbar.appendChild(c),t.snackbar.style.background=r.backgroundColor,r.showSecondButton){var a=document.createElement("button");a.className="action",a.innerHTML=r.secondButtonText,a.setAttribute("aria-label",r.secondButtonAria),a.style.color=r.secondButtonTextColor,a.addEventListener("click",(function(){r.onSecondButtonClick(t.snackbar)})),t.snackbar.appendChild(a)}if(r.showAction){var i=document.createElement("button");i.className="action",i.innerHTML=r.actionText,i.setAttribute("aria-label",r.actionTextAria),i.style.color=r.actionTextColor,i.addEventListener("click",(function(){r.onActionClick(t.snackbar)})),t.snackbar.appendChild(i)}r.duration&&setTimeout(function(){t.current===this&&(t.current.style.opacity=0,t.current.style.top="-100px",t.current.style.bottom="-100px")}.bind(t.snackbar),r.duration),r.alertScreenReader&&t.snackbar.setAttribute("role","alert"),t.snackbar.addEventListener("transitionend",function(e,o){"opacity"===e.propertyName&&"0"===this.style.opacity&&("function"==typeof r.onClose&&r.onClose(this),this.parentElement.removeChild(this),t.current===this&&(t.current=null))}.bind(t.snackbar)),t.current=t.snackbar,document.body.appendChild(t.snackbar),getComputedStyle(t.snackbar).bottom,getComputedStyle(t.snackbar).top,t.snackbar.style.opacity=1,t.snackbar.className="snackbar-container "+r.customClass+" snackbar-pos "+r.pos},t.close=function(){t.current&&(t.current.style.opacity=0)};var o=function t(){var e={},o=!1,n=0,r=arguments.length;"[object Boolean]"===Object.prototype.toString.call(arguments[0])&&(o=arguments[0],n++);for(var c=function(n){for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(o&&"[object Object]"===Object.prototype.toString.call(n[r])?e[r]=t(!0,e[r],n[r]):e[r]=n[r])};n<r;n++)c(arguments[n]);return e};return t}));