/**
 * @license
 * lodash lodash.com/license | Underscore.js 1.8.3 underscorejs.org/LICENSE
 */
;(function(){function t(t,n){return t.set(n[0],n[1]),t}function n(t,n){return t.add(n),t}function r(t,n,r){switch(r.length){case 0:return t.call(n);case 1:return t.call(n,r[0]);case 2:return t.call(n,r[0],r[1]);case 3:return t.call(n,r[0],r[1],r[2])}return t.apply(n,r)}function e(t,n,r,e){for(var u=-1,i=t?t.length:0;++u<i;){var o=t[u];n(e,o,r(o),t)}return e}function u(t,n){for(var r=-1,e=t?t.length:0;++r<e&&false!==n(t[r],r,t););return t}function i(t,n){for(var r=t?t.length:0;r--&&false!==n(t[r],r,t););
return t}function o(t,n){for(var r=-1,e=t?t.length:0;++r<e;)if(!n(t[r],r,t))return false;return true}function f(t,n){for(var r=-1,e=t?t.length:0,u=0,i=[];++r<e;){var o=t[r];n(o,r,t)&&(i[u++]=o)}return i}function c(t,n){return!(!t||!t.length)&&-1<d(t,n,0)}function a(t,n,r){for(var e=-1,u=t?t.length:0;++e<u;)if(r(n,t[e]))return true;return false}function l(t,n){for(var r=-1,e=t?t.length:0,u=Array(e);++r<e;)u[r]=n(t[r],r,t);return u}function s(t,n){for(var r=-1,e=n.length,u=t.length;++r<e;)t[u+r]=n[r];return t}function h(t,n,r,e){
var u=-1,i=t?t.length:0;for(e&&i&&(r=t[++u]);++u<i;)r=n(r,t[u],u,t);return r}function p(t,n,r,e){var u=t?t.length:0;for(e&&u&&(r=t[--u]);u--;)r=n(r,t[u],u,t);return r}function _(t,n){for(var r=-1,e=t?t.length:0;++r<e;)if(n(t[r],r,t))return true;return false}function v(t,n,r){var e;return r(t,function(t,r,u){if(n(t,r,u))return e=r,false}),e}function g(t,n,r,e){var u=t.length;for(r+=e?1:-1;e?r--:++r<u;)if(n(t[r],r,t))return r;return-1}function d(t,n,r){if(n===n)t:{--r;for(var e=t.length;++r<e;)if(t[r]===n){t=r;
break t}t=-1}else t=g(t,b,r);return t}function y(t,n,r,e){--r;for(var u=t.length;++r<u;)if(e(t[r],n))return r;return-1}function b(t){return t!==t}function x(t,n){var r=t?t.length:0;return r?k(t,n)/r:P}function j(t){return function(n){return null==n?F:n[t]}}function w(t){return function(n){return null==t?F:t[n]}}function m(t,n,r,e,u){return u(t,function(t,u,i){r=e?(e=false,t):n(r,t,u,i)}),r}function A(t,n){var r=t.length;for(t.sort(n);r--;)t[r]=t[r].c;return t}function k(t,n){for(var r,e=-1,u=t.length;++e<u;){
var i=n(t[e]);i!==F&&(r=r===F?i:r+i)}return r}function E(t,n){for(var r=-1,e=Array(t);++r<t;)e[r]=n(r);return e}function O(t,n){return l(n,function(n){return[n,t[n]]})}function S(t){return function(n){return t(n)}}function I(t,n){return l(n,function(n){return t[n]})}function R(t,n){return t.has(n)}function z(t,n){for(var r=-1,e=t.length;++r<e&&-1<d(n,t[r],0););return r}function W(t,n){for(var r=t.length;r--&&-1<d(n,t[r],0););return r}function B(t){return"\\"+Dt[t]}function L(t){var n=-1,r=Array(t.size);
return t.forEach(function(t,e){r[++n]=[e,t]}),r}function U(t,n){return function(r){return t(n(r))}}function C(t,n){for(var r=-1,e=t.length,u=0,i=[];++r<e;){var o=t[r];o!==n&&"__lodash_placeholder__"!==o||(t[r]="__lodash_placeholder__",i[u++]=r)}return i}function M(t){var n=-1,r=Array(t.size);return t.forEach(function(t){r[++n]=t}),r}function D(t){var n=-1,r=Array(t.size);return t.forEach(function(t){r[++n]=[t,t]}),r}function T(t){if(Wt.test(t)){for(var n=Rt.lastIndex=0;Rt.test(t);)++n;t=n}else t=tn(t);
return t}function $(t){return Wt.test(t)?t.match(Rt)||[]:t.split("")}var F,N=1/0,P=NaN,Z=[["ary",128],["bind",1],["bindKey",2],["curry",8],["curryRight",16],["flip",512],["partial",32],["partialRight",64],["rearg",256]],q=/\b__p\+='';/g,V=/\b(__p\+=)''\+/g,K=/(__e\(.*?\)|\b__t\))\+'';/g,G=/&(?:amp|lt|gt|quot|#39);/g,J=/[&<>"']/g,Y=RegExp(G.source),H=RegExp(J.source),Q=/<%-([\s\S]+?)%>/g,X=/<%([\s\S]+?)%>/g,tt=/<%=([\s\S]+?)%>/g,nt=/\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,rt=/^\w*$/,et=/^\./,ut=/[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,it=/[\\^$.*+?()[\]{}|]/g,ot=RegExp(it.source),ft=/^\s+|\s+$/g,ct=/^\s+/,at=/\s+$/,lt=/\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/,st=/\{\n\/\* \[wrapped with (.+)\] \*/,ht=/,? & /,pt=/[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g,_t=/\\(\\)?/g,vt=/\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g,gt=/\w*$/,dt=/^[-+]0x[0-9a-f]+$/i,yt=/^0b[01]+$/i,bt=/^\[object .+?Constructor\]$/,xt=/^0o[0-7]+$/i,jt=/^(?:0|[1-9]\d*)$/,wt=/[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g,mt=/($^)/,At=/['\n\r\u2028\u2029\\]/g,kt="[\\ufe0e\\ufe0f]?(?:[\\u0300-\\u036f\\ufe20-\\ufe23\\u20d0-\\u20f0]|\\ud83c[\\udffb-\\udfff])?(?:\\u200d(?:[^\\ud800-\\udfff]|(?:\\ud83c[\\udde6-\\uddff]){2}|[\\ud800-\\udbff][\\udc00-\\udfff])[\\ufe0e\\ufe0f]?(?:[\\u0300-\\u036f\\ufe20-\\ufe23\\u20d0-\\u20f0]|\\ud83c[\\udffb-\\udfff])?)*",Et="(?:[\\u2700-\\u27bf]|(?:\\ud83c[\\udde6-\\uddff]){2}|[\\ud800-\\udbff][\\udc00-\\udfff])"+kt,Ot="(?:[^\\ud800-\\udfff][\\u0300-\\u036f\\ufe20-\\ufe23\\u20d0-\\u20f0]?|[\\u0300-\\u036f\\ufe20-\\ufe23\\u20d0-\\u20f0]|(?:\\ud83c[\\udde6-\\uddff]){2}|[\\ud800-\\udbff][\\udc00-\\udfff]|[\\ud800-\\udfff])",St=RegExp("['\u2019]","g"),It=RegExp("[\\u0300-\\u036f\\ufe20-\\ufe23\\u20d0-\\u20f0]","g"),Rt=RegExp("\\ud83c[\\udffb-\\udfff](?=\\ud83c[\\udffb-\\udfff])|"+Ot+kt,"g"),zt=RegExp(["[A-Z\\xc0-\\xd6\\xd8-\\xde]?[a-z\\xdf-\\xf6\\xf8-\\xff]+(?:['\u2019](?:d|ll|m|re|s|t|ve))?(?=[\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000]|[A-Z\\xc0-\\xd6\\xd8-\\xde]|$)|(?:[A-Z\\xc0-\\xd6\\xd8-\\xde]|[^\\ud800-\\udfff\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000\\d+\\u2700-\\u27bfa-z\\xdf-\\xf6\\xf8-\\xffA-Z\\xc0-\\xd6\\xd8-\\xde])+(?:['\u2019](?:D|LL|M|RE|S|T|VE))?(?=[\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000]|[A-Z\\xc0-\\xd6\\xd8-\\xde](?:[a-z\\xdf-\\xf6\\xf8-\\xff]|[^\\ud800-\\udfff\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000\\d+\\u2700-\\u27bfa-z\\xdf-\\xf6\\xf8-\\xffA-Z\\xc0-\\xd6\\xd8-\\xde])|$)|[A-Z\\xc0-\\xd6\\xd8-\\xde]?(?:[a-z\\xdf-\\xf6\\xf8-\\xff]|[^\\ud800-\\udfff\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000\\d+\\u2700-\\u27bfa-z\\xdf-\\xf6\\xf8-\\xffA-Z\\xc0-\\xd6\\xd8-\\xde])+(?:['\u2019](?:d|ll|m|re|s|t|ve))?|[A-Z\\xc0-\\xd6\\xd8-\\xde]+(?:['\u2019](?:D|LL|M|RE|S|T|VE))?|\\d+",Et].join("|"),"g"),Wt=RegExp("[\\u200d\\ud800-\\udfff\\u0300-\\u036f\\ufe20-\\ufe23\\u20d0-\\u20f0\\ufe0e\\ufe0f]"),Bt=/[a-z][A-Z]|[A-Z]{2,}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/,Lt="Array Buffer DataView Date Error Float32Array Float64Array Function Int8Array Int16Array Int32Array Map Math Object Promise RegExp Set String Symbol TypeError Uint8Array Uint8ClampedArray Uint16Array Uint32Array WeakMap _ clearTimeout isFinite parseInt setTimeout".split(" "),Ut={};
Ut["[object Float32Array]"]=Ut["[object Float64Array]"]=Ut["[object Int8Array]"]=Ut["[object Int16Array]"]=Ut["[object Int32Array]"]=Ut["[object Uint8Array]"]=Ut["[object Uint8ClampedArray]"]=Ut["[object Uint16Array]"]=Ut["[object Uint32Array]"]=true,Ut["[object Arguments]"]=Ut["[object Array]"]=Ut["[object ArrayBuffer]"]=Ut["[object Boolean]"]=Ut["[object DataView]"]=Ut["[object Date]"]=Ut["[object Error]"]=Ut["[object Function]"]=Ut["[object Map]"]=Ut["[object Number]"]=Ut["[object Object]"]=Ut["[object RegExp]"]=Ut["[object Set]"]=Ut["[object String]"]=Ut["[object WeakMap]"]=false;
var Ct={};Ct["[object Arguments]"]=Ct["[object Array]"]=Ct["[object ArrayBuffer]"]=Ct["[object DataView]"]=Ct["[object Boolean]"]=Ct["[object Date]"]=Ct["[object Float32Array]"]=Ct["[object Float64Array]"]=Ct["[object Int8Array]"]=Ct["[object Int16Array]"]=Ct["[object Int32Array]"]=Ct["[object Map]"]=Ct["[object Number]"]=Ct["[object Object]"]=Ct["[object RegExp]"]=Ct["[object Set]"]=Ct["[object String]"]=Ct["[object Symbol]"]=Ct["[object Uint8Array]"]=Ct["[object Uint8ClampedArray]"]=Ct["[object Uint16Array]"]=Ct["[object Uint32Array]"]=true,
Ct["[object Error]"]=Ct["[object Function]"]=Ct["[object WeakMap]"]=false;var Mt,Dt={"\\":"\\","'":"'","\n":"n","\r":"r","\u2028":"u2028","\u2029":"u2029"},Tt=parseFloat,$t=parseInt,Ft=typeof global=="object"&&global&&global.Object===Object&&global,Nt=typeof self=="object"&&self&&self.Object===Object&&self,Pt=Ft||Nt||Function("return this")(),Zt=typeof exports=="object"&&exports&&!exports.nodeType&&exports,qt=Zt&&typeof module=="object"&&module&&!module.nodeType&&module,Vt=qt&&qt.exports===Zt,Kt=Vt&&Ft.h;
t:{try{Mt=Kt&&Kt.g("util");break t}catch(t){}Mt=void 0}var Gt=Mt&&Mt.isArrayBuffer,Jt=Mt&&Mt.isDate,Yt=Mt&&Mt.isMap,Ht=Mt&&Mt.isRegExp,Qt=Mt&&Mt.isSet,Xt=Mt&&Mt.isTypedArray,tn=j("length"),nn=w({"\xc0":"A","\xc1":"A","\xc2":"A","\xc3":"A","\xc4":"A","\xc5":"A","\xe0":"a","\xe1":"a","\xe2":"a","\xe3":"a","\xe4":"a","\xe5":"a","\xc7":"C","\xe7":"c","\xd0":"D","\xf0":"d","\xc8":"E","\xc9":"E","\xca":"E","\xcb":"E","\xe8":"e","\xe9":"e","\xea":"e","\xeb":"e","\xcc":"I","\xcd":"I","\xce":"I","\xcf":"I",
"\xec":"i","\xed":"i","\xee":"i","\xef":"i","\xd1":"N","\xf1":"n","\xd2":"O","\xd3":"O","\xd4":"O","\xd5":"O","\xd6":"O","\xd8":"O","\xf2":"o","\xf3":"o","\xf4":"o","\xf5":"o","\xf6":"o","\xf8":"o","\xd9":"U","\xda":"U","\xdb":"U","\xdc":"U","\xf9":"u","\xfa":"u","\xfb":"u","\xfc":"u","\xdd":"Y","\xfd":"y","\xff":"y","\xc6":"Ae","\xe6":"ae","\xde":"Th","\xfe":"th","\xdf":"ss","\u0100":"A","\u0102":"A","\u0104":"A","\u0101":"a","\u0103":"a","\u0105":"a","\u0106":"C","\u0108":"C","\u010a":"C","\u010c":"C",
"\u0107":"c","\u0109":"c","\u010b":"c","\u010d":"c","\u010e":"D","\u0110":"D","\u010f":"d","\u0111":"d","\u0112":"E","\u0114":"E","\u0116":"E","\u0118":"E","\u011a":"E","\u0113":"e","\u0115":"e","\u0117":"e","\u0119":"e","\u011b":"e","\u011c":"G","\u011e":"G","\u0120":"G","\u0122":"G","\u011d":"g","\u011f":"g","\u0121":"g","\u0123":"g","\u0124":"H","\u0126":"H","\u0125":"h","\u0127":"h","\u0128":"I","\u012a":"I","\u012c":"I","\u012e":"I","\u0130":"I","\u0129":"i","\u012b":"i","\u012d":"i","\u012f":"i",
"\u0131":"i","\u0134":"J","\u0135":"j","\u0136":"K","\u0137":"k","\u0138":"k","\u0139":"L","\u013b":"L","\u013d":"L","\u013f":"L","\u0141":"L","\u013a":"l","\u013c":"l","\u013e":"l","\u0140":"l","\u0142":"l","\u0143":"N","\u0145":"N","\u0147":"N","\u014a":"N","\u0144":"n","\u0146":"n","\u0148":"n","\u014b":"n","\u014c":"O","\u014e":"O","\u0150":"O","\u014d":"o","\u014f":"o","\u0151":"o","\u0154":"R","\u0156":"R","\u0158":"R","\u0155":"r","\u0157":"r","\u0159":"r","\u015a":"S","\u015c":"S","\u015e":"S",
"\u0160":"S","\u015b":"s","\u015d":"s","\u015f":"s","\u0161":"s","\u0162":"T","\u0164":"T","\u0166":"T","\u0163":"t","\u0165":"t","\u0167":"t","\u0168":"U","\u016a":"U","\u016c":"U","\u016e":"U","\u0170":"U","\u0172":"U","\u0169":"u","\u016b":"u","\u016d":"u","\u016f":"u","\u0171":"u","\u0173":"u","\u0174":"W","\u0175":"w","\u0176":"Y","\u0177":"y","\u0178":"Y","\u0179":"Z","\u017b":"Z","\u017d":"Z","\u017a":"z","\u017c":"z","\u017e":"z","\u0132":"IJ","\u0133":"ij","\u0152":"Oe","\u0153":"oe","\u0149":"'n",
"\u017f":"s"}),rn=w({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}),en=w({"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&#39;":"'"}),un=function w(kt){function Et(t){return fi.call(t)}function Ot(t){if(vu(t)&&!nf(t)&&!(t instanceof Dt)){if(t instanceof Mt)return t;if(ui.call(t,"__wrapped__"))return De(t)}return new Mt(t)}function Rt(){}function Mt(t,n){this.__wrapped__=t,this.__actions__=[],this.__chain__=!!n,this.__index__=0,this.__values__=F}function Dt(t){this.__wrapped__=t,this.__actions__=[],
this.__dir__=1,this.__filtered__=false,this.__iteratees__=[],this.__takeCount__=4294967295,this.__views__=[]}function Ft(t){var n=-1,r=t?t.length:0;for(this.clear();++n<r;){var e=t[n];this.set(e[0],e[1])}}function Nt(t){var n=-1,r=t?t.length:0;for(this.clear();++n<r;){var e=t[n];this.set(e[0],e[1])}}function Zt(t){var n=-1,r=t?t.length:0;for(this.clear();++n<r;){var e=t[n];this.set(e[0],e[1])}}function qt(t){var n=-1,r=t?t.length:0;for(this.__data__=new Zt;++n<r;)this.add(t[n])}function Kt(t){this.size=(this.__data__=new Nt(t)).size;
}function tn(t,n){var r,e=nf(t),u=!e&&tf(t),i=!e&&!u&&ef(t),o=!e&&!u&&!i&&af(t),u=(e=e||u||i||o)?E(t.length,Hu):[],f=u.length;for(r in t)!n&&!ui.call(t,r)||e&&("length"==r||i&&("offset"==r||"parent"==r)||o&&("buffer"==r||"byteLength"==r||"byteOffset"==r)||me(r,f))||u.push(r);return u}function on(t){var n=t.length;return n?t[cr(0,n-1)]:F}function fn(t,n){return Le(Cr(t),dn(n,0,t.length))}function cn(t){return Le(Cr(t))}function an(t,n,r,e){return t===F||fu(t,ti[r])&&!ui.call(e,r)?n:t}function ln(t,n,r){
(r===F||fu(t[n],r))&&(r!==F||n in t)||vn(t,n,r)}function sn(t,n,r){var e=t[n];ui.call(t,n)&&fu(e,r)&&(r!==F||n in t)||vn(t,n,r)}function hn(t,n){for(var r=t.length;r--;)if(fu(t[r][0],n))return r;return-1}function pn(t,n,r,e){return to(t,function(t,u,i){n(e,t,r(t),i)}),e}function _n(t,n){return t&&Mr(n,Iu(n),t)}function vn(t,n,r){"__proto__"==n&&xi?xi(t,n,{configurable:true,enumerable:true,value:r,writable:true}):t[n]=r}function gn(t,n){for(var r=-1,e=null==t,u=n.length,i=Zu(u);++r<u;)i[r]=e?F:Ou(t,n[r]);
return i}function dn(t,n,r){return t===t&&(r!==F&&(t=t<=r?t:r),n!==F&&(t=t>=n?t:n)),t}function yn(t,n,r,e,i,o,f){var c;if(e&&(c=o?e(t,i,o,f):e(t)),c!==F)return c;if(!_u(t))return t;if(i=nf(t)){if(c=be(t),!n)return Cr(t,c)}else{var a=Et(t),l="[object Function]"==a||"[object GeneratorFunction]"==a;if(ef(t))return Rr(t,n);if("[object Object]"==a||"[object Arguments]"==a||l&&!o){if(c=xe(l?{}:t),!n)return Dr(t,_n(c,t))}else{if(!Ct[a])return o?t:{};c=je(t,a,yn,n)}}if(f||(f=new Kt),o=f.get(t))return o;f.set(t,c);
var s=i?F:(r?se:Iu)(t);return u(s||t,function(u,i){s&&(i=u,u=t[i]),sn(c,i,yn(u,n,r,e,i,t,f))}),c}function bn(t){var n=Iu(t);return function(r){return xn(r,t,n)}}function xn(t,n,r){var e=r.length;if(null==t)return!e;for(t=Ju(t);e--;){var u=r[e],i=n[u],o=t[u];if(o===F&&!(u in t)||!i(o))return false}return true}function jn(t,n,r){if(typeof t!="function")throw new Qu("Expected a function");return po(function(){t.apply(F,r)},n)}function wn(t,n,r,e){var u=-1,i=c,o=true,f=t.length,s=[],h=n.length;if(!f)return s;r&&(n=l(n,S(r))),
e?(i=a,o=false):200<=n.length&&(i=R,o=false,n=new qt(n));t:for(;++u<f;){var p=t[u],_=r?r(p):p,p=e||0!==p?p:0;if(o&&_===_){for(var v=h;v--;)if(n[v]===_)continue t;s.push(p)}else i(n,_,e)||s.push(p)}return s}function mn(t,n){var r=true;return to(t,function(t,e,u){return r=!!n(t,e,u)}),r}function An(t,n,r){for(var e=-1,u=t.length;++e<u;){var i=t[e],o=n(i);if(null!=o&&(f===F?o===o&&!bu(o):r(o,f)))var f=o,c=i}return c}function kn(t,n){var r=[];return to(t,function(t,e,u){n(t,e,u)&&r.push(t)}),r}function En(t,n,r,e,u){
var i=-1,o=t.length;for(r||(r=we),u||(u=[]);++i<o;){var f=t[i];0<n&&r(f)?1<n?En(f,n-1,r,e,u):s(u,f):e||(u[u.length]=f)}return u}function On(t,n){return t&&ro(t,n,Iu)}function Sn(t,n){return t&&eo(t,n,Iu)}function In(t,n){return f(n,function(n){return su(t[n])})}function Rn(t,n){n=ke(n,t)?[n]:Sr(n);for(var r=0,e=n.length;null!=t&&r<e;)t=t[Ue(n[r++])];return r&&r==e?t:F}function zn(t,n,r){return n=n(t),nf(t)?n:s(n,r(t))}function Wn(t,n){return t>n}function Bn(t,n){return null!=t&&ui.call(t,n)}function Ln(t,n){
return null!=t&&n in Ju(t)}function Un(t,n,r){for(var e=r?a:c,u=t[0].length,i=t.length,o=i,f=Zu(i),s=1/0,h=[];o--;){var p=t[o];o&&n&&(p=l(p,S(n))),s=Wi(p.length,s),f[o]=!r&&(n||120<=u&&120<=p.length)?new qt(o&&p):F}var p=t[0],_=-1,v=f[0];t:for(;++_<u&&h.length<s;){var g=p[_],d=n?n(g):g,g=r||0!==g?g:0;if(v?!R(v,d):!e(h,d,r)){for(o=i;--o;){var y=f[o];if(y?!R(y,d):!e(t[o],d,r))continue t}v&&v.push(d),h.push(g)}}return h}function Cn(t,n,r){var e={};return On(t,function(t,u,i){n(e,r(t),u,i)}),e}function Mn(t,n,e){
return ke(n,t)||(n=Sr(n),t=ze(t,n),n=Pe(n)),n=null==t?t:t[Ue(n)],null==n?F:r(n,t,e)}function Dn(t){return vu(t)&&"[object Arguments]"==fi.call(t)}function Tn(t){return vu(t)&&"[object ArrayBuffer]"==fi.call(t)}function $n(t){return vu(t)&&"[object Date]"==fi.call(t)}function Fn(t,n,r,e,u){if(t===n)n=true;else if(null==t||null==n||!_u(t)&&!vu(n))n=t!==t&&n!==n;else t:{var i=nf(t),o=nf(n),f="[object Array]",c="[object Array]";i||(f=Et(t),f="[object Arguments]"==f?"[object Object]":f),o||(c=Et(n),c="[object Arguments]"==c?"[object Object]":c);
var a="[object Object]"==f,o="[object Object]"==c;if((c=f==c)&&ef(t)){if(!ef(n)){n=false;break t}i=true,a=false}if(c&&!a)u||(u=new Kt),n=i||af(t)?ce(t,n,Fn,r,e,u):ae(t,n,f,Fn,r,e,u);else{if(!(2&e)&&(i=a&&ui.call(t,"__wrapped__"),f=o&&ui.call(n,"__wrapped__"),i||f)){t=i?t.value():t,n=f?n.value():n,u||(u=new Kt),n=Fn(t,n,r,e,u);break t}if(c)n:if(u||(u=new Kt),i=2&e,f=Iu(t),o=f.length,c=Iu(n).length,o==c||i){for(a=o;a--;){var l=f[a];if(!(i?l in n:ui.call(n,l))){n=false;break n}}if((c=u.get(t))&&u.get(n))n=c==n;else{
c=true,u.set(t,n),u.set(n,t);for(var s=i;++a<o;){var l=f[a],h=t[l],p=n[l];if(r)var _=i?r(p,h,l,n,t,u):r(h,p,l,t,n,u);if(_===F?h!==p&&!Fn(h,p,r,e,u):!_){c=false;break}s||(s="constructor"==l)}c&&!s&&(r=t.constructor,e=n.constructor,r!=e&&"constructor"in t&&"constructor"in n&&!(typeof r=="function"&&r instanceof r&&typeof e=="function"&&e instanceof e)&&(c=false)),u.delete(t),u.delete(n),n=c}}else n=false;else n=false}}return n}function Nn(t){return vu(t)&&"[object Map]"==Et(t)}function Pn(t,n,r,e){var u=r.length,i=u,o=!e;
if(null==t)return!i;for(t=Ju(t);u--;){var f=r[u];if(o&&f[2]?f[1]!==t[f[0]]:!(f[0]in t))return false}for(;++u<i;){var f=r[u],c=f[0],a=t[c],l=f[1];if(o&&f[2]){if(a===F&&!(c in t))return false}else{if(f=new Kt,e)var s=e(a,l,c,t,n,f);if(s===F?!Fn(l,a,e,3,f):!s)return false}}return true}function Zn(t){return!(!_u(t)||ri&&ri in t)&&(su(t)?ai:bt).test(Ce(t))}function qn(t){return _u(t)&&"[object RegExp]"==fi.call(t)}function Vn(t){return vu(t)&&"[object Set]"==Et(t)}function Kn(t){return vu(t)&&pu(t.length)&&!!Ut[fi.call(t)];
}function Gn(t){return typeof t=="function"?t:null==t?Mu:typeof t=="object"?nf(t)?Xn(t[0],t[1]):Qn(t):Fu(t)}function Jn(t){if(!Oe(t))return Ri(t);var n,r=[];for(n in Ju(t))ui.call(t,n)&&"constructor"!=n&&r.push(n);return r}function Yn(t,n){return t<n}function Hn(t,n){var r=-1,e=cu(t)?Zu(t.length):[];return to(t,function(t,u,i){e[++r]=n(t,u,i)}),e}function Qn(t){var n=ge(t);return 1==n.length&&n[0][2]?Se(n[0][0],n[0][1]):function(r){return r===t||Pn(r,t,n)}}function Xn(t,n){return ke(t)&&n===n&&!_u(n)?Se(Ue(t),n):function(r){
var e=Ou(r,t);return e===F&&e===n?Su(r,t):Fn(n,e,F,3)}}function tr(t,n,r,e,u){t!==n&&ro(n,function(i,o){if(_u(i)){u||(u=new Kt);var f=u,c=t[o],a=n[o],l=f.get(a);if(l)ln(t,o,l);else{var l=e?e(c,a,o+"",t,n,f):F,s=l===F;if(s){var h=nf(a),p=!h&&ef(a),_=!h&&!p&&af(a),l=a;h||p||_?nf(c)?l=c:au(c)?l=Cr(c):p?(s=false,l=Rr(a,true)):_?(s=false,l=Wr(a,true)):l=[]:du(a)||tf(a)?(l=c,tf(c)?l=ku(c):(!_u(c)||r&&su(c))&&(l=xe(a))):s=false}s&&(f.set(a,l),tr(l,a,r,e,f),f.delete(a)),ln(t,o,l)}}else f=e?e(t[o],i,o+"",t,n,u):F,f===F&&(f=i),
ln(t,o,f)},Ru)}function nr(t,n){var r=t.length;if(r)return n+=0>n?r:0,me(n,r)?t[n]:F}function rr(t,n,r){var e=-1;return n=l(n.length?n:[Mu],S(_e())),t=Hn(t,function(t){return{a:l(n,function(n){return n(t)}),b:++e,c:t}}),A(t,function(t,n){var e;t:{e=-1;for(var u=t.a,i=n.a,o=u.length,f=r.length;++e<o;){var c=Br(u[e],i[e]);if(c){e=e>=f?c:c*("desc"==r[e]?-1:1);break t}}e=t.b-n.b}return e})}function er(t,n){return t=Ju(t),ur(t,n,function(n,r){return r in t})}function ur(t,n,r){for(var e=-1,u=n.length,i={};++e<u;){
var o=n[e],f=t[o];r(f,o)&&vn(i,o,f)}return i}function ir(t){return function(n){return Rn(n,t)}}function or(t,n,r,e){var u=e?y:d,i=-1,o=n.length,f=t;for(t===n&&(n=Cr(n)),r&&(f=l(t,S(r)));++i<o;)for(var c=0,a=n[i],a=r?r(a):a;-1<(c=u(f,a,c,e));)f!==t&&yi.call(f,c,1),yi.call(t,c,1);return t}function fr(t,n){for(var r=t?n.length:0,e=r-1;r--;){var u=n[r];if(r==e||u!==i){var i=u;if(me(u))yi.call(t,u,1);else if(ke(u,t))delete t[Ue(u)];else{var u=Sr(u),o=ze(t,u);null!=o&&delete o[Ue(Pe(u))]}}}}function cr(t,n){
return t+ki(Ui()*(n-t+1))}function ar(t,n){var r="";if(!t||1>n||9007199254740991<n)return r;do n%2&&(r+=t),(n=ki(n/2))&&(t+=t);while(n);return r}function lr(t,n){return _o(Re(t,n,Mu),t+"")}function sr(t){return on(Wu(t))}function hr(t,n){var r=Wu(t);return Le(r,dn(n,0,r.length))}function pr(t,n,r,e){if(!_u(t))return t;n=ke(n,t)?[n]:Sr(n);for(var u=-1,i=n.length,o=i-1,f=t;null!=f&&++u<i;){var c=Ue(n[u]),a=r;if(u!=o){var l=f[c],a=e?e(l,c,f):F;a===F&&(a=_u(l)?l:me(n[u+1])?[]:{})}sn(f,c,a),f=f[c]}return t;
}function _r(t){return Le(Wu(t))}function vr(t,n,r){var e=-1,u=t.length;for(0>n&&(n=-n>u?0:u+n),r=r>u?u:r,0>r&&(r+=u),u=n>r?0:r-n>>>0,n>>>=0,r=Zu(u);++e<u;)r[e]=t[e+n];return r}function gr(t,n){var r;return to(t,function(t,e,u){return r=n(t,e,u),!r}),!!r}function dr(t,n,r){var e=0,u=t?t.length:e;if(typeof n=="number"&&n===n&&2147483647>=u){for(;e<u;){var i=e+u>>>1,o=t[i];null!==o&&!bu(o)&&(r?o<=n:o<n)?e=i+1:u=i}return u}return yr(t,n,Mu,r)}function yr(t,n,r,e){n=r(n);for(var u=0,i=t?t.length:0,o=n!==n,f=null===n,c=bu(n),a=n===F;u<i;){
var l=ki((u+i)/2),s=r(t[l]),h=s!==F,p=null===s,_=s===s,v=bu(s);(o?e||_:a?_&&(e||h):f?_&&h&&(e||!p):c?_&&h&&!p&&(e||!v):p||v?0:e?s<=n:s<n)?u=l+1:i=l}return Wi(i,4294967294)}function br(t,n){for(var r=-1,e=t.length,u=0,i=[];++r<e;){var o=t[r],f=n?n(o):o;if(!r||!fu(f,c)){var c=f;i[u++]=0===o?0:o}}return i}function xr(t){return typeof t=="number"?t:bu(t)?P:+t}function jr(t){if(typeof t=="string")return t;if(nf(t))return l(t,jr)+"";if(bu(t))return Qi?Qi.call(t):"";var n=t+"";return"0"==n&&1/t==-N?"-0":n;
}function wr(t,n,r){var e=-1,u=c,i=t.length,o=true,f=[],l=f;if(r)o=false,u=a;else if(200<=i){if(u=n?null:fo(t))return M(u);o=false,u=R,l=new qt}else l=n?[]:f;t:for(;++e<i;){var s=t[e],h=n?n(s):s,s=r||0!==s?s:0;if(o&&h===h){for(var p=l.length;p--;)if(l[p]===h)continue t;n&&l.push(h),f.push(s)}else u(l,h,r)||(l!==f&&l.push(h),f.push(s))}return f}function mr(t,n,r,e){for(var u=t.length,i=e?u:-1;(e?i--:++i<u)&&n(t[i],i,t););return r?vr(t,e?0:i,e?i+1:u):vr(t,e?i+1:0,e?u:i)}function Ar(t,n){var r=t;return r instanceof Dt&&(r=r.value()),
h(n,function(t,n){return n.func.apply(n.thisArg,s([t],n.args))},r)}function kr(t,n,r){for(var e=-1,u=t.length;++e<u;)var i=i?s(wn(i,t[e],n,r),wn(t[e],i,n,r)):t[e];return i&&i.length?wr(i,n,r):[]}function Er(t,n,r){for(var e=-1,u=t.length,i=n.length,o={};++e<u;)r(o,t[e],e<i?n[e]:F);return o}function Or(t){return au(t)?t:[]}function Sr(t){return nf(t)?t:vo(t)}function Ir(t,n,r){var e=t.length;return r=r===F?e:r,!n&&r>=e?t:vr(t,n,r)}function Rr(t,n){if(n)return t.slice();var r=t.length,r=pi?pi(r):new t.constructor(r);
return t.copy(r),r}function zr(t){var n=new t.constructor(t.byteLength);return new hi(n).set(new hi(t)),n}function Wr(t,n){return new t.constructor(n?zr(t.buffer):t.buffer,t.byteOffset,t.length)}function Br(t,n){if(t!==n){var r=t!==F,e=null===t,u=t===t,i=bu(t),o=n!==F,f=null===n,c=n===n,a=bu(n);if(!f&&!a&&!i&&t>n||i&&o&&c&&!f&&!a||e&&o&&c||!r&&c||!u)return 1;if(!e&&!i&&!a&&t<n||a&&r&&u&&!e&&!i||f&&r&&u||!o&&u||!c)return-1}return 0}function Lr(t,n,r,e){var u=-1,i=t.length,o=r.length,f=-1,c=n.length,a=zi(i-o,0),l=Zu(c+a);
for(e=!e;++f<c;)l[f]=n[f];for(;++u<o;)(e||u<i)&&(l[r[u]]=t[u]);for(;a--;)l[f++]=t[u++];return l}function Ur(t,n,r,e){var u=-1,i=t.length,o=-1,f=r.length,c=-1,a=n.length,l=zi(i-f,0),s=Zu(l+a);for(e=!e;++u<l;)s[u]=t[u];for(l=u;++c<a;)s[l+c]=n[c];for(;++o<f;)(e||u<i)&&(s[l+r[o]]=t[u++]);return s}function Cr(t,n){var r=-1,e=t.length;for(n||(n=Zu(e));++r<e;)n[r]=t[r];return n}function Mr(t,n,r,e){var u=!r;r||(r={});for(var i=-1,o=n.length;++i<o;){var f=n[i],c=e?e(r[f],t[f],f,r,t):F;c===F&&(c=t[f]),u?vn(r,f,c):sn(r,f,c);
}return r}function Dr(t,n){return Mr(t,ao(t),n)}function Tr(t,n){return function(r,u){var i=nf(r)?e:pn,o=n?n():{};return i(r,t,_e(u,2),o)}}function $r(t){return lr(function(n,r){var e=-1,u=r.length,i=1<u?r[u-1]:F,o=2<u?r[2]:F,i=3<t.length&&typeof i=="function"?(u--,i):F;for(o&&Ae(r[0],r[1],o)&&(i=3>u?F:i,u=1),n=Ju(n);++e<u;)(o=r[e])&&t(n,o,e,i);return n})}function Fr(t,n){return function(r,e){if(null==r)return r;if(!cu(r))return t(r,e);for(var u=r.length,i=n?u:-1,o=Ju(r);(n?i--:++i<u)&&false!==e(o[i],i,o););
return r}}function Nr(t){return function(n,r,e){var u=-1,i=Ju(n);e=e(n);for(var o=e.length;o--;){var f=e[t?o:++u];if(false===r(i[f],f,i))break}return n}}function Pr(t,n,r){function e(){return(this&&this!==Pt&&this instanceof e?i:t).apply(u?r:this,arguments)}var u=1&n,i=Vr(t);return e}function Zr(t){return function(n){n=Eu(n);var r=Wt.test(n)?$(n):F,e=r?r[0]:n.charAt(0);return n=r?Ir(r,1).join(""):n.slice(1),e[t]()+n}}function qr(t){return function(n){return h(Uu(Lu(n).replace(St,"")),t,"")}}function Vr(t){
return function(){var n=arguments;switch(n.length){case 0:return new t;case 1:return new t(n[0]);case 2:return new t(n[0],n[1]);case 3:return new t(n[0],n[1],n[2]);case 4:return new t(n[0],n[1],n[2],n[3]);case 5:return new t(n[0],n[1],n[2],n[3],n[4]);case 6:return new t(n[0],n[1],n[2],n[3],n[4],n[5]);case 7:return new t(n[0],n[1],n[2],n[3],n[4],n[5],n[6])}var r=Xi(t.prototype),n=t.apply(r,n);return _u(n)?n:r}}function Kr(t,n,e){function u(){for(var o=arguments.length,f=Zu(o),c=o,a=pe(u);c--;)f[c]=arguments[c];
return c=3>o&&f[0]!==a&&f[o-1]!==a?[]:C(f,a),o-=c.length,o<e?ue(t,n,Yr,u.placeholder,F,f,c,F,F,e-o):r(this&&this!==Pt&&this instanceof u?i:t,this,f)}var i=Vr(t);return u}function Gr(t){return function(n,r,e){var u=Ju(n);if(!cu(n)){var i=_e(r,3);n=Iu(n),r=function(t){return i(u[t],t,u)}}return r=t(n,r,e),-1<r?u[i?n[r]:r]:F}}function Jr(t){return le(function(n){var r=n.length,e=r,u=Mt.prototype.thru;for(t&&n.reverse();e--;){var i=n[e];if(typeof i!="function")throw new Qu("Expected a function");if(u&&!o&&"wrapper"==he(i))var o=new Mt([],true);
}for(e=o?e:r;++e<r;)var i=n[e],u=he(i),f="wrapper"==u?co(i):F,o=f&&Ee(f[0])&&424==f[1]&&!f[4].length&&1==f[9]?o[he(f[0])].apply(o,f[3]):1==i.length&&Ee(i)?o[u]():o.thru(i);return function(){var t=arguments,e=t[0];if(o&&1==t.length&&nf(e)&&200<=e.length)return o.plant(e).value();for(var u=0,t=r?n[u].apply(this,t):e;++u<r;)t=n[u].call(this,t);return t}})}function Yr(t,n,r,e,u,i,o,f,c,a){function l(){for(var d=arguments.length,y=Zu(d),b=d;b--;)y[b]=arguments[b];if(_){var x,j=pe(l),b=y.length;for(x=0;b--;)y[b]===j&&++x;
}if(e&&(y=Lr(y,e,u,_)),i&&(y=Ur(y,i,o,_)),d-=x,_&&d<a)return j=C(y,j),ue(t,n,Yr,l.placeholder,r,y,j,f,c,a-d);if(j=h?r:this,b=p?j[t]:t,d=y.length,f){x=y.length;for(var w=Wi(f.length,x),m=Cr(y);w--;){var A=f[w];y[w]=me(A,x)?m[A]:F}}else v&&1<d&&y.reverse();return s&&c<d&&(y.length=c),this&&this!==Pt&&this instanceof l&&(b=g||Vr(b)),b.apply(j,y)}var s=128&n,h=1&n,p=2&n,_=24&n,v=512&n,g=p?F:Vr(t);return l}function Hr(t,n){return function(r,e){return Cn(r,t,n(e))}}function Qr(t,n){return function(r,e){
var u;if(r===F&&e===F)return n;if(r!==F&&(u=r),e!==F){if(u===F)return e;typeof r=="string"||typeof e=="string"?(r=jr(r),e=jr(e)):(r=xr(r),e=xr(e)),u=t(r,e)}return u}}function Xr(t){return le(function(n){return n=l(n,S(_e())),lr(function(e){var u=this;return t(n,function(t){return r(t,u,e)})})})}function te(t,n){n=n===F?" ":jr(n);var r=n.length;return 2>r?r?ar(n,t):n:(r=ar(n,Ai(t/T(n))),Wt.test(n)?Ir($(r),0,t).join(""):r.slice(0,t))}function ne(t,n,e,u){function i(){for(var n=-1,c=arguments.length,a=-1,l=u.length,s=Zu(l+c),h=this&&this!==Pt&&this instanceof i?f:t;++a<l;)s[a]=u[a];
for(;c--;)s[a++]=arguments[++n];return r(h,o?e:this,s)}var o=1&n,f=Vr(t);return i}function re(t){return function(n,r,e){e&&typeof e!="number"&&Ae(n,r,e)&&(r=e=F),n=ju(n),r===F?(r=n,n=0):r=ju(r),e=e===F?n<r?1:-1:ju(e);var u=-1;r=zi(Ai((r-n)/(e||1)),0);for(var i=Zu(r);r--;)i[t?r:++u]=n,n+=e;return i}}function ee(t){return function(n,r){return typeof n=="string"&&typeof r=="string"||(n=Au(n),r=Au(r)),t(n,r)}}function ue(t,n,r,e,u,i,o,f,c,a){var l=8&n,s=l?o:F;o=l?F:o;var h=l?i:F;return i=l?F:i,n=(n|(l?32:64))&~(l?64:32),
4&n||(n&=-4),u=[t,n,u,h,s,i,o,f,c,a],r=r.apply(F,u),Ee(t)&&ho(r,u),r.placeholder=e,We(r,t,n)}function ie(t){var n=Gu[t];return function(t,r){if(t=Au(t),r=Wi(wu(r),292)){var e=(Eu(t)+"e").split("e"),e=n(e[0]+"e"+(+e[1]+r)),e=(Eu(e)+"e").split("e");return+(e[0]+"e"+(+e[1]-r))}return n(t)}}function oe(t){return function(n){var r=Et(n);return"[object Map]"==r?L(n):"[object Set]"==r?D(n):O(n,t(n))}}function fe(t,n,r,e,u,i,o,f){var c=2&n;if(!c&&typeof t!="function")throw new Qu("Expected a function");var a=e?e.length:0;
if(a||(n&=-97,e=u=F),o=o===F?o:zi(wu(o),0),f=f===F?f:wu(f),a-=u?u.length:0,64&n){var l=e,s=u;e=u=F}var h=c?F:co(t);return i=[t,n,r,e,u,l,s,i,o,f],h&&(r=i[1],t=h[1],n=r|t,e=128==t&&8==r||128==t&&256==r&&i[7].length<=h[8]||384==t&&h[7].length<=h[8]&&8==r,131>n||e)&&(1&t&&(i[2]=h[2],n|=1&r?0:4),(r=h[3])&&(e=i[3],i[3]=e?Lr(e,r,h[4]):r,i[4]=e?C(i[3],"__lodash_placeholder__"):h[4]),(r=h[5])&&(e=i[5],i[5]=e?Ur(e,r,h[6]):r,i[6]=e?C(i[5],"__lodash_placeholder__"):h[6]),(r=h[7])&&(i[7]=r),128&t&&(i[8]=null==i[8]?h[8]:Wi(i[8],h[8])),
null==i[9]&&(i[9]=h[9]),i[0]=h[0],i[1]=n),t=i[0],n=i[1],r=i[2],e=i[3],u=i[4],f=i[9]=null==i[9]?c?0:t.length:zi(i[9]-a,0),!f&&24&n&&(n&=-25),We((h?uo:ho)(n&&1!=n?8==n||16==n?Kr(t,n,f):32!=n&&33!=n||u.length?Yr.apply(F,i):ne(t,n,r,e):Pr(t,n,r),i),t,n)}function ce(t,n,r,e,u,i){var o=2&u,f=t.length,c=n.length;if(f!=c&&!(o&&c>f))return false;if((c=i.get(t))&&i.get(n))return c==n;var c=-1,a=true,l=1&u?new qt:F;for(i.set(t,n),i.set(n,t);++c<f;){var s=t[c],h=n[c];if(e)var p=o?e(h,s,c,n,t,i):e(s,h,c,t,n,i);if(p!==F){
if(p)continue;a=false;break}if(l){if(!_(n,function(t,n){if(!R(l,n)&&(s===t||r(s,t,e,u,i)))return l.push(n)})){a=false;break}}else if(s!==h&&!r(s,h,e,u,i)){a=false;break}}return i.delete(t),i.delete(n),a}function ae(t,n,r,e,u,i,o){switch(r){case"[object DataView]":if(t.byteLength!=n.byteLength||t.byteOffset!=n.byteOffset)break;t=t.buffer,n=n.buffer;case"[object ArrayBuffer]":if(t.byteLength!=n.byteLength||!e(new hi(t),new hi(n)))break;return true;case"[object Boolean]":case"[object Date]":case"[object Number]":
return fu(+t,+n);case"[object Error]":return t.name==n.name&&t.message==n.message;case"[object RegExp]":case"[object String]":return t==n+"";case"[object Map]":var f=L;case"[object Set]":if(f||(f=M),t.size!=n.size&&!(2&i))break;return(r=o.get(t))?r==n:(i|=1,o.set(t,n),n=ce(f(t),f(n),e,u,i,o),o.delete(t),n);case"[object Symbol]":if(Hi)return Hi.call(t)==Hi.call(n)}return false}function le(t){return _o(Re(t,F,Fe),t+"")}function se(t){return zn(t,Iu,ao)}function he(t){for(var n=t.name+"",r=Zi[n],e=ui.call(Zi,n)?r.length:0;e--;){
var u=r[e],i=u.func;if(null==i||i==t)return u.name}return n}function pe(t){return(ui.call(Ot,"placeholder")?Ot:t).placeholder}function _e(){var t=Ot.iteratee||Du,t=t===Du?Gn:t;return arguments.length?t(arguments[0],arguments[1]):t}function ve(t,n){var r=t.__data__,e=typeof n;return("string"==e||"number"==e||"symbol"==e||"boolean"==e?"__proto__"!==n:null===n)?r[typeof n=="string"?"string":"hash"]:r.map}function ge(t){for(var n=Iu(t),r=n.length;r--;){var e=n[r],u=t[e];n[r]=[e,u,u===u&&!_u(u)]}return n;
}function de(t,n){var r=null==t?F:t[n];return Zn(r)?r:F}function ye(t,n,r){n=ke(n,t)?[n]:Sr(n);for(var e=-1,u=n.length,i=false;++e<u;){var o=Ue(n[e]);if(!(i=null!=t&&r(t,o)))break;t=t[o]}return i||++e!=u?i:(u=t?t.length:0,!!u&&pu(u)&&me(o,u)&&(nf(t)||tf(t)))}function be(t){var n=t.length,r=t.constructor(n);return n&&"string"==typeof t[0]&&ui.call(t,"index")&&(r.index=t.index,r.input=t.input),r}function xe(t){return typeof t.constructor!="function"||Oe(t)?{}:Xi(_i(t))}function je(r,e,u,i){var o=r.constructor;
switch(e){case"[object ArrayBuffer]":return zr(r);case"[object Boolean]":case"[object Date]":return new o(+r);case"[object DataView]":return e=i?zr(r.buffer):r.buffer,new r.constructor(e,r.byteOffset,r.byteLength);case"[object Float32Array]":case"[object Float64Array]":case"[object Int8Array]":case"[object Int16Array]":case"[object Int32Array]":case"[object Uint8Array]":case"[object Uint8ClampedArray]":case"[object Uint16Array]":case"[object Uint32Array]":return Wr(r,i);case"[object Map]":return e=i?u(L(r),true):L(r),
h(e,t,new r.constructor);case"[object Number]":case"[object String]":return new o(r);case"[object RegExp]":return e=new r.constructor(r.source,gt.exec(r)),e.lastIndex=r.lastIndex,e;case"[object Set]":return e=i?u(M(r),true):M(r),h(e,n,new r.constructor);case"[object Symbol]":return Hi?Ju(Hi.call(r)):{}}}function we(t){return nf(t)||tf(t)||!!(bi&&t&&t[bi])}function me(t,n){return n=null==n?9007199254740991:n,!!n&&(typeof t=="number"||jt.test(t))&&-1<t&&0==t%1&&t<n}function Ae(t,n,r){if(!_u(r))return false;
var e=typeof n;return!!("number"==e?cu(r)&&me(n,r.length):"string"==e&&n in r)&&fu(r[n],t)}function ke(t,n){if(nf(t))return false;var r=typeof t;return!("number"!=r&&"symbol"!=r&&"boolean"!=r&&null!=t&&!bu(t))||(rt.test(t)||!nt.test(t)||null!=n&&t in Ju(n))}function Ee(t){var n=he(t),r=Ot[n];return typeof r=="function"&&n in Dt.prototype&&(t===r||(n=co(r),!!n&&t===n[0]))}function Oe(t){var n=t&&t.constructor;return t===(typeof n=="function"&&n.prototype||ti)}function Se(t,n){return function(r){return null!=r&&(r[t]===n&&(n!==F||t in Ju(r)));
}}function Ie(t,n,r,e,u,i){return _u(t)&&_u(n)&&(i.set(n,t),tr(t,n,F,Ie,i),i.delete(n)),t}function Re(t,n,e){return n=zi(n===F?t.length-1:n,0),function(){for(var u=arguments,i=-1,o=zi(u.length-n,0),f=Zu(o);++i<o;)f[i]=u[n+i];for(i=-1,o=Zu(n+1);++i<n;)o[i]=u[i];return o[n]=e(f),r(t,this,o)}}function ze(t,n){return 1==n.length?t:Rn(t,vr(n,0,-1))}function We(t,n,r){var e=n+"";n=_o;var u,i=Me;return u=(u=e.match(st))?u[1].split(ht):[],r=i(u,r),(i=r.length)&&(u=i-1,r[u]=(1<i?"& ":"")+r[u],r=r.join(2<i?", ":" "),
e=e.replace(lt,"{\n/* [wrapped with "+r+"] */\n")),n(t,e)}function Be(t){var n=0,r=0;return function(){var e=Bi(),u=16-(e-r);if(r=e,0<u){if(500<=++n)return arguments[0]}else n=0;return t.apply(F,arguments)}}function Le(t,n){var r=-1,e=t.length,u=e-1;for(n=n===F?e:n;++r<n;){var e=cr(r,u),i=t[e];t[e]=t[r],t[r]=i}return t.length=n,t}function Ue(t){if(typeof t=="string"||bu(t))return t;var n=t+"";return"0"==n&&1/t==-N?"-0":n}function Ce(t){if(null!=t){try{return ei.call(t)}catch(t){}return t+""}return"";
}function Me(t,n){return u(Z,function(r){var e="_."+r[0];n&r[1]&&!c(t,e)&&t.push(e)}),t.sort()}function De(t){if(t instanceof Dt)return t.clone();var n=new Mt(t.__wrapped__,t.__chain__);return n.__actions__=Cr(t.__actions__),n.__index__=t.__index__,n.__values__=t.__values__,n}function Te(t,n,r){var e=t?t.length:0;return e?(r=null==r?0:wu(r),0>r&&(r=zi(e+r,0)),g(t,_e(n,3),r)):-1}function $e(t,n,r){var e=t?t.length:0;if(!e)return-1;var u=e-1;return r!==F&&(u=wu(r),u=0>r?zi(e+u,0):Wi(u,e-1)),g(t,_e(n,3),u,true);
}function Fe(t){return t&&t.length?En(t,1):[]}function Ne(t){return t&&t.length?t[0]:F}function Pe(t){var n=t?t.length:0;return n?t[n-1]:F}function Ze(t,n){return t&&t.length&&n&&n.length?or(t,n):t}function qe(t){return t?Ci.call(t):t}function Ve(t){if(!t||!t.length)return[];var n=0;return t=f(t,function(t){if(au(t))return n=zi(t.length,n),true}),E(n,function(n){return l(t,j(n))})}function Ke(t,n){if(!t||!t.length)return[];var e=Ve(t);return null==n?e:l(e,function(t){return r(n,F,t)})}function Ge(t){
return t=Ot(t),t.__chain__=true,t}function Je(t,n){return n(t)}function Ye(){return this}function He(t,n){return(nf(t)?u:to)(t,_e(n,3))}function Qe(t,n){return(nf(t)?i:no)(t,_e(n,3))}function Xe(t,n){return(nf(t)?l:Hn)(t,_e(n,3))}function tu(t,n,r){return n=r?F:n,n=t&&null==n?t.length:n,fe(t,128,F,F,F,F,n)}function nu(t,n){var r;if(typeof n!="function")throw new Qu("Expected a function");return t=wu(t),function(){return 0<--t&&(r=n.apply(this,arguments)),1>=t&&(n=F),r}}function ru(t,n,r){return n=r?F:n,
t=fe(t,8,F,F,F,F,F,n),t.placeholder=ru.placeholder,t}function eu(t,n,r){return n=r?F:n,t=fe(t,16,F,F,F,F,F,n),t.placeholder=eu.placeholder,t}function uu(t,n,r){function e(n){var r=c,e=a;return c=a=F,_=n,s=t.apply(e,r)}function u(t){var r=t-p;return t-=_,p===F||r>=n||0>r||g&&t>=l}function i(){var t=Po();if(u(t))return o(t);var r,e=po;r=t-_,t=n-(t-p),r=g?Wi(t,l-r):t,h=e(i,r)}function o(t){return h=F,d&&c?e(t):(c=a=F,s)}function f(){var t=Po(),r=u(t);if(c=arguments,a=this,p=t,r){if(h===F)return _=t=p,
h=po(i,n),v?e(t):s;if(g)return h=po(i,n),e(p)}return h===F&&(h=po(i,n)),s}var c,a,l,s,h,p,_=0,v=false,g=false,d=true;if(typeof t!="function")throw new Qu("Expected a function");return n=Au(n)||0,_u(r)&&(v=!!r.leading,l=(g="maxWait"in r)?zi(Au(r.maxWait)||0,n):l,d="trailing"in r?!!r.trailing:d),f.cancel=function(){h!==F&&oo(h),_=0,c=p=a=h=F},f.flush=function(){return h===F?s:o(Po())},f}function iu(t,n){function r(){var e=arguments,u=n?n.apply(this,e):e[0],i=r.cache;return i.has(u)?i.get(u):(e=t.apply(this,e),
r.cache=i.set(u,e)||i,e)}if(typeof t!="function"||n&&typeof n!="function")throw new Qu("Expected a function");return r.cache=new(iu.Cache||Zt),r}function ou(t){if(typeof t!="function")throw new Qu("Expected a function");return function(){var n=arguments;switch(n.length){case 0:return!t.call(this);case 1:return!t.call(this,n[0]);case 2:return!t.call(this,n[0],n[1]);case 3:return!t.call(this,n[0],n[1],n[2])}return!t.apply(this,n)}}function fu(t,n){return t===n||t!==t&&n!==n}function cu(t){return null!=t&&pu(t.length)&&!su(t);
}function au(t){return vu(t)&&cu(t)}function lu(t){return!!vu(t)&&("[object Error]"==fi.call(t)||typeof t.message=="string"&&typeof t.name=="string")}function su(t){return t=_u(t)?fi.call(t):"","[object Function]"==t||"[object GeneratorFunction]"==t||"[object Proxy]"==t}function hu(t){return typeof t=="number"&&t==wu(t)}function pu(t){return typeof t=="number"&&-1<t&&0==t%1&&9007199254740991>=t}function _u(t){var n=typeof t;return null!=t&&("object"==n||"function"==n)}function vu(t){return null!=t&&typeof t=="object";
}function gu(t){return typeof t=="number"||vu(t)&&"[object Number]"==fi.call(t)}function du(t){return!(!vu(t)||"[object Object]"!=fi.call(t))&&(t=_i(t),null===t||(t=ui.call(t,"constructor")&&t.constructor,typeof t=="function"&&t instanceof t&&ei.call(t)==oi))}function yu(t){return typeof t=="string"||!nf(t)&&vu(t)&&"[object String]"==fi.call(t)}function bu(t){return typeof t=="symbol"||vu(t)&&"[object Symbol]"==fi.call(t)}function xu(t){if(!t)return[];if(cu(t))return yu(t)?$(t):Cr(t);if(vi&&t[vi]){t=t[vi]();
for(var n,r=[];!(n=t.next()).done;)r.push(n.value);return r}return n=Et(t),("[object Map]"==n?L:"[object Set]"==n?M:Wu)(t)}function ju(t){return t?(t=Au(t),t===N||t===-N?1.7976931348623157e308*(0>t?-1:1):t===t?t:0):0===t?t:0}function wu(t){t=ju(t);var n=t%1;return t===t?n?t-n:t:0}function mu(t){return t?dn(wu(t),0,4294967295):0}function Au(t){if(typeof t=="number")return t;if(bu(t))return P;if(_u(t)&&(t=typeof t.valueOf=="function"?t.valueOf():t,t=_u(t)?t+"":t),typeof t!="string")return 0===t?t:+t;
t=t.replace(ft,"");var n=yt.test(t);return n||xt.test(t)?$t(t.slice(2),n?2:8):dt.test(t)?P:+t}function ku(t){return Mr(t,Ru(t))}function Eu(t){return null==t?"":jr(t)}function Ou(t,n,r){return t=null==t?F:Rn(t,n),t===F?r:t}function Su(t,n){return null!=t&&ye(t,n,Ln)}function Iu(t){return cu(t)?tn(t):Jn(t)}function Ru(t){if(cu(t))t=tn(t,true);else if(_u(t)){var n,r=Oe(t),e=[];for(n in t)("constructor"!=n||!r&&ui.call(t,n))&&e.push(n);t=e}else{if(n=[],null!=t)for(r in Ju(t))n.push(r);t=n}return t}function zu(t,n){
return null==t?{}:ur(t,zn(t,Ru,lo),_e(n))}function Wu(t){return t?I(t,Iu(t)):[]}function Bu(t){return Uf(Eu(t).toLowerCase())}function Lu(t){return(t=Eu(t))&&t.replace(wt,nn).replace(It,"")}function Uu(t,n,r){return t=Eu(t),n=r?F:n,n===F?Bt.test(t)?t.match(zt)||[]:t.match(pt)||[]:t.match(n)||[]}function Cu(t){return function(){return t}}function Mu(t){return t}function Du(t){return Gn(typeof t=="function"?t:yn(t,true))}function Tu(t,n,r){var e=Iu(n),i=In(n,e);null!=r||_u(n)&&(i.length||!e.length)||(r=n,
n=t,t=this,i=In(n,Iu(n)));var o=!(_u(r)&&"chain"in r&&!r.chain),f=su(t);return u(i,function(r){var e=n[r];t[r]=e,f&&(t.prototype[r]=function(){var n=this.__chain__;if(o||n){var r=t(this.__wrapped__);return(r.__actions__=Cr(this.__actions__)).push({func:e,args:arguments,thisArg:t}),r.__chain__=n,r}return e.apply(t,s([this.value()],arguments))})}),t}function $u(){}function Fu(t){return ke(t)?j(Ue(t)):ir(t)}function Nu(){return[]}function Pu(){return false}kt=kt?un.defaults(Pt.Object(),kt,un.pick(Pt,Lt)):Pt;
var Zu=kt.Array,qu=kt.Date,Vu=kt.Error,Ku=kt.Function,Gu=kt.Math,Ju=kt.Object,Yu=kt.RegExp,Hu=kt.String,Qu=kt.TypeError,Xu=Zu.prototype,ti=Ju.prototype,ni=kt["__core-js_shared__"],ri=function(){var t=/[^.]+$/.exec(ni&&ni.keys&&ni.keys.IE_PROTO||"");return t?"Symbol(src)_1."+t:""}(),ei=Ku.prototype.toString,ui=ti.hasOwnProperty,ii=0,oi=ei.call(Ju),fi=ti.toString,ci=Pt._,ai=Yu("^"+ei.call(ui).replace(it,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$"),li=Vt?kt.Buffer:F,si=kt.Symbol,hi=kt.Uint8Array,pi=li?li.f:F,_i=U(Ju.getPrototypeOf,Ju),vi=si?si.iterator:F,gi=Ju.create,di=ti.propertyIsEnumerable,yi=Xu.splice,bi=si?si.isConcatSpreadable:F,xi=function(){
try{var t=de(Ju,"defineProperty");return t({},"",{}),t}catch(t){}}(),ji=kt.clearTimeout!==Pt.clearTimeout&&kt.clearTimeout,wi=qu&&qu.now!==Pt.Date.now&&qu.now,mi=kt.setTimeout!==Pt.setTimeout&&kt.setTimeout,Ai=Gu.ceil,ki=Gu.floor,Ei=Ju.getOwnPropertySymbols,Oi=li?li.isBuffer:F,Si=kt.isFinite,Ii=Xu.join,Ri=U(Ju.keys,Ju),zi=Gu.max,Wi=Gu.min,Bi=qu.now,Li=kt.parseInt,Ui=Gu.random,Ci=Xu.reverse,Mi=de(kt,"DataView"),Di=de(kt,"Map"),Ti=de(kt,"Promise"),$i=de(kt,"Set"),Fi=de(kt,"WeakMap"),Ni=de(Ju,"create"),Pi=Fi&&new Fi,Zi={},qi=Ce(Mi),Vi=Ce(Di),Ki=Ce(Ti),Gi=Ce($i),Ji=Ce(Fi),Yi=si?si.prototype:F,Hi=Yi?Yi.valueOf:F,Qi=Yi?Yi.toString:F,Xi=function(){
function t(){}return function(n){return _u(n)?gi?gi(n):(t.prototype=n,n=new t,t.prototype=F,n):{}}}();Ot.templateSettings={escape:Q,evaluate:X,interpolate:tt,variable:"",imports:{_:Ot}},Ot.prototype=Rt.prototype,Ot.prototype.constructor=Ot,Mt.prototype=Xi(Rt.prototype),Mt.prototype.constructor=Mt,Dt.prototype=Xi(Rt.prototype),Dt.prototype.constructor=Dt,Ft.prototype.clear=function(){this.__data__=Ni?Ni(null):{},this.size=0},Ft.prototype.delete=function(t){return t=this.has(t)&&delete this.__data__[t],
this.size-=t?1:0,t},Ft.prototype.get=function(t){var n=this.__data__;return Ni?(t=n[t],"__lodash_hash_undefined__"===t?F:t):ui.call(n,t)?n[t]:F},Ft.prototype.has=function(t){var n=this.__data__;return Ni?n[t]!==F:ui.call(n,t)},Ft.prototype.set=function(t,n){var r=this.__data__;return this.size+=this.has(t)?0:1,r[t]=Ni&&n===F?"__lodash_hash_undefined__":n,this},Nt.prototype.clear=function(){this.__data__=[],this.size=0},Nt.prototype.delete=function(t){var n=this.__data__;return t=hn(n,t),!(0>t)&&(t==n.length-1?n.pop():yi.call(n,t,1),
--this.size,true)},Nt.prototype.get=function(t){var n=this.__data__;return t=hn(n,t),0>t?F:n[t][1]},Nt.prototype.has=function(t){return-1<hn(this.__data__,t)},Nt.prototype.set=function(t,n){var r=this.__data__,e=hn(r,t);return 0>e?(++this.size,r.push([t,n])):r[e][1]=n,this},Zt.prototype.clear=function(){this.size=0,this.__data__={hash:new Ft,map:new(Di||Nt),string:new Ft}},Zt.prototype.delete=function(t){return t=ve(this,t).delete(t),this.size-=t?1:0,t},Zt.prototype.get=function(t){return ve(this,t).get(t);
},Zt.prototype.has=function(t){return ve(this,t).has(t)},Zt.prototype.set=function(t,n){var r=ve(this,t),e=r.size;return r.set(t,n),this.size+=r.size==e?0:1,this},qt.prototype.add=qt.prototype.push=function(t){return this.__data__.set(t,"__lodash_hash_undefined__"),this},qt.prototype.has=function(t){return this.__data__.has(t)},Kt.prototype.clear=function(){this.__data__=new Nt,this.size=0},Kt.prototype.delete=function(t){var n=this.__data__;return t=n.delete(t),this.size=n.size,t},Kt.prototype.get=function(t){
return this.__data__.get(t)},Kt.prototype.has=function(t){return this.__data__.has(t)},Kt.prototype.set=function(t,n){var r=this.__data__;if(r instanceof Nt){var e=r.__data__;if(!Di||199>e.length)return e.push([t,n]),this.size=++r.size,this;r=this.__data__=new Zt(e)}return r.set(t,n),this.size=r.size,this};var to=Fr(On),no=Fr(Sn,true),ro=Nr(),eo=Nr(true),uo=Pi?function(t,n){return Pi.set(t,n),t}:Mu,io=xi?function(t,n){return xi(t,"toString",{configurable:true,enumerable:false,value:Cu(n),writable:true})}:Mu,oo=ji||function(t){
return Pt.clearTimeout(t)},fo=$i&&1/M(new $i([,-0]))[1]==N?function(t){return new $i(t)}:$u,co=Pi?function(t){return Pi.get(t)}:$u,ao=Ei?U(Ei,Ju):Nu,lo=Ei?function(t){for(var n=[];t;)s(n,ao(t)),t=_i(t);return n}:Nu;(Mi&&"[object DataView]"!=Et(new Mi(new ArrayBuffer(1)))||Di&&"[object Map]"!=Et(new Di)||Ti&&"[object Promise]"!=Et(Ti.resolve())||$i&&"[object Set]"!=Et(new $i)||Fi&&"[object WeakMap]"!=Et(new Fi))&&(Et=function(t){var n=fi.call(t);if(t=(t="[object Object]"==n?t.constructor:F)?Ce(t):F)switch(t){
case qi:return"[object DataView]";case Vi:return"[object Map]";case Ki:return"[object Promise]";case Gi:return"[object Set]";case Ji:return"[object WeakMap]"}return n});var so=ni?su:Pu,ho=Be(uo),po=mi||function(t,n){return Pt.setTimeout(t,n)},_o=Be(io),vo=function(t){t=iu(t,function(t){return 500===n.size&&n.clear(),t});var n=t.cache;return t}(function(t){t=Eu(t);var n=[];return et.test(t)&&n.push(""),t.replace(ut,function(t,r,e,u){n.push(e?u.replace(_t,"$1"):r||t)}),n}),go=lr(function(t,n){return au(t)?wn(t,En(n,1,au,true)):[];
}),yo=lr(function(t,n){var r=Pe(n);return au(r)&&(r=F),au(t)?wn(t,En(n,1,au,true),_e(r,2)):[]}),bo=lr(function(t,n){var r=Pe(n);return au(r)&&(r=F),au(t)?wn(t,En(n,1,au,true),F,r):[]}),xo=lr(function(t){var n=l(t,Or);return n.length&&n[0]===t[0]?Un(n):[]}),jo=lr(function(t){var n=Pe(t),r=l(t,Or);return n===Pe(r)?n=F:r.pop(),r.length&&r[0]===t[0]?Un(r,_e(n,2)):[]}),wo=lr(function(t){var n=Pe(t),r=l(t,Or);return n===Pe(r)?n=F:r.pop(),r.length&&r[0]===t[0]?Un(r,F,n):[]}),mo=lr(Ze),Ao=le(function(t,n){var r=t?t.length:0,e=gn(t,n);
return fr(t,l(n,function(t){return me(t,r)?+t:t}).sort(Br)),e}),ko=lr(function(t){return wr(En(t,1,au,true))}),Eo=lr(function(t){var n=Pe(t);return au(n)&&(n=F),wr(En(t,1,au,true),_e(n,2))}),Oo=lr(function(t){var n=Pe(t);return au(n)&&(n=F),wr(En(t,1,au,true),F,n)}),So=lr(function(t,n){return au(t)?wn(t,n):[]}),Io=lr(function(t){return kr(f(t,au))}),Ro=lr(function(t){var n=Pe(t);return au(n)&&(n=F),kr(f(t,au),_e(n,2))}),zo=lr(function(t){var n=Pe(t);return au(n)&&(n=F),kr(f(t,au),F,n)}),Wo=lr(Ve),Bo=lr(function(t){
var n=t.length,n=1<n?t[n-1]:F,n=typeof n=="function"?(t.pop(),n):F;return Ke(t,n)}),Lo=le(function(t){function n(n){return gn(n,t)}var r=t.length,e=r?t[0]:0,u=this.__wrapped__;return!(1<r||this.__actions__.length)&&u instanceof Dt&&me(e)?(u=u.slice(e,+e+(r?1:0)),u.__actions__.push({func:Je,args:[n],thisArg:F}),new Mt(u,this.__chain__).thru(function(t){return r&&!t.length&&t.push(F),t})):this.thru(n)}),Uo=Tr(function(t,n,r){ui.call(t,r)?++t[r]:vn(t,r,1)}),Co=Gr(Te),Mo=Gr($e),Do=Tr(function(t,n,r){
ui.call(t,r)?t[r].push(n):vn(t,r,[n])}),To=lr(function(t,n,e){var u=-1,i=typeof n=="function",o=ke(n),f=cu(t)?Zu(t.length):[];return to(t,function(t){var c=i?n:o&&null!=t?t[n]:F;f[++u]=c?r(c,t,e):Mn(t,n,e)}),f}),$o=Tr(function(t,n,r){vn(t,r,n)}),Fo=Tr(function(t,n,r){t[r?0:1].push(n)},function(){return[[],[]]}),No=lr(function(t,n){if(null==t)return[];var r=n.length;return 1<r&&Ae(t,n[0],n[1])?n=[]:2<r&&Ae(n[0],n[1],n[2])&&(n=[n[0]]),rr(t,En(n,1),[])}),Po=wi||function(){return Pt.Date.now()},Zo=lr(function(t,n,r){
var e=1;if(r.length)var u=C(r,pe(Zo)),e=32|e;return fe(t,e,n,r,u)}),qo=lr(function(t,n,r){var e=3;if(r.length)var u=C(r,pe(qo)),e=32|e;return fe(n,e,t,r,u)}),Vo=lr(function(t,n){return jn(t,1,n)}),Ko=lr(function(t,n,r){return jn(t,Au(n)||0,r)});iu.Cache=Zt;var Go=lr(function(t,n){n=1==n.length&&nf(n[0])?l(n[0],S(_e())):l(En(n,1),S(_e()));var e=n.length;return lr(function(u){for(var i=-1,o=Wi(u.length,e);++i<o;)u[i]=n[i].call(this,u[i]);return r(t,this,u)})}),Jo=lr(function(t,n){return fe(t,32,F,n,C(n,pe(Jo)));
}),Yo=lr(function(t,n){return fe(t,64,F,n,C(n,pe(Yo)))}),Ho=le(function(t,n){return fe(t,256,F,F,F,n)}),Qo=ee(Wn),Xo=ee(function(t,n){return t>=n}),tf=Dn(function(){return arguments}())?Dn:function(t){return vu(t)&&ui.call(t,"callee")&&!di.call(t,"callee")},nf=Zu.isArray,rf=Gt?S(Gt):Tn,ef=Oi||Pu,uf=Jt?S(Jt):$n,of=Yt?S(Yt):Nn,ff=Ht?S(Ht):qn,cf=Qt?S(Qt):Vn,af=Xt?S(Xt):Kn,lf=ee(Yn),sf=ee(function(t,n){return t<=n}),hf=$r(function(t,n){if(Oe(n)||cu(n))Mr(n,Iu(n),t);else for(var r in n)ui.call(n,r)&&sn(t,r,n[r]);
}),pf=$r(function(t,n){Mr(n,Ru(n),t)}),_f=$r(function(t,n,r,e){Mr(n,Ru(n),t,e)}),vf=$r(function(t,n,r,e){Mr(n,Iu(n),t,e)}),gf=le(gn),df=lr(function(t){return t.push(F,an),r(_f,F,t)}),yf=lr(function(t){return t.push(F,Ie),r(mf,F,t)}),bf=Hr(function(t,n,r){t[n]=r},Cu(Mu)),xf=Hr(function(t,n,r){ui.call(t,n)?t[n].push(r):t[n]=[r]},_e),jf=lr(Mn),wf=$r(function(t,n,r){tr(t,n,r)}),mf=$r(function(t,n,r,e){tr(t,n,r,e)}),Af=le(function(t,n){return null==t?{}:(n=l(n,Ue),er(t,wn(zn(t,Ru,lo),n)))}),kf=le(function(t,n){
return null==t?{}:er(t,l(n,Ue))}),Ef=oe(Iu),Of=oe(Ru),Sf=qr(function(t,n,r){return n=n.toLowerCase(),t+(r?Bu(n):n)}),If=qr(function(t,n,r){return t+(r?"-":"")+n.toLowerCase()}),Rf=qr(function(t,n,r){return t+(r?" ":"")+n.toLowerCase()}),zf=Zr("toLowerCase"),Wf=qr(function(t,n,r){return t+(r?"_":"")+n.toLowerCase()}),Bf=qr(function(t,n,r){return t+(r?" ":"")+Uf(n)}),Lf=qr(function(t,n,r){return t+(r?" ":"")+n.toUpperCase()}),Uf=Zr("toUpperCase"),Cf=lr(function(t,n){try{return r(t,F,n)}catch(t){return lu(t)?t:new Vu(t);
}}),Mf=le(function(t,n){return u(n,function(n){n=Ue(n),vn(t,n,Zo(t[n],t))}),t}),Df=Jr(),Tf=Jr(true),$f=lr(function(t,n){return function(r){return Mn(r,t,n)}}),Ff=lr(function(t,n){return function(r){return Mn(t,r,n)}}),Nf=Xr(l),Pf=Xr(o),Zf=Xr(_),qf=re(),Vf=re(true),Kf=Qr(function(t,n){return t+n},0),Gf=ie("ceil"),Jf=Qr(function(t,n){return t/n},1),Yf=ie("floor"),Hf=Qr(function(t,n){return t*n},1),Qf=ie("round"),Xf=Qr(function(t,n){return t-n},0);return Ot.after=function(t,n){if(typeof n!="function")throw new Qu("Expected a function");
return t=wu(t),function(){if(1>--t)return n.apply(this,arguments)}},Ot.ary=tu,Ot.assign=hf,Ot.assignIn=pf,Ot.assignInWith=_f,Ot.assignWith=vf,Ot.at=gf,Ot.before=nu,Ot.bind=Zo,Ot.bindAll=Mf,Ot.bindKey=qo,Ot.castArray=function(){if(!arguments.length)return[];var t=arguments[0];return nf(t)?t:[t]},Ot.chain=Ge,Ot.chunk=function(t,n,r){if(n=(r?Ae(t,n,r):n===F)?1:zi(wu(n),0),r=t?t.length:0,!r||1>n)return[];for(var e=0,u=0,i=Zu(Ai(r/n));e<r;)i[u++]=vr(t,e,e+=n);return i},Ot.compact=function(t){for(var n=-1,r=t?t.length:0,e=0,u=[];++n<r;){
var i=t[n];i&&(u[e++]=i)}return u},Ot.concat=function(){var t=arguments.length;if(!t)return[];for(var n=Zu(t-1),r=arguments[0];t--;)n[t-1]=arguments[t];return s(nf(r)?Cr(r):[r],En(n,1))},Ot.cond=function(t){var n=t?t.length:0,e=_e();return t=n?l(t,function(t){if("function"!=typeof t[1])throw new Qu("Expected a function");return[e(t[0]),t[1]]}):[],lr(function(e){for(var u=-1;++u<n;){var i=t[u];if(r(i[0],this,e))return r(i[1],this,e)}})},Ot.conforms=function(t){return bn(yn(t,true))},Ot.constant=Cu,Ot.countBy=Uo,
Ot.create=function(t,n){var r=Xi(t);return n?_n(r,n):r},Ot.curry=ru,Ot.curryRight=eu,Ot.debounce=uu,Ot.defaults=df,Ot.defaultsDeep=yf,Ot.defer=Vo,Ot.delay=Ko,Ot.difference=go,Ot.differenceBy=yo,Ot.differenceWith=bo,Ot.drop=function(t,n,r){var e=t?t.length:0;return e?(n=r||n===F?1:wu(n),vr(t,0>n?0:n,e)):[]},Ot.dropRight=function(t,n,r){var e=t?t.length:0;return e?(n=r||n===F?1:wu(n),n=e-n,vr(t,0,0>n?0:n)):[]},Ot.dropRightWhile=function(t,n){return t&&t.length?mr(t,_e(n,3),true,true):[]},Ot.dropWhile=function(t,n){
return t&&t.length?mr(t,_e(n,3),true):[]},Ot.fill=function(t,n,r,e){var u=t?t.length:0;if(!u)return[];for(r&&typeof r!="number"&&Ae(t,n,r)&&(r=0,e=u),u=t.length,r=wu(r),0>r&&(r=-r>u?0:u+r),e=e===F||e>u?u:wu(e),0>e&&(e+=u),e=r>e?0:mu(e);r<e;)t[r++]=n;return t},Ot.filter=function(t,n){return(nf(t)?f:kn)(t,_e(n,3))},Ot.flatMap=function(t,n){return En(Xe(t,n),1)},Ot.flatMapDeep=function(t,n){return En(Xe(t,n),N)},Ot.flatMapDepth=function(t,n,r){return r=r===F?1:wu(r),En(Xe(t,n),r)},Ot.flatten=Fe,Ot.flattenDeep=function(t){
return t&&t.length?En(t,N):[]},Ot.flattenDepth=function(t,n){return t&&t.length?(n=n===F?1:wu(n),En(t,n)):[]},Ot.flip=function(t){return fe(t,512)},Ot.flow=Df,Ot.flowRight=Tf,Ot.fromPairs=function(t){for(var n=-1,r=t?t.length:0,e={};++n<r;){var u=t[n];e[u[0]]=u[1]}return e},Ot.functions=function(t){return null==t?[]:In(t,Iu(t))},Ot.functionsIn=function(t){return null==t?[]:In(t,Ru(t))},Ot.groupBy=Do,Ot.initial=function(t){return t&&t.length?vr(t,0,-1):[]},Ot.intersection=xo,Ot.intersectionBy=jo,Ot.intersectionWith=wo,
Ot.invert=bf,Ot.invertBy=xf,Ot.invokeMap=To,Ot.iteratee=Du,Ot.keyBy=$o,Ot.keys=Iu,Ot.keysIn=Ru,Ot.map=Xe,Ot.mapKeys=function(t,n){var r={};return n=_e(n,3),On(t,function(t,e,u){vn(r,n(t,e,u),t)}),r},Ot.mapValues=function(t,n){var r={};return n=_e(n,3),On(t,function(t,e,u){vn(r,e,n(t,e,u))}),r},Ot.matches=function(t){return Qn(yn(t,true))},Ot.matchesProperty=function(t,n){return Xn(t,yn(n,true))},Ot.memoize=iu,Ot.merge=wf,Ot.mergeWith=mf,Ot.method=$f,Ot.methodOf=Ff,Ot.mixin=Tu,Ot.negate=ou,Ot.nthArg=function(t){
return t=wu(t),lr(function(n){return nr(n,t)})},Ot.omit=Af,Ot.omitBy=function(t,n){return zu(t,ou(_e(n)))},Ot.once=function(t){return nu(2,t)},Ot.orderBy=function(t,n,r,e){return null==t?[]:(nf(n)||(n=null==n?[]:[n]),r=e?F:r,nf(r)||(r=null==r?[]:[r]),rr(t,n,r))},Ot.over=Nf,Ot.overArgs=Go,Ot.overEvery=Pf,Ot.overSome=Zf,Ot.partial=Jo,Ot.partialRight=Yo,Ot.partition=Fo,Ot.pick=kf,Ot.pickBy=zu,Ot.property=Fu,Ot.propertyOf=function(t){return function(n){return null==t?F:Rn(t,n)}},Ot.pull=mo,Ot.pullAll=Ze,
Ot.pullAllBy=function(t,n,r){return t&&t.length&&n&&n.length?or(t,n,_e(r,2)):t},Ot.pullAllWith=function(t,n,r){return t&&t.length&&n&&n.length?or(t,n,F,r):t},Ot.pullAt=Ao,Ot.range=qf,Ot.rangeRight=Vf,Ot.rearg=Ho,Ot.reject=function(t,n){return(nf(t)?f:kn)(t,ou(_e(n,3)))},Ot.remove=function(t,n){var r=[];if(!t||!t.length)return r;var e=-1,u=[],i=t.length;for(n=_e(n,3);++e<i;){var o=t[e];n(o,e,t)&&(r.push(o),u.push(e))}return fr(t,u),r},Ot.rest=function(t,n){if(typeof t!="function")throw new Qu("Expected a function");
return n=n===F?n:wu(n),lr(t,n)},Ot.reverse=qe,Ot.sampleSize=function(t,n,r){return n=(r?Ae(t,n,r):n===F)?1:wu(n),(nf(t)?fn:hr)(t,n)},Ot.set=function(t,n,r){return null==t?t:pr(t,n,r)},Ot.setWith=function(t,n,r,e){return e=typeof e=="function"?e:F,null==t?t:pr(t,n,r,e)},Ot.shuffle=function(t){return(nf(t)?cn:_r)(t)},Ot.slice=function(t,n,r){var e=t?t.length:0;return e?(r&&typeof r!="number"&&Ae(t,n,r)?(n=0,r=e):(n=null==n?0:wu(n),r=r===F?e:wu(r)),vr(t,n,r)):[]},Ot.sortBy=No,Ot.sortedUniq=function(t){
return t&&t.length?br(t):[]},Ot.sortedUniqBy=function(t,n){return t&&t.length?br(t,_e(n,2)):[]},Ot.split=function(t,n,r){return r&&typeof r!="number"&&Ae(t,n,r)&&(n=r=F),r=r===F?4294967295:r>>>0,r?(t=Eu(t))&&(typeof n=="string"||null!=n&&!ff(n))&&(n=jr(n),!n&&Wt.test(t))?Ir($(t),0,r):t.split(n,r):[]},Ot.spread=function(t,n){if(typeof t!="function")throw new Qu("Expected a function");return n=n===F?0:zi(wu(n),0),lr(function(e){var u=e[n];return e=Ir(e,0,n),u&&s(e,u),r(t,this,e)})},Ot.tail=function(t){
var n=t?t.length:0;return n?vr(t,1,n):[]},Ot.take=function(t,n,r){return t&&t.length?(n=r||n===F?1:wu(n),vr(t,0,0>n?0:n)):[]},Ot.takeRight=function(t,n,r){var e=t?t.length:0;return e?(n=r||n===F?1:wu(n),n=e-n,vr(t,0>n?0:n,e)):[]},Ot.takeRightWhile=function(t,n){return t&&t.length?mr(t,_e(n,3),false,true):[]},Ot.takeWhile=function(t,n){return t&&t.length?mr(t,_e(n,3)):[]},Ot.tap=function(t,n){return n(t),t},Ot.throttle=function(t,n,r){var e=true,u=true;if(typeof t!="function")throw new Qu("Expected a function");
return _u(r)&&(e="leading"in r?!!r.leading:e,u="trailing"in r?!!r.trailing:u),uu(t,n,{leading:e,maxWait:n,trailing:u})},Ot.thru=Je,Ot.toArray=xu,Ot.toPairs=Ef,Ot.toPairsIn=Of,Ot.toPath=function(t){return nf(t)?l(t,Ue):bu(t)?[t]:Cr(vo(t))},Ot.toPlainObject=ku,Ot.transform=function(t,n,r){var e=nf(t),i=e||ef(t)||af(t);if(n=_e(n,4),null==r){var o=t&&t.constructor;r=i?e?new o:[]:_u(t)&&su(o)?Xi(_i(t)):{}}return(i?u:On)(t,function(t,e,u){return n(r,t,e,u)}),r},Ot.unary=function(t){return tu(t,1)},Ot.union=ko,
Ot.unionBy=Eo,Ot.unionWith=Oo,Ot.uniq=function(t){return t&&t.length?wr(t):[]},Ot.uniqBy=function(t,n){return t&&t.length?wr(t,_e(n,2)):[]},Ot.uniqWith=function(t,n){return t&&t.length?wr(t,F,n):[]},Ot.unset=function(t,n){var r;if(null==t)r=true;else{r=t;var e=n,e=ke(e,r)?[e]:Sr(e);r=ze(r,e),e=Ue(Pe(e)),r=!(null!=r&&ui.call(r,e))||delete r[e]}return r},Ot.unzip=Ve,Ot.unzipWith=Ke,Ot.update=function(t,n,r){return null==t?t:pr(t,n,(typeof r=="function"?r:Mu)(Rn(t,n)),void 0)},Ot.updateWith=function(t,n,r,e){
return e=typeof e=="function"?e:F,null!=t&&(t=pr(t,n,(typeof r=="function"?r:Mu)(Rn(t,n)),e)),t},Ot.values=Wu,Ot.valuesIn=function(t){return null==t?[]:I(t,Ru(t))},Ot.without=So,Ot.words=Uu,Ot.wrap=function(t,n){return n=null==n?Mu:n,Jo(n,t)},Ot.xor=Io,Ot.xorBy=Ro,Ot.xorWith=zo,Ot.zip=Wo,Ot.zipObject=function(t,n){return Er(t||[],n||[],sn)},Ot.zipObjectDeep=function(t,n){return Er(t||[],n||[],pr)},Ot.zipWith=Bo,Ot.entries=Ef,Ot.entriesIn=Of,Ot.extend=pf,Ot.extendWith=_f,Tu(Ot,Ot),Ot.add=Kf,Ot.attempt=Cf,
Ot.camelCase=Sf,Ot.capitalize=Bu,Ot.ceil=Gf,Ot.clamp=function(t,n,r){return r===F&&(r=n,n=F),r!==F&&(r=Au(r),r=r===r?r:0),n!==F&&(n=Au(n),n=n===n?n:0),dn(Au(t),n,r)},Ot.clone=function(t){return yn(t,false,true)},Ot.cloneDeep=function(t){return yn(t,true,true)},Ot.cloneDeepWith=function(t,n){return yn(t,true,true,n)},Ot.cloneWith=function(t,n){return yn(t,false,true,n)},Ot.conformsTo=function(t,n){return null==n||xn(t,n,Iu(n))},Ot.deburr=Lu,Ot.defaultTo=function(t,n){return null==t||t!==t?n:t},Ot.divide=Jf,Ot.endsWith=function(t,n,r){
t=Eu(t),n=jr(n);var e=t.length,e=r=r===F?e:dn(wu(r),0,e);return r-=n.length,0<=r&&t.slice(r,e)==n},Ot.eq=fu,Ot.escape=function(t){return(t=Eu(t))&&H.test(t)?t.replace(J,rn):t},Ot.escapeRegExp=function(t){return(t=Eu(t))&&ot.test(t)?t.replace(it,"\\$&"):t},Ot.every=function(t,n,r){var e=nf(t)?o:mn;return r&&Ae(t,n,r)&&(n=F),e(t,_e(n,3))},Ot.find=Co,Ot.findIndex=Te,Ot.findKey=function(t,n){return v(t,_e(n,3),On)},Ot.findLast=Mo,Ot.findLastIndex=$e,Ot.findLastKey=function(t,n){return v(t,_e(n,3),Sn);
},Ot.floor=Yf,Ot.forEach=He,Ot.forEachRight=Qe,Ot.forIn=function(t,n){return null==t?t:ro(t,_e(n,3),Ru)},Ot.forInRight=function(t,n){return null==t?t:eo(t,_e(n,3),Ru)},Ot.forOwn=function(t,n){return t&&On(t,_e(n,3))},Ot.forOwnRight=function(t,n){return t&&Sn(t,_e(n,3))},Ot.get=Ou,Ot.gt=Qo,Ot.gte=Xo,Ot.has=function(t,n){return null!=t&&ye(t,n,Bn)},Ot.hasIn=Su,Ot.head=Ne,Ot.identity=Mu,Ot.includes=function(t,n,r,e){return t=cu(t)?t:Wu(t),r=r&&!e?wu(r):0,e=t.length,0>r&&(r=zi(e+r,0)),yu(t)?r<=e&&-1<t.indexOf(n,r):!!e&&-1<d(t,n,r);
},Ot.indexOf=function(t,n,r){var e=t?t.length:0;return e?(r=null==r?0:wu(r),0>r&&(r=zi(e+r,0)),d(t,n,r)):-1},Ot.inRange=function(t,n,r){return n=ju(n),r===F?(r=n,n=0):r=ju(r),t=Au(t),t>=Wi(n,r)&&t<zi(n,r)},Ot.invoke=jf,Ot.isArguments=tf,Ot.isArray=nf,Ot.isArrayBuffer=rf,Ot.isArrayLike=cu,Ot.isArrayLikeObject=au,Ot.isBoolean=function(t){return true===t||false===t||vu(t)&&"[object Boolean]"==fi.call(t)},Ot.isBuffer=ef,Ot.isDate=uf,Ot.isElement=function(t){return null!=t&&1===t.nodeType&&vu(t)&&!du(t)},Ot.isEmpty=function(t){
if(cu(t)&&(nf(t)||typeof t=="string"||typeof t.splice=="function"||ef(t)||af(t)||tf(t)))return!t.length;var n=Et(t);if("[object Map]"==n||"[object Set]"==n)return!t.size;if(Oe(t))return!Jn(t).length;for(var r in t)if(ui.call(t,r))return false;return true},Ot.isEqual=function(t,n){return Fn(t,n)},Ot.isEqualWith=function(t,n,r){var e=(r=typeof r=="function"?r:F)?r(t,n):F;return e===F?Fn(t,n,r):!!e},Ot.isError=lu,Ot.isFinite=function(t){return typeof t=="number"&&Si(t)},Ot.isFunction=su,Ot.isInteger=hu,Ot.isLength=pu,
Ot.isMap=of,Ot.isMatch=function(t,n){return t===n||Pn(t,n,ge(n))},Ot.isMatchWith=function(t,n,r){return r=typeof r=="function"?r:F,Pn(t,n,ge(n),r)},Ot.isNaN=function(t){return gu(t)&&t!=+t},Ot.isNative=function(t){if(so(t))throw new Vu("Unsupported core-js use. Try https://github.com/es-shims.");return Zn(t)},Ot.isNil=function(t){return null==t},Ot.isNull=function(t){return null===t},Ot.isNumber=gu,Ot.isObject=_u,Ot.isObjectLike=vu,Ot.isPlainObject=du,Ot.isRegExp=ff,Ot.isSafeInteger=function(t){return hu(t)&&-9007199254740991<=t&&9007199254740991>=t;
},Ot.isSet=cf,Ot.isString=yu,Ot.isSymbol=bu,Ot.isTypedArray=af,Ot.isUndefined=function(t){return t===F},Ot.isWeakMap=function(t){return vu(t)&&"[object WeakMap]"==Et(t)},Ot.isWeakSet=function(t){return vu(t)&&"[object WeakSet]"==fi.call(t)},Ot.join=function(t,n){return t?Ii.call(t,n):""},Ot.kebabCase=If,Ot.last=Pe,Ot.lastIndexOf=function(t,n,r){var e=t?t.length:0;if(!e)return-1;var u=e;if(r!==F&&(u=wu(r),u=0>u?zi(e+u,0):Wi(u,e-1)),n===n){for(r=u+1;r--&&t[r]!==n;);t=r}else t=g(t,b,u,true);return t},
Ot.lowerCase=Rf,Ot.lowerFirst=zf,Ot.lt=lf,Ot.lte=sf,Ot.max=function(t){return t&&t.length?An(t,Mu,Wn):F},Ot.maxBy=function(t,n){return t&&t.length?An(t,_e(n,2),Wn):F},Ot.mean=function(t){return x(t,Mu)},Ot.meanBy=function(t,n){return x(t,_e(n,2))},Ot.min=function(t){return t&&t.length?An(t,Mu,Yn):F},Ot.minBy=function(t,n){return t&&t.length?An(t,_e(n,2),Yn):F},Ot.stubArray=Nu,Ot.stubFalse=Pu,Ot.stubObject=function(){return{}},Ot.stubString=function(){return""},Ot.stubTrue=function(){return true},Ot.multiply=Hf,
Ot.nth=function(t,n){return t&&t.length?nr(t,wu(n)):F},Ot.noConflict=function(){return Pt._===this&&(Pt._=ci),this},Ot.noop=$u,Ot.now=Po,Ot.pad=function(t,n,r){t=Eu(t);var e=(n=wu(n))?T(t):0;return!n||e>=n?t:(n=(n-e)/2,te(ki(n),r)+t+te(Ai(n),r))},Ot.padEnd=function(t,n,r){t=Eu(t);var e=(n=wu(n))?T(t):0;return n&&e<n?t+te(n-e,r):t},Ot.padStart=function(t,n,r){t=Eu(t);var e=(n=wu(n))?T(t):0;return n&&e<n?te(n-e,r)+t:t},Ot.parseInt=function(t,n,r){return r||null==n?n=0:n&&(n=+n),Li(Eu(t).replace(ct,""),n||0);
},Ot.random=function(t,n,r){if(r&&typeof r!="boolean"&&Ae(t,n,r)&&(n=r=F),r===F&&(typeof n=="boolean"?(r=n,n=F):typeof t=="boolean"&&(r=t,t=F)),t===F&&n===F?(t=0,n=1):(t=ju(t),n===F?(n=t,t=0):n=ju(n)),t>n){var e=t;t=n,n=e}return r||t%1||n%1?(r=Ui(),Wi(t+r*(n-t+Tt("1e-"+((r+"").length-1))),n)):cr(t,n)},Ot.reduce=function(t,n,r){var e=nf(t)?h:m,u=3>arguments.length;return e(t,_e(n,4),r,u,to)},Ot.reduceRight=function(t,n,r){var e=nf(t)?p:m,u=3>arguments.length;return e(t,_e(n,4),r,u,no)},Ot.repeat=function(t,n,r){
return n=(r?Ae(t,n,r):n===F)?1:wu(n),ar(Eu(t),n)},Ot.replace=function(){var t=arguments,n=Eu(t[0]);return 3>t.length?n:n.replace(t[1],t[2])},Ot.result=function(t,n,r){n=ke(n,t)?[n]:Sr(n);var e=-1,u=n.length;for(u||(t=F,u=1);++e<u;){var i=null==t?F:t[Ue(n[e])];i===F&&(e=u,i=r),t=su(i)?i.call(t):i}return t},Ot.round=Qf,Ot.runInContext=w,Ot.sample=function(t){return(nf(t)?on:sr)(t)},Ot.size=function(t){if(null==t)return 0;if(cu(t))return yu(t)?T(t):t.length;var n=Et(t);return"[object Map]"==n||"[object Set]"==n?t.size:Jn(t).length;
},Ot.snakeCase=Wf,Ot.some=function(t,n,r){var e=nf(t)?_:gr;return r&&Ae(t,n,r)&&(n=F),e(t,_e(n,3))},Ot.sortedIndex=function(t,n){return dr(t,n)},Ot.sortedIndexBy=function(t,n,r){return yr(t,n,_e(r,2))},Ot.sortedIndexOf=function(t,n){var r=t?t.length:0;if(r){var e=dr(t,n);if(e<r&&fu(t[e],n))return e}return-1},Ot.sortedLastIndex=function(t,n){return dr(t,n,true)},Ot.sortedLastIndexBy=function(t,n,r){return yr(t,n,_e(r,2),true)},Ot.sortedLastIndexOf=function(t,n){if(t&&t.length){var r=dr(t,n,true)-1;if(fu(t[r],n))return r;
}return-1},Ot.startCase=Bf,Ot.startsWith=function(t,n,r){return t=Eu(t),r=dn(wu(r),0,t.length),n=jr(n),t.slice(r,r+n.length)==n},Ot.subtract=Xf,Ot.sum=function(t){return t&&t.length?k(t,Mu):0},Ot.sumBy=function(t,n){return t&&t.length?k(t,_e(n,2)):0},Ot.template=function(t,n,r){var e=Ot.templateSettings;r&&Ae(t,n,r)&&(n=F),t=Eu(t),n=_f({},n,e,an),r=_f({},n.imports,e.imports,an);var u,i,o=Iu(r),f=I(r,o),c=0;r=n.interpolate||mt;var a="__p+='";r=Yu((n.escape||mt).source+"|"+r.source+"|"+(r===tt?vt:mt).source+"|"+(n.evaluate||mt).source+"|$","g");
var l="sourceURL"in n?"//# sourceURL="+n.sourceURL+"\n":"";if(t.replace(r,function(n,r,e,o,f,l){return e||(e=o),a+=t.slice(c,l).replace(At,B),r&&(u=true,a+="'+__e("+r+")+'"),f&&(i=true,a+="';"+f+";\n__p+='"),e&&(a+="'+((__t=("+e+"))==null?'':__t)+'"),c=l+n.length,n}),a+="';",(n=n.variable)||(a="with(obj){"+a+"}"),a=(i?a.replace(q,""):a).replace(V,"$1").replace(K,"$1;"),a="function("+(n||"obj")+"){"+(n?"":"obj||(obj={});")+"var __t,__p=''"+(u?",__e=_.escape":"")+(i?",__j=Array.prototype.join;function print(){__p+=__j.call(arguments,'')}":";")+a+"return __p}",
n=Cf(function(){return Ku(o,l+"return "+a).apply(F,f)}),n.source=a,lu(n))throw n;return n},Ot.times=function(t,n){if(t=wu(t),1>t||9007199254740991<t)return[];var r=4294967295,e=Wi(t,4294967295);for(n=_e(n),t-=4294967295,e=E(e,n);++r<t;)n(r);return e},Ot.toFinite=ju,Ot.toInteger=wu,Ot.toLength=mu,Ot.toLower=function(t){return Eu(t).toLowerCase()},Ot.toNumber=Au,Ot.toSafeInteger=function(t){return dn(wu(t),-9007199254740991,9007199254740991)},Ot.toString=Eu,Ot.toUpper=function(t){return Eu(t).toUpperCase();
},Ot.trim=function(t,n,r){return(t=Eu(t))&&(r||n===F)?t.replace(ft,""):t&&(n=jr(n))?(t=$(t),r=$(n),n=z(t,r),r=W(t,r)+1,Ir(t,n,r).join("")):t},Ot.trimEnd=function(t,n,r){return(t=Eu(t))&&(r||n===F)?t.replace(at,""):t&&(n=jr(n))?(t=$(t),n=W(t,$(n))+1,Ir(t,0,n).join("")):t},Ot.trimStart=function(t,n,r){return(t=Eu(t))&&(r||n===F)?t.replace(ct,""):t&&(n=jr(n))?(t=$(t),n=z(t,$(n)),Ir(t,n).join("")):t},Ot.truncate=function(t,n){var r=30,e="...";if(_u(n))var u="separator"in n?n.separator:u,r="length"in n?wu(n.length):r,e="omission"in n?jr(n.omission):e;
t=Eu(t);var i=t.length;if(Wt.test(t))var o=$(t),i=o.length;if(r>=i)return t;if(i=r-T(e),1>i)return e;if(r=o?Ir(o,0,i).join(""):t.slice(0,i),u===F)return r+e;if(o&&(i+=r.length-i),ff(u)){if(t.slice(i).search(u)){var f=r;for(u.global||(u=Yu(u.source,Eu(gt.exec(u))+"g")),u.lastIndex=0;o=u.exec(f);)var c=o.index;r=r.slice(0,c===F?i:c)}}else t.indexOf(jr(u),i)!=i&&(u=r.lastIndexOf(u),-1<u&&(r=r.slice(0,u)));return r+e},Ot.unescape=function(t){return(t=Eu(t))&&Y.test(t)?t.replace(G,en):t},Ot.uniqueId=function(t){
var n=++ii;return Eu(t)+n},Ot.upperCase=Lf,Ot.upperFirst=Uf,Ot.each=He,Ot.eachRight=Qe,Ot.first=Ne,Tu(Ot,function(){var t={};return On(Ot,function(n,r){ui.call(Ot.prototype,r)||(t[r]=n)}),t}(),{chain:false}),Ot.VERSION="4.16.4",u("bind bindKey curry curryRight partial partialRight".split(" "),function(t){Ot[t].placeholder=Ot}),u(["drop","take"],function(t,n){Dt.prototype[t]=function(r){var e=this.__filtered__;if(e&&!n)return new Dt(this);r=r===F?1:zi(wu(r),0);var u=this.clone();return e?u.__takeCount__=Wi(r,u.__takeCount__):u.__views__.push({
size:Wi(r,4294967295),type:t+(0>u.__dir__?"Right":"")}),u},Dt.prototype[t+"Right"]=function(n){return this.reverse()[t](n).reverse()}}),u(["filter","map","takeWhile"],function(t,n){var r=n+1,e=1==r||3==r;Dt.prototype[t]=function(t){var n=this.clone();return n.__iteratees__.push({iteratee:_e(t,3),type:r}),n.__filtered__=n.__filtered__||e,n}}),u(["head","last"],function(t,n){var r="take"+(n?"Right":"");Dt.prototype[t]=function(){return this[r](1).value()[0]}}),u(["initial","tail"],function(t,n){var r="drop"+(n?"":"Right");
Dt.prototype[t]=function(){return this.__filtered__?new Dt(this):this[r](1)}}),Dt.prototype.compact=function(){return this.filter(Mu)},Dt.prototype.find=function(t){return this.filter(t).head()},Dt.prototype.findLast=function(t){return this.reverse().find(t)},Dt.prototype.invokeMap=lr(function(t,n){return typeof t=="function"?new Dt(this):this.map(function(r){return Mn(r,t,n)})}),Dt.prototype.reject=function(t){return this.filter(ou(_e(t)))},Dt.prototype.slice=function(t,n){t=wu(t);var r=this;return r.__filtered__&&(0<t||0>n)?new Dt(r):(0>t?r=r.takeRight(-t):t&&(r=r.drop(t)),
n!==F&&(n=wu(n),r=0>n?r.dropRight(-n):r.take(n-t)),r)},Dt.prototype.takeRightWhile=function(t){return this.reverse().takeWhile(t).reverse()},Dt.prototype.toArray=function(){return this.take(4294967295)},On(Dt.prototype,function(t,n){var r=/^(?:filter|find|map|reject)|While$/.test(n),e=/^(?:head|last)$/.test(n),u=Ot[e?"take"+("last"==n?"Right":""):n],i=e||/^find/.test(n);u&&(Ot.prototype[n]=function(){function n(t){return t=u.apply(Ot,s([t],f)),e&&h?t[0]:t}var o=this.__wrapped__,f=e?[1]:arguments,c=o instanceof Dt,a=f[0],l=c||nf(o);
l&&r&&typeof a=="function"&&1!=a.length&&(c=l=false);var h=this.__chain__,p=!!this.__actions__.length,a=i&&!h,c=c&&!p;return!i&&l?(o=c?o:new Dt(this),o=t.apply(o,f),o.__actions__.push({func:Je,args:[n],thisArg:F}),new Mt(o,h)):a&&c?t.apply(this,f):(o=this.thru(n),a?e?o.value()[0]:o.value():o)})}),u("pop push shift sort splice unshift".split(" "),function(t){var n=Xu[t],r=/^(?:push|sort|unshift)$/.test(t)?"tap":"thru",e=/^(?:pop|shift)$/.test(t);Ot.prototype[t]=function(){var t=arguments;if(e&&!this.__chain__){
var u=this.value();return n.apply(nf(u)?u:[],t)}return this[r](function(r){return n.apply(nf(r)?r:[],t)})}}),On(Dt.prototype,function(t,n){var r=Ot[n];if(r){var e=r.name+"";(Zi[e]||(Zi[e]=[])).push({name:n,func:r})}}),Zi[Yr(F,2).name]=[{name:"wrapper",func:F}],Dt.prototype.clone=function(){var t=new Dt(this.__wrapped__);return t.__actions__=Cr(this.__actions__),t.__dir__=this.__dir__,t.__filtered__=this.__filtered__,t.__iteratees__=Cr(this.__iteratees__),t.__takeCount__=this.__takeCount__,t.__views__=Cr(this.__views__),
t},Dt.prototype.reverse=function(){if(this.__filtered__){var t=new Dt(this);t.__dir__=-1,t.__filtered__=true}else t=this.clone(),t.__dir__*=-1;return t},Dt.prototype.value=function(){var t,n=this.__wrapped__.value(),r=this.__dir__,e=nf(n),u=0>r,i=e?n.length:0;t=i;for(var o=this.__views__,f=0,c=-1,a=o.length;++c<a;){var l=o[c],s=l.size;switch(l.type){case"drop":f+=s;break;case"dropRight":t-=s;break;case"take":t=Wi(t,f+s);break;case"takeRight":f=zi(f,t-s)}}if(t={start:f,end:t},o=t.start,f=t.end,t=f-o,
u=u?f:o-1,o=this.__iteratees__,f=o.length,c=0,a=Wi(t,this.__takeCount__),!e||200>i||i==t&&a==t)return Ar(n,this.__actions__);e=[];t:for(;t--&&c<a;){for(u+=r,i=-1,l=n[u];++i<f;){var h=o[i],s=h.type,h=(0,h.iteratee)(l);if(2==s)l=h;else if(!h){if(1==s)continue t;break t}}e[c++]=l}return e},Ot.prototype.at=Lo,Ot.prototype.chain=function(){return Ge(this)},Ot.prototype.commit=function(){return new Mt(this.value(),this.__chain__)},Ot.prototype.next=function(){this.__values__===F&&(this.__values__=xu(this.value()));
var t=this.__index__>=this.__values__.length;return{done:t,value:t?F:this.__values__[this.__index__++]}},Ot.prototype.plant=function(t){for(var n,r=this;r instanceof Rt;){var e=De(r);e.__index__=0,e.__values__=F,n?u.__wrapped__=e:n=e;var u=e,r=r.__wrapped__}return u.__wrapped__=t,n},Ot.prototype.reverse=function(){var t=this.__wrapped__;return t instanceof Dt?(this.__actions__.length&&(t=new Dt(this)),t=t.reverse(),t.__actions__.push({func:Je,args:[qe],thisArg:F}),new Mt(t,this.__chain__)):this.thru(qe);
},Ot.prototype.toJSON=Ot.prototype.valueOf=Ot.prototype.value=function(){return Ar(this.__wrapped__,this.__actions__)},Ot.prototype.first=Ot.prototype.head,vi&&(Ot.prototype[vi]=Ye),Ot}();typeof define=="function"&&typeof define.amd=="object"&&define.amd?(Pt._=un, define('lodash',[],function(){return un})):qt?((qt.exports=un)._=un,Zt._=un):Pt._=un}).call(this);
/**
 * @author Ivan Ivanov <ivan.ivanov@telebid-pro.com>
 * @desc Telebid's js heart
 * @module TB
 * @memberOf TB
 */
(function(root, factory) {
  root.TB = root.TB || {};

  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(root.TB, require('lodash'));
  } else if (typeof define === 'function' && define.amd) {
    define('tb.core',['lodash'], function() {
      return (root.TB = factory(root.TB, root._));
    });
  } else {
    root.TB = factory(root.TB, root._);
  }
})(this, function(TB, _) {
  'use strict';

  /**
   * @namespace {Object} TB
   * @augments module:xerrors
   */

  /**
   * @memberOf TB
   * @alias TB.CONFIG
   * @type {Object}
   * @property {Boolean} XERRORS_LOG_CONSOLE append log messages in navigator's console ( console.log() )
   * @property {Boolean} XERRORS_LOG_LOCALSTORAGE append log message in navigator's localStorage
   * @property {String} XERRORS_LOG_LOCALSTORAGE_NAME name of navigator's localStorage to append log messages
   */
  TB.CONFIG = TB.CONFIG || {};

  TB.CONFIG.WHITELISTED_ERROR_SOURCES = [];

  TB.CONFIG.ERR_PEER = 'TbPeerError';
  TB.CONFIG.ERR_PEER_PREFIX = 'PEER_ERROR';
  TB.CONFIG.PEER_ERROR_AUDIT_TYPE_ID = 2;
  TB.CONFIG.AUDIT_LEVEL_WARN = 4;

  TB.CONFIG.ERR_ASSERT_PEER = 'TbAssertPeerError';
  TB.CONFIG.ERR_ASSERT_PEER_PREFIX = 'ASSERT_PEER_FAILED';
  TB.CONFIG.ASSERT_PEER_AUDIT_TYPE_ID = 60;
  TB.CONFIG.AUDIT_LEVEL_ERR = 3;

  TB.CONFIG.ERR_USER = 'TbUserError';
  TB.CONFIG.ERR_USER_PREFIX = 'USER_ERROR';
  TB.CONFIG.USER_ERROR_AUDIT_TYPE_ID = 50;
  TB.CONFIG.AUDIT_LEVEL_INFO = 6;

  TB.CONFIG.ERR_SYS = 'TbSysError';
  TB.CONFIG.ERR_SYS_PREFIX = 'TEMP_APP_ERROR';
  TB.CONFIG.SYS_AUDIT_TYPE_ID = 80;
  TB.CONFIG.AUDIT_LEVEL_ERR = 3;

  TB.CONFIG.ERR_APP = 'TbAppError';
  TB.CONFIG.ERR_APP_PREFIX = 'ASSERT_FAILED';
  TB.CONFIG.ASSERT_AUDIT_TYPE_ID = 1;
  TB.CONFIG.AUDIT_LEVEL_ERR = 3;

  TB.CONFIG.ERR_CONFIG = 'TbConfigError';
  TB.CONFIG.ERR_CONFIG_PREFIX = 'CONF_ERROR';
  TB.CONFIG.CONFIG_AUDIT_TYPE_ID = 4;
  TB.CONFIG.AUDIT_LEVEL_ERR = 3;

  TB.CONFIG.ERR_OPEN_CONN = 'TbOpenConnError';
  TB.CONFIG.ERR_OPEN_CONN_PREFIX = 'CONN_OPEN_ERROR';
  TB.CONFIG.IO_AUDIT_TYPE_ID = 70;
  TB.CONFIG.AUDIT_LEVEL_ERR = 3;

  TB.CONFIG.ERR_IO_CONN = 'TbConnIOError';
  TB.CONFIG.ERR_IO_CONN_PREFIX = 'CONN_IO_ERROR';
  TB.CONFIG.IO_AUDIT_TYPE_ID = 70;
  TB.CONFIG.AUDIT_LEVEL_ERR = 3;

  TB.CONFIG.ERR_UNKNOWN = 'TbUnknownError';
  TB.CONFIG.ERR_UNKNOWN_PREFIX = 'TEMP_APP_ERROR';
  TB.CONFIG.SYS_AUDIT_TYPE_ID = 80;
  TB.CONFIG.AUDIT_LEVEL_ERR = 3;

  TB.CONFIG.KEEP_ORIGINAL_MSGS = false;
  TB.CONFIG.SERVICE_AUDIT_TYPE_ID = 3;

  TB.CONFIG.DEBUG_IN_GLOBAL_SCOPE = true;
  TB.CONFIG.ASSERTS_DISABLED = false;
  TB.CONFIG.ASSERTS_DEFAULT_MSG_DELIMITER = ' ';
  TB.CONFIG.TYPE_DELIMITER = '|';
  TB.CONFIG.TRACE_ARGUMENTS_DELIMITER = ' ';
  TB.CONFIG.TRACE_OPEN_PLACEHOLDER_STR = '';
  TB.CONFIG.TRACE_CLOSE_PLACEHOLDER_STR = '';
  TB.CONFIG.TRACE_OPEN_PLACEHOLDER_STR = '[[ ';
  TB.CONFIG.TRACE_CLOSE_PLACEHOLDER_STR = ' ]]';
  TB.CONFIG.TRACE_OPEN_TYPE_PLACEHOLDER_STR = '(';
  TB.CONFIG.TRACE_CLOSE_TYPE_PLACEHOLDER_STR = ')';
  TB.CONFIG.EMPTY_DATE = '';
  TB.CONFIG.XHR_RETRY_MS = 5000;
  TB.CONFIG.ENV = 'dev';
  TB.CONFIG.HAS_WINDOW = typeof window !== 'undefined';
  TB.CONFIG.MAX_TRACE_LINES = 1000;
  TB.CONFIG.MAX_TRACE_LINE_LENGTH = 10000;
  TB.CONFIG.INTERFACE_NAME = '';

  TB.CONFIG.XERRORS_LOG_CONSOLE =
    typeof TB.CONFIG.XERRORS_LOG_CONSOLE !== 'undefined'
      ? TB.CONFIG.XERRORS_LOG_CONSOLE
      : true;
  TB.CONFIG.XERRORS_LOG_LOCALSTORAGE =
    typeof TB.CONFIG.XERRORS_LOG_LOCALSTORAGE !== 'undefined'
      ? TB.CONFIG.XERRORS_LOG_LOCALSTORAGE
      : false;
  TB.CONFIG.XERRORS_LOG_LOCALSTORAGE_NAME = '__TB_XERRORS__';
  TB.CONFIG.XERRORS_DEFAULT_CODE = '0000';
  TB.CONFIG.XERRORS_DEFAULT_MSG = 'Application error!';

  TB.CONFIG.RETRY_TIMES = 10;
  TB.CONFIG.RETRY_INTERVAL = 1000;

  /**
   * Generates unique id for current browser window. Starts from 1 and increments with one each time it's called.
   * If prefix set, it's prefixed before the number.
   * @param  {String) prefix string to prepend before unique number
   * @return {String}   unique id
   */
  TB.getUniqueId = (function() {
    var idCounter = 0;
    return function(prefix) {
      prefix = prefix || '';

      return prefix + ++idCounter + '';
    };
  })();

  TB.isPositiveInteger = function isPositiveInteger(x) {
    // http://stackoverflow.com/a/1019526/11236
    return /^\d+$/.test(x);
  };

  TB.isCompatibleVersion = function isCompatibleVersion(ver1, ver2) {
    var ver1parts = ver1.split('.');
    var ver2parts = ver2.split('.');

    function validateParts(parts) {
      for (var i = 0; i < parts.length; ++i) {
        if (!TB.isPositiveInteger(parts[i])) {
          return false;
        }
      }
      return true;
    }

    if (!validateParts(ver1parts) || !validateParts(ver2parts)) {
      return false;
    }

    if (ver1parts.length != ver2parts.length) {
      return false;
    }

    if (ver1parts[0] > ver2parts[0]) {
      return false;
    }

    for (var i = 1; i < ver1parts.length; ++i) {
      if (ver2parts.length === i) {
        return true;
      }

      if (ver1parts[i] >= ver2parts[i]) {
        continue;
      }

      return false;
    }

    if (ver1parts.length != ver2parts.length) {
      return false;
    }
  };

  /**
   * If object has length property
   * @param {*} obj object to check
   * @return {Boolean} true if has property length
   */
  TB.isArrayLike = function(obj) {
    var length = TB.isString(obj) ? obj.length : TB.get(obj, 'length');

    if (Number.MAX_SAFE_INTEGER > 0) {
      return (
        typeof length === 'number' &&
        length >= 0 &&
        length <= Number.MAX_SAFE_INTEGER
      );
    } else {
      return typeof length === 'number' && length >= 0;
    }
  };

  /**
   * Convert to array
   * @param  {*} obj iteratable object
   * @return {Array}
   */
  TB.toArray = function(obj) {
    if (TB.isUndefined(obj)) {
      return [];
    }
    if (TB.isArray(obj)) {
      return Array.prototype.slice.call(obj, 0);
    }

    if (TB.isArrayLike(obj)) {
      return TB.map(obj, function(value) {
        return value;
      });
    }
    return TB.values(obj);
  };

  /**
   * Map over object
   * @param  {Object} obj      object to map
   * @param  {Function} iteratee function to fire
   * @param  {*} [context]  context for iteratee function
   * @return {Array}          results
   */
  TB.map = function(obj, iteratee, context) {
    var keys = !TB.isArrayLike(obj) && Object.keys(obj);
    var length = (keys || obj).length;
    var results = Array(length);

    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;

      results[index] = iteratee.bind(context || this)(
        obj[currentKey],
        currentKey,
        obj
      );
    }
    return results;
  };

  /**
   * Convert object to array of it's property values
   * @param {Object} obj object
   * @return {Array} list of property values
   */
  TB.values = function(obj) {
    var keys = Object.keys(obj);
    var result = [];

    for (var i = 0; i < keys.length; i++) {
      var val = obj[keys[i]];

      result.push(val);
    }

    return result;
  };

  /**
   * Empty function
   */
  TB.noop = function() {};

  /**
   * Add 'px' suffix
   * @param  {Number} value value to concatenate
   * @return {String}       concatenated value with px
   */
  TB.toPx = function(value) {
    return value + 'px';
  };

  /**
   * Get property value by path
   * @param  {Object} obj          object to search in
   * @param  {(String|Array)} path         path to search; if string, properties are using "." (dot) delimiter
   * @param  {*} defaultValue default value if undefined
   * @return {*}              found value
   * @example
   * var obj = { foo: { bar: 5, qux: undefined } };
   * TB.get( obj, 'foo.bar', null ); // 5
   * TB.get( obj, 'foo.baz' ); // undefined
   * TB.get( obj, 'foo.qux', null ); // null
   * TB.get( obj, 'foo.baz.qux', null ); // null
   * TB.get( obj, ['foo', 'bar'] ); // 5
   */
  TB.get = function(obj, path, defaultValue) {
    var pathArr = typeof path === 'string' ? path.split('.') : path;

    return pathArr.reduce(function(prev, curr) {
      return prev && prev[curr] !== undefined ? prev[curr] : defaultValue;
    }, obj);
  };

  /**
   * Set property value
   * @param {Object} obj   object to set property
   * @param {(String|Array)} path  path to search; if string, properties are using "." (dot) delimiter
   * @param {*} value value to set on given path
   * @example
   * var obj = { foo: { bar: 5 } };
   * TB.set( obj, 'foo.bar', 6 ); // obj.foo.bar === 6
   * TB.set( obj, 'foo.qux', 'value' ); // obj.foo.qux === 'value'
   * TB.set( obj, 'foo.bar.qux', 'value' ); // throws new TypeError
   */
  TB.set = function(obj, path, value) {
    var a = typeof path === 'string' ? path.split('.') : path;
    var o = obj;

    for (var i = 0; i < a.length - 1; i++) {
      var n = a[i];

      if (n in o) {
        o = o[n];
      } else {
        o[n] = {};
        o = o[n];
      }
    }
    o[a[a.length - 1]] = value;

    return value;
  };

  /**
   * Clone function
   * @param  {Function} fn function to clone
   * @return {Function}      cloned function
   */
  TB.cloneFunction = function(fn) {
    var temp = function temporary() {
      return fn.apply(this, arguments);
    };

    for (var key in fn) {
      if (fn.hasOwnProperty(key)) {
        temp[key] = fn[key];
      }
    }

    return temp;
  };

  /**
   * Assign properties of obj2 to obj1
   * @param  {Object} obj1 destination
   * @param  {Object} obj2 source
   * @return {Object}      destination
   */
  TB.assign = function(obj1, obj2) {
    for (var key in obj2) {
      obj1[key] = obj2[key];
    }
    return obj1;
  };

  TB.clone = TB.assign;

  /**
   * Set properties of source to destination by value
   * @param  {Object} destination destination object
   * @param  {Object} source      source object
   * @return {Object}             destination object (NOTE: destination argument is passed by reference, so it's already extended and it's === with return value)
   */
  TB.merge = function(destination, source) {
    for (var property in source) {
      if (
        source[property] &&
        source[property].constructor &&
        source[property].constructor === Object
      ) {
        destination[property] = destination[property] || {};
        TB.merge(destination[property], source[property]);
      } else if (
        source[property] &&
        source[property].constructor &&
        source[property].constructor === Array
      ) {
        destination[property] = destination[property] || [];
        TB.merge(destination[property], source[property]);
      } else {
        destination[property] = source[property];
      }
    }

    return destination;
  };

  /**
   * Values is between values
   * @param  {Number}  value     value to check
   * @param  {down}  down      minimum of the range
   * @param  {up}  up        maximum of the range
   * @param  {Boolean}  inclusive range inclusive
   * @return {Boolean}           true if in range
   */
  TB.isBetween = function(value, down, up, inclusive) {
    return inclusive
      ? value >= down && value <= up
      : value > down && value < up;
  };
  /**
   * If value is out of range, set it to closest range border
   * @param  {Number} value value to check
   * @param  {Number} down  minimum of the range
   * @param  {Number} up    maximum of the range
   * @return {Number}       ranged value
   * @example
   * TB.limitToRange( 105, 1, 100 ) // returns 100
   * TB.limitToRange( -15, 1, 100 ) // returns 1
   * TB.limitToRange( 76, 1, 100 ) // returns 76
   */
  TB.limitToRange = function(value, down, up) {
    if (value > up) {
      return up;
    } else if (value < down) {
      return down;
    } else {
      return value;
    }
  };

  /**
   * If object contains value
   * @todo support String and Object
   * @param  {(Array)} arr  where to search for value
   * @param  {*} item value to search for
   * @return {Boolean}
   */
  TB.contains = function(arr, item) {
    return arr.indexOf(item) >= 0;
  };

  /**
   * Checks if value is a boolean
   * @param  {*}  value value to check
   * @return {Boolean}       true if value is a boolean
   */
  TB.isBoolean = function(value) {
    return typeof value === 'boolean';
  };

  /**
   * Checks if value is a number
   * @param  {*}  value value to check
   * @return {Boolean}       true if value is a number
   */
  TB.isNumber = function(value) {
    return typeof value === 'number' || value instanceof Number;
  };

  /**
   * Checks if value is defined
   * @param  {*}  value         value to check
   * @param  {Boolean}  nullIsDefined treat null as defined value
   * @return {Boolean}               true if value is defined
   */
  TB.isDefined = function(value, nullIsDefined) {
    return nullIsDefined
      ? typeof value !== 'undefined'
      : typeof value !== 'undefined' && value !== null;
  };

  /**
   * Checks if value is not defined
   * @param  {*}  value         value to check
   * @param  {Boolean}  nullIsDefined treat null as defined value
   * @return {Boolean}               true if value is not defined
   */
  TB.isUndefined = function(value, nullIsDefined) {
    return !TB.isDefined(value, nullIsDefined);
  };

  /**
   * Checks if value is object
   * @param  {*}  value value to check
   * @return {Boolean}       true if value is an object
   */
  TB.isObject = function(value) {
    return value === Object(value);
  };

  /**
   * Checks if value is a sting
   * @param  {*}  value value to check
   * @return {Boolean} true if value is a string
   */
  TB.isString = function(value) {
    return typeof value === 'string';
  };

  /**
   * Checks if value is a function
   * @param  {*}  value value to check
   * @return {Boolean}       true if values is a function
   */
  TB.isFunction = function(value) {
    return typeof value === 'function';
  };
  /**
   * Checks if object is a date
   * @param  {*}  date value to check
   * @return {Boolean}      true if value is instance of Date
   */
  TB.isDate = function(value) {
    return value && typeof value === 'object' && value.constructor === Date;
  };

  /**
   * Checks if object is an array
   * @param  {*}  arr value to check
   * @return {Boolean} true if values is an array
   */
  TB.isArray = function(value) {
    return value && typeof value === 'object' && value.constructor === Array;
  };

  /**
   * Checks if value is empty
   * @param  {*}  value value to check
   * @return {Boolean}       true if value is NaN,
   * infinity, null, undefined, empty string, empty array, empty object
   */
  TB.isEmpty = function(value) {
    switch (TB.typeof(value)) {
      case 'NaN':
      case 'infinity':
      case 'null':
      case 'undefined':
        return true;
      case 'string':
        return value === '';
      case 'array':
        return value.length <= 0;
      case 'object':
        return Object.keys(value).length <= 0;
      default:
        return false;
    }
  };
  /**
   * Custom typeof
   * @param  {*} val value to check type
   * @return {String}     any of types object, array, null, NaN, infinity, number, string, symbol, undefined, boolean, function
   */
  TB.typeof = function(val) {
    switch (typeof val) {
      case 'object':
        if (val === null) {
          return 'null';
        } else if (_.isArray(val)) {
          return 'array';
        } else {
          return 'object';
        }
      case 'number':
        if (val !== val) {
          return 'NaN';
        }

        if (!isFinite(val)) {
          return 'infinity';
        }

        return 'number';
      case 'string':
      case 'symbol':
      case 'undefined':
      case 'boolean':
      case 'function':
      default:
        return typeof val;
    }
  };

  /**
   * Applies cssText to document
   * @param  {String} idSelector          id of the style tag; if element found, replace contents, else create new
   * @param  {String} cssText             CSS content
   * @param  {?Object} destinationDocument destination document; use when style applied in child window objects (iframe, child windows etc)
   */
  TB.applyCssRules = function(idSelector, cssText, destinationDocument) {
    var destination = destinationDocument || window.document;
    var style = destination.getElementById(idSelector);

    if (!style) {
      var container = destination;

      style = window.document.createElement('style');
      style.id = idSelector;
      style.type = 'text/css';

      if (destination instanceof Document) {
        container = destination.head;
      }

      container.appendChild(style);
    }

    style.textContent = cssText;
  };

  /**
   * Converts selector and jsonCss object to CSS style definition
   * @param {DOMSelector} selector selector string
   * @param {Object<String, String>} jsonCss  object where keys are css properties and values are css values
   * @return {String} generated css style definition
   */
  TB.JSON2CSS = function(selector, jsonCss) {
    var resultCss = ' ';

    ASSERT.isString(selector);
    ASSERT.isPlainObject(jsonCss);

    resultCss += selector;
    resultCss += ' { ';

    for (var cssProperty in jsonCss) {
      ASSERT(
        _.isString(jsonCss[cssProperty]) || _.isNumber(jsonCss[cssProperty])
      );

      resultCss += TB.camelCaseToDashes(cssProperty);
      resultCss += ': ';
      resultCss += jsonCss[cssProperty];
      resultCss += '; ';
    }
    resultCss += ' } ';

    return resultCss;
  };

  /**
   * Convert camel or pascal cased words to dashed string
   * @param  {String} str camel or pascal cased string
   * @return {String}     dashed string
   */
  TB.camelCaseToDashes = function(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  };

  /**
   * Convert underscored words to dashed string
   * @param  {String} str underscored string
   * @return {String}        dashed string
   */
  TB.underscoreToDash = function(str) {
    return str.replace('_', '-');
  };

  /**
   * Extends class with another one
   * @param  {Object} extendedClass  extended class
   * @param  {Object} extensionClass class to extend with
   * @return {Object}                extended class (NOTE: extendedClass argument is passed by reference, so it's already extended and it's === with return value)
   */
  TB.classExtend = function(extendedClass, extensionClass) {
    extendedClass.prototype = TB.merge(
      Object.create(extensionClass.prototype),
      extendedClass.prototype
    );
    extendedClass.prototype.constructor = extendedClass;
    return extendedClass;
  };

  /**
   * Append query string to url
   * @param  {String} url         url
   * @param  {String} queryString query string to append
   * @return {String}             resulted url
   */
  TB.urlAppend = function(url, queryString) {
    return (
      url +
      (/\?/.test(url) ? '&' : '?') +
      (TB.isEmpty(queryString) ? '' : queryString)
    );
  };

  /**
   * Convert ISO like date to ISO date
   * @param  {String} date iso like string
   * @return {String}      iso date
   */
  TB.normalizeDate = function(date) {
    if (!(date instanceof Date) && TB.isEmpty(date)) {
      return '';
    }

    if (date instanceof String || typeof date === 'string') {
      date = date.replace(/(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/, '$1T$2');
      date = new Date(date);
    }

    return date;
  };
  /*
  function importKey(key){
    return window.crypto.subtle.importKey(
      "raw",
      Uint8Array.from(key.split('').map(e=>e.charCodeAt(0))),
      {name:"AES-CTR", length: key.length * 4},
      true,
      ["encrypt", "decrypt"]
    );
  }

  /**
   * Encrypts data using symetric key
   * @param {String key key to be used for encryption
   * @param {String} data data to encrypt
   * @return {String} encrypted data
   *
  TB.encrypt = async function(key, data, params){
    TB.ASSERT(window.crypto, 'Crypto API not found', window);
    TB.ASSERT(window.crypto.subtle, 'Crypto Subtle API not found', window);
    TB.ASSERT(key, 'Key not supplied.', key);
    var rawData = data;
    if (params && params['inputType'] === 'string'){
      var te = new TextEncoder("utf-8");
      rawData = te.encode(data);
    }
    var encrypted = await window.crypto.subtle.encrypt(
      {
        name: "AES-CTR", 
        counter: new Uint8Array(16), 
        length: 16*8
      },
      await importKey(key),
      rawData
    );

    if (params && params['outputType'] === 'hex'){
      return Array.prototype.map.call(new Uint8Array(encrypted), x=>(('00'+x.toString(16)).slice(-2))).join('');
    }

    return encrypted;
  }
  */

  /**
   * Decrypts data using symetric key
   * @param {String key key to be used for decryption
   * @param {String} data data to decrypt
   * @return {String} decrypted data
   *
  TB.decrypt = async function(key, data, params){
    TB.ASSERT(window.crypto, 'Crypto API not found', window);
    TB.ASSERT(window.crypto.subtle, 'Crypto Subtle API not found', window);
    TB.ASSERT(key, 'Key not supplied.', key);
    var encryptedData = data;
    if (params && params['inputType'] === 'hex'){
      const bytes = [];
      for (let i = 0; i < hex.length; i+=2) {
        bytes.push(Number.parseInt(hex.slice(i,i+2), 16));
      }
      encryptedData = new Uint8Array(bytes);
    }
    var decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-CTR", 
        counter: new Uint8Array(16), 
        length: 16*8
      },
      await importKey(key),
      encryptedData
    );
    if (params && params['outputType'] === 'string'){
      var td = new TextDecoder("utf-8");
      return td.decrypt(decrypted);
    }
    return decrypted;
  }
  */

  /**
   * Parse query params
   * @param  {String} inputQuery query to be parsed, may start with "?" or "#"
   * @return {Object}            parsed query with keys of parameter names and their values
   */
  TB.parseQueryParams = function(inputQuery) {
    var search = /([^&;=]+)=?([^&;]*)/g;
    var decode = function(s) {
      return decodeURIComponent(s.replace(/\+/g, ' '));
    };
    var queryString = inputQuery || window.location.search;

    var query = queryString.replace(/^(\?*)/, '');
    query = query.replace(/^(\#*)/, '');

    var urlParams = {};
    var match;

    while ((match = search.exec(query))) {
      var key = decode(match[1]);
      var val = decode(match[2]);

      if (urlParams[key] instanceof Array) {
        urlParams[key].push(val);
      } else if (urlParams[key] !== undefined) {
        urlParams[key] = [urlParams[key], val];
      } else {
        urlParams[key] = val;
      }
    }

    return urlParams;
  };

  /**
   * Turns js hash to properly escaped query params
   * @params {Object}
   * @return {String}
   */
  TB.toQueryString = function(params) {
    if (_.isString(params) || _.isEmpty(params)) {
      return params;
    }

    var queryArr = [];
    var add = function(key, value) {
      // If value is a function, invoke it and return its value
      value = _.isFunction(value) ? value() : value === null ? '' : value;

      if(value === undefined) return;

      queryArr[queryArr.length] =
        encodeURIComponent(key) + '=' + encodeURIComponent(value);
    };

    // If an array was passed in, assume that it is an array of form elements.
    if (_.isArray(params)) {
      for (var i = 0; params && i < params.length; i++) {
        add(params[i]['name'], params[i]['value']);
      }
    } else {
      // If traditional, encode the "old" way ( the way 1.3.2 or older
      // did it ), otherwise encode params recursively.
      for (var prefix in params) {
        if (params.hasOwnProperty(prefix)) {
          TB.buildParams(prefix, params[prefix], add);
        }
      }
    }

    // spaces should be + according to spec
    return queryArr.join('&').replace(/%20/g, '+');
  };
  /**
   * Build query params
   * @todo refactor this
   * @private
   * @param  {String} prefix TODO
   * @param  {Object} obj    TODO
   * @param  {Function} add    add callback
   */
  TB.buildParams = function(prefix, obj, add) {
    var rbracket = /\[ \ ]$/;

    if (_.isArray(obj)) {
      // Serialize array item.
      for (var i = 0, l = obj.length; obj && i < l; i++) {
        var value = obj[i];

        if (rbracket.test(prefix)) {
          // Treat each array item as a scalar.
          add(prefix, value);
        } else {
          TB.buildParams(
            prefix + '[ ' + (typeof value === 'object' ? i : '') + ' ]',
            value,
            add
          );
        }
      }
    } else if (obj && obj.toString() === '[ object Object ]') {
      // Serialize object item.
      for (var name in obj) {
        TB.buildParams(prefix + '[ ' + name + ' ]', obj[name], add);
      }
    } else {
      // Serialize scalar item.
      add(prefix, obj);
    }
  };
  /**
   * Returns a function, that, as long as it continues to be invoked, will not
   * be triggered. The function will be called after it stops being called for
   * N milliseconds. If `immediate` is passed, trigger the function on the
   * leading edge, instead of the trailing.
   * @param  {Function} func      [description]
   * @param  {Integer} wait      [description]
   * @param  {Boolean} immediate [description]
   * @return {Void}           [description]
   */
  TB.debounce = function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this,
        args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };

  /**
   * Replaces placeholders with given values. Placeholders format is $placeholder_name$. Placeholders are case-sensitive!
   * @param  {String} msgTmpl      Template string
   * @param  {Object} placeholders Values to be interpolated
   * @return {String}              Interpolated string
   */
  TB.simpleTmpl = function(msgTmpl, placeholders) {
    if (!placeholders) {
      return msgTmpl;
    }

    for (var key in placeholders) {
      var searchFor = '$' + key + '$';
      msgTmpl = msgTmpl.replace(searchFor, placeholders[key]);
    }

    return msgTmpl;
  };

  /**
   * Generic function used to enforce HTTP logout. Actually uses a little hach and sends wrong credention to force 401 from server.
   */
  var isLogoutRunning = false;
  const LOGOUT_COMMAND = 'logout';
  TB.HTTPLogout = function(authapi_apikey) {
    if (isLogoutRunning) {
      return;
    }

    var exitReq = new XMLHttpRequest();

    let pathNameSplit = window.location.pathname.split('/');
    let backoffice_apikey = pathNameSplit[1];
    let session_token = pathNameSplit[2];

	  ASSERT(authapi_apikey != null);
	  ASSERT(session_token != null);
	  ASSERT(backoffice_apikey != null);

	  var qsDs = {
		  command: LOGOUT_COMMAND,
          cgi: 1,
	  };

	  var query_data = '';

	  for (var param in qsDs) {
		  var encodedParam = encodeURIComponent(qsDs[param]);
	  	query_data += `${param}=${encodedParam}&`;
	  }

    var requestUrl = `/${backoffice_apikey}/authentication-api/${authapi_apikey}?${query_data}`;

    exitReq.open('GET', requestUrl, true);
    exitReq.onreadystatechange = function() {
		if (exitReq.readyState == 4) {
			if (exitReq.status == 200) {
				let res = JSON.parse(exitReq.responseText);
				ASSERT(res.result.location != null);

				window.location = res.result.location;
			} else {
		  	TB.THROW_USER({msg: 'Error while log out', code: 'TBCJS/900'});
			}
		}
	};

    isLogoutRunning = true;
    exitReq.send();
  };

  /**
   * Generates random color, supports seed
   * @param  {String} seed seed to generate color from, anytime you provide the same seed, you get the same color
   * @return {String}      HEX color
   */
  TB.generateColor = function(seed) {
    seed = seed !== undefined ? seed : Math.random();
    seed = seed.toString();

    var hash = 0;

    for (var i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    var color = Math.floor(Math.abs(Math.sin(seed) * 16777215) % 16777215);

    color = color.toString(16);
    // pad any colors shorter than 6 characters with leading 0s
    while (color.length < 6) {
      color = '0' + color;
    }

    return color;
  };

  TB.getCookie = function(cookies, cookieName) {
    var cookie = ('; ' + cookies).split('; '+ cookieName + '=').pop().split(';').shift();

    return cookie;
  }

  TB.rsplit = function( str, sep, maxsplit ) {
    var split = str.split(sep);
    if (split.length <= maxsplit ) {
      return split;
    }
    return maxsplit ? [ split.slice(0, -maxsplit).join(sep) ].concat(split.slice(-maxsplit)) : split;
  }


  // https://stackoverflow.com/questions/11401897/get-the-current-domain-name-with-javascript-not-the-path-etc
  TB.getDomain = function getDomain(url) {
    url = url.replace(/(https?:\/\/)?(www.)?/i, '');
    if (url.indexOf('/') !== -1) {
        url = url.split('/')[0];
    }

    return url;
  }


  var notifySettings = {
    addclass: 'translucent',
    icon: 'fa fa-exclamation-triangle',
    buttons: { sticker: false, },
    hide: false,
    styling: 'bootstrap3',
    delay: 4000
  };

  if (TB.CONFIG.HAS_WINDOW && window.$) {
    $(document).on('click', '#alert-show-details', function() {
      $(this).hide();
      $(this).siblings('br').hide();

      $('#alert-details').css('display', 'block');
    });
  }

  /*
    errDetails format:
      {system_version} => string
      {checksum} => string
      {event_id} => string
      {prefixed_code} => string
  */
  var createNotification = function createNotification(title, text, type, errDetails) {
    if ( ! window.PNotify ) {
      return;
    }

	if (TB.isModalShown) {
	  PNotify.removeAll();
	}

    if (errDetails) {
       // Event ID: ${errDetails.event_id}
      text += `
        <span id="alert-show-details" style="cursor: pointer;">Show Details</span>
        <span id="alert-details" style="display: none;">
          Diagnostics: ${errDetails.diag}
          Audit Code: ${errDetails.prefixed_code}
          Error Checksum: <span id="tb-error-checksum">${errDetails.checksum}</span>
          Timestamp: ${errDetails.timestamp}
          System Version: ${errDetails.system_version}
        </span>
      `;

    }

    var notify = new PNotify(_.merge(
      {
        title: title,
        text: text,
        type: type,
      }, notifySettings)
    );

    TB.isModalShown = true;

    return notify;
  }

  TB.createNotification = createNotification;



  var TB_CORE_MODAL_IFRAME_ID = 0;
  // TB.createModalWithJF2 maybe? That will fetch the API?
  TB.createModalWithIFrame = function(options) {
    if ( ! TB.CONFIG.HAS_WINDOW ) {
      return;
    }

    TB.ASSERT(_.isPlainObject(options), options);
    TB.ASSERT(options.src, options);
       TB.ASSERT(options.title, options);

    TB_CORE_MODAL_IFRAME_ID += 1;

    // show modal
    var $modal = $(`
         <div class="modal" tabindex="-1" role="dialog">
           <div class="modal-dialog" role="document" style="width: 95%; height: ${window.innerHeight - 50}px">
                 <div class="modal-content">
                   <div class="modal-header">
                     <h5 class="modal-title">${ options.title }</h5>
                         <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                           <span aria-hidden="true">&times;</span>
                         </button>
                       </div>
                       <div class="modal-body">
                         <iframe src="${ options.src }" height = "${window.innerHeight - 250}px" width = "100%;">
              </iframe>
                       </div>
                       <div class="modal-footer">
                         <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                       </div>
                 </div>
               </div>
         </div>
    `);

    $modal.modal('show');
    $modal.on('shown.bs.modal', function () {
    });

    // populate with iframe with link <options.url>
  }

  TB.loadJSFile = function(src) {
/*

    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
*/


    let promise = new Promise((resolve, reject) => {
      require([src], (...modules) => {
        resolve(modules);
      });
    });

    // head.appendChild(script);

    return promise;
  }

  return TB;
});

/**
 * @author Ivan Ivanov <ivan.ivanov@telebid-pro.com>
 * @desc setting up all debug utilities for applications
 * @module xerrors
 * @memberOf TB
 */
(function (root, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('./tb.core'), require('lodash'));
  } else if (typeof define === 'function' && define.amd) {
    define('tb.xerrors',['tb.core', 'lodash'], function() {
      return factory.apply(factory, arguments);
    });
  } else {
    root.TB = root.TB || {};
    root.TB = factory(root.TB, _);
  }
})(this, function(TB, _) {
  'use strict';

  if(TB.CONFIG.HAS_WINDOW && TB.XErrors) {
    return TB;
  }

  class MyPromise extends Promise {
    constructor(...params) {
      super(...params);
      this.callStackMagic = TB.XErrors.prototype.getStackTrace();
    }
  }

  Error.stackTraceLimit = 100;

  var traceData = [];
  var AUDIT_LEVEL_ERROR = 'error';
  var AUDIT_LEVEL_NOTICE = 'notice';
  var MaxErrorAuditingRetryCount = 3;

  var ERROR_TYPE_TO_AUDIT_LEVEL = {
    [TB.CONFIG.ERR_CONFIG]: TB.CONFIG.AUDIT_LEVEL_ERR,
    [TB.CONFIG.ERR_USER]: TB.CONFIG.AUDIT_LEVEL_INFO,
    [TB.CONFIG.ERR_PEER]: TB.CONFIG.AUDIT_LEVEL_WARN,
    [TB.CONFIG.ERR_ASSERT_PEER]: TB.CONFIG.AUDIT_LEVEL_ERR,

    [TB.CONFIG.ERR_APP]: TB.CONFIG.AUDIT_LEVEL_ERR,

    [TB.CONFIG.ERR_SYS]: TB.CONFIG.AUDIT_LEVEL_ERR,
    [TB.CONFIG.ERR_OPEN_CONN]: TB.CONFIG.AUDIT_LEVEL_ERR,
    [TB.CONFIG.ERR_OPEN_CONN]: TB.CONFIG.AUDIT_LEVEL_ERR,
    [TB.CONFIG.ERR_IO_CONN]: TB.CONFIG.AUDIT_LEVEL_ERR,
    [TB.CONFIG.ERR_UNKNOWN]: TB.CONFIG.AUDIT_LEVEL_ERR,
  };

  var ERROR_TYPE_TO_MONITORING_PREFIX = {
    [TB.CONFIG.ERR_CONFIG]: TB.CONFIG.ERR_CONFIG_PREFIX,
    [TB.CONFIG.ERR_USER]: TB.CONFIG.ERR_USER_PREFIX,
    [TB.CONFIG.ERR_PEER]: TB.CONFIG.ERR_PEER_PREFIX,
    [TB.CONFIG.ERR_ASSERT_PEER]: TB.CONFIG.ERR_ASSERT_PEER_PREFIX,

    [TB.CONFIG.ERR_APP]: TB.CONFIG.ERR_APP_PREFIX,

    [TB.CONFIG.ERR_SYS]: TB.CONFIG.ERR_SYS_PREFIX,
    [TB.CONFIG.ERR_OPEN_CONN]: TB.CONFIG.ERR_OPEN_CONN_PREFIX,
    [TB.CONFIG.ERR_OPEN_CONN]: TB.CONFIG.ERR_OPEN_CONN_PREFIX,
    [TB.CONFIG.ERR_IO_CONN]: TB.CONFIG.ERR_IO_CONN_PREFIX,
    [TB.CONFIG.ERR_UNKNOWN]: TB.CONFIG.ERR_UNKNOWN_PREFIX,
  };

  var classnameToPrefix = {};
  classnameToPrefix[TB.CONFIG.ERR_USER] = 'U';
  classnameToPrefix[TB.CONFIG.ERR_CONFIG] = 'U';
  classnameToPrefix[TB.CONFIG.ERR_PEER] = 'RT';
  classnameToPrefix[TB.CONFIG.ERR_ASSERT_PEER] = 'RF';
  classnameToPrefix[TB.CONFIG.ERR_APP] = 'I';
  classnameToPrefix[TB.CONFIG.ERR_UNKNOWN] = 'I';
  classnameToPrefix[TB.CONFIG.ERR_SYS] = 'T';
  classnameToPrefix[TB.CONFIG.ERR_OPEN_CONN] = 'T';
  classnameToPrefix[TB.CONFIG.ERR_IO_CONN] = 'T';


  function tbSerialize(data) {
    var seen = [];

    // https://stackoverflow.com/questions/18391212/is-it-not-possible-to-stringify-an-error-using-json-stringify
    // stringification of error objects IS TRICKY BUSINESSS!
    function replaceErrors(key, value) {
      if (value != null && typeof value == "object") {
        if (seen.indexOf(value) >= 0) {
          return;
        }

        seen.push(value);
      }


      if (value instanceof Error) {
        var error = {};

        Object.getOwnPropertyNames(value).forEach(function (innerKey) {
          error[innerKey] = value[innerKey];
        });

        if (value.name) {
          error.name = value.name
        }

        return error;
      }

      if (TB.CONFIG.HAS_WINDOW && value instanceof Event) {
        // event, aswell as Error, had some bullshit number of properties that are ignored!
        var e = {};

        for (var innerKey in value) {
          if (innerKey === 'path' || innerKey === 'srcElement' || innerKey === 'currentTarget' || innerKey === 'target') {
            console.log("Skipping path prop on event because its too big");
          } else {
            e[innerKey] = value[innerKey];
          }
        }

        if (value.name) {
          e[name] = value.name
        }

        return e;
      }

      return value;
    }

    var res = JSON.stringify(data, replaceErrors);

    return res;
  }

  var generateChecksum = function (str) {
    var hash = 0, i, chr;
    for (i = 0; i < str.length; i++) {
      chr   = str.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }

	if (hash < 0) {
		hash = -hash;
    }

    return String(hash);
  }

  var windowAlert = function(msg) {
    if(TB.CONFIG.HAS_WINDOW) {
      window.alert(msg);
    }
  }

  /**
   * Very complicated to explain, please see the source
   * @todo refactor this hell
   * @param {...*} msgPartials message partials
   * @return {String} String
   */

  var TbCustomError = (function() {
    function TbCustomError(message, tbData) {
      var error = Error.call(this, message);
      var isHandled = false;
      var isProcessed = false;

      tbData = tbData || {};

      this.origMsg = tbData.origMsg;
      this.message = error.message;
      this.msg = tbData.msg;
      this.code = tbData.code;
      this.stack = error.stack;
      this.tbData = tbData;
      this.level_id = this.tbData.level;

      var prefix = tbData.monitoring_prefix;


      if (prefix === TB.CONFIG.ERR_USER_PREFIX) {
        this.type_id = TB.CONFIG.USER_ERROR_AUDIT_TYPE_ID;
      } else if (prefix === TB.CONFIG.ERR_PEER_PREFIX) {
        this.type_id = TB.CONFIG.PEER_ERROR_AUDIT_TYPE_ID;
      } else if (prefix === TB.CONFIG.ERR_ASSERT_PEER_PREFIX) {
        this.type_id = TB.CONFIG.ASSERT_PEER_AUDIT_TYPE_ID;
      } else if (prefix === TB.CONFIG.ERR_SYS_PREFIX) {
        this.type_id = TB.CONFIG.SYS_AUDIT_TYPE_ID;
      } else if (prefix === TB.CONFIG.ERR_APP_PREFIX) {
        this.type_id = TB.CONFIG.ASSERT_AUDIT_TYPE_ID;
      } else if (prefix === TB.CONFIG.ERR_CONFIG_PREFIX) {
        this.type_id = TB.CONFIG.CONFIG_AUDIT_TYPE_ID;
      } else if (prefix === TB.CONFIG.ERR_OPEN_CONN_PREFIX || prefix === TB.CONFIG.ERR_IO_CONN_PREFIX) {
        this.type_id = TB.CONFIG.IO_AUDIT_TYPE_ID;
      } else {
        this.type_id = TB.CONFIG.ASSERT_AUDIT_TYPE_ID;
      }

      this.isHandled = function() {
        return isHandled;
      }

      this.setHandled = function() {
        return isHandled = true;
      }

      this.SetProcessed = function() {
        return this.setHandled();
      }

      this.Process = function(additionalParams){
        // make multiple $err->Process calls to not generate multiple audits and etc., but the SetProcessed + Process to actually audit the error!
        if (isProcessed) {
          return;
        }

        // what should we do in this place? Maybe use it like jf.page uses it and sends stuff to the server? It works...
        TRACE("Processed the error!");
      }

      return this;
    }

    TbCustomError.prototype = Object.create(Error.prototype);
    TbCustomError.prototype.constructor = TbCustomError;

    return TbCustomError;
  })();


  var ErrorClassCreator = function(errClassName) {
    var CustomError = function CustomError(message, tbData) {
        var baseErrorObj = TbCustomError || Error;
        var error = new baseErrorObj(message, tbData);
        error.name = errClassName;

        return error;
    }

    return CustomError;
  };

  var UserError = ErrorClassCreator(TB.CONFIG.ERR_USER);
  var PeerError = ErrorClassCreator(TB.CONFIG.ERR_PEER);
  var AssertPeerError = ErrorClassCreator(TB.CONFIG.ERR_ASSERT_PEER);
  var AppError = ErrorClassCreator(TB.CONFIG.ERR_APP);
  var SysError = ErrorClassCreator(TB.CONFIG.ERR_SYS);
  var ConfigError = ErrorClassCreator(TB.CONFIG.ERR_CONFIG); // AppErr SUPP2
  var OpenConnError = ErrorClassCreator(TB.CONFIG.ERR_OPEN_CONN); // SysErr
  var UnknownError = ErrorClassCreator(TB.CONFIG.ERR_UNKNOWN);

  var errorMap = {};
  errorMap[TB.CONFIG.ERR_USER] = UserError;
  errorMap[TB.CONFIG.ERR_ASSERT_PEER] = AssertPeerError;
  errorMap[TB.CONFIG.ERR_PEER] = PeerError;
  errorMap[TB.CONFIG.ERR_UNKNOWN] = UnknownError;
  errorMap[TB.CONFIG.ERR_APP] = AppError;
  errorMap[TB.CONFIG.ERR_SYS] = SysError;
  errorMap[TB.CONFIG.ERR_CONFIG] = ConfigError;
  errorMap[TB.CONFIG.ERR_OPEN_CONN] = OpenConnError;
  errorMap[TB.CONFIG.ERR_UNKNOWN] = UnknownError;
  errorMap[TB.CONFIG.ERR_IO_CONN] = OpenConnError;

  var lodashAssertionsDefinitions = [{
    methods: ['isArguments', 'isArray', 'isBoolean', 'isDate', 'isElement', 'isEmpty', 'isError', 'isFinite', 'isFunction', 'isInteger', 'isLength', 'isMap', 'isNaN', 'isNative', 'isNil', 'isNull', 'isNumber', 'isObject', 'isObjectLike', 'isPlainObject', 'isRegExp', 'isSafeInteger', 'isSet', 'isString', 'isUndefined', 'isTypedArray', 'isWeakMap', 'isWeakSet'],
    numArgs: 1,
    orNil: true,
    todoUpdate: ['isArrayBuffer', 'isArrayLike', 'isArrayLikeObject', 'isBuffer']
  }, {
    methods: ['isEqual', 'isMatch', 'has', ],
    numArgs: 2,
  }, {
    methods: ['isEqualWith', 'isMatchWith', ],
    numArgs: 3,
  }];

  var lodashExecCondition = function(lodashMethodName, argumentsArr, isNil) {
    if(isNil) {
      return _.isNil.call(_, argumentsArr[0]) ||  _[lodashMethodName].apply(_, argumentsArr);
    } else {
      return _[lodashMethodName].apply(_, argumentsArr);
    }
  }

  var lodashAssertFunc = function(assert, lodashMethodName, lodashAssertionDefinition, isNil) {
    var minArguments = lodashAssertionDefinition.numArgs;
    var maxArguments = lodashAssertionDefinition.numArgs + 1;
    return function() {
      TB.ASSERT(arguments.length >= minArguments && arguments.length <= maxArguments, {
        code: 'TBJS/XERR/1010',
        msg: 'Incorrect use of tb.xerrors ASSERT with lodashMethodName `' + lodashMethodName + '`. Expected `' + minArguments + '` or `' + maxArguments + '`, but `' + arguments.length + '` found',
      });

      if(arguments.length === minArguments) {
        assert(lodashExecCondition(lodashMethodName, arguments, isNil));
      } else {
        var assertArgument = arguments[maxArguments - 1];
        delete arguments[maxArguments - 1];

        return assert.call(this, lodashExecCondition(lodashMethodName, arguments, isNil), assertArgument);
      }
    };
  };

  function XErrors(s) {
    this.s = _.defaults({
      prefix: 'TB/Global: ',
      openPlaceholderStr: TB.CONFIG.TRACE_OPEN_PLACEHOLDER_STR,
      closePlaceholderStr: TB.CONFIG.TRACE_CLOSE_PLACEHOLDER_STR,
      openTypePlaceholderStr: TB.CONFIG.TRACE_OPEN_TYPE_PLACEHOLDER_STR,
      closeTypePlaceholderStr: TB.CONFIG.TRACE_CLOSE_TYPE_PLACEHOLDER_STR,
      recursiveObjectMsg: TB.CONFIG.TRACE_RECURSIVE_OBJECT_MSG,
      logConsole: TB.CONFIG.XERRORS_LOG_CONSOLE,
      logLocalStorage: TB.CONFIG.XERRORS_LOG_LOCALSTORAGE,
      logLocalStorageKey: TB.CONFIG.XERRORS_LOG_LOCALSTORAGE_KEY,
      maxTraceLines: TB.CONFIG.MAX_TRACE_LINES,
      maxTraceLineLength: TB.CONFIG.MAX_TRACE_LINE_LENGTH,
      defaultBenchmarkName: TB.CONFIG.DEFAULT_BENCHMARK_NAME,
      assertsDisabled: TB.CONFIG.ASSERTS_DISABLED,
      defaultMsg: TB.CONFIG.XERRORS_DEFAULT_MSG,
    }, s);

    var HARD_MAX_TRACE_LINES = 10000;
    var HARD_MAX_TRACE_LINE_LENGTH = 1000;

    if ( _.isNumber(this.s.maxTraceLines) && this.s.maxTraceLines > HARD_MAX_TRACE_LINES) {
        this.s.maxTraceLines = HARD_MAX_TRACE_LINES;
    }

    if ( !_.isNumber(this.s.maxTraceLineLength) || this.s.maxTraceLineLength > HARD_MAX_TRACE_LINES) {
        this.s.maxTraceLineLength = HARD_MAX_TRACE_LINES;
    }

    this.remoteAuditConnectorTimeout = null;
    this.benchmarkData = {};


    this.ASSERT =           this.assertWrapper(TB.CONFIG.ERR_APP);
    this.ASSERT_USER =      this.assertWrapper(TB.CONFIG.ERR_USER);
    this.ASSERT_PEER =      this.assertWrapper(TB.CONFIG.ERR_ASSERT_PEER);
    this.ASSERT_CONFIG =    this.assertWrapper(TB.CONFIG.ERR_CONFIG);
    this.ASSERT_CONN =      this.assertWrapper(TB.CONFIG.ERR_IO_CONN);
    this.ASSERT_OPEN_CONN = this.assertWrapper(TB.CONFIG.ERR_OPEN_CONN);

    this.THROW_SYS =        this.throwErrorWrapper(TB.CONFIG.ERR_SYS);
    this.THROW_USER =       this.throwErrorWrapper(TB.CONFIG.ERR_USER);
    this.THROW_PEER =       this.throwErrorWrapper(TB.CONFIG.ERR_PEER);
    this.THROW_CONFIG =     this.throwErrorWrapper(TB.CONFIG.ERR_CONFIG);
    this.THROW_CONN =       this.throwErrorWrapper(TB.CONFIG.ERR_IO_CONN);
    this.THROW_OPEN_CONN =  this.throwErrorWrapper(TB.CONFIG.ERR_OPEN_CONN);

    var trace5 = this.traceGenerator(5);
    this.TRACE = trace5.bind(this);
    this.TRACE5 = trace5.bind(this);

    var trace4 = this.traceGenerator(4);
    this.TRACE4 = trace4.bind(this);

    var trace3 = this.traceGenerator(3);
    this.TRACE3 = trace3.bind(this);

    var trace2 = this.traceGenerator(2);
    this.TRACE2 = trace2.bind(this);

    var trace1 = this.traceGenerator(1);
    this.TRACE1 = trace1.bind(this);
  }

  var p = {};

  XErrors.prototype = p;
  p.traceGenerator = function traceGenerator(logLevel) {
    return function a(...args) {
      //console.log(...args); NOTE: @velislav: THIS IS USELESS -> Leads to multiple traces in console.

      var msgStr = this.prepareMsg(args[0], args[1], true);
      return this.traceReadyMsg(msgStr);
    }

  }


  p.prepareMsg = function prepareMsg(msg, msgParams, addType) {
    var stringifiedParams = {};

    var MAX_OBJECT_PROPS_LIMIT = 100;

    if(typeof msgParams === 'string') {
        return msg + ' ' + msgParams;
    }

    if(typeof msgParams === 'number') {
        return msg + ' ' + msgParams;
    }

    if(msgParams && typeof msgParams === 'object' && Object.keys(msgParams).length > MAX_OBJECT_PROPS_LIMIT) {
        return msg + ' [OBJECT TOO BIG TO BE TRACED] ';
    }

    for(var msgParamName in msgParams) {
      var msgParam = msgParams[msgParamName];

      stringifiedParams[msgParamName] = '';

      if(addType) {
        stringifiedParams[msgParamName] += this.s.openPlaceholderStr + this.s.openTypePlaceholderStr + this.guessType(msgParam) + this.s.closeTypePlaceholderStr;
      }

      try {
        stringifiedParams[msgParamName] += tbSerialize(msgParam);
      } catch(e) {
        stringifiedParams[msgParamName] += this.s.recursiveObjectMsg;
      }

      if(addType) {
        stringifiedParams[msgParamName] += this.s.closePlaceholderStr;
      }
    }

    return TB.simpleTmpl(msg, stringifiedParams)
  };

  p.guessType = function guessType(value) {
    if(_.isArray(value)) {
      return 'array';
    }

    if(_.isNull(value)) {
      return 'null';
    }

    if(_.isNaN(value)) {
      return 'NaN';
    }

    return typeof value;
  };

  p.getStackTrace = function getStackTrace() {
    let callerStackLines = (new Error()).stack.split("\n");

    return callerStackLines;
  }


  p.traceReadyMsg = function traceReadyMsg(msgStr) {
    var currentTime = new Date().toISOString();
    const numberOfStackFramesFromTraceFunctionToTraceCaller = 4;
    let callerStackLine = (new Error()).stack.split("\n")[ numberOfStackFramesFromTraceFunctionToTraceCaller ];

    if(TB.CONFIG.HAS_WINDOW) {
      if ( this.s.logConsole && window.console && window.console.error ) {
        console.log( msgStr.split ? msgStr.split('\\n').join('\n') : msgStr );
      }

      if ( this.s.logLocalStorage && window !== undefined && window.localStorage ) {
        var logSoFar = window.localStorage.getItem( this.s.logLocalStorageKey ) || '';
        var log = logSoFar + msgStr;

        window.localStorage.setItem( this.s.logLocalStorageKey, log );
      }
    }

    if ( !_.isNumber( this.s.maxTraceLines ) || traceData.length >= this.s.maxTraceLines ) {
      traceData.shift( );
    }

    try {
        msgStr = msgStr.toString();
    } catch(e) {
        msgStr = '';
    }

    if ( msgStr.length > this.s.maxTraceLineLength ) {
        var half = Math.max(Math.floor(this.s.maxTraceLineLength / 2) - 5, 4);
        var newStr = '!!!Message too long!!! ';

        newStr += msgStr.substr(0, half);
        newStr += ' [...] ';
        newStr += msgStr.substr(-half);

        msgStr = newStr;
    }
      
    msgStr = currentTime + " " + msgStr;
    msgStr = msgStr + callerStackLine;

    traceData.push( msgStr );

    return msgStr;
  };

  /**
   * Traces content
   * @alias TRACE
   * @memberOf module:xerrors
   * @todo optimize appending to localStorage by cashing current messages
   * @return {String} traced msg
   */
  p.trace = function trace(msg, msgParams) {

    if (TB.CONFIG.HAS_WINDOW) {
      var msgStr = this.prepareMsg(msg, msgParams, true);
      return this.traceReadyMsg(msgStr);
    } else {
      var currentTime = new Date().toISOString();
      var data = [currentTime, ...arguments];

      console.log(data.join(' '));
    }
  }
















  /**
   * Starts a code benchmark
   * @alias BENCHMARK_START
   * @memberOf module:xerrors
   * @param  {String} [name] name of the benchmark; if not provided will be used the value of this.s.defaultBenchmarkName
   */
  p.benchmarkStart = function benchmarkStart( name ) {
    name = name || this.s.defaultBenchmarkName;

    this.benchmarkData[ name ] = {
      start: new Date( ),
    };
    console.time( name );
    trace( 'Benchmark start $NAME$ at $TIME$', {
      NAME: name,
      TIME: this.benchmarkData[ name ].start,
    } );
  };
  /**
   * Starts a code benchmark
   * @alias BENCHMARK_END
   * @memberOf module:xerrors
   * @param  {String} [name] name of the benchmark; if not provided will be used the value of this.s.defaultBenchmarkName
   */
  p.benchmarkEnd = function benchmarkEnd( name ) {
    name = name || this.s.defaultBenchmarkName;

    if ( !this.benchmarkData.hasOwnProperty( name ) ) {
      return;
    }

    this.benchmarkData[ name ].end = new Date( );
    var period = this.benchmarkData[ name ].end - this.benchmarkData[ name ].start;

    console.timeEnd( name );
    trace( 'Benchmark end $NAME$ for $PERIOD$ ($START$ | $END$)', {
      NAME: name,
      START: this.benchmarkData[ name ].start,
      END: this.benchmarkData[ name ].start,
      PERIOD: period,
    } );
    delete this.benchmarkData[ name ];
  };

  p.getLog = function getLog() {
    return traceData;
  }

  p.throwErrorWrapper = function throwErrorWrapper( type ) {
    var self = this;

    return function( props, msg, code, addParams ) {
      if(type === TB.CONFIG.ERR_USER) {
          TB.ASSERT(!_.isNil(props.code));
          TB.ASSERT(!_.isNil(props.msg));
      } else {
        props = props || {};
      }

      var inMsg = props.msg;
      if (msg) {
        inMsg = msg;
      }

      var inCode = props.code;
      if (code) {
        inCode = code;
      }

      var error = self.createError({
        throw: true,
        type: type,
        code: inCode,
        msg: inMsg,
        msgParams: props.msgParams,
        debug: props.debug,
        addParams: addParams,
        depth: 4,
      });

      self.errorHandler(error);

      throw error;
    };
  }

  p.assertWrapper = function assertWrapper( type ) {
    var self = this;
    /**
     * @alias ASSERT
     * @memberOf module:xerrors
     * @param {(Boolean|*)} condition condition to check of trueable

     * @return {Boolean}
     */
    function assert( condition, msg, code, addParams ) {
      if ( self.s.assertsDisabled && 0 ) return true;

      if (type !== TB.CONFIG.ERR_APP) {
          if (typeof msg === 'object' && msg !== null) {
            // parse the object?
            code = msg.code;
            msg = msg.msg;
          }

          if(type === TB.CONFIG.ERR_USER) {
              TB.ASSERT(!_.isNil(code));
              TB.ASSERT(!_.isNil(msg));
          }
      }

      if ( condition ) {
        return true;
      }

      if (type === TB.CONFIG.ERR_APP) {
        // createError will do it
        msg = undefined;
        code = undefined;
        addParams = undefined;
      }

      var error = self.createError({
        assert: true,
        type: type,
        code: code,
        msg: msg,
        addParams: addParams,
        debug: arguments,
        depth: 4,
      });

      self.errorHandler(error);

      if (TB.CONFIG.HAS_WINDOW) {
        TRACE("Throwing the error....");
      } else {
       plv8.elog(NOTICE, "DATA: ", JSON.stringify(error));
      }
      throw error;
    }

    var allShortcutAssertsMethods = ['isNotNil', 'isNotEmpty',];

    for(var i = 0, l = lodashAssertionsDefinitions.length; i < l; i++) {
      var lodashAssertionDefinition = lodashAssertionsDefinitions[i];

      for(var k = 0, l = lodashAssertionDefinition.methods.length; k < l; k++) {
        var lodashMethodName = lodashAssertionDefinition.methods[k];

        allShortcutAssertsMethods.push(lodashMethodName);

        if(typeof _[lodashMethodName] !== 'function') {
          var err = new AppError('Unknown lodash method: ' + lodashMethodName);
          throw err;
        }

        assert[lodashMethodName] = lodashAssertFunc(assert, lodashMethodName, lodashAssertionDefinition, false);

        if(lodashAssertionDefinition.orNil) {
          assert[lodashMethodName + 'OrNil'] = lodashAssertFunc(assert, lodashMethodName, lodashAssertionDefinition, true);
        }
      }
    }

    assert.isNotNil = function(value, errData) {
      return assert(!_.isNil(value), errData);
    };

    assert.isNotEmpty = function(value, errData) {
      return assert(!_.isEmpty(value), errData);
    }

    if(TB.CONFIG.ASSERTS_DISABLED && 0) {
      for(var i = 0, l = allShortcutAssertsMethods.length; i < l; i++) {
        assert[ allShortcutAssertsMethods[i] ] = _.noop;
      }
    }

    return assert;
  };

  p.simplifyStack = function simplifyStack(err, level) {
    var stackArr = err.stack.split('\n');

    stackArr.splice(1, level || 0);

    return stackArr.join('\n');
  };

  function getLineFileAndColFromStack(stack) {
    if (stack == undefined) {
      return undefined;
    }

    var stackArray = stack.split("\n");
    var line = stackArray[1];
    var re = /.*?\((.*)\)/;
    var match = re.exec( line );

    var correctLine;
    if (match === null) {
      // line is already in the correct format (<file.js>:<line>:<col>) - with and without the parentheses
      correctLine = line;
    } else {
      correctLine = match[1];
    }

    if (correctLine == undefined) {
      TB.ASSERT(0, "Unknown Stack Trace???", stack, "unable to parse sensible error from it!");
    }

    var matchArray = TB.rsplit(correctLine, ":", 2);

    return {
      filename: matchArray[0],
      filenameUI: matchArray[0].split('?')[0],
      lineno: matchArray[1],
      colno: matchArray[2],
    }
  }



  p.createError = function createError( errData ) {
    var code = errData.code || TB.CONFIG.XERRORS_DEFAULT_CODE;
    if (code !== undefined && typeof code !== 'string') {
        code = code.toString();
    }

    TB.ASSERT(ERROR_TYPE_TO_AUDIT_LEVEL[errData.type], "Unknown Error Type or level: ", errData.type, ERROR_TYPE_TO_AUDIT_LEVEL);
    errData.level = ERROR_TYPE_TO_AUDIT_LEVEL[errData.type];
    errData.monitoring_prefix = ERROR_TYPE_TO_MONITORING_PREFIX[errData.type];

    errData.addParams = errData.addParams || {};

    if ( ! errData.addParams.skipPrefixForCode ) {
      // if it doesnt begin, prefix: this is the case of an ASSERT_USER in the RemoteAPI tb.service.js, maybe the fix should be there, but maybe not - no reason for multiple SAME prefixes...
      code = classnameToPrefix[errData.type] + '/' + code;
    }

    var isUI = errData.type === TB.CONFIG.ERR_USER;
    errData.addParams = errData.addParams || {};
    if (errData.addParams.isUIAppropriate === undefined) {
      errData.addParams.isUIAppropriate = false;
    }

    var msg;

    if(errData.msg) {
      msg = this.prepareMsg(errData.msg, errData.msgParams, !isUI);
    } else if (errData.defaultMsg) {
      msg = this.prepareMsg(errData.defaultMsg, errData.defaultMsgParams, !isUI);
    } else {
      msg = this.s.defaultMsg;
    }


    if (errData.err) {
      errData.origMsg = errData.err.origMsg || msg;
    } else {
      errData.origMsg = msg;
    }

    var UIFrontParams = [
      TB.CONFIG.ERR_USER,
      TB.CONFIG.ERR_PEER,
    ];
    if (UIFrontParams.indexOf(errData.type) == -1 && ! errData.addParams.isUIAppropriate) {
      msg = this.s.defaultMsg;
    }

    msg = msg || this.s.defaultMsg;

    errData.msg = msg;
    errData.code = code;



    var msgWithCode = '[' + code + '] ' + msg;
    var err = new errorMap[errData.type]( msgWithCode, errData );

    var stackSimple = this.simplifyStack(err, errData.depth || 0);

    err.addParams = errData.addParams;
    if (errData.hasStack === false) {
      err.stack = undefined;
    } else {
      err.stack = stackSimple;
    }

    var stack = stackSimple;
    var stackArray = stack.split("\n");

    var line = stackArray[1];
    var re = /.*?\((.*)\)/;
    var match = re.exec( line );
    if (match === null) {
      match = line;
    } else {
      match = match[1]
    }
    var matchArray = TB.rsplit(match, ":", 2);

    if (errData.hasStack !== false) {

      // there is a change for normalizeError to be called from the global handlers
      // and they WILL override our current line/col/filename etc. etc
      // So we must first get the line/col/filename from the errData /input data/, instead of trying to guess it ourselves /from the stack/
      // although we need it for some debug information

      err.filename = _.get(errData, 'filename') || matchArray[0];
      err.filenameUI = err.filename.split('?')[0];
      err.lineno = _.get(errData, 'lineno') || matchArray[1];
      err.colno = _.get(errData, 'colno') ||  matchArray[2];
      err.stack = _.get(errData, 'stack') || _.get(errData, 'err.stack') || err.stack;

      if (_.get(errData, 'err.stack')) {
        // add some more debug data
        err.rethrow_stack = stackSimple;
        err.rethrow_filename = matchArray[0];
        err.rethrow_lineno = matchArray[1];
        err.rethrow_colno = matchArray[2];
      }

      err.level = errData.level || AUDIT_LEVEL_ERROR;
    }

    //var filenameUILastTwoSlashes = TB.rsplit(matchArray[0], "/", 3);
    //filenameUILastTwoSlashes.shift();
    //filenameUILastTwoSlashes = filenameUILastTwoSlashes.join('/');
    //var filenameUILastTwoSlashesWithoutExtension = TB.rsplit(filenameUILastTwoSlashes, '.', 1);
    //var filenameUI = filenameUILastTwoSlashesWithoutExtension[0];
    //err.filenameUI = filenameUI;

    // the msgWithCode param only changes err.message.
    // the errData.code param only changes err.code.
	if (errData.type === TB.CONFIG.ERR_APP) {
      var checksum = generateChecksum(err.filenameUI + ":" + err.lineno + ":" + err.colno);
      err.code = classnameToPrefix[errData.type] + '/' + checksum;

      msgWithCode = '[' + err.code + '] ' + msg;
      err.message = msgWithCode;
    }


    return err;
  }

  p.remoteAuditConnector = function(flushData) {
    if(!TB.CONFIG.HAS_WINDOW) {
      return;
    }

    var errData = '{}';
    flushData = flushData || {};


    if (flushData.filename) {
      // all is fine, already set up!
    } else {
      flushData.filename = 'TO BE IMPLEMENTED';
      flushData.lineno = -1;
      flushData.colno = -1;
    }


    flushData.timestamp = new Date().toISOString();
    flushData.currentURL = window.location.href;
    flushData.refferer   = document.referrer;

    flushData.retry_count = flushData.retry_count || 0;
    flushData.retry_count++;

    //messageParams come from the developer, so they CAN be bad!
    var badMessageParams = false;

    try {
        errData = tbSerialize(flushData);
    } catch(e) {
        try {
            delete flushData.tbData.msgParams;
            errData = JSON.stringify(flushData);
            badMessageParams = true;
        } catch(e) {
            errData = JSON.stringify({
                '__UNABLE_TO_ENCODE_ERR__': true,
                'msg': "[UNABLE TO ENCODE TO JSON]",
            });
        }
    }

    var self = this;
    var promise = new Promise(TB.noop);
    var data = {
      cgi: 'cgi',
      api_key: TB.API_KEY,
      err_data: errData,
      stack_trace: flushData.stack || (new Error()).stack,
      trace: traceData.join( '\r\n' ),
      command: 'ui_trace',
      bad_message_params: badMessageParams,
      terminal_descr: TB.CONFIG.INTERFACE_NAME,
    };

    clearTimeout(this.remoteAuditConnectorTimeout);
    var queryParams = TB.parseQueryParams();

    if(TB.Request) {
      var reqSettings = {
        httpMethod: 'POST',
        url: TB.CONFIG.API_URL || TB.API_URL || queryParams['api_url'],
        data: data
      };

      promise = new TB.Request(reqSettings).request();
    } else {
      promise = new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        var formData = new FormData();

        for(var k in data) {
          if(typeof data[k] === 'object') {
            data[k] = JSON.stringify(data[k]);
          }

          formData.append(k, data[k]);
        }

        xhr.open('POST', TB.API_URL || '', true);
        xhr.onload = function(event) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    self.trace('Debug info successfully sent');
                    resolve();
                } else {
                    self.trace('Sending debug info failed with status $STATUS_TEXT$', {
                       STATUS_TEXT: xhr.statusText,
                    });
                    reject();
                }
            }
        };
        xhr.onerror = function(e) {
            self.trace('Sending debug info failed with status $STATUS_TEXT$', {
              STATUS_TEXT: xhr.statusText,
            });
        };

        xhr.send(formData);
      });
    }

    promise
      .then(function() {
        clearTimeout(self.remoteAuditConnectorTimeout);
      })
      .catch(function() {
        if (flushData.retry_count > MaxErrorAuditingRetryCount) {
          // stop retrying errors...
          clearTimeout(self.remoteAuditConnectorTimeout);
        } else {
          flushData.retry_count++;
          self.remoteAuditConnectorTimeout = setTimeout(function() {
            self.remoteAuditConnector(flushData);
          }, TB.CONFIG.XHR_RETRY_MS + Math.random() * TB.CONFIG.XHR_RETRY_MS);
        }

      });

    return promise;
  };

  p.normalizeError = function normalizeError(origError) {
    // TODO @suricactus - what is this? Where is it used, what was the purpose of this?
    // var errContext = {
    //   navigator: (typeof navigator !== 'undefined') ? navigator.userAgent : null,
    // };
    var error;

    if(origError !== null && origError !== undefined) {
      if(origError instanceof TbCustomError) {
        error = origError;
      } else if (typeof origError === 'object' && origError !== null) {
         error = this.createError({
          type: TB.CONFIG.ERR_APP,
          code: TB.CONFIG.XERRORS_DEFAULT_CODE,
          err: origError,
          msg: origError.message,
          depth: 4,
          filename: origError.filename,
          lineno: origError.lineno,
          colno: origError.colno
        });
      } else {
        error = this.createError({
          type: TB.CONFIG.ERR_APP,
          code: TB.CONFIG.XERRORS_DEFAULT_CODE,
          err: origError,
          msg: origError,
          depth: 4,
          filename: origError.filename,
          lineno: origError.lineno,
          colno: origError.colno
        });
      }
    } else {
      error = this.createError({
        type: TB.CONFIG.ERR_APP,
        code: TB.CONFIG.XERRORS_DEFAULT_CODE,
        msg: TB.CONFIG.XERRORS_DEFAULT_MSG,
        data: event,
        depth: 5,
      });
    }

    error.timestamp = new Date().toISOString();

    if(! ( false
        || origError instanceof EvalError
        || origError instanceof RangeError
        || origError instanceof ReferenceError
        || origError instanceof SyntaxError
        || origError instanceof TypeError
        || origError instanceof URIError
        || origError instanceof TbCustomError
      )
    ) {
      error.isErrorTypeRecognized = true;
    }

    return error;
  };

  /**
   * Traces content
   * @todo this function must really send http request one day
   * @deprecated it's not implemented yet
   * @alias FLUSH
   * @param {String} level DEBUG|NOTICE|WARNING|ERROR
   * @param {String} msg
   * @param {*} data
   * @memberOf module:xerrors
   * @return {object} promise
   */
  p.remoteAudit = function remoteAudit( level, msg, data ) {
    var data = {
      level: level || AUDIT_LEVEL_NOTICE,
      msg: msg || '',
      data: data,
      browser: TB.Browser && TB.Browser.getFullInfo( ),
      type_id: TB.CONFIG.SERVICE_AUDIT_TYPE_ID,
    };

    return TB.CONFIG.XERRORS_HOOK_REMOTE_AUDIT(data);
  };

  p.flush = function flush( level, msg, data ) {
    var err =  new Error();
    windowAlert('You are using flush(), but must be replaced by remoteAudit() near: ' + this.simplifyStack(err, 1))
    return remoteAudit(level, msg, data);
  }

  p.errorHandler = function errorHandler(tbError) {
    TB.LAST_ERROR = tbError;

    if(tbError.isHandled()) return tbError;

    tbError.setHandled(true);

    this.traceReadyMsg(tbSerialize(tbError));

    TB.CONFIG.XERRORS_HOOK_REMOTE_AUDIT(tbError);

    // TODO assert it is a function
    TB.CONFIG.XERRORS_HOOK_ERROR_HANDLER_UI(tbError);
    tbError.isUIHandled = true;


    if(tbError instanceof AppError || tbError instanceof PeerError ) {
      throw tbError;
    }

    return tbError;
  };

  p.errorHandlerUi = function errorHandlerUi(err) {
    if (err.isUIHandled) {
      return;
    }

    if ( ! TB.CONFIG.HAS_WINDOW ) {
      return;
    }

    var errDetails;
    if (_.get(err, 'addParams.reqErr.details')) {
      errDetails = err.addParams.reqErr.details;
    } else if (_.get(err, 'addParams.req_err.details')) {
      errDetails = err.addParams.req_err.details;
    }

    if (err.name === TB.CONFIG.ERR_USER) {
      TB.createNotification(err.msg + ' [' + err.code + ']', 'Operation failed!', 'warning', errDetails);
    } else {
      TB.createNotification('Operation Failed', err.msg + ' [' + err.code + ']', 'error', errDetails);
    }
  };

  if(TB.CONFIG.HAS_WINDOW) {
    var globalErrorHandling = function(errorEvent) {
      //alert("tb xerrors catch error");
      //console.log("Tzzz23", errorEvent);
      if (errorEvent.message === 'Script error.') {
        return false;
      }

      if (errorEvent.error && errorEvent.error.requireModules) {
        // https://tbpro.slack.com/archives/C044870M8DR/p1684747637928029
        // this is require.js error
        return false;
      }

      var filename = errorEvent.filename;
      if ( TB.CONFIG.WHITELISTED_ERROR_SOURCES.length !== 0 && filename !== '' && filename !== undefined ) {
        var domainName = TB.getDomain( filename );

        if ( TB.CONFIG.WHITELISTED_ERROR_SOURCES.indexOf( domainName ) == -1 ) {
          return false;
        }
      }

      if (errorEvent.origMsg && errorEvent.origMsg.match("Script error for.*\\n.*require")) {
        return false;
      }

      TRACE("We got this data in the handler: errorEvent: " + errorEvent.origMsg);
      TRACE("We got this data in the handlers: $$errorEventReason$$ $$errorEventErr", {
        errorEventReason: errorEvent.reason,
        errorEventErr: errorEvent.err,
        errorEvent: tbSerialize(errorEvent),
      });

      var origError;
      if (errorEvent.error && typeof errorEvent.error === 'object') {
        if (!errorEvent.error.lineno && errorEvent.lineno) {
          errorEvent.error.lineno = errorEvent.lineno;
        }
        if (!errorEvent.error.filename && errorEvent.filename) {
          errorEvent.error.filename = errorEvent.filename;
        }
        if (!errorEvent.error.colno && errorEvent.colno) {
          errorEvent.error.colno = errorEvent.colno;
        }

        origError = globalXerr.normalizeError(errorEvent.error);
      } else if (errorEvent.message) {
        origError = globalXerr.normalizeError({
          message: errorEvent.message,
          filename: errorEvent.filename,
          lineno: errorEvent.lineno,
          colno: errorEvent.colno,
          isCors: errorEvent.message === 'Script error.',
        });

      } else if (errorEvent.type && errorEvent.type === 'unhandledrejection') {
        // this case is throw new Error on a promise, all we have is a stack trace and message!
        var stack = _.get(errorEvent, 'reason.stack');
        TB.ASSERT(stack, "Unknown stack: ", stack, Object.keys(errorEvent), errorEvent);
        var parsedStack = getLineFileAndColFromStack(stack);
        if (parsedStack) {
          origError = globalXerr.normalizeError({
            message: errorEvent.reason.message,
            filename: parsedStack.filename,
            lineno: parsedStack.lineno,
            colno: parsedStack.colno,
            stack: stack,
            isCors: errorEvent.reason.message === 'Script error.',
          });
        } else {
          // no idea, unhandled to the max!
          origError = globalXerr.normalizeError(errorEvent);
        }
      } else {
        origError = globalXerr.normalizeError();
      }

      // should be above but this will duplicate all the logic about finding the filename!
      var regexIsExtensionError = /^(.*)extension:\/\//;
      if (origError.filename && origError.filename.match(regexIsExtensionError)) {
        return;
      }

      globalXerr.errorHandler(origError);

      errorEvent.error2 = TB.LAST_ERROR;
      errorEvent.tbError = TB.LAST_ERROR;
    }

    window.addEventListener('error', globalErrorHandling);
    window.onunhandledrejection = globalErrorHandling;

  }

  var globalXerr = new XErrors();

  TB.TRACE1 = globalXerr.TRACE1;
  TB.TRACE2 = globalXerr.TRACE2;
  TB.TRACE3 = globalXerr.TRACE3;
  TB.TRACE4 = globalXerr.TRACE4;
  TB.TRACE5 = globalXerr.TRACE5;
  TB.TRACE = globalXerr.TRACE;

  TB.ASSERT = globalXerr.ASSERT;
  TB.ASSERT_PEER = globalXerr.ASSERT_PEER;
  TB.ASSERT_USER = globalXerr.ASSERT_USER;
  TB.ASSERT_CONFIG = globalXerr.ASSERT_CONFIG;
  TB.ASSERT_CONN = globalXerr.ASSERT_CONN;
  TB.ASSERT_OPEN_CONN = globalXerr.ASSERT_OPEN_CONN;

  TB.THROW_SYS = globalXerr.THROW_SYS;
  TB.THROW_PEER = globalXerr.THROW_PEER;
  TB.THROW_USER = globalXerr.THROW_USER;
  TB.THROW_CONFIG = globalXerr.THROW_CONFIG;
  TB.THROW_CONN = globalXerr.THROW_CONN;
  TB.THROW_OPEN_CONN = globalXerr.THROW_OPEN_CONN;


  TB.GET_LOG = globalXerr.getLog.bind(globalXerr);
  TB.FLUSH = globalXerr.remoteAudit.bind(globalXerr);
  TB.BENCHMARK_START = globalXerr.benchmarkStart.bind(globalXerr);
  TB.BENCHMARK_END = globalXerr.benchmarkEnd.bind(globalXerr);
  TB.CREATE_ERROR = globalXerr.createError.bind(globalXerr);
  TB.NORMALIZE_ERROR = globalXerr.normalizeError.bind(globalXerr);
  TB.ERROR_HANDLER = globalXerr.errorHandler.bind(globalXerr);
  TB.SERIALIZE = tbSerialize;

  TB.CONFIG = TB.CONFIG || {};
  TB.CONFIG.XERRORS_HOOK_REMOTE_AUDIT = TB.CONFIG.XERRORS_HOOK_REMOTE_AUDIT || globalXerr.remoteAuditConnector.bind(globalXerr);
  TB.CONFIG.XERRORS_HOOK_ERROR_HANDLER_UI = TB.CONFIG.XERRORS_HOOK_ERROR_HANDLER_UI || globalXerr.errorHandlerUi.bind(globalXerr);
  TB.CONFIG.XERRORS_DEFAULT_ERROR_HANDLER_UI = globalXerr.errorHandlerUi.bind(globalXerr);

  TB.XErrors = XErrors;
  TB.TbCustomError = TbCustomError;


  // Always export all the variables:
  var globalDebugFunctionNames = [
      'ASSERT', 'ASSERT_PEER', 'ASSERT_USER', 'ASSERT_CONFIG', 'ASSERT_CONN', 'ASSERT_OPEN_CONN',
      'THROW_SYS', 'THROW_PEER', 'THROW_USER', 'THROW_CONFIG', 'THROW_CONN', 'THROW_OPEN_CONN',
      'FLUSH', 'BENCHMARK_START', 'BENCHMARK_END',
      'NORMALIZE_ERROR',
      'TRACE', 'TRACE1', 'TRACE2', 'TRACE3', 'TRACE4', 'TRACE5',
  ];



  for ( var i = 0, l = globalDebugFunctionNames.length; i < l; i++ ) {
    var debugFunctionName = globalDebugFunctionNames[ i ];

    if (TB.CONFIG.HAS_WINDOW) {
      window[ debugFunctionName ] = TB[ debugFunctionName ];
    }
  }

  TB.Promise = MyPromise;

  return TB;
});

