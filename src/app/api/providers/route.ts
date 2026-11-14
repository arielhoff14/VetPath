import { z } from 'zod';
import { searchProviders } from '../../../server/repositories/providers';
const query = z.object({lat:z.number().min(-90).max(90),lon:z.number().min(-180).max(180),species:z.enum(['dog','cat','bird','rabbit']).optional(),careType:z.enum(['emergency','urgent','specialty','general']).optional(),includeUnknown:z.boolean().default(true)});
export async function POST(request: Request) {
  let input: unknown;
  try { input = await request.json(); } catch { return Response.json({error:'Invalid request'}, {status:400}); }
  const parsed = query.safeParse(input);
  if (!parsed.success) return Response.json({error:'Invalid search parameters'}, {status:400,headers:{'Cache-Control':'no-store'}});
  try {
    const providers = await searchProviders(parsed.data);
    return Response.json({providers}, {headers:{'Cache-Control':'no-store'}});
  } catch {
    return Response.json({error:'The directory is temporarily unavailable. Please contact a veterinary clinic directly.'}, {status:503,headers:{'Cache-Control':'no-store'}});
  }
}
