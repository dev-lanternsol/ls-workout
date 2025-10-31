// app/api/reprocess/route.js
import { NextResponse } from 'next/server';

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { processClickUpRaw } from '@/lib/webhook-processor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const supa = getSupabaseAdmin();

  let params = {};
  try {
    params = await req.json();
  } catch (_) {
    // allow empty body
  }

  const {
    log_id,                 // number|string (single)
    ids,                    // number[] (explicit list)
    workout_id,             // number|string (reprocess by workout)
    since,                  // ISO string to filter by created_at
    only_unprocessed = true,
    limit = 50,
  } = params || {};

  try {
    // Helper to process a set of rows
    const processRows = async (rows) => {
      const results = [];

      for (const r of rows) {
        const res = await processClickUpRaw(r.body, { skipHmac: true });

        // Only update webhook_logs if this is a real webhook log (not a synthetic workout)
        if (!String(r.id).startsWith('workout_')) {
          const attemptsNext = (r.reprocess_attempts ?? 0) + 1;
          await supa
            .from('webhook_logs')
            .update({
              reprocess_attempts: attemptsNext,
              processed_at: res.success ? new Date().toISOString() : null,
              last_error: res.success ? null : JSON.stringify(res.info),
            })
            .eq('id', r.id);
        }

        results.push({ id: r.id, success: res.success, info: res.info });
      }

      return results;
    };

    // 1) If explicit target(s) provided
    if (log_id || (ids && ids.length) || workout_id) {
      const idList = [];
      if (log_id) idList.push(log_id);
      if (ids && ids.length) idList.push(...ids);
      
      let query;
      
      if (workout_id) {
        // For workout reprocessing, we'll fetch the workout record and create a synthetic webhook log
        const { data: workout, error: workoutError } = await supa
          .from('workouts')
          .select('*')
          .eq('id', workout_id)
          .single();
          
        if (workoutError) {
          console.error('Workout fetch error:', workoutError);
          throw workoutError;
        }
        
        if (!workout) {
          return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
        }
        
        // Create a synthetic row that mimics a webhook log for reprocessing
        const syntheticRow = {
          id: `workout_${workout_id}`,
          body: {
            workout: workout,
            reprocess: true,
            original_workout_id: workout_id
          },
          reprocess_attempts: 0
        };
        
        const results = await processRows([syntheticRow]);
        return NextResponse.json({ results });
      } else if (log_id || (ids && ids.length)) {
        const idList = [];
        if (log_id) idList.push(log_id);
        if (ids && ids.length) idList.push(...ids);
        
        const query = supa
          .from('webhook_logs')
          .select('id, body, reprocess_attempts')
          .in('id', idList);

        const { data: rows, error } = await query;

        if (error) {
          console.error('Database query error:', error);
          throw error;
        }
        
        if (!rows || rows.length === 0) {
          console.log('No matching logs found for:', { log_id, ids, workout_id });
          return NextResponse.json({ error: 'No matching logs found' }, { status: 404 });
        }

        console.log(`Found ${rows.length} logs to reprocess`);
        const results = await processRows(rows);
        return NextResponse.json({ results });
      }

      // 2) Batch by filters
      let q = supa
        .from('webhook_logs')
        .select('id, body, reprocess_attempts, created_at, processed_at')
        .order('id', { ascending: true })
        .limit(limit);

      if (since) q = q.gte('created_at', since);
      if (only_unprocessed) q = q.is('processed_at', null);

      const { data: rows, error } = await q;
      if (error) throw error;

      if (!rows || rows.length === 0) {
        return NextResponse.json({ results: [], note: 'Nothing to process' });
      }

      const results = await processRows(rows);
      return NextResponse.json({ results });
    }
  } catch (err) {
    console.error('Reprocess error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export async function GET() {
  return NextResponse.json({ ok: true, mode: 'reprocess', ts: Date.now() });
};
