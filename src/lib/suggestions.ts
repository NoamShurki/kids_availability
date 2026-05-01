import type { BabyStatusHistory, StatusDefinition } from "./types";
import { formatTime, formatDelta } from "./utils";

const BUCKET_SIZE_MINS = 30;
const BUCKETS_PER_DAY = (24 * 60) / BUCKET_SIZE_MINS; // 48
const MIN_DATA_POINTS = 10;

type HistoryWithStatus = BabyStatusHistory & { status_definitions: StatusDefinition };

function bucketIndex(date: Date): number {
  return Math.floor((date.getHours() * 60 + date.getMinutes()) / BUCKET_SIZE_MINS);
}

function ageWeight(setAt: string, now: Date): number {
  const ageDays = (now.getTime() - new Date(setAt).getTime()) / 86400000;
  if (ageDays <= 7) return 2;
  if (ageDays <= 14) return 1.5;
  return 1;
}

// Returns total weighted minutes each label was active in each 30-min bucket
function buildFrequencyMap(
  history: HistoryWithStatus[],
  now: Date
): Map<number, Map<string, number>> {
  const map = new Map<number, Map<string, number>>();

  for (let i = 0; i < history.length - 1; i++) {
    const entry = history[i];
    const nextEntry = history[i + 1];
    const start = new Date(entry.set_at);
    const end = new Date(nextEntry.set_at);
    const label = entry.status_definitions.label;
    const weight = ageWeight(entry.set_at, now);

    let cursor = new Date(start);
    while (cursor < end) {
      const bucket = bucketIndex(cursor);
      const bucketEnd = new Date(cursor);
      bucketEnd.setMinutes(
        Math.ceil((cursor.getMinutes() + 1) / BUCKET_SIZE_MINS) * BUCKET_SIZE_MINS,
        0, 0
      );
      const segEnd = bucketEnd < end ? bucketEnd : end;
      const mins = (segEnd.getTime() - cursor.getTime()) / 60000;

      if (!map.has(bucket)) map.set(bucket, new Map());
      const bucketMap = map.get(bucket)!;
      bucketMap.set(label, (bucketMap.get(label) ?? 0) + mins * weight);

      cursor = segEnd;
    }
  }

  return map;
}

function dominantLabel(
  freqMap: Map<number, Map<string, number>>,
  bucket: number
): string | null {
  const bucketMap = freqMap.get(bucket);
  if (!bucketMap) return null;
  let best: string | null = null;
  let bestScore = 0;
  for (const [label, score] of bucketMap) {
    if (score > bestScore) {
      bestScore = score;
      best = label;
    }
  }
  return best;
}

function isAvailable(label: string): boolean {
  return label.toLowerCase().includes("available");
}

function isSleeping(label: string): boolean {
  return label.toLowerCase().includes("sleep");
}

export function generateSuggestion(
  currentStatus: StatusDefinition,
  history: HistoryWithStatus[],
  lastChangedAt: string,
  now: Date = new Date()
): string | null {
  if (history.length < MIN_DATA_POINTS) return null;

  const freqMap = buildFrequencyMap(history, now);
  const currentBucket = bucketIndex(now);

  // Pattern A: Currently sleeping — check if median sleep session is almost over
  if (isSleeping(currentStatus.label)) {
    const sleepSessions = computeSleepSessionLengths(history);
    if (sleepSessions.length >= 5) {
      const medianMs = median(sleepSessions);
      const elapsedMs = now.getTime() - new Date(lastChangedAt).getTime();
      if (elapsedMs >= medianMs * 0.75) {
        return "Nap is probably almost over — check back soon!";
      }
    }
  }

  // Pattern B: Currently available — warn if sleep window is coming in 60-90 min
  if (isAvailable(currentStatus.label)) {
    for (let offset = 2; offset <= 3; offset++) {
      const futureBucket = (currentBucket + offset) % BUCKETS_PER_DAY;
      const dominant = dominantLabel(freqMap, futureBucket);
      if (dominant && isSleeping(dominant)) {
        const futureTime = new Date(now.getTime() + offset * BUCKET_SIZE_MINS * 60000);
        return `Usually goes to sleep around ${formatTime(futureTime)} — don't wait too long!`;
      }
    }
  }

  // Pattern C: Currently unavailable — find next available window in next 4 hours
  if (!isAvailable(currentStatus.label)) {
    for (let offset = 1; offset <= 8; offset++) {
      const futureBucket = (currentBucket + offset) % BUCKETS_PER_DAY;
      const dominant = dominantLabel(freqMap, futureBucket);
      if (dominant && isAvailable(dominant)) {
        const futureTime = new Date(now.getTime() + offset * BUCKET_SIZE_MINS * 60000);
        const delta = formatDelta(offset * BUCKET_SIZE_MINS * 60000);
        return `Usually free around ${formatTime(futureTime)} — try again in ${delta}.`;
      }
    }
  }

  return null;
}

function computeSleepSessionLengths(history: HistoryWithStatus[]): number[] {
  const lengths: number[] = [];
  for (let i = 0; i < history.length - 1; i++) {
    if (isSleeping(history[i].status_definitions.label)) {
      const start = new Date(history[i].set_at).getTime();
      const end = new Date(history[i + 1].set_at).getTime();
      lengths.push(end - start);
    }
  }
  return lengths;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}