/** LOADER **/
/**
 * @author Ivan Ivanov <ivan.ivanov@telebid-pro.com>
 * @desc request wrapper
 * @module Request
 * @memberOf TB
 */
;(function(global, factory) {
  if(typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('lodash'), require('tb.xerrors'));
  } else if (typeof define === 'function' && define.amd) {
    define('tb.request',['lodash', 'tb.xerrors'], function() {
      return factory.apply(factory, arguments);
    });
  } else {
    global.TB = global.TB || {};
    global.TB.Request = factory(global._, global.TB);
  }
})(this, function(_, TB) {
  'use strict';

  let HTTP_LINE_DELIMITER = '\r\n';

  let websocketPool = [];
  const WEBSOCKET_COUNT = 5; 

  class TBWebsocket {

    constructor() {
    }

    get response() {
      return this.responseText;
    }

    get readyState() {
      return this._readyState;
    }

    set readyState(_state) {
      this._readyState = _state;
      this.onreadystatechange();
    }

    onreadystatechange() { }

    abort() {
      this.readyState = 0;
      this.status = 0;
      if (this.ws && this.ws.readyState <= 1) {
        this.ws.close();
      }
    }

    getResponseHeader(header) {
      return this.responseHeaders[header.toLowerCase()];
    }

    setRequestHeader(header, value) {
      this.requestHeaders[header.toLowerCase()] = value;
    }

    open(method, url, options = {}) {

      this.method = method;

      url = url.replace('.', window.location.pathname);
      // TODO
      // ASSERT.has(window, 'WebSocket', { code: 'TBJS/REQ/2010', msg: 'Browser does not support Websockets', } );

      let wsProtocol = window.location.protocol === 'http:' ? 'ws:' : 'wss:';

      // let wsUrl = `wss://tblib-test.tb-pro.com/${url}`;
      let wsUrl = `${wsProtocol}//${window.location.host}${url}`;

      let optionsSearch = this.getParamsFromObject(options);
      if (url.indexOf('?') === -1) {
        wsUrl += '?' + optionsSearch;
      } else {
        wsUrl += '&' + optionsSearch;
      }

      let eventSettings = {
        once: true
      };

      // return new TB.Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.addEventListener('open', (event) => {
        this.readyState = 1;
        websocketPool.push(this);
        this.openResolve();

        this.stopReject = this.sendReject;

      }, eventSettings);

      this.ws.addEventListener('error', (e) => {
        console.log('error', e);
        this.stopReject();
        this.stopReject = () => { }; // TODO: replace with lodash noop
        // clearTimeout(timeout);

      }, eventSettings);

      this.ws.addEventListener('close', (c) => {
        console.log('close', c.code, c.reason);
        this.stopReject();
        // clearTimeout(timeout)
      }, eventSettings);

      this.ws.addEventListener('message', async (event) => {

        let msg = await event.data.text();

        if (msg === 'WSG_BEG') {
          this.readyState = 2;
        } else if (msg === 'WSG_EOF') {
          // this.s.type = 'html';
          // this._successCallback(response.responseText);
          /*this.sendResolve(new Response(this.responseText, {
                    status: this.status,
                    statusText: '',
                    headers: this.responseHeaders
                }));
                */
          this.sendResolve({
            body: this.responseText,
            status: this.status,
            headers: this.responseHeaders
          })
          this.readyState = 4;
          websocketPool.push(this);
        } else {
          if (!this.status) {
            let statusLineDelimIndex = msg.indexOf(HTTP_LINE_DELIMITER);

            this.status = msg.slice(0, statusLineDelimIndex);
            let headersString = msg.slice(HTTP_LINE_DELIMITER.length + statusLineDelimIndex);

            this.responseHeaders = headersString.split(HTTP_LINE_DELIMITER).reduce((acc, cur) => {
              let [headerKey, headerVal] = cur.split(': ');
              acc[headerKey] = headerVal;
              return acc;
            }, {});

            this.readyState = 3;
          } else {
            this.responseText += msg;
          }
        }
      });

      // });

      return this.openPromise;
    }

    send(body = null, url = '', method = null) {

      this.requestHeaders['authorization'] = 'Basic ' + btoa(unescape(encodeURIComponent(window.TB.LOGIN + ':' + window.TB.PASSWD)));
      this.requestHeaders['referer'] = window.location.href;

      // this.requestPromise = new TB.Promise((resolve, reject) => {
      //     this.requestResolve = resolve;
      //     this.requestReject = reject;
      // });

      let endpoint = url.replace('./', window.location.pathname.slice(0, window.location.pathname.lastIndexOf('/') + 1));

      let message = this.prepareMessage({
        body,
        endpoint,
        method: method || this.method || 'GET',
        headers: this.requestHeaders
      });


      try{
        let i = 0;
        while (i < message.headers.length) {
          this.ws.send(message.headers.slice(i, i += 65535));
        }

        i = 0;
        while (message.body && (i < message.body.length || i < message.body.byteLength)) {
          this.ws.send(message.body.slice(i, i += 65535));
        }

        if (message.checksum) {
          this.ws.send(message.checksum);
        }
      }catch(e){
        console.log('caught', e);
      }

      return this.sendPromise;
    }

    /**
     * Returns the settings, parsed to the protocol of the WSG
     * @param {Object} settings - An object for wrapping the HTTP request parameters.
     * @param {string} settings.method - The HTTP method to use for the request.
     * @param {string} settings.endpoint - The Endpoint the request is sent to.
     * @param {Object} [settings.wsgParameters={}] - An object containing the web socket gateway overhead.
     * @param {Object} [settings.headers={}] - An object containing the headers of the request.
     * @param {Object} [settings.getParams={}] - An object containing the get parameters of the request.
     * @param {string} [settings.body={}] - Body of the request.
     * @returns {Uint8Array}
     */
    prepareMessage(settings) {

      ASSERT(settings, { msg: "Parameter must not be null." });
      // ASSERT(settings.method, "Method must not be null.");
      // ASSERT(settings.endpoint != null, "Endpoint must not be null.");

      // const HTTP_LINE_DELIMITER = '\r\n';

      let payload = `${settings.method} ${settings.endpoint}`;
      if (settings.getParams) {

        let getParamsStr = this.getParamsFromObject(settings.getParams);

        if (payload.includes('?')) {
          getParamsStr = '&' + getParamsStr;
        } else {
          getParamsStr = '?' + getParamsStr;
        }

        payload += getParamsStr;
      }

      payload += HTTP_LINE_DELIMITER;

      let bodySize = (new Blob([settings.body || ''])).size;

      settings.headers = _.merge(
        settings.headers, 
        {
          "wsg-content-length": bodySize,
          "wsg-do-checksum": String(Boolean(settings.doChecksum))
        }
      );

      for (const header in settings.headers) {
        const value = settings.headers[header];
        payload += `${header}: ${value}${HTTP_LINE_DELIMITER}`;
      }

      payload += HTTP_LINE_DELIMITER;

      let message = {
        headers: payload.length + HTTP_LINE_DELIMITER + payload,
        body: settings.body,
      };

      /*
        if (settings.doChecksum) {
            const te = new TextEncoder();
            let payloadEncoded = te.encode(payload);
            let tmp = new Uint8Array(payloadEncoded.byteLength + bodyEncoded.byteLength);
            tmp.set(new Uint8Array(payloadEncoded), 0);
            tmp.set(new Uint8Array(bodyEncoded), payloadEncoded.byteLength);

            let checksum = [...new Uint8Array(await crypto.subtle.digest('SHA-256', tmp))]
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            checksum += HTTP_LINE_DELIMITER;
            message.checksum = checksum;
        }
        */
      return message;
    }

    getParamsFromObject(getParamsObj) {

      ASSERT(getParamsObj, { msg: "Get params should not be null." });

      return Object.entries(getParamsObj).map(([key, value]) => {
        if (value && String(value).length > 0) {
          return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        }
        return encodeURIComponent(key);
      }).join('&');
    }
  }

  function initializeWebsocketPool(){
    for (let i = 0; i < WEBSOCKET_COUNT; i++) {
      let tbws = new TBWebsocket();
      tbws.open("GET", '/', {
        "ws_type":"command",
        "wsg_version": "tbwsg01"
      });
    }
  }

  function useWS(){
    return window.location.href.indexOf('tblib-test.tb-pro.com') !== -1 || window.location.port === '9876';
  }

  if (useWS()) {
    //if ( window.location.search.indexOf('wsg') !== -1 ) {
    initializeWebsocketPool();
  }

  ASSERT(typeof _ != 'undefined', { code: 'TBJS/REQ/1010', msg: "Missing lodash", });

  // this._errorCallback: is actually network error callback: timeout, abort, non-2\d\d HTTP status code 

  /** LOADER **/

  var DOMhead = document.getElementsByTagName( 'head' )[0];

  /**
   * Request class
   * @constructor
   * @memberOf TB
   * @param {Object} settings instance settings
   * @param {Object} settings.url remote url
   * @param {?Function} settings.before complete callback
   * @param {?Function} settings.complete complete callback
   * @param {?Function} settings.progress progress callback
   */
  function Request( settings ) {

    if ( !( this instanceof Request ) ) {
      return new Request( settings );
    }

    var self = this;

    /**
     * Settings holder
     * @name Request#s
     * @type {Object}
     */
    this.s = _.extend({
      data: null,
      processData: true,
      httpMethod: 'GET',
      timeout: 10000,
      retardTimeout: 800,
      retardCb: null,
      retry: true,
      retryAuto: true, // TODO global
      retryRepeats: 3,
      retryInterval: 100,
      requestType: 'urlencode',

      isUIRequest: true,
      overlaySelector: null,
      loadingAnimationSelector: null,
    }, settings);

    if (this.s.cb) {
      ASSERT( ! _.has(this.s, 'cb') || _.isFunction(this.s.cb), "Provided settings CB is not a function!");
    }

    /**
     * Timeout id
     * @name Request#timeout
     * @type {?Number}
     */
    this.timeout = null;

    /**
     * Timeout for requests which last too long
     * @name Request#timeout
     * @type {?Number}
     */
    this.retardTimeout = null;

    /**
     * HTTP method
     * @name Request#httpMethod
     * @type {String}
     */
    this.httpMethod = ( this.s.httpMethod || 'GET' ).toUpperCase( );

    /**
     * Service URL
     * @name Request#url
     * @type {String}
     */
    this.url = this.s.url || '';

    /**
      * overlaySelector for loading
      * @name Request#overlaySelector
      * @type {String, null}
    */
    this.overlaySelector = this.s.overlaySelector;

    /**
      * loadingAnimationSelector for loading
      * @name Request#loadingAnimationSelector
      * @type {String, null}
    */
    this.loadingAnimationSelector = this.s.loadingAnimationSelector;


    /**
     * Data to send to the server
     * @name Request#data
     * @type {*}
     */
    this.data = null;
   
    /**
     * Request object
     * @type {Object}
     */
    this.requestObj = null;


    /**
     * Numbers request retried
     * @type {Number}
     */
    this.commitedRetries = 0;

    if ( !_.isEmpty( this.s.data ) ) {
      if ( this.s.processData ) {
        this.data = TB.toQueryString( this.s.data );
      } else {
        this.data = this.s.data;
      }

      if ( this.httpMethod === 'GET' ) {
        this.url = TB.urlAppend( this.url, this.data );
        this.data = null;
      }
    }

    this.promise = new TB.Promise( function( resolve, reject ) {
      self._promiseResolve = resolve;
      self._promiseReject = reject;
    } );

    this.isRequested = false;

    this.then = function() {
        this.promise = this.promise.then.apply(this.promise, arguments);
        return this;
    };

    this.catch = function() {
        this.promise = this.promise.catch.apply(this.promise, arguments);
        return this;
    };
  }

  /** @lends TB.Request.prototype */
  Request.prototype = {
    /**
     * Default request headers
     * @private
     * @type {Object}
     */
    _defaultHeaders: {
      contentType: 'application/x-www-form-urlencoded',
      // 'X-Requested-With': 'XMLHttpRequest',
      accept: {
        '*': 'text/javascript, text/html, application/xml, text/xml, */*',
        xml: 'application/xml, text/xml',
        html: 'text/html',
        text: 'text/plain',
        json: 'application/json, text/javascript',
        js: 'application/javascript, text/javascript',
      },
    },
    /**
     * getRequest
     * @private
     * @return {Object} XHR object
     */
    _makeRequest: function( ) {
      var self = this;

      TRACE('Starting request');

      this.isRequested = true;

      // If timeout, set timeout
      if ( _.isNumber( this.s.timeout ) && this.s.timeout > 0 ) {
        this.timeout = setTimeout( function( ) {
          self._timedOut = true;
          self.requestObj.abort();
          self.timeout = null;

          // adding 1s to the retry interval, because timeout :)
          self.currentRetryInterval += 1000;
        }, this.s.timeout );
      }

      if ( _.isNumber( this.s.retardTimeout ) && this.s.retardTimeout > 0 ) {
        this.retardTimeout = setTimeout( function( ) {
            self._retarded = true;

            if ( _.isFunction( self.s.retardCb ) ) {
               self.s.retardCb();
            }
        }, self.s.retardTimeout);
      }

      if ( this.s.type === 'jsonp' ) {
          this.requestObj = this._makeRequestJSONP();
      } else if ( useWS() ) {
          this.requestObj = this._makeRequestWS();
      } else {
          this.requestObj = this._makeRequestXHR();
      }
    },


	_makeRequestWS: function() { // changing to async will require changes on makeRequest
		
        if (websocketPool.length === 0){
				let tbws = new TBWebsocket();
			 	tbws.open("GET", '/', {
					"ws_type": "command",
					"wsg_version": "tbwsg01"
			  	});	
            //tbws.onreadystatechange = ()=>{
               websocketPool.push(tbws);
            //   tbws.onreadystatechange = _.noop;
            //}
        }

        let ws = websocketPool.shift();
        this._setHeaders( ws );
        this._setCredentials( ws );

        ws.onreadystatechange = this._handlerReadystatechangeXHR.bind( this );

        /*
        if(_.isFunction(this.s.beforeSend)) {
           this.s.beforeSend(xhr);
        }
        */

       /* 		
        var sentData = null;
        //form contains files that should be appended to the request: must be sent via formData
        if(this.s.requestType === 'formdata'&& this.s.requestFiles) {
           var formData = new FormData();
           var jsonPointerToName = {};

           for (var key in this.s.requestFiles.fileRequest) {
              if(this.s.requestFiles.fileRequest.hasOwnProperty(key)) {
                 var file = this.s.requestFiles.fileRequest[key].file;
                 var fileName = this.s.requestFiles.fileRequest[key].name;
                 if (_.isArray(file)) {
                    for (var i = 0; i < file.length; i++) {
                       formData.append(key, file[i], fileName);
                    }
                 } else {
                    formData.append(key, file, fileName);
                 }
              }
           }

           for (var key in this.data) {
              formData.append(key, this.data[key]);
           }

           sentData = formData;
        } else {
           sentData = this.data;
        }
        */


        ws.send( this.data, this.url, this.httpMethod);
        this._showLoadingAnimation();

        return ws;
	},

     /**
      * Make request with JSONP
      * @private
      * @return {Object} abortable
      */
     _makeRequestJSONP: function( ) {
        var cbQueryParamName = this.s[ 'jsonpCallback' ] || 'callback';
        var cbQueryParamValue = this.s[ 'jsonpCallbackName' ];
        var scriptEl = document.createElement( 'script' );
        var isLoaded = false;
        var responseData;

        this.url = TB.urlAppend( this.url, this.data );
        this.url = TB.urlAppend( this.url, cbQueryParamName + '=' + cbQueryParamValue );

        window[ cbQueryParamValue ] = function( data ) {
           responseData = data;
        };

        scriptEl.type = 'text/javascript';
        scriptEl.src = this.url;
        scriptEl.async = true;


        scriptEl.onload = scriptEl.onreadystatechange = function() {
           if ( ( scriptEl.readyState && scriptEl.readyState !== 'complete' && scriptEl.readyState !== 'isLoaded' ) || isLoaded ) {
              return false;
           }

           scriptEl.onload = null;
           scriptEl.onreadystatechange = null;

           if ( scriptEl.onclick ) {
           }

           this._hideLoadingAnimation();

           // Call the user callback with the last value stored and clean up values and scripts.
           this._successCallback( responseData );
           responseData = undefined;
           DOMhead.removeChild( scriptEl );
           isLoaded = true;
        };

        DOMhead.appendChild( scriptEl );

        return {
           abort: function() {
              scriptEl.onload = scriptEl.onreadystatechange = null;
              this._errorCallback( this.requestObj, 'abort', {} )
              responseData = undefined;
              DOMhead.removeChild( scriptEl );
              isLoaded = true;
           },
        };
     },
     /**
      * Make request with XHR
      * @private
      * @return {Object}      XHR object
      */
     _makeRequestXHR: function() {
        var xhr = this._getXHR( this.s );

        xhr.open( this.httpMethod, this.url, !( this.s.async ) );

        this._setHeaders( xhr );
        this._setCredentials( xhr );

        xhr.onreadystatechange = this._handlerReadystatechangeXHR.bind( this );

        if(_.isFunction(this.s.beforeSend)) {
           this.s.beforeSend(xhr);
       }

        var sentData = null;
        //form contains files that should be appended to the request: must be sent via formData
        if(this.s.requestType === 'formdata'&& this.s.requestFiles) {
           var formData = new FormData();
           var jsonPointerToName = {};

           for (var key in this.s.requestFiles.fileRequest) {
              if(this.s.requestFiles.fileRequest.hasOwnProperty(key)) {
                 var file = this.s.requestFiles.fileRequest[key].file;
                 var fileName = this.s.requestFiles.fileRequest[key].name;
                 if (_.isArray(file)) {
                    for (var i = 0; i < file.length; i++) {
                       formData.append(key, file[i], fileName);
                    }
                 } else {
                    formData.append(key, file, fileName);
                 }
              }
           }

           for (var key in this.data) {
              formData.append(key, this.data[key]);
           }

           sentData = formData;
        } else {
           sentData = this.data;
        }

        xhr.send( sentData );
        this._showLoadingAnimation();

        return xhr;
     },

     /**
      * Gets XMLHtttpRequest object
      * @private
      * @return {Object} XHR object
      */
     _getXHR: function( ) {
        ASSERT.has(window, 'XMLHttpRequest', { code: 'TBJS/REQ/2010', msg: 'Browser does not support AJAX', } );

        var xhr = new XMLHttpRequest();

        if ( this.s.crossOrigin === true ) {
           ASSERT.has(xhr, 'withCredentials', { code: 'TBJS/REQ/2020', msg: 'Browser does not support cross-origin requests', } );
        }

        return xhr;
     },

     /**
      * Handler onreadystatechange
      * @private
      */
     _handlerReadystatechangeXHR: function( ) {
        // use _aborted to mitigate against IE err c00c023f
        // ( can't read props on aborted request objects )
        if ( this._aborted ) {
           this._hideLoadingAnimation();

           return this._errorCallback( this.requestObj, 'abort' );
        }

        if ( this._timedOut ) {
           if ( ! this._isOnline() ) {

              // infinite retry in the case of timeout + non-online
              this._request();

              return;
           } else {
              this._hideLoadingAnimation();
              this._errorCallback( this.requestObj, 'timeout' );

              return;
           }
        }

        if ( this.requestObj && this.requestObj.readyState === 4 ) {
           this.requestObj.onreadystatechange = _.noop;

           this._hideLoadingAnimation();

           if ( this._checkResponseStatus() ) {
              this._successCallback( this.requestObj.responseText );
           } else {
              this._errorCallback( this.requestObj );
           }
        }
     },
     /**
      * Check if response status is ok
      * @private
      * @return {Boolean} true if the request has finished successfully, whatever that means!
      */
     _checkResponseStatus: function() {
        var httpRe = /^http/;
        var protocolRe = /(^\w+):\/\//;

        var successStatus = /^(2\d\d)$/;

        var protocolMath = protocolRe.exec( this.url );
        var protocol = ( protocolMath && protocolMath[ 1 ] ) || window.location.protocol;

        // If http request
        if ( httpRe.test(protocol) ) {
           if (successStatus.test(this.requestObj.status)) {
              return true;
           }

           if (this.requestObj.status === 304) {
              return true;
           }

           return false;
        } else {
           return !!this.requestObj.response;
        }
     },

     _parseResponse: function (filteredResponse) {
        var type = this.s.type || this._getTypeFromResponseHeader( this.requestObj.getResponseHeader( 'Content-Type' ) );

        if ( filteredResponse ) {
           switch ( type ) {
              case 'json':
                 filteredResponse = JSON.parse( filteredResponse );
                 break;
              case 'js':
                 filteredResponse = eval( filteredResponse );
                 break;
              case 'html':
                 filteredResponse = filteredResponse;
                 break;
              case 'xml':
                 filteredResponse = this.requestObj.responseXML && this.requestObj.responseXML.parseError
                    && this.requestObj.responseXML.parseError.errorCode && this.requestObj.responseXML.parseError.reason ? null : this.requestObj.responseXML;
                 break;
              default:
                 THROW( 'Unknown expected response type' );
           }
        }

        return filteredResponse;
     },

    loadResponseInContainer: function(responseBody, containerSelector){
      $(containerSelector).html(responseBody);
    },

     /**
      * Callback when request is successfull
      * @private
      * @param {String} filteredResponse response text
      */
     _successCallback: function( filteredResponse ) {
        let parsedFilteredResponse;
        try {
           parsedFilteredResponse = this._parseResponse(filteredResponse);
        } catch (err) {
           return this._reqPromiseReject({
              reason: this.request,
              error: err,
           });
        }

        let allResponseHeaders = this.requestObj.getAllResponseHeaders();
        let arr = allResponseHeaders.split('\r\n');
		let headers = arr.reduce(function (acc, current, i){
			  var parts = current.split(': ');
			  acc[parts[0]] = parts[1];
			  return acc;
		}, {});

        this._reqPromiseResolve( {
          data: parsedFilteredResponse,
          statusCode: this.requestObj.status,
		  headers: headers, 
        });

        // Ако дадена заявка е "fg", ако типа на отговора е "html" (content-type), и заявката е "успешна" (status_code: 200), да се попълни в контейнера (contSelector)
       if (this.s.fg && this.requestObj.getResponseHeader("content-type").startsWith('text/html')) {
        this.loadResponseInContainer(parsedFilteredResponse, this.s.contSelector);
       }

        this._completeCallback(parsedFilteredResponse);
     },
     _unknownError: function (response, reason, t) {
        this._reqPromiseReject({
           xhr: response,
           reason: reason,
           error: t,
        });
		
        this._completeCallback( response );
     },
     /**
      * Callback when request has an error
      * @private
      * @param  {Object} response failed response
      * @param  {String} reason      error message string
      * @param  {*} t        TODO
      */
     _errorCallback: function( response, reason, t ) {

        if ( ! response.response ) {
           this._unknownError(response, reason, t);
           return;
        }

        try {
           let parsedFilteredResponse = this._parseResponse(response.response);

           this._reqPromiseResolve( {
              data: parsedFilteredResponse,
           });
           this._completeCallback( response );

        } catch (err) {
           this._unknownError(response, reason, t);
        }
     },
     /**
      * Callback to complete when request either failed or succeed
      * @private
      * @param  {Object} resp response
      */
     _completeCallback: function( resp ) {
        if ( this.s.timeout ) {
           clearTimeout( this.timeout );
        }

        this.timeout = null;

        if ( _.isFunction( this.s.complete ) ) {
           this.s.complete( resp );
        }
     },
     /**
      * Get type by response headers
      * @private
      * @param  {String} header value of "Content-Type" header
      * @return {String}
      */
     _getTypeFromResponseHeader: function( header ) {
        // json, javascript, text/plain, text/html, xml
        if ( header === null ) { return undefined; } //In case of no content-type.
        if ( header.match( 'json' ) ) { return 'json'; }
        if ( header.match( 'javascript' ) ) { return 'js'; }
        if ( header.match( 'text' ) ) { return 'html'; }
        if ( header.match( 'xml' ) ) { return 'xml'; }
     },
     /**
      * Set credentials if needed
      * @param {Object} xhr XHR object
      */
     _setCredentials: function( xhr ) {
        if ( !_.isNil( this.s.withCredentials ) && !_.isNil( xhr.withCredentials ) ) {
           xhr.withCredentials = !!this.s.withCredentials;
        }
     },
     /**
      * Set header to XHR object
      * @private
      * @param {Object} xhr XHR object
      */
     _setHeaders: function( xhr ) {
        var headers = this.s.headers || {};

        headers[ 'Accept' ] = headers[ 'Accept' ] || this._defaultHeaders[ 'accept' ][ this.s.type ] || this._defaultHeaders[ 'accept' ][ '*' ];


        // if passed data is instance of FormData then make form request
        var isAFormData = typeof FormData === 'function' && ( this.s.data instanceof FormData );
        // breaks cross-origin requests with legacy browsers
        // if ( !this.s.crossOrigin && !headers[ 'X-Requested-With' ] ) {
        //   headers[ 'X-Requested-With' ] = this._defaultHeaders[ 'X-Requested-With' ];
        // }

        if(this.s.requestType !== 'formdata') {
           headers[ 'Content-Type' ] = this.s.contentType || this._defaultHeaders[ 'contentType' ];
        }

        for ( var header in headers ) {
           // not all headers are created equal...
           if (header == 'Cookie') {
             // i think this will work only on same-origin requests
             document.cookie = headers[ header ];
           } else {
            xhr.setRequestHeader( header, headers[ header ] );
           }
        }
     },
     /**
      * Abort request
      */
     abort: function( ) {
        this._aborted = true;
        this.requestObj.abort();
        return this;
     },
     request: function() {
        this.currentRetryInterval = this.s.retryInterval;

        if(this.isRequested === true) {
           ASSERT(0, { msg: 'Already requested', });
        }
        return this._request();
     },
     _requestModifyResp: function() {
        if(this.s.modifyResp) {
           for(var i = 0, l = this.s.modifyResp.length; i < l; i++) {
              this._reqPromise = this.s.modifyResp[ i ](this._reqPromise, this);
           }
        }
     },
     _request: function() {
        var self = this;

        // revert the state of the request
        this._aborted = false;
        this._retarded = false;
        this._timedOut = false;
        
        if (this.retardTimeout != null) {
            clearTimeout(this.retardTimeout);
        }

        this._reqPromise = new TB.Promise( function( resolve, reject ) {
           self._reqPromiseResolve = resolve;
           self._reqPromiseReject = reject;
        } );

        this._requestModifyResp();
        this._makeRequest();

        this._reqPromise
           .then(function(result) {
              if (self.retardTimeout != null) {
                clearTimeout(self.retardTimeout);
              }

              console.log("PROMISE_RESOLVE...");
              self._promiseResolve(result);
           })
           .catch(function(reason) {
              TRACE("Request failed, reason: $REASON$", { REASON: reason, });

              if(self._isTemporaryError(reason) && self.s.retry === true && self.commitedRetries < self.s.retryRepeats && self.s.retryAuto) {
                 setTimeout(function() {
                    try {
                       self.retry();
                    } catch(e) {

                       // Disable callback on retry
                       // self.cb && self.cb(undefined, e);
                       // self._promiseReject(e);
                    }
                 }, self.currentRetryInterval);
              } else {
                 self.cb && self.cb(undefined, reason);
                 self._promiseReject(reason);
              }
           });

        return this.promise;
     },
     retry: function() {
        ASSERT(this.s.retry === true, { msg: 'Retrying request is not allowed', });
        ASSERT(this.commitedRetries < this.s.retryRepeats, { msg: 'Retried too much times', });

        TRACE("Retrying request in $INTERVAL$ for $TIMES$ times so far", { INTERVAL: this.s.retryInterval, TIMES: this.commitedRetries, });

        this.commitedRetries++;

        return this._request();
     },
     cancelRetry: function() {
        this.commitedRetries = this.s.retryRepeats;
     },
     _isOnline: function() {
        if (typeof navigator === 'undefined') {
           return true;
        }

        return navigator.onLine;
     },
     // implement
     _isTemporaryError: function(reason) {
        // ERR_NETWORK_CHANGED
        TRACE("Fail in the request, maybe retry? Reason: $REASON$", {
            REASON: reason,
        });
        // console.log(reason);
        console.log(this);

        return true;
     },

     _showLoadingAnimation: function() {
        if (this.loadingAnimationSelector) {
           document.querySelector(this.loadingAnimationSelector).style.display = 'block';

           if (this.overlaySelector) {
              document.querySelector(this.overlaySelector).style.display = 'block';
           }
        }
     },
     _hideLoadingAnimation: function() {
        if (this.loadingAnimationSelector) {
           document.querySelector(this.loadingAnimationSelector).style.display = 'none';

           if (this.overlaySelector) {
              document.querySelector(this.overlaySelector).style.display = 'none';
           }
        }
     },
  };

   TB.Request = Request;

   return Request;
});

