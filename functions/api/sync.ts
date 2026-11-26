interface Env {
  SAVANTIX_SYNC_KV?: {
    get: (key: string, type?: string) => Promise<any>;
    put: (key: string, value: string) => Promise<void>;
  };
}

const memoryFallback: Record<string, { payload: any; updatedAt: string }> = {};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

const cleanKey = (key: string) =>
  (key || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

function mergeByKey(existing: any[], incoming: any[], getKey: (x: any) => string): any[] {
  const map = new Map<string, any>();
  if (Array.isArray(existing)) {
    for (const item of existing) {
      const k = getKey(item);
      if (k) map.set(k, item);
    }
  }
  if (Array.isArray(incoming)) {
    for (const item of incoming) {
      const k = getKey(item);
      if (k) map.set(k, item);
    }
  }
  return Array.from(map.values());
}

function mergeDefined(base: Record<string, any>, patch: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...(base || {}) };
  if (patch && typeof patch === 'object') {
    for (const [k, v] of Object.entries(patch)) {
      if (v !== undefined && v !== null && v !== '') {
        out[k] = v;
      } else if (typeof v === 'number' && !Number.isNaN(v)) {
        out[k] = v;
      }
    }
  }
  return out;
}

function mergePayloads(existing: any, incoming: any): any {
  if (!existing || typeof existing !== 'object') return incoming;
  if (!incoming || typeof incoming !== 'object') return existing;

  const deletedLogIds = Array.from(new Set<string>([
    ...(Array.isArray(existing.deletedLogIds) ? existing.deletedLogIds : []),
    ...(Array.isArray(incoming.deletedLogIds) ? incoming.deletedLogIds : []),
  ])).slice(-500);
  const deletedGoalIds = Array.from(new Set<string>([
    ...(Array.isArray(existing.deletedGoalIds) ? existing.deletedGoalIds : []),
    ...(Array.isArray(incoming.deletedGoalIds) ? incoming.deletedGoalIds : []),
  ])).slice(-500);
  const deletedJournalIds = Array.from(new Set<string>([
    ...(Array.isArray(existing.deletedJournalIds) ? existing.deletedJournalIds : []),
    ...(Array.isArray(incoming.deletedJournalIds) ? incoming.deletedJournalIds : []),
  ])).slice(-500);

  const delLogSet = new Set(deletedLogIds);
  const delGoalSet = new Set(deletedGoalIds);
  const delJournalSet = new Set(deletedJournalIds);

  const mergedLogs = mergeByKey(existing.logs, incoming.logs, (x) =>
    x?.id ? String(x.id) : `${x?.date || ''}_${x?.subject || ''}_${x?.durationMinutes || 0}`
  ).filter((x) => !x?.id || !delLogSet.has(String(x.id)));

  const mergedGoals = mergeByKey(existing.goals, incoming.goals, (x) =>
    x?.id ? String(x.id) : `${x?.title || ''}`
  ).filter((x) => !x?.id || !delGoalSet.has(String(x.id)));

  const mergedJournal = mergeByKey(existing.journal, incoming.journal, (x) =>
    x?.id ? String(x.id) : `${x?.date || ''}_${(x?.content || '').slice(0, 24)}`
  ).filter((x) => !x?.id || !delJournalSet.has(String(x.id)));
  const mergedInsights = mergeByKey(existing.insights, incoming.insights, (x) =>
    x?.id ? String(x.id) : `${x?.date || ''}`
  );

  let mergedInst = incoming.institutional_attendance || existing.institutional_attendance || null;
  if (existing.institutional_attendance && incoming.institutional_attendance) {
    const existingDeleted = new Set<string>(
      Array.isArray(existing.institutional_attendance.deletedAbsenceDates)
        ? existing.institutional_attendance.deletedAbsenceDates
        : []
    );
    const incomingDeleted = new Set<string>(
      Array.isArray(incoming.institutional_attendance.deletedAbsenceDates)
        ? incoming.institutional_attendance.deletedAbsenceDates
        : []
    );
    const incomingActiveDates = new Set<string>(
      (Array.isArray(incoming.institutional_attendance.absences)
        ? incoming.institutional_attendance.absences
        : []
      )
        .map((a: any) => (a?.date ? String(a.date) : ''))
        .filter(Boolean)
    );

    // Tombstone reconciliation: union deletions, but if incoming explicitly re-added a date (present in incoming.absences and not in incomingDeleted), un-tombstone it.
    const mergedDeletedSet = new Set<string>([...existingDeleted, ...incomingDeleted]);
    for (const activeDate of incomingActiveDates) {
      if (!incomingDeleted.has(activeDate)) {
        mergedDeletedSet.delete(activeDate);
      }
    }

    const rawMergedAbsences = mergeByKey(
      existing.institutional_attendance.absences,
      incoming.institutional_attendance.absences,
      (a) => (a?.date ? String(a.date) : a?.id ? String(a.id) : '')
    );
    const mergedAbsences = rawMergedAbsences
      .filter((a) => !a?.date || !mergedDeletedSet.has(String(a.date)))
      .sort((a, b) => String(b?.date || '').localeCompare(String(a?.date || '')));

    const mergedProfile = mergeDefined(
      existing.institutional_attendance.profile || {},
      incoming.institutional_attendance.profile || {}
    );
    const held = Math.max(
      typeof mergedProfile.workingDaysHeld === 'number' ? mergedProfile.workingDaysHeld : 0,
      mergedAbsences.length
    );
    mergedProfile.workingDaysHeld = held;
    mergedProfile.absentDays = mergedAbsences.length;
    mergedProfile.presentDays = Math.max(0, held - mergedAbsences.length);

    mergedInst = {
      ...existing.institutional_attendance,
      ...incoming.institutional_attendance,
      profile: mergedProfile,
      absences: mergedAbsences,
      deletedAbsenceDates: Array.from(mergedDeletedSet).sort(),
      lastUpdated: new Date().toISOString(),
    };
  }

  return {
    ...existing,
    ...incoming,
    logs: mergedLogs,
    goals: mergedGoals,
    journal: mergedJournal,
    deletedLogIds,
    deletedGoalIds,
    deletedJournalIds,
    insights: mergedInsights,
    institutional_attendance: mergedInst,
    lastSyncedAt: new Date().toISOString(),
  };
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const kv = env?.SAVANTIX_SYNC_KV;
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const rawId =
      url.searchParams.get('canonicalId') ||
      url.searchParams.get('key') ||
      url.searchParams.get('email') ||
      '';
    if (!rawId) {
      return new Response(
        JSON.stringify({ success: false, message: 'canonicalId parameter is required' }),
        { status: 400, headers: corsHeaders }
      );
    }
    const id = cleanKey(rawId);
    const item = kv ? await kv.get(id, 'json') : memoryFallback[id];

    return new Response(
      JSON.stringify({
        success: true,
        durable: Boolean(kv),
        exists: Boolean(item),
        canonicalId: id,
        payload: item ? item.payload : null,
        updatedAt: item ? item.updatedAt : null,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  if (request.method === 'POST') {
    try {
      const body: any = await request.json();
      const rawId = body?.canonicalId || body?.key || body?.email || '';
      if (!rawId) {
        return new Response(
          JSON.stringify({ success: false, message: 'canonicalId is required in body' }),
          { status: 400, headers: corsHeaders }
        );
      }
      const id = cleanKey(rawId);
      const incoming = body.snapshot || body.payload || body.data || body;
      const existing = kv ? await kv.get(id, 'json') : memoryFallback[id];
      const mergedPayload = mergePayloads(existing?.payload, incoming);
      const updatedAt = new Date().toISOString();
      const record = { payload: mergedPayload, updatedAt };

      if (kv) {
        await kv.put(id, JSON.stringify(record));
      } else {
        memoryFallback[id] = record;
      }

      return new Response(
        JSON.stringify({
          success: true,
          durable: Boolean(kv),
          canonicalId: id,
          updatedAt,
          absencesCount: mergedPayload?.institutional_attendance?.absences?.length || 0,
          deletedCount: mergedPayload?.institutional_attendance?.deletedAbsenceDates?.length || 0,
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (e: any) {
      return new Response(
        JSON.stringify({ success: false, message: e?.message || 'Invalid JSON body' }),
        { status: 400, headers: corsHeaders }
      );
    }
  }

  return new Response(
    JSON.stringify({ success: false, message: 'Method not allowed' }),
    { status: 405, headers: corsHeaders }
  );
}
