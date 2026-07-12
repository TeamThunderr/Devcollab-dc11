import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Folder, Activity, Users, CreditCard, Settings, Sparkles, ChevronLeft, ChevronRight, MoreHorizontal, LogOut, User, CheckCircle, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "../../components/ui/DropdownMenu";
import { useRole } from "../../context/RBACContext";
import { useWorkspaces } from "../../hooks/useWorkspaces";
import { useProjects } from "../../hooks/useProjects";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../store/useStore";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const { role } = useRole();
  const { currentUser: user } = useAuth();
  const { activeWorkspaceId } = useStore();
  const { data: workspaces } = useWorkspaces();
  const activeWorkspaceObj = workspaces?.find(w => Number(w.id) === Number(activeWorkspaceId)) || workspaces?.[0];
  const { data: projects } = useProjects(activeWorkspaceObj?.id);

  const isAdmin = role === "ADMIN" || role === "OWNER";
  const isAtLeastMember = role !== "VIEWER";
  
  const activeWorkspace = activeWorkspaceObj?.name || "Workspace";
  const userInitials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
  const userName = user?.name || "User";

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      className="h-full flex flex-col border-r border-gray-200 dark:border-[#2C2C2C] bg-[#fbfbfa] dark:bg-[#111111] transition-colors duration-300 relative shrink-0 z-40"
    >
      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-white dark:bg-[#2C2C2C] border border-gray-200 dark:border-[#333] flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 shadow-sm z-50 transition-colors"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Workspace / Top Area */}
      <div className="pt-5 px-4 pb-4">
        <Link to="/select-workspace" className="flex items-center gap-3 mb-6 group" title="Switch Workspace">
          <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-bold text-sm shrink-0 shadow-sm border border-gray-200 dark:border-[#2C2C2C] group-hover:scale-105 transition-transform">
            DC
          </div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-lg text-gray-900 dark:text-gray-100 tracking-tight whitespace-nowrap overflow-hidden"
              >
                DevCollab
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="text-[0.65rem] font-semibold text-gray-400 mb-1 uppercase tracking-[0.12em]">
                Workspace
              </div>
              <div className="font-semibold text-[0.95rem] text-gray-900 dark:text-gray-100 tracking-tight">
                {activeWorkspace}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto mt-2 px-3 space-y-1">
        {/* Navigation */}
        <nav className="space-y-0.5">
          <NavItem icon={<Home className="w-5 h-5" />} label="Overview" to="/dashboard" isCollapsed={isCollapsed} />
          {role === "MEMBER" && (
            <NavItem icon={<CheckCircle className="w-5 h-5" />} label="My Tasks" to="/tasks" isCollapsed={isCollapsed} />
          )}
          <NavItem icon={<Folder className="w-5 h-5" />} label="Projects" to="/projects" isCollapsed={isCollapsed} />
          <NavItem icon={<Activity className="w-5 h-5" />} label="Activity" to="/activity" isCollapsed={isCollapsed} />
        </nav>

        <div className="my-4 mx-2 border-t border-gray-200 dark:border-[#2C2C2C] w-[calc(100%-16px)]"></div>

        {/* Admin */}
        <nav className="space-y-0.5">
          <NavItem icon={<Users className="w-5 h-5" />} label="Members" to="/members" isCollapsed={isCollapsed} />
          {isAdmin && (
            <>
              <NavItem icon={<CreditCard className="w-5 h-5" />} label="Billing" to="/billing" isCollapsed={isCollapsed} />
              <NavItem icon={<Settings className="w-5 h-5" />} label="Settings" to="/settings" isCollapsed={isCollapsed} />
            </>
          )}
        </nav>

        {isAtLeastMember && (
          <>
            <div className="my-4 mx-2 border-t border-gray-200 dark:border-[#2C2C2C] w-[calc(100%-16px)]"></div>

            {/* Intelligence */}
            {!isCollapsed && (
              <div className="text-[0.65rem] font-semibold text-gray-400 mb-2 px-3 uppercase tracking-[0.12em]">
                Intelligence
              </div>
            )}
            <nav className="space-y-0.5">
              <NavItem icon={<Sparkles className="w-5 h-5" />} label="AI Assistant" to="/ai" isCollapsed={isCollapsed} />
            </nav>

          </>
        )}
      </div>

      {/* User Profile */}
      <div className="p-3 border-t border-gray-200 dark:border-[#2C2C2C] mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className={`flex items-center p-2 rounded-md transition-colors cursor-pointer group ${isCollapsed ? 'justify-center' : 'justify-between'} ${
              (user as any)?.plan === "PRO" 
                ? 'ring-1 ring-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.2)] bg-gradient-to-r from-yellow-50/50 to-amber-50/50 dark:from-yellow-900/20 dark:to-amber-900/20 hover:from-yellow-100/50 hover:to-amber-100/50 dark:hover:from-yellow-900/30 dark:hover:to-amber-900/30' 
                : 'hover:bg-gray-200/50 dark:hover:bg-[#2C2C2C]/50'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 overflow-hidden ${
                  (user as any)?.plan === "PRO"
                    ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow-sm'
                    : 'bg-black dark:bg-white text-white dark:text-black'
                }`}>
                  {user?.avatarUrl ? <img src={user.avatarUrl} alt={userName} className="w-full h-full object-cover" /> : userInitials}
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium truncate leading-tight flex items-center gap-1 ${
                      (user as any)?.plan === "PRO"
                        ? 'text-amber-700 dark:text-amber-400 font-bold'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {userName}
                      {(user as any)?.plan === "PRO" && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    </span>
                    {(user as any)?.plan === "PRO" && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-500 font-bold uppercase tracking-wider leading-none mt-0.5">
                        Pro User
                      </span>
                    )}
                  </div>
                )}
              </div>
              {!isCollapsed && <MoreHorizontal className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${
                (user as any)?.plan === "PRO" ? 'text-amber-600 dark:text-amber-500' : 'text-gray-400'
              }`} />}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mb-2">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/select-workspace")}>
              <Folder className="mr-2 h-4 w-4" />
              <span>Switch Workspace</span>
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
    </motion.aside>
  );
}

function NavItem({ icon, label, to, isCollapsed }: { icon: React.ReactNode; label: string; to: string; isCollapsed: boolean }) {
  const location = useLocation();
  const active = location.pathname === to;
  
  const content = (
    <motion.div 
      className={`flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'} rounded-md cursor-pointer transition-colors duration-200 ${
        active 
          ? "text-gray-900 dark:text-gray-100 bg-transparent" 
          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2C2C2C]/50 hover:text-gray-900 dark:hover:text-gray-100"
      }`}
    >
      <div className={`flex items-center justify-center shrink-0 ${active ? "text-gray-900 dark:text-gray-100" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"}`}>
        {icon}
      </div>
      {!isCollapsed && <span className="text-[0.9rem] font-medium truncate">{label}</span>}
    </motion.div>
  );

  return (
    <Link to={to} className="block relative group" title={isCollapsed ? label : undefined}>
      {active && (
        <motion.div 
          layoutId="active-nav"
          className={`absolute ${isCollapsed ? 'left-1 top-2 bottom-2 w-1 rounded-full' : 'left-[-12px] top-[4px] bottom-[4px] w-[2px]'} bg-black dark:bg-white`}
        />
      )}
      {content}
    </Link>
  );
}
