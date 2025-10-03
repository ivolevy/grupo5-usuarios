import { getApiDocs } from '@/lib/openapi';

export async function GET() {
  const spec = await getApiDocs();
  return Response.json(spec);
}
