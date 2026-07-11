import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Command, User, Settings, LogOut, Crown } from "lucide-react";
import { ThemeToggle } from "../common/ThemeToggle";
import { Tooltip } from "../ui/Tooltip";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "../ui/DropdownMenu";
import { useStore } from "../../store/useStore";

import { useAuth } from "../../context/AuthContext";
import { useWorkspaces } from "../../hooks/useWorkspaces";
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from "../../hooks/useActivity";

export function Header({ title = "Overview" }: { title?: string }) {
  const navigate = useNavigate();
  const { currentUser: user } = useAuth();
  const { activeWorkspaceId } = useStore();
  const { data: workspaces } = useWorkspaces();
  const activeWorkspaceObj = workspaces?.find(w => Number(w.id) === Number(activeWorkspaceId)) || workspaces?.[0];
  const activeWorkspace = activeWorkspaceObj?.name || "Workspace";
  const userInitials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

  const { data: notificationsData = [] } = useNotifications();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const markReadMutation = useMarkNotificationRead();
  const unreadCount = notificationsData.filter((n: any) => !n.isRead).length;

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const handleNotificationClick = (id: number) => {
    markReadMutation.mutate(id);
  };

  return (
    <header className="h-12 flex items-center justify-between px-8 border-b border-gray-200 dark:border-[#2C2C2C] bg-white/80 dark:bg-[#191919]/80 backdrop-blur-md transition-colors duration-300">
      {/* Breadcrumbs */}
      <div className="flex items-center text-[14px]">
        <span 
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors"
        >
          {activeWorkspace}
        </span>
        <span className="mx-2 text-gray-300 dark:text-gray-700">/</span>
        <span className="text-gray-900 dark:text-gray-100 font-medium">{title}</span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-8 relative">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            className="w-full bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm rounded-full pl-9 pr-12 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-white focus:border-gray-300 dark:focus:border-white transition-all placeholder:text-gray-400"
            placeholder="Search or jump to..."
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-[10px] font-medium text-gray-400 flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#191919] shadow-sm">
              <Command className="w-3 h-3" /> K
            </span>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <Tooltip content="Toggle Theme" side="bottom">
          <div className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors cursor-pointer flex items-center justify-center">
            <ThemeToggle />
          </div>
        </Tooltip>

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
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div className="flex gap-3 w-full">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 font-bold text-xs">
                      {notification.type === 'MENTION' ? '@' : notification.type === 'ASSIGNMENT' ? '✓' : 'ℹ'}
                    </div>
                    <div className="flex flex-col gap-1 w-full min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-sm text-gray-900 dark:text-gray-100 leading-snug ${notification.isRead ? '' : 'font-medium'}`}>
                          {notification.message}
                        </span>
                        {!notification.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1"></div>}
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`ml-2 relative w-7 h-7 rounded-full flex items-center justify-center transition-all focus:outline-none overflow-visible ${
              (user as any)?.plan === "PRO" 
                ? 'ring-2 ring-yellow-400 bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-80'
            }`}>
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center text-xs font-bold">
                {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" /> : userInitials}
              </div>
              {(user as any)?.plan === "PRO" && (
                <div className="absolute -top-1.5 -right-1.5 bg-white dark:bg-[#191919] rounded-full p-0.5 shadow-sm">
                  <Crown className="w-3 h-3 text-amber-500" />
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/login")}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
