import { CloudSyncService } from '../services/cloudSyncService';

export async function runSyncTombstoneTests(): Promise<boolean> {
  console.log('\nRUNNING SUITE: Cloud Sync Deletion Tombstones (Logs, Goals, Journal)');
  let passed = 0;
  let failed = 0;

  const assert = (name: string, cond: boolean, detail = '') => {
    if (cond) {
      console.log(`  PASS ${name}`);
      passed++;
    } else {
      console.error(`  FAIL ${name}${detail ? ': ' + detail : ''}`);
      failed++;
    }
  };

  if (typeof (globalThis as any).localStorage === 'undefined') {
    const store = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => store.set(k, String(v)),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
    };
  }
  localStorage.clear();

  const email = 'partofcosmmos@gmail.com';
  const cid = CloudSyncService.getCanonicalUid(email);

  CloudSyncService.recordDeletionTombstone(cid, 'logs', 'log_del_1');
  CloudSyncService.recordDeletionTombstone(cid, 'goals', 'goal_del_1');
  CloudSyncService.recordDeletionTombstone(cid, 'journal', 'jour_del_1');

  const snap = CloudSyncService.getLocalSnapshot(email, cid);
  assert('Snapshot includes deletedLogIds', (snap.deletedLogIds || []).includes('log_del_1'));
  assert('Snapshot includes deletedGoalIds', (snap.deletedGoalIds || []).includes('goal_del_1'));
  assert('Snapshot includes deletedJournalIds', (snap.deletedJournalIds || []).includes('jour_del_1'));

  const res = CloudSyncService.mergeAndPersist(
    {
      version: 2,
      email,
      canonicalId: cid,
      lastSyncedAt: new Date().toISOString(),
      deviceInfo: 'test',
      logs: [
        { id: 'log_del_1', date: '2026-11-25', subject: 'Physics', durationMinutes: 30 },
        { id: 'log_keep_2', date: '2026-11-26', subject: 'Mathematics', durationMinutes: 60 },
      ],
      goals: [],
      journal: [],
      attendance: [], flashcards: [], examTargets: [],
    },
    email,
    cid
  );

  assert('Tombstoned log_del_1 is filtered out during mergeAndPersist', !res.mergedLogs?.some((l: any) => l.id === 'log_del_1'));
  assert('Active log_keep_2 is preserved during mergeAndPersist', Boolean(res.mergedLogs?.some((l: any) => l.id === 'log_keep_2')));

  console.log(`SYNC TOMBSTONE TESTS COMPLETE: ${passed}/${passed + failed} PASSED`);
  return failed === 0;
}

