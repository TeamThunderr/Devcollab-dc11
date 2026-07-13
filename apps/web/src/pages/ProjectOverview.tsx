import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminDashboard } from "../components/dashboard/AdminDashboard";
import { MemberOverview } from "../pages/member/MemberOverview";
import { ViewerOverview } from "../pages/viewer/ViewerOverview";
import { useParams } from "react-router-dom";
import { useRole } from "../context/RBACContext";
import { getProjectPermissions } from "../lib/projectPermissions";
import { useWorkspaces } from "../hooks/useWorkspaces";
import { useProjects } from "../hooks/useProjects";
import { useTasks } from "../hooks/useTasks";
import { GreetingSection } from "../components/dashboard/GreetingSection";
import { StatsGrid } from "../components/dashboard/StatsGrid";
import { WorkspaceStats } from "../components/dashboard/WorkspaceStats";
import { RecentNotifications } from "../components/dashboard/RecentNotifications";
import { IntelligenceSection } from "../components/dashboard/IntelligenceSection";
import { ActivitySection } from "../components/dashboard/ActivitySection";
import { Sparkles, BrainCircuit, AlertCircle, ShieldAlert } from "lucide-react"
import { useStore } from "../store/useStore";


export function ProjectOverview() {
  const { projectId } = useParams();
  const { role } = useRole();
  const perms = getProjectPermissions(role);

  const { activeWorkspaceId } = useStore();
  const { data: workspaces } = useWorkspaces();
  const activeWorkspaceObj = workspaces?.find(w => Number(w.id) === Number(activeWorkspaceId)) || workspaces?.[0];
  const workspaceId = activeWorkspaceObj?.id;

  const { data: projects = [] } = useProjects(workspaceId);
  const targetProjectId = projectId || (projects[0]?.id ? String(projects[0].id) : '1');
  const parsedProjectId = parseInt(targetProjectId, 10) || projects[0]?.id || 1;
  
  const { data: tasks = [] } = useTasks(parsedProjectId);
  
  const project = projects.find(p => String(p.id) === String(targetProjectId) || p.id === parsedProjectId) || projects[0];

  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === "Done").length;
  // Fallback to 0 for activeMembersCount since projects don't have .members array directly in backend
  const activeMembersCount = 0;

  const [brainQuery, setBrainQuery] = useState("");

  const suggestedPrompts = [
    "Summarize sprint progress",
    "Show blockers",
    "Who owns authentication?",
    "Find recent wiki changes",
    "Generate standup update"
  ];

  const projectRadar = [
    { id: 1, text: "Database schema migration blocked by Smith", type: "danger" },
    { id: 2, text: "Authentication module requires your review", type: "warning" },
    { id: 3, text: "Sprint ends in 2 days. 4 tasks remaining.", type: "warning" }
  ];


  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 w-full py-10">
      {/* Dynamic Role-Based Experience Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={role}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: "easeOut" as const }}
          className="w-full"
        >
          {(role === "ADMIN" || role === "OWNER") && <AdminDashboard projectId={targetProjectId} />}
          {role === "MEMBER" && <MemberOverview projectId={targetProjectId} />}
          {role === "VIEWER" && <ViewerOverview projectId={targetProjectId} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
