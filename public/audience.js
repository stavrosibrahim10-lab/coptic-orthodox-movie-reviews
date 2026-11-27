// First-party, short-lived pseudonymous browser analytics; no email or IP in event rows.
const key='tol-audience-v1', sessionKey='tol-audience-session-v1', optKey='tol-analytics-optout';
function optedOut(){try{return localStorage.getItem(optKey)==='1'||navigator.globalPrivacyControl===true||navigator.doNotTrack==='1';}catch{return true;}}
function identity(){
  try{
    const now=Date.now();let v=JSON.parse(localStorage.getItem(key)||'null');
    if(!v||!v.id||v.until<now){v={id:crypto.randomUUID(),until:now+30*86400000};localStorage.setItem(key,JSON.stringify(v));}
    let s=JSON.parse(sessionStorage.getItem(sessionKey)||'null');
    if(!s||!s.id||now-s.last>30*60000)s={id:crypto.randomUUID()};
    s.last=now;sessionStorage.setItem(sessionKey,JSON.stringify(s));
    return {visitor_id:v.id,session_id:s.id};
  }catch{return {};}
}
function source(){try{const host=new URL(document.referrer).hostname;if(host===location.hostname)return 'internal';if(/(^|\.)google\./.test(host)||/bing\.com$|duckduckgo\.com$/.test(host))return 'search';if(/facebook\.com$|instagram\.com$|reddit\.com$|t\.co$|youtube\.com$/.test(host))return 'social';return 'referral';}catch{return 'direct';}}
export function trackAudience(event){
  if(typeof window==='undefined'||location.protocol==='file:'||!navigator.onLine||optedOut())return;
  const ids=identity();
  fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...event,...ids,source:source(),device:matchMedia('(max-width: 767px)').matches?'mobile':'desktop'}),keepalive:true,credentials:'omit'}).catch(()=>{});
}
if(typeof document!=='undefined'){
  const b=document.getElementById('analytics-opt-out');
  if(b){
    function label(){b.textContent=optedOut()?'Analytics off · privacy':'Analytics privacy';}
    label();b.addEventListener('click',()=>{
      const off=optedOut();
      if(navigator.globalPrivacyControl===true||navigator.doNotTrack==='1'){alert('Analytics are disabled by your browser privacy preference.');return;}
      if(confirm(off?'Enable optional anonymous analytics?':'Disable optional analytics? We use a random browser identifier for up to 30 days to estimate repeat readership, a tab session identifier, page interactions, broad referral category and screen size. We do not store your email or IP address in analytics.')){
        try{if(off)localStorage.removeItem(optKey);else{localStorage.setItem(optKey,'1');localStorage.removeItem(key);sessionStorage.removeItem(sessionKey);}}catch{}label();
      }
    });
  }
}
