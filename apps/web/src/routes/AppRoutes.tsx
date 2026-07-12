import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { Landing } from "../pages/Landing";
import { AuthPage } from "../pages/AuthPage";
import { ForgotPassword } from "../pages/ForgotPassword";
import { VerifyOTP } from "../pages/VerifyOTP";
import { ResetPassword } from "../pages/ResetPassword";
import { Dashboard } from "../pages/Dashboard";
import { Projects } from "../pages/Projects";
import { Activity } from "../pages/Activity";
import { Members } from "../pages/Members";
import { Billing } from "../pages/Billing";
import { Settings } from "../pages/Settings";
import { Profile } from "../pages/Profile";
import { ProjectLayout } from "../components/layout/ProjectLayout";
import { ProjectOverview } from "../pages/ProjectOverview";
import { Board } from "../pages/Board";
import { Wiki } from "../pages/Wiki";
import { Snippets } from "../pages/Snippets";
import { Editor } from "../pages/Editor";
import { Chat } from "../pages/Chat";
import { AIAssistant } from "../pages/AIAssistant";
import { WorkspaceAI } from "../pages/WorkspaceAI";
import { Privacy } from "../pages/Privacy";
import { Terms } from "../pages/Terms";
import { WorkspaceSelection } from "../pages/WorkspaceSelection";
import { Onboarding } from "../pages/Onboarding";
import { RejectInvite } from "../pages/RejectInvite";
import { Invite } from "../pages/Invite";
import { MyTasks } from "../pages/MyTasks";
import { MemberTasks } from "../pages/member/MemberTasks";
import { MemberWorkspace } from "../pages/member/MemberWorkspace";
import { MemberCollaboration } from "../pages/member/MemberCollaboration";
import { ViewerProgress } from "../pages/viewer/ViewerProgress";
import { ViewerTimeline } from "../pages/viewer/ViewerTimeline";
import { ViewerTeam } from "../pages/viewer/ViewerTeam";
import { useRole } from "../context/RBACContext";
import { getProjectPermissions, ProjectPermissions } from "../lib/projectPermissions";
import { useSocket } from "../hooks/useSocket";
import { useBackendSync } from "../hooks/useBackendSync";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useAuth();
  if (isLoading) return <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-[#191919]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function ProjectRouteGuard({ children, capability }: { children: React.ReactNode; capability: keyof ProjectPermissions }) {
  const { role } = useRole();
  const perms = getProjectPermissions(role);
  const { projectId } = useParams();

  if (!perms[capability]) {
    return <Navigate to={`/projects/${projectId}/overview`} replace />;
  }

  return <>{children}</>;
}

function WorkspaceRouteGuard({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { role } = useRole();
  const isAdmin = role === 'ADMIN' || role === 'OWNER';

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function AppRoutes() {
  useSocket();
  useBackendSync();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-reset-otp" element={<VerifyOTP />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/reject-invite" element={<RejectInvite />} />
      <Route path="/invite/:slug" element={<AuthGuard><Invite /></AuthGuard>} />

      {/* Protected Routes */}
      <Route path="/select-workspace" element={<AuthGuard><WorkspaceSelection /></AuthGuard>} />
      <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
      <Route path="/projects" element={<AuthGuard><Projects /></AuthGuard>} />
      <Route path="/tasks" element={<AuthGuard><MyTasks /></AuthGuard>} />
      <Route path="/activity" element={<AuthGuard><Activity /></AuthGuard>} />
      <Route path="/members" element={<AuthGuard><Members /></AuthGuard>} />
      <Route path="/ai" element={<AuthGuard><WorkspaceAI /></AuthGuard>} />

      <Route path="/billing" element={
        <AuthGuard>
          <Billing />
        </AuthGuard>
      } />
      <Route path="/settings" element={
        <AuthGuard>
          <WorkspaceRouteGuard adminOnly>
            <Settings />
          </WorkspaceRouteGuard>
        </AuthGuard>
      } />
      <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />

      {/* Project Context Routes */}
      <Route path="/projects/:projectId" element={<AuthGuard><ProjectLayout /></AuthGuard>}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<ProjectOverview />} />
        <Route path="board" element={<Board />} />
        <Route path="activity" element={<Activity />} />
        <Route path="wiki" element={<Wiki />} />
        <Route path="snippets" element={
          <ProjectRouteGuard capability="canAccessSnippets">
            <Snippets />
          </ProjectRouteGuard>
        } />
        <Route path="editor" element={
          <ProjectRouteGuard capability="canAccessEditor">
            <Editor />
          </ProjectRouteGuard>
        } />
        <Route path="members" element={<Members />} />
        <Route path="chat" element={
          <ProjectRouteGuard capability="canAccessChat">
            <Chat />
          </ProjectRouteGuard>
        } />
        <Route path="ai" element={
          <ProjectRouteGuard capability="canAccessAI">
            <AIAssistant />
          </ProjectRouteGuard>
        } />

        {/* Member Workspace Routes */}
        <Route path="tasks" element={
          <ProjectRouteGuard capability="canCollaborate">
            <MemberTasks />
          </ProjectRouteGuard>
        } />
        <Route path="workspace" element={
          <ProjectRouteGuard capability="canCollaborate">
            <MemberWorkspace />
          </ProjectRouteGuard>
        } />
        <Route path="collaboration" element={
          <ProjectRouteGuard capability="canCollaborate">
            <MemberCollaboration />
          </ProjectRouteGuard>
        } />

        {/* Viewer Workspace Routes */}
        <Route path="progress" element={<ViewerProgress />} />
        <Route path="timeline" element={<ViewerTimeline />} />
        <Route path="team" element={<ViewerTeam />} />

        {/* Fallbacks for nested routes */}
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Route>

      {/* Catch-all route to redirect back to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