/**
 * @author Ivan Ivanov <ivan.ivanov@telebid-pro.com>
 * @desc Dispatch events from current class. Used for pub/sub pattern
 * @module Dispatcher
 * @memberOf TB
 */
;(function(global, factory) {
  if(typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('tb.xerrors'));
  } else if (typeof define === 'function' && define.amd) {
    define('tb.dispatcher',['tb.xerrors'], function() {
      return factory.apply(factory, arguments);
    });
  } else {
    global.TB = global.TB || {};
    global.TB.Dispatcher = factory(global.TB);
  }
})(this, function(TB) {
  'use strict';
  /**
   * TB.Dispatcher object - dispatching and listening to events easy
   * @constructor
   * @memberof TB
   * @example
   * // use it seperately
   * var dispatcher = new Dispatcher();
   * dispatcher.on( 'event', function( greeting ) { console.log( greeting ); } );
   * dispatcher.dispatch( 'event', 'Hello world!' );
   * @example
   * // extend class with dispatcher
   * function ClassName () {
   *   TB.Dispatcher.call( this );
   * }
   * TB.classExtend( ClassName, TB.Dispatcher );
   */
  function Dispatcher() {
    if ( !( this instanceof Dispatcher ) ) {
      return new Dispatcher();
    }

    var listeners = {};

    /**
     * Adds event listener
     * @param  {String} eventName event name to attach listener
     * @param  {Function} handler   listener to execute when event occures
     * @return {Object}           returns this for chaining
     */
    this.on = function( eventName, handler ) {
      listeners[ eventName ] = listeners[ eventName ] || [];
      listeners[ eventName ].push( handler );

      return this;
    };

    /**
     * Remove event listener. If no handler passed, then remove all listeners
     * @param  {String} eventName event name to remove
     * @param  {?Function} handler   event handler to remove
     * @return {Object}           returns this for chaining
     */
    this.off = function( eventName, handler ) {
      if ( !listeners.hasOwnProperty( eventName ) ) {
        return this;
      }

      // Remove all event listeners if no handler provided
      if ( TB.isEmpty( handler ) ) {
        listeners[ eventName ].length = 0;
      }

      ASSERT.isFunction( handler );

      var indexOfHandler = listeners[ eventName ].indexOf( handler );

      if ( indexOfHandler >= 0 ) {
        listeners[ eventName ].splice( indexOfHandler, 1 );
      }

      return this;
    };

    /**
     * Dispatches event with given name and data
     * @param  {String} eventName event name to dispatch
     * @param  {*} data      data to pass as first argument to listeners
     * @return {Object}           returns this for chaining
     */
    this.dispatch = function( eventName, data ) {
      if ( listeners.hasOwnProperty( eventName ) ) {
        for ( var i = 0; i < listeners[ eventName ].length; i++ ) {
          var callback = listeners[ eventName ][ i ];

          callback( data );
        }
      }

      return this;
    };
  }

  /** @lends TB.Dispatcher.prototype */
  Dispatcher.prototype = {};

  return Dispatcher;
});

