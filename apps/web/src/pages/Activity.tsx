import React, { useState, useEffect, useRef, useMemo } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { 
  Activity as ActivityIcon, 
  ChevronDown, 
  ArrowUp,
  MessageSquare,
  CheckCircle2,
  FileEdit,
  UserPlus,
  RefreshCw,
  MoreHorizontal,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  BarChart2,
  Clock,
  Folder,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../components/ui/DropdownMenu";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWorkspaces, useWorkspaceMembers } from "../hooks/useWorkspaces";
import { useProjects } from "../hooks/useProjects";
import { useWorkspaceActivity, useProjectActivity } from "../hooks/useActivity";
import { useRole } from "../context/RBACContext";
import { useStore } from "../store/useStore";
import { toast } from "sonner";
import { TaskModal } from "../components/dashboard/TaskModal";

export function Activity() {
  const { projectId } = useParams();
  const parsedId = parseInt(projectId || "0", 10);
  const navigate = useNavigate();
  
  const { currentUser: profile } = useAuth();
  const { role, currentUserId } = useRole();
  
  const { activeWorkspaceId } = useStore();
  const { data: workspaces } = useWorkspaces();
  const activeWorkspaceObj = workspaces?.find(w => Number(w.id) === Number(activeWorkspaceId)) || workspaces?.[0];
  const workspace = activeWorkspaceObj || { id: 0, name: 'Workspace', slug: 'workspace' };
  const workspaceId = workspace.id;

  const { data: projects = [] } = useProjects(workspaceId);
  const { data: workspaceActivity = [] } = useWorkspaceActivity(workspaceId);
  const { data: projectActivity = [] } = useProjectActivity(parsedId);
  
  const storeActivities = useStore(state => state.activities);
  const storeMembers = useStore(state => state.members);
  const storeTasks = useStore(state => state.tasks);
  const triggerProjectTransition = useStore(state => state.triggerProjectTransition);
  
  const { data: wsMembers = [] } = useWorkspaceMembers(workspaceId);
  
  // Resolve all members to properly show names
  const allMembers = useMemo(() => {
    const list = [...wsMembers, ...storeMembers];
    if (profile) {
      list.push({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        avatarUrl: profile.avatarUrl || 'https://i.pravatar.cc/150',
        role: 'Owner'
      });
    }
    const seen = new Set();
    return list.filter(m => {
      const sId = String(m.id);
      if (seen.has(sId)) return false;
      seen.add(sId);
      return true;
    });
  }, [wsMembers, storeMembers, profile]);

  const [selectedTaskForModal, setSelectedTaskForModal] = useState<any>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const handleTaskClick = (taskTitle: string) => {
    const foundTask = storeTasks.find(
      (t) => t.title.toLowerCase() === taskTitle.toLowerCase()
    );
    if (foundTask) {
      setSelectedTaskForModal(foundTask);
      setIsTaskModalOpen(true);
    } else {
      // Create a dummy task with just title to show detail modal cleanly
      setSelectedTaskForModal({ title: taskTitle, projectId: projectId || projects[0]?.id || 'p1', description: "Log detail reference" });
      setIsTaskModalOpen(true);
    }
  };

  const renderActionText = (actionText: string) => {
    const parts = actionText.split(/(".*?")/g);
    return parts.map((part, idx) => {
      if (part.startsWith('"') && part.endsWith('"')) {
        const taskTitle = part.slice(1, -1);
        return (
          <button
            key={idx}
            type="button"
            onClick={() => handleTaskClick(taskTitle)}
            className="font-bold text-gray-900 dark:text-white underline decoration-gray-400 hover:decoration-gray-900 dark:hover:decoration-white hover:text-black dark:hover:text-white transition-colors inline-block"
          >
            "{taskTitle}"
          </button>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const [projectFilter, setProjectFilter] = useState<string | number>('All Projects');
  const [dateFilter, setDateFilter] = useState<string>('All Time');
  const [customDate, setCustomDate] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string | null>(null);
  const [showScrollPill, setShowScrollPill] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedAuditId, setExpandedAuditId] = useState<string | number | null>(null);

  const [searchParams] = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchParams.get("focusSearch") === "true") {
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [searchParams]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop < 50) {
      setShowScrollPill(false);
      setNewCount(0);
    }
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setShowScrollPill(false);
    setNewCount(0);
  };

  const mergedActivities = projectId 
    ? [...projectActivity, ...storeActivities.filter(a => String(a.projectId) === String(projectId) || String(a.projectId) === 'p1')]
    : [...workspaceActivity, ...storeActivities];

  // Deduplicate by ID and sort descending
  const activities = useMemo(() => {
    const deduped = Array.from(new Map(mergedActivities.map(item => [item.id, item])).values());
    return deduped.sort((a, b) => new Date(b.createdAt || b.timestamp || 0).getTime() - new Date(a.createdAt || a.timestamp || 0).getTime());
  }, [mergedActivities]);

  // Generate 14-day heatmap pulse data
  const heatmapDays = useMemo(() => {
    const days: { dateStr: string; label: string; count: number; dateObj: Date }[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      days.push({ dateStr, label, count: 0, dateObj: d });
    }
    
    activities.forEach(act => {
      const actDateStr = new Date(act.createdAt || act.timestamp || Date.now()).toISOString().slice(0, 10);
      const dayEntry = days.find(d => d.dateStr === actDateStr);
      if (dayEntry) dayEntry.count++;
    });
    return days;
  }, [activities]);

  const maxDailyCount = useMemo(() => {
    return Math.max(1, ...heatmapDays.map(d => d.count));
  }, [heatmapDays]);

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      // Role-based filtering: Members only see their own activities
      if (role === 'MEMBER' && act.userId?.toString() !== currentUserId?.toString()) return false;
      
      // Project filtering
      if (projectId && act.projectId?.toString() !== projectId.toString() && act.projectId !== 'p1') return false;
      if (!projectId && projectFilter !== 'All Projects' && act.projectId?.toString() !== projectFilter.toString()) return false;

      // Action type filtering
      const actionText = (act.actionType || act.action || '').toLowerCase();
      if (actionFilter === 'creations' && !actionText.includes('creat') && !actionText.includes('add') && !actionText.includes('assign')) return false;
      if (actionFilter === 'updates' && !actionText.includes('updat') && !actionText.includes('edit') && !actionText.includes('modif')) return false;
      if (actionFilter === 'comments' && !actionText.includes('comment') && !actionText.includes('message')) return false;
      if (actionFilter === 'completions' && !actionText.includes('complet') && !actionText.includes('done') && !actionText.includes('finish')) return false;

      // Search query filtering
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const member = allMembers.find(m => String(m.id) === String(act.userId));
        const project = projects.find(p => p.id === act.projectId || String(p.id) === String(act.projectId));
        const memberName = (member?.name || 'Someone').toLowerCase();
        const projName = (project?.name || '').toLowerCase();
        if (!actionText.includes(q) && !memberName.includes(q) && !projName.includes(q)) return false;
      }

      // Heatmap day filtering
      if (selectedDayFilter) {
        const actDateStr = new Date(act.createdAt || act.timestamp || Date.now()).toISOString().slice(0, 10);
        if (actDateStr !== selectedDayFilter) return false;
      }

      // Date filtering
      if (dateFilter !== 'All Time') {
        const actDate = new Date(act.createdAt || act.timestamp || Date.now());
        const now = new Date();
        
        if (dateFilter === 'Today') {
          if (actDate.toDateString() !== now.toDateString()) return false;
        } else if (dateFilter === 'Yesterday') {
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          if (actDate.toDateString() !== yesterday.toDateString()) return false;
        } else if (dateFilter === 'Custom Date' && customDate) {
          const actYear = actDate.getFullYear();
          const actMonth = String(actDate.getMonth() + 1).padStart(2, '0');
          const actDay = String(actDate.getDate()).padStart(2, '0');
          const actDateString = `${actYear}-${actMonth}-${actDay}`;
          
          if (actDateString !== customDate) return false;
        }
      }
      
      return true;
    });
  }, [activities, role, currentUserId, projectId, projectFilter, actionFilter, searchQuery, selectedDayFilter, dateFilter, customDate, allMembers, projects]);

  // Group by date
  const groupedActivities = useMemo(() => {
    const groups: Record<string, any[]> = {
      'Today': [],
      'Yesterday': [],
      'Earlier This Week': [],
      'Older': []
    };

    const now = new Date();
    filteredActivities.forEach(act => {
      const date = new Date(act.createdAt || act.timestamp || Date.now());
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0 && now.getDate() === date.getDate()) {
        groups['Today']?.push(act);
      } else if (diffDays === 1 || (diffDays === 0 && now.getDate() !== date.getDate())) {
        groups['Yesterday']?.push(act);
      } else if (diffDays <= 7) {
        groups['Earlier This Week']?.push(act);
      } else {
        groups['Older']?.push(act);
      }
    });
    return groups;
  }, [filteredActivities]);

  // Executive summary metrics
  const todayCount = groupedActivities['Today']?.length || 0;
  const activeProjectCount = useMemo(() => {
    const pIds = new Set(activities.map(a => a.projectId).filter(Boolean));
    return pIds.size;
  }, [activities]);

  const latestActionTime = useMemo(() => {
    const firstAct = activities[0];
    if (!firstAct) return "No activity";
    const last = new Date(firstAct.createdAt || firstAct.timestamp || Date.now());
    const diffMins = Math.floor((Date.now() - last.getTime()) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }, [activities]);

  const getActionIcon = (actionText: string) => {
    const text = (actionText || '').toLowerCase();
    if (text.includes("comment") || text.includes("message")) return <MessageSquare className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />;
    if (text.includes("complet") || text.includes("done") || text.includes("finish")) return <CheckCircle2 className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />;
    if (text.includes("updat") || text.includes("edit") || text.includes("modif")) return <FileEdit className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />;
    if (text.includes("assign") || text.includes("creat") || text.includes("add")) return <UserPlus className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />;
    return <RefreshCw className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />;
  };

  const getActionBadgeText = (actionText: string) => {
    const text = (actionText || '').toLowerCase();
    if (text.includes("comment") || text.includes("message")) return "COMMENTED";
    if (text.includes("complet") || text.includes("done")) return "COMPLETED";
    if (text.includes("updat") || text.includes("edit")) return "UPDATED";
    if (text.includes("creat") || text.includes("add")) return "CREATED";
    if (text.includes("assign")) return "ASSIGNED";
    return "LOGGED";
  };

  const getModuleFromAction = (actionText: string) => {
    const text = (actionText || '').toLowerCase();
    if (text.includes("task") || text.includes("board") || text.includes("assign")) return "Task Board";
    if (text.includes("snippet") || text.includes("code") || text.includes("file") || text.includes("editor")) return "IDE Workspace";
    if (text.includes("doc") || text.includes("wiki")) return "Documentation";
    if (text.includes("member") || text.includes("team") || text.includes("join")) return "Team RBAC";
    if (text.includes("project") || text.includes("workspace")) return "Workspace Core";
    return "General System";
  };

  const handleCopyDetails = (act: any, memberName: string) => {
    const text = `[${new Date(act.createdAt || act.timestamp || Date.now()).toLocaleString()}] ${memberName}: ${act.actionType || act.action}`;
    navigator.clipboard.writeText(text);
    setCopiedId(act.id);
    toast.success("Activity details copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const content = (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex flex-col pb-16 relative bg-transparent"
    >
      {/* Scroll Pill */}
      <AnimatePresence>
        {showScrollPill && (
          <motion.div
            initial={{ y: -50, opacity: 0, x: "-50%" }}
            animate={{ y: 0, opacity: 1, x: "-50%" }}
            exit={{ y: -50, opacity: 0, x: "-50%" }}
            className="fixed top-24 left-1/2 z-50"
          >
            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-xs font-bold shadow-xl border border-gray-300 dark:border-gray-700 hover:scale-105 transition-transform"
            >
              <ArrowUp className="w-3 h-3" />
              {newCount} New Activity
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl w-full mx-auto space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 dark:border-[#2C2C2C] pb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] text-xs font-medium text-gray-700 dark:text-gray-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Executive Intelligence & Audit Log</span>
            </div>
            <h1 className="text-[2.25rem] font-bold tracking-tight text-gray-900 dark:text-gray-100 leading-tight flex items-center gap-3">
              <ActivityIcon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
              {role === 'MEMBER' ? 'My Activity Pulse' : 'Activity Command Center'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-2xl">
              {role === 'MEMBER' 
                ? 'An interactive chronological feed of your contributions, edits, and collaborations.' 
                : `Real-time activity pulse and historical audit feed across ${projectId ? 'this project' : workspace.name}.`}
            </p>
          </div>

          {/* Quick Stats Pill & Project Filter */}
          <div className="flex flex-col items-end gap-3">
            {!projectId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-between min-w-[140px] gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2C2C2C] bg-white dark:bg-[#141414] text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#191919] transition-colors shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{projectFilter === 'All Projects' ? 'All Projects' : projects.find(p => p.id === projectFilter)?.name || 'Project'}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setProjectFilter('All Projects')}>All Projects</DropdownMenuItem>
                  {projects.map(p => (
                    <DropdownMenuItem key={p.id} onClick={() => setProjectFilter(p.id)}>{p.name}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <div className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2C2C2C] text-right min-w-[140px]">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Recorded</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white font-mono">{activities.length}</div>
            </div>
          </div>
        </div>

        {/* Executive Summary Metrics Grid (Monochrome) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2C2C2C] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
              <span>Total Events</span>
              <BarChart2 className="w-4 h-4 text-gray-400" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{activities.length}</span>
              <span className="text-xs text-gray-500 font-medium">100% logged</span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2C2C2C] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
              <span>Today's Intensity</span>
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{todayCount}</span>
              <span className="text-xs text-gray-500 font-medium">last 24 hours</span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2C2C2C] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
              <span>Active Projects</span>
              <Folder className="w-4 h-4 text-gray-400" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{activeProjectCount}</span>
              <span className="text-xs text-gray-500 font-medium">workspaces impacted</span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2C2C2C] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
              <span>Latest Pulse</span>
              <Clock className="w-4 h-4 text-gray-400" />
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-xl font-bold text-gray-900 dark:text-white font-mono truncate">{latestActionTime}</span>
              <span className="text-xs text-gray-500 font-medium">live status</span>
            </div>
          </div>
        </div>

        {/* Interactive 14-Day Heatmap Pulse Strip */}
        <div className="p-6 rounded-xl bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2C2C2C] shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">14-Day Activity Heatmap</h3>
              <span className="text-xs text-gray-500">(Click any day to filter timeline)</span>
            </div>
            {selectedDayFilter && (
              <button
                onClick={() => setSelectedDayFilter(null)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-[#222] text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
              >
                <span>Filtering: {selectedDayFilter}</span>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-2">
            {heatmapDays.map((day) => {
              const intensity = day.count === 0 ? 0 : Math.max(0.2, day.count / maxDailyCount);
              const isSelected = selectedDayFilter === day.dateStr;

              return (
                <button
                  key={day.dateStr}
                  onClick={() => setSelectedDayFilter(isSelected ? null : day.dateStr)}
                  title={`${day.label}: ${day.count} event(s)`}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all duration-200 ${
                    isSelected
                      ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white scale-105 shadow-md"
                      : "bg-gray-50 dark:bg-[#191919] border-gray-100 dark:border-[#262626] hover:border-gray-300 dark:hover:border-[#444]"
                  }`}
                >
                  <div className="h-8 w-full flex items-end justify-center px-0.5">
                    <div
                      style={{ height: `${Math.max(10, intensity * 100)}%` }}
                      className={`w-full rounded-sm transition-all duration-300 ${
                        isSelected
                          ? "bg-white dark:bg-black"
                          : day.count > 0
                          ? "bg-gray-800 dark:bg-gray-200"
                          : "bg-gray-200 dark:bg-[#2C2C2C]"
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-medium opacity-80">{day.label}</span>
                  <span className="text-[9px] font-bold">{day.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2C2C2C] shadow-sm">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by action, member, project, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 rounded-lg bg-gray-50 dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors font-medium"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Chips & Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-[#191919] p-1 rounded-lg border border-gray-200 dark:border-[#2C2C2C]">
              {[
                { id: 'all', label: 'All' },
                { id: 'creations', label: 'Created' },
                { id: 'updates', label: 'Updated' },
                { id: 'comments', label: 'Comments' },
                { id: 'completions', label: 'Done' },
              ].map(chip => (
                <button
                  key={chip.id}
                  onClick={() => setActionFilter(chip.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    actionFilter === chip.id
                      ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>



            {/* Date Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2C2C2C] bg-white dark:bg-[#191919] text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors shadow-sm shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>{dateFilter === 'Custom Date' && customDate ? customDate : dateFilter}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => { setDateFilter('All Time'); setCustomDate(''); }}>All Time</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setDateFilter('Today'); setCustomDate(''); }}>Today</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setDateFilter('Yesterday'); setCustomDate(''); }}>Yesterday</DropdownMenuItem>
                <DropdownMenuItem className="p-0 focus:bg-transparent" onSelect={(e) => e.preventDefault()}>
                  <label className="flex items-center w-full px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-[#2C2C2C]/50 cursor-pointer">
                    <span className="mr-2 text-gray-600 dark:text-gray-300">Custom:</span>
                    <input 
                      type="date" 
                      className="bg-transparent border border-gray-200 dark:border-[#2C2C2C] text-xs outline-none rounded px-1 py-0.5 w-full dark:text-white"
                      value={customDate}
                      onChange={(e) => {
                        setCustomDate(e.target.value);
                        setDateFilter('Custom Date');
                      }}
                    />
                  </label>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Timeline List (Redesigned with Zero Overlap) */}
        <div className="relative pt-2">
          {/* Continuous Vertical Timeline Line (positioned at left 104px on desktop) */}
          <div className="absolute left-[103px] top-6 bottom-6 w-[2px] bg-gray-200 dark:bg-[#2C2C2C] z-0 hidden sm:block" />

          {Object.entries(groupedActivities).map(([group, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={group} className="relative z-10 mb-10">
                {/* Date separator header */}
                <div className="flex items-center gap-4 py-2 mb-4">
                  <div className="w-[104px] hidden sm:flex justify-end pr-6">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest font-mono">
                      {group}
                    </span>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-500 ring-4 ring-white dark:ring-[#09090b] z-10 hidden sm:block -ml-[5px]" />
                  <span className="sm:hidden text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest bg-white dark:bg-[#141414] py-1 px-3 rounded-md border border-gray-200 dark:border-[#2C2C2C] shadow-sm">
                    {group}
                  </span>
                  <div className="flex-1 h-[1px] bg-gray-200 dark:bg-[#262626] sm:hidden" />
                </div>

                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {items.map(act => {
                      const member: any = allMembers.find(m => String(m.id) === String(act.userId)) || 
                                     (String(act.userId) === 'm1' ? { name: 'Sanjay Balan', avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=SANJAY' } : null) ||
                                     (String(act.userId) === 'm2' ? { name: 'Alice Smith', avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alice' } : null) ||
                                     (String(act.userId) === 'm3' ? { name: 'Bob Johnson', avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Bob' } : null) ||
                                     (String(act.userId) === 'US' || String(act.userId) === 'u1' || String(act.userId) === 'owner' ? (profile || { name: 'libin (OWNER)', avatarUrl: (profile as any)?.avatarUrl }) : null);
                      const resolvedName = member?.name || act.userName || (String(act.userId) === 'US' ? (profile?.name || 'libin (OWNER)') : 'libin (OWNER)');
                      const project = projects.find(p => p.id === act.projectId || String(p.id) === String(act.projectId));
                      const isNew = new Date().getTime() - new Date(act.createdAt || act.timestamp || Date.now()).getTime() < 5000;
                      const actionText = act.actionType || act.action || 'performed an action';
                      const actDate = new Date(act.createdAt || act.timestamp || Date.now());
                      const timeString = actDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const isCurrentProject = project && (String(projectId) === String(project.id) || (projectId === undefined && String(project.id) === 'p1'));

                      return (
                        <motion.div
                          key={act.id}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="relative flex flex-col sm:flex-row sm:items-center group gap-2 sm:gap-0"
                        >
                          {/* Left Timestamp Column */}
                          <div className="w-[104px] hidden sm:flex justify-end pr-6 shrink-0">
                            <span className="text-xs font-mono text-gray-400 dark:text-gray-500 font-medium">
                              {timeString}
                            </span>
                          </div>

                          {/* Center Node Icon (Monochrome Neutral Grayscale!) */}
                          <div className="w-8 h-8 rounded-full bg-white dark:bg-[#191919] border border-gray-300 dark:border-[#3a3a3a] flex items-center justify-center shadow-sm z-10 shrink-0 hidden sm:flex -ml-4 group-hover:border-gray-500 dark:group-hover:border-gray-300 transition-colors">
                            {getActionIcon(actionText)}
                          </div>

                          {/* Right Activity Card (Clean margin to prevent any overlap!) */}
                          <div className="flex-1 sm:ml-6 bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#262626] p-4 rounded-xl shadow-sm hover:border-gray-300 dark:hover:border-[#3c3c3c] hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                                <img
                                  src={member?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(resolvedName)}&background=random`}
                                  alt="Avatar"
                                  className="w-8 h-8 rounded-full border border-gray-200 dark:border-[#333333] shrink-0"
                                />
                                
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                      {resolvedName}
                                    </span>
                                    
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider font-mono bg-gray-100 dark:bg-[#222] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#333]">
                                      {getActionBadgeText(actionText)}
                                    </span>

                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-50 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#333]">
                                      {getModuleFromAction(actionText)}
                                    </span>

                                    {isNew && (
                                      <span className="bg-black text-white dark:bg-white dark:text-black text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm animate-pulse">
                                        New
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                                    {renderActionText(actionText)}
                                    {project && (
                                      <span>
                                        {" "}in project{" "}
                                        {isCurrentProject ? (
                                          <span className="font-bold text-gray-900 dark:text-white">
                                            {project.name}
                                          </span>
                                        ) : (
                                          <button
                                            onClick={() => triggerProjectTransition({ id: project.id, name: project.name })}
                                            className="font-bold text-gray-900 dark:text-white underline decoration-gray-300 dark:decoration-gray-600 underline-offset-4 hover:decoration-gray-900 dark:hover:decoration-white transition-colors inline-flex items-center gap-1"
                                          >
                                            <span>{project.name}</span>
                                          </button>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Card Actions / Quick Navigation */}
                              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                <span className="sm:hidden text-[10px] font-mono text-gray-400 mr-1">
                                  {timeString}
                                </span>

                                <button
                                  onClick={() => setExpandedAuditId(expandedAuditId === act.id ? null : act.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#333] text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                                  title="Toggle Audit Metadata & Detailing"
                                >
                                  <span>Audit Spec</span>
                                  <ChevronDown className={`w-3 h-3 transition-transform ${expandedAuditId === act.id ? 'rotate-180' : ''}`} />
                                </button>

                                {project && !isCurrentProject && (
                                  <button
                                    onClick={() => triggerProjectTransition({ id: project.id, name: project.name })}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#333] text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                                    title={`Open project ${project.name}`}
                                  >
                                    <span>Open</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}

                                <button
                                  onClick={() => handleCopyDetails(act, resolvedName)}
                                  className="p-1.5 rounded-lg bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#333] text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                                  title="Copy log details"
                                >
                                  {copiedId === act.id ? <Check className="w-3.5 h-3.5 text-gray-900 dark:text-white" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            {/* Expandable Audit Log Detail Panel */}
                            <AnimatePresence>
                              {expandedAuditId === act.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.25 }}
                                  className="overflow-hidden border-t border-gray-200 dark:border-[#262626] pt-3 mt-1"
                                >
                                  <div className="p-3.5 rounded-lg bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#222] font-mono text-[11px] space-y-2.5">
                                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#222] pb-2 text-gray-500">
                                      <span className="font-bold text-gray-800 dark:text-gray-200">AUDIT REF: #LOG-{act.id}</span>
                                      <span className="uppercase tracking-wider">STATUS: 200 OK / VERIFIED</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-gray-600 dark:text-gray-400">
                                      <div><span className="text-gray-400 dark:text-gray-500">Scope:</span> {project ? `Project (${project.name})` : 'Workspace Core'}</div>
                                      <div><span className="text-gray-400 dark:text-gray-500">Target Module:</span> {getModuleFromAction(actionText)}</div>
                                      <div><span className="text-gray-400 dark:text-gray-500">Initiator Role:</span> {member?.role || 'Admin'}</div>
                                    </div>
                                    <div className="bg-white dark:bg-[#141414] p-2 rounded border border-gray-200 dark:border-[#262626] text-gray-700 dark:text-gray-300 overflow-x-auto">
                                      <code>
                                        {JSON.stringify({
                                          event_id: act.id,
                                          timestamp_utc: actDate.toISOString(),
                                          local_time: actDate.toLocaleString(),
                                          actor_id: act.userId,
                                          action_payload: actionText,
                                          project_context: project ? { id: project.id, name: project.name } : null,
                                          session_integrity: "VALIDATED_HMAC"
                                        }, null, 2)}
                                      </code>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}

          {/* End of Feed Node */}
          {filteredActivities.length > 0 ? (
            <div className="relative flex items-center py-6 z-10">
              <div className="w-[104px] hidden sm:block" />
              <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 ring-4 ring-white dark:ring-[#09090b] z-10 hidden sm:block -ml-[5px]" />
              <p className="sm:ml-6 text-xs font-mono text-gray-400 dark:text-gray-500 italic">
                — End of recorded audit history —
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 z-10 relative bg-white dark:bg-[#141414] border border-dashed border-gray-200 dark:border-[#2C2C2C] rounded-xl mt-4">
              <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-[#1f1f1f] flex items-center justify-center mb-3 border border-gray-200 dark:border-[#333]">
                <ActivityIcon className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-base font-bold text-gray-900 dark:text-gray-100">No activity logs found</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm text-center">
                {searchQuery || actionFilter !== 'all' || selectedDayFilter
                  ? "No activities match your current search query or active filter chips."
                  : role === 'MEMBER' 
                  ? "You haven't performed any logged actions in this workspace yet." 
                  : "No events have been recorded in this scope."}
              </p>
              {(searchQuery || actionFilter !== 'all' || selectedDayFilter || dateFilter !== 'All Time' || projectFilter !== 'All Projects') && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActionFilter("all");
                    setSelectedDayFilter(null);
                    setDateFilter("All Time");
                    setProjectFilter("All Projects");
                  }}
                  className="mt-4 px-4 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTaskForModal(null);
        }}
        mode="detail"
        projectId={projectId || selectedTaskForModal?.projectId || projects[0]?.id || 'p1'}
        task={selectedTaskForModal}
      />
    </div>
  );

  if (projectId) return content;
  return <DashboardLayout title={role === 'MEMBER' ? "My Activity Pulse" : "Activity Command Center"}>{content}</DashboardLayout>;
}
