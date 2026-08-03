import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck, Filter, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSmartNotifications } from '../../context/SmartNotificationsContext';
import type { NotificationFilter, SmartNotification } from '../../utils/smartNotifications';

const FILTERS: { key: NotificationFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'exams', label: 'Exams' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'classes', label: 'Classes' },
];

const badgeToneClass: Record<'red' | 'orange' | 'blue', string> = {
  red: 'border-red-400/60 bg-red-500 text-white shadow-[0_0_18px_rgba(239,68,68,0.45)]',
  orange: 'border-orange-400/60 bg-orange-500 text-black shadow-[0_0_18px_rgba(249,115,22,0.4)]',
  blue: 'border-blue-400/60 bg-blue-500 text-white shadow-[0_0_18px_rgba(59,130,246,0.35)]',
};

const filterClass = (active: boolean): string => active
  ? 'border-safe/50 bg-safe/10 text-safe'
  : 'border-gray-800 bg-black/20 text-gray-400 hover:border-gray-700 hover:text-white';

const cardToneClass: Record<SmartNotification['tone'], string> = {
  red: 'border-red-500/45 bg-gradient-to-r from-red-950/95 via-red-900/70 to-[#1b0a0a] shadow-[0_0_28px_rgba(239,68,68,0.16)]',
  orange: 'border-orange-400/45 bg-gradient-to-r from-orange-950/95 via-orange-900/70 to-[#1c1207] shadow-[0_0_28px_rgba(249,115,22,0.14)]',
  yellow: 'border-amber-400/45 bg-gradient-to-r from-amber-950/95 via-amber-900/55 to-[#1b1506] shadow-[0_0_24px_rgba(245,158,11,0.12)]',
  blue: 'border-blue-400/45 bg-gradient-to-r from-blue-950/95 via-blue-900/60 to-[#07111c] shadow-[0_0_24px_rgba(59,130,246,0.12)]',
  purple: 'border-purple-400/45 bg-gradient-to-r from-purple-950/95 via-purple-900/60 to-[#13081d] shadow-[0_0_24px_rgba(168,85,247,0.14)]',
  green: 'border-emerald-400/45 bg-gradient-to-r from-emerald-950/95 via-emerald-900/60 to-[#07170f] shadow-[0_0_24px_rgba(16,185,129,0.12)]',
};

const titleToneClass: Record<SmartNotification['tone'], string> = {
  red: 'text-red-200',
  orange: 'text-orange-200',
  yellow: 'text-amber-100',
  blue: 'text-blue-100',
  purple: 'text-purple-100',
  green: 'text-emerald-100',
};

const badgeText = (count: number): string => {
  if (count <= 0) {
    return '';
  }
  if (count >= 100) {
    return '99+';
  }
  return `${count}`;
};

const keyActivate = (event: ReactKeyboardEvent, callback: () => void) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    callback();
  }
};

const NotificationItem = ({
  notification,
  isRead,
  onOpen,
  onMarkAsRead,
  onDismiss,
}: {
  notification: SmartNotification;
  isRead: boolean;
  onOpen: () => void;
  onMarkAsRead: () => void;
  onDismiss: () => void;
}) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onOpen}
    onKeyDown={(event) => keyActivate(event, onOpen)}
    className={`w-full min-w-0 border px-4 py-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-safe/70 ${
      cardToneClass[notification.tone]
    } ${isRead ? 'opacity-65 saturate-75' : 'opacity-100'}`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className={`text-[11px] font-bold uppercase tracking-[0.22em] ${titleToneClass[notification.tone]}`}>
          {notification.title}
        </p>
        <h4 className="mt-2 truncate text-sm font-bold uppercase tracking-wide text-white">
          {notification.courseCode ? `${notification.courseCode} ` : ''}
          {notification.headline}
        </h4>
        <p className="mt-2 text-sm leading-relaxed text-gray-100 break-words">{notification.body}</p>
        {notification.helperText && (
          <p className="mt-2 text-xs leading-relaxed text-gray-300 break-words">{notification.helperText}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!isRead && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onMarkAsRead();
            }}
            aria-label={`Mark ${notification.headline} as read`}
            className="border border-white/20 bg-black/20 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-100 transition-colors hover:border-white/35 hover:text-white"
          >
            Read
          </button>
        )}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDismiss();
          }}
          aria-label={`Dismiss ${notification.headline}`}
          className="border border-white/20 bg-black/20 p-2 text-gray-200 transition-colors hover:border-white/35 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </div>

    <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-[10px] uppercase tracking-widest text-gray-300">
      <span>{notification.sourceLabel}</span>
      <span>{isRead ? 'Read' : 'Unread'}</span>
    </div>
  </div>
);