//** LOADER **/
/**
 * @author Ivan Ivanov <ivan.ivanov@telebid-pro.com>
 * @desc RemoteAPI wrapper
 * @module RAservice
 * @memberOf TB
 */
;(function(global, factory) {
  if(typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('lodash'), require('tb.xerrors'), require('tb.request'), require('tb.dispatcher'));
  } else if (typeof define === 'function' && define.amd) {
    define('tb.service',['lodash', 'tb.xerrors', 'tb.request', 'tb.dispatcher'], function() {
      return factory.apply(factory, arguments);
    });
  } else {
    global.TB = global.TB || {};
    global.TB.RAService = factory(global._, global.TB, global.TB.Request, global.TB.Dispatcher);
  }
})(this, function(_, TB, Request, Dispatcher) {
  'use strict';
  
  function parseBaseProtocolExceptionAndThrow(req, reqErr) {
    let responseText = _.get(reqErr, 'xhr.responseText');
    if (responseText) {
      TRACE("RESPONSE_TEXT: " + responseText);
    }

    if(reqErr instanceof UnpackError) {
      if(!reqErr.status) {
        TB.ASSERT(0, TB.CONFIG.XERRORS_DEFAULT_MSG, "ERR", {
          req_err: reqErr,
        });
      } else {
        if(reqErr.status.status === 'ui_error') {
          req && req.cancelRetry();
          
          TB.ASSERT_USER(0, reqErr.status.msg, reqErr.status.code, {
            req_err: reqErr,
            skipPrefixForCode: true,
          });
        } else if (reqErr.status.status === 'client_sys_error') {
          req && req.cancelRetry();

          TB.ASSERT(0, TB.CONFIG.XERRORS_DEFAULT_MSG, reqErr.status.code, {
            req_err: reqErr,
            skipPrefixForCode: true,
          });
        } else if (reqErr.status.status === 'session_error') {
          req && req.cancelRetry();

          TB.ASSERT_USER(0, reqErr.status.msg, reqErr.status.code, {
            req_err: reqErr,
            skipPrefixForCode: true,
          });
        } else if (reqErr.status.status === 'server_sys_error') {
          // why is server_assert server_sys_error tho? :thinking_face:
		  if (reqErr.status.code.startsWith('I/') || reqErr.status.code.startsWith('C/')) {
            req && req.cancelRetry();
          }

          TB.THROW_SYS({}, "Temporary Problem! Please Try Again...", reqErr.status.code, {
            req_err: reqErr,
            isUIAppropriate: true,
            skipPrefixForCode: true,
          });
        } else {
          req && req.cancelRetry();

          TB.ASSERT(0, TB.CONFIG.XERRORS_DEFAULT_MSG, "ERRSTATUS", {
            req_err: reqErr,
          });
        }
      }
    } else {
      if(reqErr.reason === 'abort') {
        TB.ASSERT_USER(0, 'Request Aborted', 'REQ/A', {
          inner_type: 'transport_error',
          reqErr: reqErr
        });
      } else if(reqErr.xhr && reqErr.xhr.status && reqErr.xhr.status == 504) {
        TB.THROW_SYS({}, 'Timeout Reached! Retrying...', 'REQ/GTW', {
          reqErr: reqErr,
          isUIAppropriate: true,
        });
      } else if(reqErr.xhr.status && reqErr.xhr.status == 403) {
        req && req.cancelRetry();

        TB.ASSERT_USER(0, 'Permission Denied!', 'PERM_DENIED', {
          reqErr: reqErr,
        });
      } else if(reqErr.xhr.status && reqErr.xhr.status == 401) {
        req && req.cancelRetry();

        TB.ASSERT_USER(0, 'Authentication Required!', 'AUTH_REQ', {
          reqErr: reqErr,
        });
      } else if(reqErr.xhr.status && (reqErr.xhr.status == 502 || reqErr.xhr.status == 302)) {
        TB.THROW_SYS({}, 'Connection Problem! Please Try Again...', 'T/REQ/BADGTW', {
          reqErr: reqErr,
          isUIAppropriate: true,
        });
      } else if(reqErr.xhr.status && (reqErr.xhr.status == 500 || reqErr.xhr.status == 540 || reqErr.xhr.status == 542)) {
        TB.THROW_SYS({}, 'Temporary Problem! Please Try Again...', 'T/RSTRT', {
          reqErr: reqErr,
          isUIAppropriate: true,
        });
      } else if(reqErr.reason === 'timeout') {
        TB.THROW_SYS({}, 'Timeout Reached! Retrying...', 'REQ/T', {
          reqErr: reqErr,
          isUIAppropriate: true,
        });
      } else if(reqErr.xhr && reqErr.xhr.responseText) {
        // the average case - some error from the server, via status code
        var resp = reqErr.xhr.responseText;

        req && req.cancelRetry();
        TB.ASSERT(0, TB.CONFIG.XERRORS_DEFAULT_MSG, reqErr.xhr.status, {
          reqErr: reqErr
        });
      } else if(reqErr.xhr && reqErr.xhr.status === 0) {
        TB.THROW_SYS({}, 'Connection Problem! Please Try Again...', 'REQ/C', {
          reqErr: reqErr,
          isUIAppropriate: true
        });
      } else {
        TB.ASSERT(0, TB.CONFIG.XERRORS_DEFAULT_MSG, 'ERRUSTATUS', {
          reqErr: reqErr
        });
      }
    }

    TB.ASSERT(0, TB.CONFIG.XERRORS_DEFAULT_MSG, 'ERR_SERV', {
      reqErr: reqErr
    });
  }


  if (_.isNil(Dispatcher)) {
      alert('Please load tb.dispatcher.js');
  }

  /**
   * asd
   * @constructor
   * @memberOf TB
   * @param {Object} settings settings
   */
  function Service(settings) {
    if (!(this instanceof Service)) {
      return new TB.RAService(settings);
    }



    /**
     *
     * @property [useTransportProtocolId=true] use id's in transport protocol or null (e.g. jsonrpc2 id property)
     */
    var defaultValues = {
      useTransportProtocolId: true,

      requestSettings: {
        apiUrl: '',

        requestParams: null,
        payloadParams: null,

        retryMax: Infinity,
        retryAuto: true,
        retryInterval: 1000,
        retryIncremental: true,
      },

      transportProtocol: 'jsonrpc2',

      commands: {
        ui_error: {
          httpMethod: 'post'
        }
      },
    };

    /**
     * Type of request (e.g. jsonrpc2, tbjson)
     * @type {Object}
     */
    this.reqType = null;
    this.respType = null;

    settings.requestSettings = settings;

    // Extend settings
    this.s = _.merge({
    }, defaultValues, settings, {requestSettings: (settings.moreSettings || {}) } );
    this.s.responseFormat = this.s.responseFormat || this.s.transportProtocol;

    ASSERT.has(this._requestTypes, this.s.transportProtocol);
    ASSERT.has(this._responseTypes, this.s.responseFormat);

    this.id = 1;
    this.transactionId = 1;
    this.hasActiveRequest = false;
    this.reqType = this._requestTypes[this.s.transportProtocol];
    this.respType = this._responseTypes[this.s.responseFormat];

    Dispatcher.call( this );
  }


  /** @lends TB.Service.prototype */
  Service.prototype = {
    _requestId: 0,
    _requestTypes: {
      jsonrpc2: {
        payloadParamName: 'payload_jsonrpc',
        makePayload: function(method, data) {
          return {
            jsonrpc: '2.0',
            id: this.getNextRequestId(),
            method: method,
            params: data,
          };
        },
      }
    },
    _responseTypes: {
      jsonrpc2: {
        unpackResult: function(rawResult) {
          if (_.isString(rawResult)) {
            try {
              rawResult = JSON.parse(rawResult);
            } catch (error) {
              THROW_SYS(undefined, "Unable To Connect To The Server!", "RERR", {
                isFromUnpackResult: true,
                isUIAppropriate: true,
              });
            }
          }

          if (rawResult.error) {
            TRACE('Error in API call: $RESULT$', { RESULT: rawResult, });
            throw new UnpackError(rawResult);
          }

          if ( ! rawResult.result ) {
            throw new Error('No result returned after API call: $RESULT$', { RESULT: rawResult, });
          }

          return rawResult.result;
        },
      },
      html: {
        unpackResult: function(rawResult) {
          return rawResult;
        }
      },
    },
    /**
     * Increments and returns request id
     * @return {Number} old request id
     */
    getNextRequestId: function() {
      if (this.s.useTransportProtocolId) {
        return ++this._requestId;
      } else {
        return null;
      }
    },
    incrementTransactionId: function() {
      return ++this.transactionId;
    },
    request: function(method, data, settings) {
      ASSERT.isObjectOrNil(settings);

      if (settings && settings.cb) {
        this.cb = settings.cb;
        // delete settings.cb;
      }

      var self = this;
      let unpackMethod = self.respType.unpackResult;
      var commandDef = this.s.commands[method];
      var reqSettings = {
        retry: true,
        retryAuto: false,
        modifyResp: [function(promise, req) {
          return promise
            .then(function(rawResult) {
              var result = unpackMethod(rawResult.data);
              if (self.cb) {
                self.cb(result);
              }

              return result;
            })
            .catch(function(reqErr) {
              if (reqErr.addParams && reqErr.addParams.isFromUnpackResult) {
                throw reqErr;
              }

              parseBaseProtocolExceptionAndThrow(req, reqErr);
            })
            .catch(function(reqErr2) {
              self.cb && self.cb(undefined, reqErr2);
              throw(reqErr2);
            });
        }],
      };
      let version = this.s.version || _.get(settings, '.version') ||  1;
      if (version === 2){
        reqSettings = _.merge(reqSettings, this.s.requestSettings, commandDef, settings.requestSettings);
      }else {
        reqSettings = _.merge(reqSettings, this.s, this.s && this.s.requestSettings, commandDef, settings, settings && settings.requestSettings);
        if ( ! _.get(reqSettings.requestParams, 'apiKey') ) {
          let apiKey = _.get(reqSettings.requestSettings, 'apiKey');
          if (reqSettings.requestParams) {
            reqSettings.requestParams.api_key = apiKey;
          } else {
            reqSettings.requestParams = {
              api_key: apiKey,
            };
          }
        }
      }

      var reqPayload = this.prepareParams(reqSettings.requestParams);
      var protocolPayload = this.prepareParams(reqSettings.payloadParams);

      protocolPayload = _.extend(protocolPayload, data);

      reqPayload[this.reqType.payloadParamName] = this.reqType.makePayload.call(this, method, protocolPayload);

      reqPayload[this.reqType.payloadParamName] = JSON.stringify(reqPayload[this.reqType.payloadParamName]);

      reqSettings.data = reqPayload;
      reqSettings.url = reqSettings.apiUrl;
      if (reqSettings.responseFormat) {
        unpackMethod = this._responseTypes[ reqSettings.responseFormat ].unpackResult;
      }


      var req = new Request(reqSettings);

      self.dispatch('ajaxStart', {
          req: req
      });

      req.then(function(resp) {
        self.dispatch('ajaxStop', {
            req: req
        });
        return resp;
      });

      req.request();

      return req;
    },
  };

  Service.prototype.prepareParams = function(params) {
    var result = {};

    if (_.isObject(params)) {
      for (var k in params) {
        result[k] = params[k];

        if (_.isFunction(result[k])) {
          // TODO: would be nice to pass the other values in _.merge
          result[k] = result[k]();
        }

        if (_.isUndefined(result[k])) {
          result[k] = null;
        }
      }
    }

    return result;
  };

  function UnpackError(resp) {
    this.resp = resp;
    this.data = resp.error.data;
    this.message = resp.error.message;
    this.code = resp.error.code;
    this.status = (resp.error.data && resp.error.data.status) ? resp.error.data.status : null;
    // this.details = (resp.error.data && resp.error.data.details) ? resp.error.data.details : null;
    this.details = _.get(resp, 'error.data.details');

    if(this.details && this.details.validation_errors) {
      var validationErrors = this.details.validation_errors;

	   /*
			TODO: ask manol about those cases?
			TODO: ask manol about this case aswell!!!
			TODO: ask manol about this case aswell2!!!

			if the SENDER is ours
				if the remote client is ours, we need to show the error code as is
				if its remote client is not ours, use the below logic of mapping protocol to client
			ELSE
				The remote client, client_sys_error should not be ASSERT for our side!
	  */
      ASSERT.isArray(validationErrors);

      validationErrors = validationErrors.map(function(d) {
        return {
          dataPath: d.dataPath || d.data_path,
          msg: d.msg,
        };
      });

      this.validationErrors = validationErrors;
    }
  }

  TB.RAService = Service;
  TB.RAServiceUnpackError = UnpackError;
  TB.RAServiceParseBaseProtocolExceptionAndThrow = parseBaseProtocolExceptionAndThrow;
    

  TB.classExtend( Service, Dispatcher );
  return Service;
});

