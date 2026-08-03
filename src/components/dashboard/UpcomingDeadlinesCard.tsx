import React from 'react';
import { motion } from 'framer-motion';
import { Bell, ArrowUpRight } from 'lucide-react';
import { useSmartNotifications } from '../../context/SmartNotificationsContext';
import type { SmartNotification } from '../../utils/smartNotifications';

const accentClass: Record<SmartNotification['tone'], string> = {
  red: 'text-red-300',
  orange: 'text-orange-300',
  yellow: 'text-amber-300',
  blue: 'text-blue-300',
  purple: 'text-purple-300',
  green: 'text-emerald-300',
};

const borderClass: Record<SmartNotification['tone'], string> = {
  red: 'border-red-500/35',
  orange: 'border-orange-500/35',
  yellow: 'border-amber-500/35',
  blue: 'border-blue-500/35',
  purple: 'border-purple-500/35',
  green: 'border-emerald-500/35',
};

const formatMeta = (notification: SmartNotification): string => {
  if (notification.helperText) {
    return notification.helperText;
  }
  if (notification.body) {
    return notification.body;
  }
  return notification.sourceLabel;
};

type Props = {
  index?: number;
};

const UpcomingDeadlinesCard: React.FC<Props> = ({ index = 0 }) => {
  const { topNotifications, unreadIds, openPanel } = useSmartNotifications();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 + index * 0.05, ease: 'easeOut' }}
      className="group bg-surface border border-gray-800 hover:border-gray-600 p-6 transition-all duration-200"
    >
      <div className="mb-4 flex items-center gap-2 border-b border-gray-900 pb-3">
        <Bell size={14} className="text-gray-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-mono">
          Upcoming Deadlines
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {topNotifications.length === 0 ? (
          <p className="text-xs leading-relaxed text-gray-500 font-mono">
            No upcoming notifications. Your dashboard is calm for now.
          </p>
        ) : (
          topNotifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={openPanel}
              aria-label={`Open notifications for ${notification.headline}`}
              className={`flex items-center justify-between gap-3 border bg-black/25 px-4 py-3 text-left transition-colors hover:border-gray-600 ${borderClass[notification.tone]}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${accentClass[notification.tone]}`}>
                    {notification.tone === 'red' ? '🔴' : notification.tone === 'orange' ? '🟠' : notification.tone === 'yellow' ? '🟡' : notification.tone === 'purple' ? '🟣' : notification.tone === 'green' ? '🟢' : '🔵'}
                  </span>
                  <p className="truncate text-sm font-bold text-white">
                    {notification.courseCode ? `${notification.courseCode} ` : ''}
                    {notification.headline}
                  </p>
                </div>
                <p className="mt-1 truncate text-xs text-gray-400">{formatMeta(notification)}</p>
              </div>
              <span className={`shrink-0 text-[10px] font-bold uppercase tracking-widest ${unreadIds.has(notification.id) ? 'text-white' : 'text-gray-500'}`}>
                {unreadIds.has(notification.id) ? 'Unread' : 'Read'}
              </span>
            </button>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={openPanel}
        aria-label="View all notifications"
        className="mt-4 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gray-500 hover:text-safe transition-colors w-fit"
      >
        View all notifications <ArrowUpRight size={12} />
      </button>
    </motion.div>
  );
};

export default UpcomingDeadlinesCard;
