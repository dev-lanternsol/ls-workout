// app/api/webhook/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { storeLogs } from '@/lib/utils';
import { processClickUpRaw } from '@/lib/webhook-processor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// HMAC check (only if both secret & header present so ClickUp "Test" can pass)
function verifyWebhookSignature(body, signature, secret) {
  const hash = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return hash === signature;
}

export async function POST(request) {
  const supa = getSupabaseAdmin();

  try {
    const raw = await request.text();
    const secret = process.env.CLICKUP_WEBHOOK_SECRET;
    const sig = request.headers.get('x-signature');

    // Fire-and-forget app-level log (separate from DB log)
    storeLogs(request, raw).catch(console.error);

    if (secret && sig && !verifyWebhookSignature(raw, sig, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 1) Persist the raw webhook payload and keep its id
    let logId = null;
    try {
      const { data: inserted, error: insErr } = await supa
        .from('webhook_logs')
        .insert({
          headers: Object.fromEntries(request.headers.entries()),
          body: raw,
          valid_signature: !!(secret && sig),
        })
        .select('id')
        .single();

      if (insErr) {
        console.error('Failed to insert webhook log:', insErr);
      } else {
        logId = inserted?.id ?? null;
      }
    } catch (e) {
      console.error('Exception inserting webhook log:', e);
    }

    // 2) Delegate to common processor (parse, download image, call Gemini, insert workout)
    const result = await processClickUpRaw(raw);

    // 3) Mark the same webhook_logs row with processed_at / last_error (no RPC, no race)
    if (logId) {
      await supa
        .from('webhook_logs')
        .update({
          processed_at: result.success ? new Date().toISOString() : null,
          last_error: result.success ? null : JSON.stringify(result.info),
        })
        .eq('id', logId);
    }

    if (!result.success) {
      return NextResponse.json(
        { error: 'Processing failed', info: result.info },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, info: result.info });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  // Simple health check for ClickUp test
  return NextResponse.json({ ok: true, ts: Date.now() });
}