const NotificationList = ({
  mobile,
  closePanel,
}: {
  mobile: boolean;
  closePanel: () => void;
}) => {
  const navigate = useNavigate();
  const {
    filteredNotifications,
    selectedFilter,
    setSelectedFilter,
    markAllAsRead,
    markAsRead,
    dismissNotification,
    unreadIds,
    undoDismiss,
    undoLastDismiss,
  } = useSmartNotifications();

  const openNotification = (notification: SmartNotification) => {
    markAsRead(notification.id);

    if (notification.route) {
      navigate(notification.route, notification.routeState ? { state: notification.routeState } : undefined);
    }

    closePanel();
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overscroll-contain">
      <div className="min-w-0 border-b border-gray-800 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">Smart Alerts</p>
            <h3 className="mt-2 text-base font-bold uppercase tracking-wide text-white">Academic Notifications</h3>
            <p className="mt-1 text-xs text-gray-400">Prioritized deadlines, exams, and next classes.</p>
          </div>

          {mobile && (
            <button
              type="button"
              onClick={closePanel}
              aria-label="Close notifications"
              className="shrink-0 border border-gray-700 bg-black/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
            >
              Close
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500">
            <Filter size={12} />
            Filters
          </div>
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setSelectedFilter(filter.key)}
              className={`border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${filterClass(selectedFilter === filter.key)}`}
              aria-label={`Show ${filter.label} notifications`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-[11px] text-gray-400">
            {filteredNotifications.length} visible notification{filteredNotifications.length === 1 ? '' : 's'}
          </p>
          <button
            type="button"
            onClick={markAllAsRead}
            aria-label="Mark all notifications as read"
            className="inline-flex shrink-0 items-center gap-1.5 border border-gray-700 bg-black/20 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-300 transition-colors hover:border-safe/50 hover:text-safe"
          >
            <CheckCheck size={12} />
            Mark all as read
          </button>
        </div>
      </div>

      <div
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <AnimatePresence initial={false}>
          {undoDismiss && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-4 flex items-center justify-between gap-3 border border-safe/35 bg-safe/10 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-safe">Dismissed</p>
                <p className="mt-1 truncate text-xs text-gray-200">{undoDismiss.headline}</p>
              </div>
              <button
                type="button"
                onClick={undoLastDismiss}
                aria-label="Undo dismissed notification"
                className="shrink-0 border border-safe/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-safe transition-colors hover:bg-safe/10"
              >
                Undo
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-3">
          {filteredNotifications.length === 0 ? (
            <div className="border border-gray-800 bg-surface px-4 py-5 text-sm text-gray-400">
              No notifications match this filter right now.
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                isRead={!unreadIds.has(notification.id)}
                onOpen={() => openNotification(notification)}
                onMarkAsRead={() => markAsRead(notification.id)}
                onDismiss={() => dismissNotification(notification.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default function NotificationBell() {
  const {
    unreadCount,
    badgeTone,
    isPanelOpen,
    bellAnimationToken,
    togglePanel,
    closePanel,
  } = useSmartNotifications();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true);
  const [shouldShake, setShouldShake] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portal target must only be used after mount (avoids SSR/hydration mismatches)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);

    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!isPanelOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePanel();
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (!isDesktop) {
        return;
      }

      const target = event.target as Node;
      const clickedInsideBell = containerRef.current?.contains(target);
      const clickedInsidePanel = panelRef.current?.contains(target);

      if (!clickedInsideBell && !clickedInsidePanel) {
        closePanel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handlePointerDown);

    // Lock background scroll on mobile while the sheet is open, and always
    // restore it correctly on close/unmount (prevents the "frozen page" bug).
    let previousOverflow = '';
    if (!isDesktop) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handlePointerDown);
      if (!isDesktop) {
        document.body.style.overflow = previousOverflow;
      }
    };
  }, [closePanel, isDesktop, isPanelOpen]);

  useEffect(() => {
    if (!bellAnimationToken) {
      return;
    }

    setShouldShake(true);
    const timer = window.setTimeout(() => setShouldShake(false), 1400);
    return () => window.clearTimeout(timer);
  }, [bellAnimationToken]);

  const unreadLabel = useMemo(() => badgeText(unreadCount), [unreadCount]);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const panelContent = (
    <AnimatePresence>
      {isPanelOpen && (
        <>
          {isDesktop ? (
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              role="dialog"
              aria-label="Notifications panel"
              style={{
                position: 'fixed',
                top: containerRef.current
                  ? containerRef.current.getBoundingClientRect().bottom + 12
                  : 72,
                right: containerRef.current
                  ? Math.max(window.innerWidth - containerRef.current.getBoundingClientRect().right, 12)
                  : 12,
              }}
              className="z-[999] w-[min(92vw,400px)] overflow-hidden border border-gray-800 bg-[#070709]/98 shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
            >
              <div className="max-h-[70vh] overflow-y-auto overscroll-contain">
                <NotificationList mobile={false} closePanel={closePanel} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="dialog"
              aria-modal="true"
              aria-label="Notifications"
              className="fixed inset-0 z-[999]"
            >
              <button
                type="button"
                aria-label="Close notifications"
                onClick={closePanel}
                className="absolute inset-0 bg-black/70"
              />
              <motion.div
                ref={panelRef}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="absolute inset-x-0 bottom-0 h-[min(82vh,680px)] min-w-0 overflow-hidden rounded-t-3xl border border-gray-800 bg-[#070709] shadow-[0_-20px_55px_rgba(0,0,0,0.5)]"
              >
                <div className="mx-auto mt-3 h-1.5 w-16 rounded-full bg-gray-700" aria-hidden="true" />
                <div className="h-[calc(100%-1rem)] min-h-0">
                  <NotificationList mobile closePanel={closePanel} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={togglePanel}
        aria-label={unreadCount > 0 ? `Open notifications, ${unreadCount} unread` : 'Open notifications'}
        aria-haspopup="dialog"
        aria-expanded={isPanelOpen}
        className="relative flex h-11 w-11 items-center justify-center border border-gray-800 bg-surface text-gray-200 transition-colors hover:border-gray-600 hover:text-white"
      >
        <motion.span
          animate={shouldShake ? { rotate: [0, -10, 8, -6, 4, 0], scale: [1, 1.08, 1] } : { rotate: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <Bell size={18} className={unreadCount > 0 ? 'text-white' : 'text-gray-300'} />
        </motion.span>

        {unreadCount > 0 && (
          <span
            className={`absolute -right-2 -top-2 inline-flex min-w-[1.6rem] items-center justify-center border px-1.5 py-0.5 text-[10px] font-bold leading-none ${badgeToneClass[badgeTone]}`}
          >
            {unreadLabel}
          </span>
        )}
      </button>

      {mounted ? createPortal(panelContent, document.body) : null}
    </div>
  );
}