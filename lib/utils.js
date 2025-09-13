import { getSupabaseAdmin } from './supabase-server';

async function storeLogs(request, body) {
  // inside POST() at the top, right after reading body/signature
  const headersObj = Object.fromEntries([...request.headers.entries()]);
  const supa = getSupabaseAdmin();
  await supa.from('webhook_logs').insert({
    headers: headersObj,
    body,
    valid_signature: !!(process.env.CLICKUP_WEBHOOK_SECRET && request.headers.get('x-signature')),
  });
}

export { storeLogs };