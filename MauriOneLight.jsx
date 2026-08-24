import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import MauriOneApp from './MauriOne.jsx';

const lightCss = `
:root{
  --bg:#f7f4ef;
  --bg2:#f1ece5;
  --surface:#fffdf9;
  --surface2:#f8f3ec;
  --bronze:#9d7549;
  --bronze2:#ad8453;
  --text:#171512;
  --muted:#6f6860;
  --line:rgba(94,72,48,.16);
  --danger:#a6554c;
}
html,body{background:var(--bg);color:var(--text)}
.splash{background:radial-gradient(circle at 50% 45%,rgba(157,117,73,.10),transparent 34%),linear-gradient(145deg,#fbf8f3,#f1ece5)}
.header{background:rgba(250,247,242,.92);border-bottom-color:var(--line);box-shadow:0 1px 0 rgba(61,45,29,.03)}
.logo{image-rendering:auto!important;filter:none!important;opacity:1!important;transform:none!important}
.nav{color:var(--muted)}.nav a:hover{color:var(--text)}
.hero{background:var(--bg)}
.heroMedia{filter:saturate(.62) contrast(.96) brightness(1.05) sepia(.08)}
.heroShade{background:linear-gradient(90deg,rgba(247,244,239,.99),rgba(247,244,239,.91) 40%,rgba(247,244,239,.34) 73%,rgba(247,244,239,.08)),linear-gradient(180deg,rgba(247,244,239,.04),rgba(247,244,239,.78))}
.hero p{color:#5f5952}.heroMeta{background:rgba(250,247,242,.76);color:#6d665e;border-top-color:var(--line);backdrop-filter:blur(12px)}
.btn{background:rgba(157,117,73,.07);color:var(--text);border-color:var(--bronze)}.btn:hover{background:rgba(157,117,73,.14)}
.section{background:linear-gradient(180deg,#f3eee7,var(--bg))}
.filters{background:#fbf8f3;border-color:var(--line);box-shadow:0 14px 40px rgba(49,37,25,.04)}
.control{background:#fffdf9;border-color:rgba(94,72,48,.11);color:var(--muted)}
.control input,.control select{color:var(--text)}.control select option{background:#fffdf9;color:var(--text)}
.note{background:rgba(157,117,73,.06);color:var(--muted)}
.card{background:var(--surface);border-color:rgba(94,72,48,.11);box-shadow:0 10px 35px rgba(46,34,23,.045)}
.card:hover{border-color:rgba(157,117,73,.35);box-shadow:0 24px 65px rgba(46,34,23,.11)}
.media,.galleryMain{background:#ebe5dd}.media img{filter:saturate(.82) contrast(.98)}.card:hover .media img{filter:saturate(.96)}
.demo{color:#765734;background:rgba(255,253,249,.88);border-color:rgba(157,117,73,.25)}
.available{color:#496046;background:#edf4ea;border-color:#c6d6c1}.sold{color:#89564f;background:#f7ece9;border-color:#e3c9c4}
.empty{background:var(--surface);border-color:var(--line)}
.contact{background:rgba(157,117,73,.06);border-color:var(--line);color:var(--text)}.contact.wa{background:#eef5ec;border-color:#c8d8c2;color:#294027}.pending{color:#82786e}
.specs{background:#f2ede6;border-color:var(--line)}
.footer{background:#f0ebe4;border-top-color:var(--line)}.copyright{color:#7d746a;border-top-color:var(--line)}
.authPage{background:radial-gradient(circle at 50% 35%,rgba(157,117,73,.08),transparent 31%),var(--bg)}
.login{background:#fffdf9;border-color:var(--line);box-shadow:0 28px 75px rgba(54,40,27,.10)}
.form input{background:#fff;color:var(--text);border-color:rgba(94,72,48,.18)}
.warn{background:rgba(157,117,73,.06)}
.nav.open{background:#fbf8f3}
.themeToggle{position:fixed;left:18px;bottom:18px;z-index:120;width:46px;height:46px;border-radius:50%;border:1px solid rgba(94,72,48,.18);background:rgba(255,253,249,.92);color:#55493c;display:grid;place-items:center;cursor:pointer;box-shadow:0 10px 30px rgba(48,35,22,.12);backdrop-filter:blur(12px);transition:transform .2s ease,background .2s ease}
.themeToggle:hover{transform:translateY(-2px)}
.themeToggle:focus-visible{outline:2px solid var(--bronze);outline-offset:3px}
html[data-theme='dark']{--bg:#0c0a08;--bg2:#100d0b;--surface:#15110e;--surface2:#1b1612;--bronze:#b38a58;--bronze2:#c6a376;--text:#f4efe8;--muted:#a69b90;--line:rgba(198,163,118,.18);--danger:#c16f64}
html[data-theme='dark'] body{background:var(--bg);color:var(--text)}
html[data-theme='dark'] .splash{background:radial-gradient(circle at 50% 45%,rgba(179,138,88,.09),transparent 32%),linear-gradient(145deg,#0d0a08,#090807)}
html[data-theme='dark'] .header{background:rgba(12,10,8,.9);box-shadow:none}
html[data-theme='dark'] .heroMedia{filter:saturate(.52) contrast(1.08) brightness(.64) sepia(.08)}
html[data-theme='dark'] .heroShade{background:linear-gradient(90deg,rgba(12,10,8,.98),rgba(12,10,8,.78) 43%,rgba(12,10,8,.28) 78%),linear-gradient(180deg,transparent,rgba(12,10,8,.7))}
html[data-theme='dark'] .hero p{color:#c5bbb1}
html[data-theme='dark'] .heroMeta{background:rgba(10,8,7,.55);color:var(--muted)}
html[data-theme='dark'] .section{background:linear-gradient(180deg,var(--bg2),var(--bg))}
html[data-theme='dark'] .filters{background:var(--surface);box-shadow:none}
html[data-theme='dark'] .control{background:#0f0c0a;border-color:rgba(198,163,118,.08)}
html[data-theme='dark'] .control select option{background:var(--surface);color:var(--text)}
html[data-theme='dark'] .card{background:var(--surface);border-color:rgba(198,163,118,.1);box-shadow:none}
html[data-theme='dark'] .card:hover{box-shadow:0 24px 70px rgba(0,0,0,.32)}
html[data-theme='dark'] .media,html[data-theme='dark'] .galleryMain{background:#090807}
html[data-theme='dark'] .media img{filter:saturate(.74)}
html[data-theme='dark'] .demo{color:var(--bronze2);background:rgba(12,10,8,.78);border-color:var(--line)}
html[data-theme='dark'] .available{color:#bed0b6;background:rgba(50,70,45,.66);border-color:rgba(136,166,127,.45)}
html[data-theme='dark'] .sold{color:#d0aaa3;background:rgba(76,40,35,.66);border-color:rgba(193,111,100,.42)}
html[data-theme='dark'] .contact{background:rgba(179,138,88,.06);color:var(--text)}
html[data-theme='dark'] .contact.wa{background:#182017;border-color:#34472f;color:var(--text)}
html[data-theme='dark'] .specs{background:var(--bg2)}
html[data-theme='dark'] .footer{background:#090807}
html[data-theme='dark'] .authPage{background:radial-gradient(circle at 50% 35%,rgba(179,138,88,.08),transparent 30%),var(--bg)}
html[data-theme='dark'] .login{background:var(--surface);box-shadow:0 30px 80px rgba(0,0,0,.35)}
html[data-theme='dark'] .form input{background:#0f0c0a;color:var(--text);border-color:var(--line)}
html[data-theme='dark'] .nav.open{background:var(--bg2)}
html[data-theme='dark'] .themeToggle{background:rgba(21,17,14,.92);color:#e8ddd1;border-color:rgba(198,163,118,.20);box-shadow:0 10px 30px rgba(0,0,0,.3)}
@media(max-width:680px){.themeToggle{width:42px;height:42px;left:14px;bottom:14px}}
`;

export default function MauriOneLight(){
  const [theme,setTheme]=useState(()=>localStorage.getItem('maurione_theme_v1')||'light');
  useEffect(()=>{
    document.documentElement.setAttribute('data-theme',theme);
    localStorage.setItem('maurione_theme_v1',theme);
    document.documentElement.style.colorScheme=theme;
  },[theme]);
  const admin=window.location.pathname.startsWith('/admin');
  return <>
    <MauriOneApp/>
    <style>{lightCss}</style>
    {!admin&&<button className="themeToggle" type="button" aria-label={theme==='light'?'تفعيل الوضع الغامق':'تفعيل الوضع الفاتح'} title={theme==='light'?'الوضع الغامق':'الوضع الفاتح'} onClick={()=>setTheme(t=>t==='light'?'dark':'light')}>{theme==='light'?<Moon size={19}/>:<Sun size={19}/>}</button>}
  </>;
}
