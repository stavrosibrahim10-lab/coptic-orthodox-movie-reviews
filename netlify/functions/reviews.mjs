import {environment,rows,reply,publicReview} from './_shared/core.mjs';
export const config={path:'/api/reviews'};
export default async function handler(req){
  if(req.method!=='GET')return reply({error:'Method not allowed'},405);
  if(!environment().ready)return reply({reviews:[],connected:false});
  try{
    const all=await rows('studio_reviews',{select:'movie_id,published,published_at',where:{published:'not.is.null'},limit:1000});
    return reply({reviews:all.map(publicReview),connected:true},200,{'Cache-Control':'public, max-age=60'});
  }catch{return reply({reviews:[],connected:false},503)}
}
