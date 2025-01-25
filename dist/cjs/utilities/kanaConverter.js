"use strict";Object.defineProperty(exports,Symbol.toStringTag,{value:"Module"});const u=require("./isHiraganaCharCode.js"),C=require("./toKatakanaCharCode.js"),k=require("../maps/kana/hiragana2hankakuKatakana.js");var i=(a=>(a[a.Hiragana=0]="Hiragana",a[a.ZenkakuKatakana=1]="ZenkakuKatakana",a[a.HankakuKatakana=2]="HankakuKatakana",a))(i||{});function s(a,t){let r="";for(let n=0;n<t.length;n++){const e=t[n];if(a===0)r+=e;else if(a===1){const o=t.charCodeAt(n);u.isHiraganaCharCode(o)?r+=String.fromCharCode(C.toKatakanaCharCode(o)):r+=e}else a===2&&(typeof k.katakanaMap[e]=="string"?r+=k.katakanaMap[e]:r+=e)}return r}exports.KanaType=i;exports.kanaConverter=s;
//# sourceMappingURL=kanaConverter.js.map
