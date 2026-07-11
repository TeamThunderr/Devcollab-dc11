import React from "react";
import { Check, CheckCircle2, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications, useMarkAllNotificationsRead } from "../../hooks/useActivity";
import { useRole } from "../../context/RBACContext";

export function RecentNotifications({ projectId }: { projectId?: string }) {
  const { role, currentUserId } = useRole();

  const navigate = useNavigate();

  const { data: notifications = [] } = useNotifications();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const markAllNotificationsRead = () => {
    markAllReadMutation.mutate();
  };

  const filteredNotifs = React.useMemo(() => {
    return notifications; // Link doesn't exist on API model yet
  }, [notifications, projectId]);

  const sortedNotifs = [...filteredNotifs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);


  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Notifications
          </h3>
          {filteredNotifs.filter(n => !n.isRead).length > 0 && (
            <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
              {filteredNotifs.filter(n => !n.isRead).length}
            </span>
          )}
        </div>
        {notifications.some(n => !n.isRead) && (

          <button 
            onClick={markAllNotificationsRead}
            className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1.5 font-medium"
          >
            <Check className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800/80 rounded-xl overflow-hidden flex flex-col shadow-sm">
        {sortedNotifs.length > 0 ? (
          <div className="flex-1 overflow-y-auto">
            {sortedNotifs.map((notif) => (
              <div 
                key={notif.id}
                className={`p-3 flex items-start gap-3 border-b border-gray-100 dark:border-[#2C2C2C] last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2C2C2C]/50 transition-colors ${!notif.isRead ? 'border-l-2 border-l-black dark:border-l-white bg-gray-50 dark:bg-white/5' : 'border-l-2 border-l-transparent'}`}
              >
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent('Notification')}&background=random`} alt="Avatar" className="w-7 h-7 rounded-full shrink-0 border border-gray-200 dark:border-gray-800" />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className={`text-sm ${!notif.isRead ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-300'} truncate`}>
                    {notif.message}
                  </p>
                  <span className="text-xs text-gray-500">{new Date(notif.createdAt).toLocaleDateString()}</span>

                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 dark:bg-transparent">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800/50 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-green-500/70" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">You're all caught up!</p>
            <p className="text-xs text-gray-500 mt-1">No new notifications to show.</p>
          </div>
        )}
        
        {filteredNotifs.length > 5 && (
          <div className="p-3 border-t border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-[#111]">
            <button className="w-full text-center text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors py-1">
              View all notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
