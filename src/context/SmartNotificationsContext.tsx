import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import { useAssignmentStorage } from '../hooks/useAssignmentStorage';
import { useExamStorage } from '../hooks/useExamStorage';
import { useTimetableStorage } from '../hooks/useTimetableStorage';
import type { Exam } from '../types';
import type { AssignmentRecord } from '../types/assignment';
import type { TimetableCourse } from '../types/timetable';
import {
  buildDeadlineNotifications,
  filterNotifications,
  getBadgeTone,
} from '../utils/smartNotifications';
import type {
  BadgeTone,
  NotificationFilter,
  SmartNotification,
} from '../utils/smartNotifications';

type UndoDismissState = {
  id: string;
  headline: string;
} | null;

type SmartNotificationsContextValue = {
  exams: Exam[];
  assignments: AssignmentRecord[];
  courses: TimetableCourse[];
  notifications: SmartNotification[];
  filteredNotifications: SmartNotification[];
  topNotifications: SmartNotification[];
  selectedFilter: NotificationFilter;
  unreadCount: number;
  unreadIds: Set<string>;
  badgeTone: BadgeTone;
  isPanelOpen: boolean;
  bellAnimationToken: number;
  undoDismiss: UndoDismissState;
  setSelectedFilter: (filter: NotificationFilter) => void;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  undoLastDismiss: () => void;
};

const SmartNotificationsContext = createContext<SmartNotificationsContextValue | undefined>(undefined);

const FILTER_KEY = 'neurospace.notifications.filter';
const READ_KEY = 'neurospace.notifications.read';
const DISMISSED_KEY = 'neurospace.notifications.dismissed';
const UNDO_TIMEOUT_MS = 5000;

const readSessionValue = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeSessionValue = (key: string, value: unknown) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures and keep the experience functional.
  }
};

