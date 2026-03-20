import { randomUUID } from 'crypto';
import { supabaseAdmin } from '../config/supabaseAdmin';

/**
 * Unique identifier for this server process.
 * Used to identify which instance holds a job lock.
 */
const INSTANCE_ID = randomUUID();

/**
 * Try to acquire a distributed job lock backed by the `job_locks` table.
 *
 * Strategy:
 *  1. Delete any stale lock (older than `staleSecs`) so a crashed instance
 *     cannot block the job forever.
 *  2. Attempt to INSERT our lock record. The `job_name` primary-key constraint
 *     causes the insert to fail (silently) when another instance already holds
 *     a fresh lock, and we return `null` to signal "lock not acquired".
 *
 * @param jobName   Unique identifier for the background job.
 * @param staleSecs Locks older than this many seconds are considered stale.
 * @returns A lock token (UUID) on success, or `null` if the lock is held by
 *          another instance.
 */
export async function tryAcquireJobLock(
  jobName: string,
  staleSecs: number,
): Promise<string | null> {
  const token = randomUUID();
  const staleThreshold = new Date(Date.now() - staleSecs * 1000).toISOString();

  // Remove any stale lock so a crashed instance doesn't block indefinitely.
  const { error: cleanupError } = await supabaseAdmin
    .from('job_locks')
    .delete()
    .eq('job_name', jobName)
    .lt('locked_at', staleThreshold);

  if (cleanupError) {
    console.error(
      `[job-lock] Failed to clean up stale lock for "${jobName}":`,
      cleanupError.message ?? cleanupError,
    );
    throw cleanupError;
  }
  // Try to insert our lock.
  // The `job_name` PRIMARY KEY constraint is the atomic gate: even if two
  // instances race through the stale-delete above and both attempt to INSERT,
  // the database guarantees that at most one INSERT succeeds.  The losing
  // instance receives a unique-violation error (code 23505) and returns null.
  const { error } = await supabaseAdmin
    .from('job_locks')
    .insert({
      job_name: jobName,
      locked_at: new Date().toISOString(),
      instance_id: INSTANCE_ID,
      token,
    });

  if (error) {
    const isPkConflict = error.code === '23505';
    if (!isPkConflict) {
      console.warn(`[job-lock] Unexpected error acquiring lock for "${jobName}":`, error.message);
    }
    return null;
  }

  return token;
}

/**
 * Release a previously acquired job lock.
 * The `token` check ensures only the instance that acquired the lock can
 * release it, preventing accidental release of a lock held by another instance.
 */
export async function releaseJobLock(jobName: string, token: string): Promise<void> {
  await supabaseAdmin
    .from('job_locks')
    .delete()
    .eq('job_name', jobName)
    .eq('token', token);
}

/**
 * Execute `fn` only if this process can acquire the distributed job lock.
 * The lock is always released after `fn` completes or throws.
 *
 * @param jobName   Unique identifier for the background job.
 * @param staleSecs Locks older than this many seconds are considered stale.
 * @param fn        The job function to execute under the lock.
 * @returns The result of `fn`, or `null` if the lock could not be acquired.
 */
export async function withJobLock<T>(
  jobName: string,
  staleSecs: number,
  fn: () => Promise<T>,
): Promise<T | null> {
  const token = await tryAcquireJobLock(jobName, staleSecs);

  if (!token) {
    console.log(`[job-lock] Skipping "${jobName}" – lock held by another instance`);
    return null;
  }

  try {
    return await fn();
  } finally {
    await releaseJobLock(jobName, token);
  }
}
