import type { Exam } from '../types';
import type { AssignmentRecord } from '../types/assignment';
import type { TimetableCourse } from '../types/timetable';

type StorageChannel = 'exams' | 'assignments' | 'timetable';

type StorageSyncPayloadMap = {
  exams: Exam[];
  assignments: AssignmentRecord[];
  timetable: TimetableCourse[];
};

type StorageSyncDetail<K extends StorageChannel = StorageChannel> = {
  channel: K;
  userId: string;
  value: StorageSyncPayloadMap[K];
};

const STORAGE_SYNC_EVENT = 'neurospace:storage-sync';

export const subscribeStorageSync = <K extends StorageChannel>(
  channel: K,
  userId: string,
  callback: (value: StorageSyncPayloadMap[K]) => void,
): (() => void) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<StorageSyncDetail>).detail;
    if (!detail || detail.channel !== channel || detail.userId !== userId) {
      return;
    }

    callback(detail.value as StorageSyncPayloadMap[K]);
  };

  window.addEventListener(STORAGE_SYNC_EVENT, handler as EventListener);
  return () => window.removeEventListener(STORAGE_SYNC_EVENT, handler as EventListener);
};

export const broadcastStorageSync = <K extends StorageChannel>(
  channel: K,
  userId: string,
  value: StorageSyncPayloadMap[K],
) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<StorageSyncDetail>(STORAGE_SYNC_EVENT, {
      detail: { channel, userId, value } as StorageSyncDetail,
    }),
  );
};
