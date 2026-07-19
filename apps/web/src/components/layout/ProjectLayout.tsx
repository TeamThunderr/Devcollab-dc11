import { useState, useEffect } from "react";
import { Outlet, useLocation, Link, useParams, useNavigate } from "react-router-dom";
import { 
  Bell,
  Kanban,
  Activity,
  Book,
  Code2,
  FileEdit,
  Users,
  MessageSquare,
  Sparkles,
  Search,
  Home,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  LogOut,
  User,
  Settings,
  CheckCircle2,
  TerminalSquare,
  AtSign,
  Eye,
  TrendingUp,
  Award,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "../../components/ui/DropdownMenu";
import { CommandPalette } from "./CommandPalette";
import { NotificationBell } from "../notifications/NotificationBell";
import { useWorkspaces } from "../../hooks/useWorkspaces";
import { useProjects, useProjectMembers } from "../../hooks/useProjects";
import { useRole } from "../../context/RBACContext";
import { getProjectPermissions } from "../../lib/projectPermissions";
import { FloatingActionBar } from "../dashboard/FloatingActionBar";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../store/useStore";
import { useSocket } from "../../hooks/useSocket";

export function ProjectLayout() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { role } = useRole();
  // Wait for project members to load before rendering role-dependent navGroups
  const { isLoading: isProjectMembersLoading } = useProjectMembers(projectId ? Number(projectId) : undefined);
  const perms = getProjectPermissions(role);
  const { currentUser: user } = useAuth();

  const { activeWorkspaceId } = useStore();
  const { data: workspaces } = useWorkspaces();
  const activeWorkspaceObj = workspaces?.find(w => Number(w.id) === Number(activeWorkspaceId)) || workspaces?.[0];
  const workspaceId = activeWorkspaceObj?.id;
  const workspaceName = activeWorkspaceObj?.name || "Workspace";

  useSocket(projectId, workspaceId);

  const { data: projects = [] } = useProjects(workspaceId);
  // parse projectId as number if it's string from URL
  const parsedId = parseInt(projectId || "0", 10);
  const project = projects.find(p => p.id === parsedId);
  const projectName = project ? project.name : projectId || "Project";

  const profileInfo = {
    name: user?.name || "User",
    seed: user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U',
    roleName: (role === "ADMIN" || role === "OWNER") ? "Admin" : role === "VIEWER" ? "Viewer" : "Member"
  };

  const adminNavGroups = [
    {
      title: "Project Management",
      items: [
        { id: "overview", label: "Executive Overview", icon: Home, href: `/projects/${projectId}/overview` },
        { id: "board", label: "Board", icon: Kanban, href: `/projects/${projectId}/board` },
        { id: "activity", label: "Activity", icon: Activity, href: `/projects/${projectId}/activity` },
        { id: "members", label: "Members", icon: Users, href: `/projects/${projectId}/members` },
      ]
    },
    {
      title: "Knowledge & Dev",
      items: [
        { id: "wiki", label: "Wiki", icon: Book, href: `/projects/${projectId}/wiki` },
        { id: "snippets", label: "Snippets", icon: Code2, href: `/projects/${projectId}/snippets` },
        { id: "editor", label: "Editor", icon: FileEdit, href: `/projects/${projectId}/editor` },
      ]
    },
    {
      title: "Team & AI",
      items: [
        { id: "chat", label: "Chat", icon: MessageSquare, href: `/projects/${projectId}/chat` },
        { id: "ai", label: "AI Assistant", icon: Sparkles, href: `/projects/${projectId}/ai` },
      ]
    }
  ];

  const memberNavGroups = [
    {
      title: "My Work",
      items: [
        { id: "overview", label: "Overview", icon: Home, href: `/projects/${projectId}/overview` },
        { id: "tasks", label: "My Tasks", icon: CheckCircle2, href: `/projects/${projectId}/tasks` },
        { id: "workspace", label: "My Workspace", icon: TerminalSquare, href: `/projects/${projectId}/workspace` },
        { id: "collaboration", label: "Collaboration", icon: AtSign, href: `/projects/${projectId}/collaboration` },
      ]
    },
    {
      title: "Development",
      items: [
        { id: "board", label: "Board", icon: Kanban, href: `/projects/${projectId}/board` },
        { id: "wiki", label: "Documentation", icon: Book, href: `/projects/${projectId}/wiki` },
        { id: "snippets", label: "Snippets", icon: Code2, href: `/projects/${projectId}/snippets` },
        { id: "editor", label: "Editor", icon: FileEdit, href: `/projects/${projectId}/editor` },
      ]
    },
    {
      title: "Communication",
      items: [
        { id: "chat", label: "Chat", icon: MessageSquare, href: `/projects/${projectId}/chat` },
        { id: "ai", label: "AI Assistant", icon: Sparkles, href: `/projects/${projectId}/ai` },
      ]
    }
  ];

  const viewerNavGroups = [
    {
      title: "Project",
      items: [
        { id: "overview", label: "Overview", icon: Eye, href: `/projects/${projectId}/overview` },
        { id: "progress", label: "Progress", icon: TrendingUp, href: `/projects/${projectId}/progress` },
        { id: "timeline", label: "Timeline", icon: Award, href: `/projects/${projectId}/timeline` },
      ]
    },
    {
      title: "People",
      items: [
        { id: "team", label: "Team", icon: Users, href: `/projects/${projectId}/team` },
      ]
    },
    {
      title: "Knowledge",
      items: [
        { id: "wiki", label: "Documentation", icon: BookOpen, href: `/projects/${projectId}/wiki` },
      ]
    },
    {
      title: "Project Board",
      items: [
        { id: "board", label: "Board (Read Only)", icon: Kanban, href: `/projects/${projectId}/board` },
      ]
    }
  ];

  // While project member data is loading, show the most restrictive nav (viewer) to prevent Member nav flashing for Viewers
  const resolvedRole = isProjectMembersLoading ? (role === "ADMIN" || role === "OWNER" ? role : "VIEWER") : role;
  const navGroups = (resolvedRole === "ADMIN" || resolvedRole === "OWNER") ? adminNavGroups : resolvedRole === "MEMBER" ? memberNavGroups : viewerNavGroups;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCmdPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-[#191919] text-gray-900 dark:text-gray-100 font-sans selection:bg-gray-200 dark:selection:bg-gray-800 transition-colors duration-300">
      <CommandPalette isOpen={isCmdPaletteOpen} onClose={() => setIsCmdPaletteOpen(false)} />

      {/* Left Sidebar */}
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

        {/* Project Context Header */}
        <div className="pt-5 px-4 pb-4 border-b border-gray-200 dark:border-[#2C2C2C]">
          <div className="flex items-center gap-3 w-full">
            <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-bold text-sm shrink-0 shadow-sm border border-gray-200 dark:border-[#2C2C2C]">
              {projectName.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <>
                <span className="font-bold text-lg text-gray-900 dark:text-gray-100 tracking-tight truncate">{projectName}</span>
                <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#3C3C3C] flex-shrink-0">
                  Active
                </span>
              </>
            )}
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              {!isCollapsed && (
                <h4 className="text-[0.65rem] font-semibold text-gray-400 mb-2 px-3 uppercase tracking-[0.12em]">
                  {group.title}
                </h4>
              )}
              <nav className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname.includes(item.href);
                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      className="block relative group"
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="active-project-nav"
                          className={`absolute ${isCollapsed ? 'left-1 top-2 bottom-2 w-1 rounded-full' : 'left-[-12px] top-[4px] bottom-[4px] w-[2px]'} bg-black dark:bg-white`}
                        />
                      )}
                      <div
                        className={`flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'} rounded-md transition-colors duration-200 ${
                          isActive 
                            ? "text-gray-900 dark:text-gray-100 bg-gray-200/50 dark:bg-[#2C2C2C]/50" 
                            : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2C2C2C]/50 hover:text-gray-900 dark:hover:text-gray-100"
                        }`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        {!isCollapsed && <span className="text-[0.9rem] font-medium truncate">{item.label}</span>}
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* User Role & Profile */}
        <div className="p-3 border-t border-gray-200 dark:border-[#2C2C2C] mt-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className={`flex items-center p-2 rounded-md hover:bg-gray-200/50 dark:hover:bg-[#2C2C2C]/50 transition-colors cursor-pointer group ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-7 h-7 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold flex items-center justify-center shrink-0 overflow-hidden">
                    {user?.avatarUrl ? <img src={user.avatarUrl} alt={profileInfo.name} className="w-full h-full object-cover" /> : profileInfo.seed}
                  </div>
                  {!isCollapsed && (
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{profileInfo.name}</span>
                      <span className="text-[10px] text-gray-500 truncate">Role: {profileInfo.roleName}</span>
                    </div>
                  )}
                </div>
                {!isCollapsed && <MoreHorizontal className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mb-2">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              {(role === "ADMIN" || role === "OWNER") && (
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Workspace Settings</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/login")}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#191919] relative">
        {/* Top Header */}
        <header className="h-12 border-b border-gray-200 dark:border-[#2C2C2C] bg-white/80 dark:bg-[#191919]/80 backdrop-blur-md transition-colors duration-300 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center text-[14px]">
            <Link to="/projects" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors">{workspaceName}</Link>
            <span className="mx-2 text-gray-300 dark:text-gray-700">/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">{projectName}</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsCmdPaletteOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium text-gray-400 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#191919] shadow-sm rounded-md transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              title="Command Palette"
            >
              <Search className="w-3 h-3" />
              <kbd className="font-sans">⌘K</kbd>
            </button>

            <NotificationBell />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white dark:bg-[#191919]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="h-full w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating Dock Action Bar */}
        <FloatingActionBar />
      </main>
    </div>
  );
}
