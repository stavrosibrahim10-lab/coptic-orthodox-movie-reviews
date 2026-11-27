// Progressive enhancement; the footer and home CTA link to a native fallback form.
import {trackAudience} from './audience.js';
const dialog=document.getElementById('newsletter-dialog');
if(dialog&&typeof dialog.showModal==='function'){
  const key='tol-interest-prompt-until';
  let shown=false,timer,previousFocus;
  function postpone(days=7){try{localStorage.setItem(key,String(Date.now()+days*86400000));}catch{}}
  function canAuto(){try{return Number(localStorage.getItem(key)||0)<=Date.now();}catch{return true;}}
  function home(){return location.pathname==='/'&&['','#home'].includes(location.hash);}
  function open(manual=false){
    if(dialog.open)return;
    clearTimeout(timer);shown=true;previousFocus=document.activeElement;
    dialog.showModal();trackAudience({kind:'interest_prompt'});
    if(!manual)postpone();
  }
  document.addEventListener('click',event=>{
    const trigger=event.target.closest?.('[data-newsletter-open]');
    if(trigger&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey&&event.button===0){event.preventDefault();open(true);}
  });
  dialog.querySelectorAll('[data-newsletter-close]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const bounds=dialog.getBoundingClientRect();
    if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();
  });
  dialog.addEventListener('close',()=>{postpone();if(previousFocus?.isConnected)previousFocus.focus();});
  const form=dialog.querySelector('form');
  form.addEventListener('submit',()=>{postpone(30);trackAudience({kind:'interest_submit'});const button=form.querySelector('button[type=submit]');button.disabled=true;button.textContent='Submitting…';});
  window.addEventListener('pageshow',()=>{const button=form.querySelector('button[type=submit]');button.disabled=false;button.textContent='Register interest →';});
  function schedule(){
    clearTimeout(timer);
    if(home()&&!shown&&canAuto())timer=setTimeout(()=>{
      if(home()&&document.visibilityState==='visible'&&!document.querySelector('dialog[open]')&&!document.activeElement?.matches('input,textarea,select,[contenteditable=true]'))open();
    },25000);
  }
  window.addEventListener('hashchange',schedule);
  schedule();
}
