import React from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "../ui/DropdownMenu";
import { Tooltip } from "../ui/Tooltip";
import { useStore } from "../../store/useStore";
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from "../../hooks/useActivity";

export function NotificationBell() {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useStore();
  
  const { data: notificationsData = [] } = useNotifications(activeWorkspaceId ? Number(activeWorkspaceId) : undefined);
  const markAllReadMutation = useMarkAllNotificationsRead(activeWorkspaceId ? Number(activeWorkspaceId) : undefined);
  const markReadMutation = useMarkNotificationRead(activeWorkspaceId ? Number(activeWorkspaceId) : undefined);
  const unreadCount = notificationsData.filter((n: any) => !n.isRead && !n.read).length;

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead && !notification.read) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <DropdownMenu>
      <Tooltip content="Notifications" side="bottom">
        <DropdownMenuTrigger asChild>
          <button className="relative p-1.5 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center focus:outline-none">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-black"></span>}
          </button>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notificationsData.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">No notifications</div>
        ) : (
          notificationsData.map((notification: any) => (
            <DropdownMenuItem 
              key={notification.id} 
              className="py-3 cursor-pointer"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex gap-3 w-full">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 font-bold text-xs">
                  {notification.type === 'mention' || notification.type === 'MENTION' ? '@' : notification.type === 'task_assigned' || notification.type === 'ASSIGNMENT' ? '✓' : 'ℹ'}
                </div>
                <div className="flex flex-col gap-1 w-full min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm text-gray-900 dark:text-gray-100 leading-snug ${notification.isRead || notification.read ? '' : 'font-medium'}`}>
                      {notification.message}
                    </span>
                    {!notification.isRead && !notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1"></div>}
                  </div>
                  <span className="text-xs text-gray-500">{new Date(notification.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        {unreadCount > 0 && (
          <DropdownMenuItem onClick={handleMarkAllRead} className="justify-center text-xs font-medium text-indigo-500 py-3 cursor-pointer">
            Mark all as read
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
