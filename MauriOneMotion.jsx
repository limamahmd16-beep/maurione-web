import React, { useEffect, useState } from 'react';
import MauriOneLight from './MauriOneLight.jsx';

const motionCss = `
/* Premium motion layer — optimized for transform/opacity only */
.heroMedia{background:none!important;filter:none!important;overflow:hidden;isolation:isolate}
.heroMedia::before,.heroMedia::after{content:'';position:absolute;inset:-4%;background-position:center 58%;background-size:cover;will-change:transform,opacity;transform:scale(1.08);pointer-events:none}
.heroMedia::before{background-image:url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1800&q=82');animation:heroSceneA 16s ease-in-out infinite}
.heroMedia::after{background-image:url('https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1800&q=82');animation:heroSceneB 16s ease-in-out infinite}
:root .heroMedia::before,:root .heroMedia::after{filter:saturate(.66) contrast(.98) brightness(1.04) sepia(.05)}
html[data-theme='dark'] .heroMedia::before,html[data-theme='dark'] .heroMedia::after{filter:saturate(.58) contrast(1.08) brightness(.68) sepia(.08)}
@keyframes heroSceneA{0%,42%{opacity:1;transform:scale(1.08) translate3d(0,0,0)}52%,92%{opacity:0;transform:scale(1.14) translate3d(-1.5%,1%,0)}100%{opacity:1;transform:scale(1.08) translate3d(0,0,0)}}
@keyframes heroSceneB{0%,42%{opacity:0;transform:scale(1.14) translate3d(1.5%,-1%,0)}52%,92%{opacity:1;transform:scale(1.08) translate3d(0,0,0)}100%{opacity:0;transform:scale(1.14) translate3d(1.5%,-1%,0)}}
.heroContent>.eyebrow{animation:heroTextIn .72s .12s cubic-bezier(.2,.72,.2,1) both}.heroContent>h1{animation:heroTextIn .86s .22s cubic-bezier(.2,.72,.2,1) both}.heroContent>p{animation:heroTextIn .8s .34s cubic-bezier(.2,.72,.2,1) both}.heroContent>.btn{animation:heroTextIn .75s .46s cubic-bezier(.2,.72,.2,1) both}.heroMeta span{animation:heroTextIn .65s .62s cubic-bezier(.2,.72,.2,1) both}
@keyframes heroTextIn{from{opacity:0;transform:translate3d(0,28px,0)}to{opacity:1;transform:translate3d(0,0,0)}}

.motion-reveal{opacity:0;transform:translate3d(0,42px,0) scale(.988);transition:opacity .78s cubic-bezier(.2,.72,.2,1),transform .82s cubic-bezier(.2,.72,.2,1);will-change:transform,opacity}
.motion-reveal.motion-visible{opacity:1;transform:translate3d(0,0,0) scale(1)}
.grid .motion-reveal:nth-child(2n){transition-delay:.06s}.grid .motion-reveal:nth-child(3n){transition-delay:.12s}
.specIn .motion-reveal:nth-child(2){transition-delay:.07s}.specIn .motion-reveal:nth-child(3){transition-delay:.14s}.specIn .motion-reveal:nth-child(4){transition-delay:.21s}

.card{transform:translateZ(0);transition:transform .36s cubic-bezier(.2,.72,.2,1),box-shadow .36s ease,border-color .28s ease!important}
.card .media img{transition:transform .62s cubic-bezier(.2,.72,.2,1),filter .35s ease!important;will-change:transform}
.card:hover{transform:translate3d(0,-12px,0) scale(1.018)!important;box-shadow:0 30px 80px rgba(40,28,16,.18)!important;z-index:2}
.card:hover .media img{transform:scale(1.105)!important}
html[data-theme='dark'] .card:hover{box-shadow:0 34px 90px rgba(0,0,0,.48)!important}

.galleryMain{overflow:hidden;transform:translateZ(0)}
.galleryMain img{transition:transform .75s cubic-bezier(.2,.72,.2,1),filter .4s ease!important;will-change:transform}
.galleryMain:hover img{transform:scale(1.065)}
.thumbs button{transition:opacity .25s ease,transform .3s cubic-bezier(.2,.72,.2,1),border-color .25s ease!important}
.thumbs button:hover{opacity:1!important;transform:translateY(-4px) scale(1.035)}
.thumbs img{transition:transform .4s ease}.thumbs button:hover img{transform:scale(1.08)}

.pageStage{animation:pageEnter .58s cubic-bezier(.2,.72,.2,1) both;transform-origin:50% 15%}
@keyframes pageEnter{from{opacity:0;transform:translate3d(0,18px,0) scale(.995);filter:blur(2px)}to{opacity:1;transform:translate3d(0,0,0) scale(1);filter:blur(0)}}

.btn,.contact,.back,.rowActions button{transition:transform .24s cubic-bezier(.2,.72,.2,1),box-shadow .24s ease,background .24s ease,border-color .24s ease!important}
.btn:hover,.contact:hover{transform:translateY(-3px)}

@media(max-width:680px){
  .heroMedia::before,.heroMedia::after{inset:-2%;background-position:center center}
  .card:hover{transform:translateY(-5px) scale(1.006)!important}
  .galleryMain:active img{transform:scale(1.045)}
  .motion-reveal{transform:translate3d(0,28px,0) scale(.994);transition-duration:.62s}
  .pageStage{animation-duration:.46s}
}
@media(prefers-reduced-motion:reduce){
  .heroMedia::before,.heroMedia::after,.heroContent>*,.heroMeta span,.pageStage{animation:none!important}
  .motion-reveal{opacity:1!important;transform:none!important;transition:none!important}
  .card,.card .media img,.galleryMain img,.thumbs button{transition:none!important}
}
`;

function useRouteMotion(){
  const [route,setRoute]=useState(()=>window.location.pathname);
  useEffect(()=>{
    const onRoute=()=>setRoute(window.location.pathname);
    window.addEventListener('popstate',onRoute);
    return()=>window.removeEventListener('popstate',onRoute);
  },[]);
  return route;
}

function useScrollReveal(route){
  useEffect(()=>{
    if(!('IntersectionObserver' in window)) return;
    let observer;
    const seen=new WeakSet();
    const selectors=['.heading>*','.filters','.note','.card','.galleryMain','.thumbs','.summary>*','.spec','.desc>*','.footerGrid>*','.login>*'];
    const scan=()=>{
      if(!observer) return;
      document.querySelectorAll(selectors.join(',')).forEach(el=>{
        if(seen.has(el)||el.closest('.hero')) return;
        seen.add(el);
        el.classList.add('motion-reveal');
        observer.observe(el);
      });
    };
    observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){entry.target.classList.add('motion-visible');observer.unobserve(entry.target)}
      });
    },{threshold:.12,rootMargin:'0px 0px -7% 0px'});
    const mutation=new MutationObserver(scan);
    mutation.observe(document.body,{childList:true,subtree:true});
    requestAnimationFrame(()=>requestAnimationFrame(scan));
    return()=>{mutation.disconnect();observer.disconnect()};
  },[route]);
}

export default function MauriOneMotion(){
  const route=useRouteMotion();
  useScrollReveal(route);
  const admin=route.startsWith('/admin');
  return <>
    <div className={admin?'':'pageStage'} key={admin?'admin':route}><MauriOneLight/></div>
    <style>{motionCss}</style>
  </>;
}