export function SmartNotificationsProvider({ children }: PropsWithChildren) {
  const [exams] = useExamStorage();
  const [assignments] = useAssignmentStorage();
  const [courses] = useTimetableStorage();
  const [now, setNow] = useState(() => new Date());
  const [selectedFilter, setSelectedFilterState] = useState<NotificationFilter>(() =>
    readSessionValue<NotificationFilter>(FILTER_KEY, 'all'));
  const [readMap, setReadMap] = useState<Record<string, number>>(() =>
    readSessionValue<Record<string, number>>(READ_KEY, {}));
  const [dismissedMap, setDismissedMap] = useState<Record<string, number>>(() =>
    readSessionValue<Record<string, number>>(DISMISSED_KEY, {}));
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [bellAnimationToken, setBellAnimationToken] = useState(0);
  const [undoDismiss, setUndoDismiss] = useState<UndoDismissState>(null);
  const undoTimerRef = useRef<number | null>(null);
  const previousUrgentIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    writeSessionValue(FILTER_KEY, selectedFilter);
  }, [selectedFilter]);

  useEffect(() => {
    writeSessionValue(READ_KEY, readMap);
  }, [readMap]);

  useEffect(() => {
    writeSessionValue(DISMISSED_KEY, dismissedMap);
  }, [dismissedMap]);

  useEffect(() => () => {
    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current);
    }
  }, []);

  const notifications = useMemo(
    () => buildDeadlineNotifications(exams, assignments, courses, now),
    [assignments, courses, exams, now],
  );

  const activeIds = useMemo(() => new Set(notifications.map((notification) => notification.id)), [notifications]);

  useEffect(() => {
    setReadMap((previous) => {
      const nextEntries = Object.entries(previous).filter(([id]) => activeIds.has(id));
      if (nextEntries.length === Object.keys(previous).length) {
        return previous;
      }
      return Object.fromEntries(nextEntries);
    });

    setDismissedMap((previous) => {
      const nextEntries = Object.entries(previous).filter(([id]) => activeIds.has(id));
      if (nextEntries.length === Object.keys(previous).length) {
        return previous;
      }
      return Object.fromEntries(nextEntries);
    });
  }, [activeIds]);

  const visibleNotifications = useMemo(
    () => notifications.filter((notification) => !dismissedMap[notification.id]),
    [dismissedMap, notifications],
  );

  const unreadIds = useMemo(() => {
    const ids = visibleNotifications
      .filter((notification) => !readMap[notification.id])
      .map((notification) => notification.id);
    return new Set(ids);
  }, [readMap, visibleNotifications]);

  useEffect(() => {
    const currentUrgentUnreadIds = new Set(
      visibleNotifications
        .filter((notification) => notification.isUrgent && unreadIds.has(notification.id))
        .map((notification) => notification.id),
    );

    const previousUrgentIds = previousUrgentIdsRef.current;
    const hasNewUrgent = Array.from(currentUrgentUnreadIds).some((id) => !previousUrgentIds.has(id));

    if (previousUrgentIds.size > 0 && hasNewUrgent) {
      setBellAnimationToken((token) => token + 1);
    }

    previousUrgentIdsRef.current = currentUrgentUnreadIds;
  }, [unreadIds, visibleNotifications]);

  const filteredNotifications = useMemo(
    () => filterNotifications(visibleNotifications, selectedFilter),
    [selectedFilter, visibleNotifications],
  );

  const topNotifications = useMemo(() => visibleNotifications.slice(0, 4), [visibleNotifications]);
  const unreadCount = unreadIds.size;
  const badgeTone = useMemo(() => getBadgeTone(visibleNotifications, unreadIds), [unreadIds, visibleNotifications]);

  const setSelectedFilter = useCallback((filter: NotificationFilter) => {
    setSelectedFilterState(filter);
  }, []);

  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  const closePanel = useCallback(() => setIsPanelOpen(false), []);
  const togglePanel = useCallback(() => setIsPanelOpen((open) => !open), []);

  const markAsRead = useCallback((id: string) => {
    setReadMap((previous) => (previous[id] ? previous : { ...previous, [id]: Date.now() }));
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadMap((previous) => {
      const next = { ...previous };
      let changed = false;

      visibleNotifications.forEach((notification) => {
        if (!next[notification.id]) {
          next[notification.id] = Date.now();
          changed = true;
        }
      });

      return changed ? next : previous;
    });
  }, [visibleNotifications]);

  const dismissNotification = useCallback((id: string) => {
    const dismissed = visibleNotifications.find((notification) => notification.id === id);
    if (!dismissed) {
      return;
    }

    setDismissedMap((previous) => ({ ...previous, [id]: Date.now() }));
    setUndoDismiss({ id, headline: dismissed.headline });

    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current);
    }

    undoTimerRef.current = window.setTimeout(() => {
      setUndoDismiss(null);
      undoTimerRef.current = null;
    }, UNDO_TIMEOUT_MS);
  }, [visibleNotifications]);

  const undoLastDismiss = useCallback(() => {
    if (!undoDismiss) {
      return;
    }

    setDismissedMap((previous) => {
      const next = { ...previous };
      delete next[undoDismiss.id];
      return next;
    });

    setUndoDismiss(null);

    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, [undoDismiss]);

  const value = useMemo<SmartNotificationsContextValue>(() => ({
    exams,
    assignments,
    courses,
    notifications: visibleNotifications,
    filteredNotifications,
    topNotifications,
    selectedFilter,
    unreadCount,
    unreadIds,
    badgeTone,
    isPanelOpen,
    bellAnimationToken,
    undoDismiss,
    setSelectedFilter,
    openPanel,
    closePanel,
    togglePanel,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    undoLastDismiss,
  }), [
    assignments,
    badgeTone,
    closePanel,
    courses,
    dismissNotification,
    exams,
    filteredNotifications,
    isPanelOpen,
    bellAnimationToken,
    markAllAsRead,
    markAsRead,
    openPanel,
    selectedFilter,
    setSelectedFilter,
    togglePanel,
    topNotifications,
    unreadCount,
    unreadIds,
    undoDismiss,
    undoLastDismiss,
    visibleNotifications,
  ]);

  return (
    <SmartNotificationsContext.Provider value={value}>
      {children}
    </SmartNotificationsContext.Provider>
  );
}

export function useSmartNotifications(): SmartNotificationsContextValue {
  const context = useContext(SmartNotificationsContext);
  if (!context) {
    throw new Error('useSmartNotifications must be used within SmartNotificationsProvider.');
  }

  return context;
}
