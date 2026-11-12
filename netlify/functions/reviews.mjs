// Seed review data is included in the static frontend. This endpoint exists to
// preserve compatibility with the frontend when there is no connected database.
export const config={path:'/api/reviews'};
export default async function handler(){return new Response(JSON.stringify({reviews:[]}),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});}
