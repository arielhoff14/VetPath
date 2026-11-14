import { z } from 'zod';
import { searchProviders } from '../../../server/repositories/providers';
const query = z.object({lat:z.coerce.number().min(-90).max(90),lon:z.coerce.number().min(-180).max(180),species:z.enum(['dog','cat','bird','rabbit']).optional(),careType:z.enum(['emergency','urgent','specialty','general']).optional(),includeUnknown:z.enum(['true','false']).default('true')});
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = query.safeParse(params);
  if (!parsed.success) return Response.json({error:'Invalid search parameters'}, {status:400,headers:{'Cache-Control':'no-store'}});
  try {
    const providers = await searchProviders({...parsed.data,includeUnknown:parsed.data.includeUnknown === 'true'});
    return Response.json({providers}, {headers:{'Cache-Control':'no-store'}});
  } catch {
    return Response.json({error:'The directory is temporarily unavailable. Please contact a veterinary clinic directly.'}, {status:503,headers:{'Cache-Control':'no-store'}});
  }
}