(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('lodash'), require('tb.xerrors'), require('tb.service'));
  } else if (typeof define === 'function' && define.amd) {
    define('tb.service-loader',['lodash', 'tb.xerrors', 'tb.service'], function () {
      return factory.apply(factory, arguments);
    });
  } else {
    global.TB = global.TB || {};
    global.TB.jf = global.TB.jf || {};
    global.TB.service_loader = factory(global._, global.TB, global.TB.RAService);
  }
})(this, function (_, TB, TbRAService) {
  'use strict';

  var queryParams = TB.parseQueryParams();
  var sp;
  var session;

  var commands_json = {};

  var isInitted = false;


  var tbCommonService = function (settings) {
    this.s = settings;
    var requestParamsObj = {};
    if (this.s.apiKey) {
        requestParamsObj.api_key = this.s.apiKey;
    }

    this.service = new TbRAService({
      transportProtocol: 'jsonrpc2',
      requireCommandDefinition: true,
      moreSettings: settings,

      commands: {
        load_commands: {
          httpMethod: 'get'      
        }
      },
      requestSettings: {
        apiUrl: this.s.apiUrl,
        httpMethod: 'POST',
        beforeSend: function (xhr) {
        },
        requestParams: _.assign(requestParamsObj, this.s.requestParams),
      }
    });
  }

  tbCommonService.prototype.init = function () {
    var self = this;

    if ( ! isInitted ) {
      isInitted = true;

      var commandsPromise = this.service.request('load_commands');
      commandsPromise.then(function(res) {
        var serverCommands = res.commands;

        // I can't use let, so i have to use explicit /function/ closure
        function ClosureForCommandCallback(command) {
          return function (params, requestParams) {
            if (requestParams) {
              if (requestParams.timeout == null) {
                requestParams.timeout = 3000;
              } else {
                // do nothing
              }
            } else {
              requestParams = {
                timeout: 3000,
              };
            }

            return self.service.request(command, params, requestParams);
          }
        }

        for (var command in serverCommands) {
          console.log("Initializing the prototype - ", command);
          tbCommonService.prototype[command] = ClosureForCommandCallback(command);
        
          console.log("Initializing the commands tb.service hash - ", command);
          self.service.s.commands[ command ] = serverCommands[ command ];

          commands_json[ command ] = serverCommands[ command ];
        }
      });

      return commandsPromise;
    } else {
      // I can't use let, so i have to use explicit /function/ closure
      function ClosureForCommandCallback(command) {
        return function (params, requestParams) {
					if (requestParams) {
						if (requestParams.timeout == null) {
							requestParams.timeout = 3000;
						} else {
							// do nothing
						}
					} else {
						requestParams = {
							timeout: 3000,
						};
					}

          return this.service.request(command, params, requestParams);
        }
      }

      for (var command in commands_json) {
        console.log("Initializing the prototype - ", command);
        tbCommonService.prototype[command] = ClosureForCommandCallback(command);
      
        console.log("Initializing the commands tb.service hash - ", command);
        this.service.s.commands[ command ] = commands_json[ command ];
      } 
    }
  }

  tbCommonService.prototype.send = function (command, ...params) {
    let fn;
    let re; 
    let promiseIn = new TB.Promise((res, rej) => {
      fn = res;
      re = rej;
    });

    let promise;
    if ( ! isInitted ) {
      promise = this.init();
    } else {
      promise = new TB.Promise((res, rej) => {
        res();
      });  
    }

    var promiseWait = promise;
    if (this.lastPromise) {
     promiseWait = this.lastPromise;
    }

    // we don't care about the promise resolve/reject, because we are just waiting for it to end, so we are serialized
    let inP = promiseWait.promise || promiseWait;
    
    inP.then(() => {
      if ( ! tbCommonService.prototype[command] ) {
        TB.ASSERT(tbCommonService.prototype[command] != undefined, "Unknown command - " + command);
      } 

      tbCommonService.prototype[command](...params)
      .then(resp => {
        fn(resp);
        this.lastPromise = null;
      })
      .catch(err => {
        re(err); 
        this.lastPromise = null;
      });
    })
    .catch(err => {
      re(err); 
      this.lastPromise = null;
    });
    
    inP.catch(err => {
      re(err);
      this.lastPromise = null;
    });

    this.lastPromise = promiseIn;

    return promiseIn;
  }

  TB.GLOBAL_API;
  if ( ! TB.API_URL ) {
    let qs = TB.parseQueryParams();
    if (qs.api_url) TB.API_URL = qs.api_url;
    if (qs.api_key) TB.API_KEY = qs.api_key;
  }

  if (TB.API_URL) {
    TB.GLOBAL_API = new tbCommonService({
      apiUrl: TB.API_URL,
      apiKey: TB.API_KEY,
    });

    var evt = new Event('tb-client-api-loaded');
    document.dispatchEvent(evt);
  } else {
    var res = setInterval(function() {
      if (TB.API_URL) {
        clearInterval(res);
        TB.GLOBAL_API = new tbCommonService({
          apiUrl: TB.API_URL,
          apiKey: TB.API_KEY,
        });

        var evt = new Event('tb-client-api-loaded');
        document.dispatchEvent(evt);
      }
    }, 100);
  }
  


  return tbCommonService;
});

