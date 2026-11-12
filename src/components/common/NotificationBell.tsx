import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, AlertTriangle, FileText, Award, AlertCircle, Info, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from '../../utils/api';
import type { NotificationItem } from '../../types';

interface NotificationBellProps {
  className?: string;
  onSelectApplicationRef?: (refNo: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  className = '',
  onSelectApplicationRef,
}) => {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load notifications for current user role and college/studentNumber
  const loadNotifications = async () => {
    // If no JWT token exists (logged-out/guest view), skip request and set empty list
    const token = typeof window !== 'undefined' ? localStorage.getItem('earist_sfao_jwt') : null;
    if (!token) {
      setNotifications([]);
      return;
    }

    try {
      setIsLoading(true);
      const role = currentUser.role;
      const college = currentUser.college;
      const studentNumber = currentUser.studentId;
      const data = await fetchNotificationsApi({ role, college, studentNumber });
      setNotifications(data);
    } catch (err) {
      console.warn('Failed to load notifications in bell:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // 30s background poll
    return () => clearInterval(interval);
  }, [currentUser.role, currentUser.college, currentUser.studentId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await markNotificationReadApi(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id || n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.warn('Could not mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsReadApi({
        role: currentUser.role,
        college: currentUser.college,
        studentNumber: currentUser.studentId,
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.warn('Could not mark all read:', err);
    }
  };

  const handleItemClick = (notif: NotificationItem) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id || notif._id || '');
    }
    if (notif.targetRefNo && onSelectApplicationRef) {
      onSelectApplicationRef(notif.targetRefNo);
      setIsOpen(false);
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'submission':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'endorsement':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'flagged':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'approval':
        return <Award className="w-4 h-4 text-emerald-700" />;
      case 'quota':
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      default:
        return <Info className="w-4 h-4 text-neutral-600" />;
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const diffMs = Date.now() - new Date(iso).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer border border-neutral-200 bg-white shadow-2xs"
        aria-label="View notifications"
        title="Institutional Notification Center"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-maroon-primary text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center border-2 border-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-neutral-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
          {/* Header */}
          <div className="p-3.5 px-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-900 font-sans">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-maroon-primary text-white px-1.5 py-0.2 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-maroon-primary hover:text-maroon-hover hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
            {isLoading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500 font-medium">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500">
                <Bell className="w-6 h-6 mx-auto mb-2 text-neutral-300" />
                <span>No notifications found. All tasks are up to date.</span>
              </div>
            ) : (
              notifications.map((notif) => {
                const id = notif.id || notif._id || '';
                return (
                  <div
                    key={id}
                    onClick={() => handleItemClick(notif)}
                    className={`p-3.5 hover:bg-neutral-50 transition-colors flex items-start gap-3 cursor-pointer ${
                      !notif.isRead ? 'bg-maroon-subtle/50' : 'bg-white'
                    }`}
                  >
                    <div className="mt-0.5 p-1.5 rounded-lg bg-neutral-100 flex-shrink-0">
                      {renderIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-neutral-900 truncate block">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono whitespace-nowrap">
                          {formatTimestamp(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-600 mt-0.5 leading-snug line-clamp-2">
                        {notif.message}
                      </p>

                      <div className="mt-1 flex items-center justify-between gap-2">
                        {notif.targetRefNo ? (
                          <span className="text-[10px] font-mono font-bold text-maroon-primary bg-maroon-subtle px-1.5 py-0.2 rounded border border-red-200">
                            {notif.targetRefNo}
                          </span>
                        ) : (
                          <span />
                        )}

                        {!notif.isRead && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(id, e)}
                            className="text-[10px] text-neutral-400 hover:text-neutral-700 font-medium hover:underline"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 px-4 bg-neutral-50 border-t border-neutral-200 text-center text-[10px] text-neutral-500">
            SFAO Real-time Notification System • R.A. 10173 Compliant
          </div>
        </div>
      )}
    </div>
  );
};
