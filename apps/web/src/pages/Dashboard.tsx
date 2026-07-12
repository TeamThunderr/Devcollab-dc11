import React from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { GreetingSection } from "../components/dashboard/GreetingSection";
import { StatsGrid } from "../components/dashboard/StatsGrid";
import { IntelligenceSection } from "../components/dashboard/IntelligenceSection";
import { ActivitySection } from "../components/dashboard/ActivitySection";
import { WorkspaceStats } from "../components/dashboard/WorkspaceStats";
import { RecentNotifications } from "../components/dashboard/RecentNotifications";
import { useWorkspaces, useWorkspaceStats } from "../hooks/useWorkspaces";
import { useStore } from "../store/useStore";

import { MemberDashboard } from "../components/dashboard/MemberDashboard";
import { ViewerWorkspaceDashboard } from "../components/dashboard/ViewerWorkspaceDashboard";
import { useRole } from "../context/RBACContext";

export function Dashboard() {
  const { role } = useRole();
  const { activeWorkspaceId } = useStore();
  const { data: workspaces } = useWorkspaces();
  const activeWorkspaceObj = workspaces?.find(w => Number(w.id) === Number(activeWorkspaceId)) || workspaces?.[0];
  const workspaceId = activeWorkspaceObj?.id;
  const { data: stats } = useWorkspaceStats(workspaceId);

  if (role === 'MEMBER') {
    return (
      <DashboardLayout title="Overview">
        <MemberDashboard />
      </DashboardLayout>
    );
  }

  if (role === 'VIEWER') {
    return (
      <DashboardLayout title="Overview">
        <ViewerWorkspaceDashboard />
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout title="Overview">
      <GreetingSection />
      <StatsGrid 
        firstValue={stats?.activeProjects?.toString() || "0"}
        firstLabel="Active Projects"
        secondValue={stats?.teamMembers?.toString() || "0"}
        secondLabel="Team Members"
        thirdValue={stats?.totalTasks?.toString() || "0"}
        thirdLabel="Tasks Across Projects"
      />
      
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 mb-16">
        <div className="xl:col-span-3">
          <WorkspaceStats />
        </div>
        <div className="xl:col-span-2">
          <RecentNotifications />
        </div>
      </div>

      <IntelligenceSection />
      <ActivitySection />
    </DashboardLayout>
  );
}
