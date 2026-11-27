// Private, persistent claim shared by all server instances. No plaintext emails stored.
import {createHmac,randomUUID} from 'node:crypto';
export function createNewsletterClaims(env,send=globalThis.fetch){
  const url=(env.SUPABASE_URL||'').trim().replace(/\/$/,'');
  const secret=(env.SUPABASE_SECRET_KEY||'').trim();
  async function rpc(name,body){
    if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)||!secret)throw new Error('Newsletter claim storage unavailable');
    const response=await send(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:secret,'Content-Type':'application/json','Accept':'application/json',...(secret.startsWith('eyJ')?{Authorization:'Bearer '+secret}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(5000)});
    if(!response.ok)throw new Error('Newsletter claim storage unavailable');
    return name==='claim_newsletter_email'?response.json():null;
  }
  return {
    async claim(email,list){
      const p_key=createHmac('sha256',secret).update('tol-newsletter:'+list+':'+email).digest('hex');
      const p_token=randomUUID();
      const args={p_key,p_token};
      const result=await rpc('claim_newsletter_email',args);
      if(typeof result!=='boolean')throw new Error('Invalid newsletter claim response');
      return result?args:null;
    },
    async release(args){await rpc('release_newsletter_email',args);}
  };
}
