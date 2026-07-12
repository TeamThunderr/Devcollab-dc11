import React, { createContext, useContext, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";

export type Role = "ADMIN" | "MEMBER" | "VIEWER" | "OWNER";

export interface Permissions {
  // Task Permissions
  canCreateTask: boolean;
  canEditTask: (resourceOwnerId: string) => boolean;
  canDeleteTask: (resourceOwnerId: string) => boolean;
  
  // Project Permissions
  canCreateProject: boolean;
  canInviteMembers: boolean;
  canManageMembers: boolean;
  canEditProjectSettings: boolean;
  canDeleteProject: boolean;

  // Wiki Permissions
  canCreateWiki: boolean;
  canEditWiki: boolean;
  canDeleteWiki: boolean;

  // Snippet Permissions
  canCreateSnippet: boolean;
  canEditSnippet: (resourceOwnerId: string) => boolean;
  canDeleteSnippet: (resourceOwnerId: string) => boolean;

  // AI Permissions
  canUseAiCopilot: boolean;
  canActOnAiRecommendations: boolean;
  canGenerateSummaries: boolean;
  canTriggerWorkflowActions: boolean;
}

const buildPermissionsForRole = (role: Role, currentUserId: string): Permissions => {
  const isAdmin = role === "ADMIN" || role === "OWNER";
  const isMember = role === "MEMBER";
  const atLeastMember = isAdmin || isMember;

  return {
    // Task Permissions
    canCreateTask: atLeastMember,
    canEditTask: (resourceOwnerId) => isAdmin || (isMember && resourceOwnerId === currentUserId),
    canDeleteTask: (resourceOwnerId) => isAdmin || (isMember && resourceOwnerId === currentUserId),

    // Project Permissions
    canCreateProject: isAdmin,
    canInviteMembers: isAdmin,
    canManageMembers: isAdmin,
    canEditProjectSettings: isAdmin,
    canDeleteProject: isAdmin,

    // Wiki Permissions
    canCreateWiki: atLeastMember,
    canEditWiki: atLeastMember,
    canDeleteWiki: isAdmin,

    // Snippet Permissions
    canCreateSnippet: atLeastMember,
    canEditSnippet: (resourceOwnerId) => isAdmin || (atLeastMember && resourceOwnerId === currentUserId),
    canDeleteSnippet: (resourceOwnerId) => isAdmin || (atLeastMember && resourceOwnerId === currentUserId),

    // AI Permissions
    canUseAiCopilot: atLeastMember,
    canActOnAiRecommendations: atLeastMember,
    canGenerateSummaries: atLeastMember,
    canTriggerWorkflowActions: isAdmin,
  };
};

interface RBACContextType {
  role: Role;
  setRole: (role: Role) => void;
  permissions: Permissions;
  currentUserId: string;
}

import { useStore } from "../store/useStore";
import { useLocation } from "react-router-dom";
import { useWorkspaces, useWorkspaceMembers } from "../hooks/useWorkspaces";
import { useProjectMembers } from "../hooks/useProjects";

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export const RBACProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const { activeWorkspaceId, members: storeMembers } = useStore();
  
  const { data: workspaces } = useWorkspaces();
  const { data: wsMembers } = useWorkspaceMembers(activeWorkspaceId ? Number(activeWorkspaceId) : undefined);

  const [manualRole, setManualRole] = useState<Role | null>(() => {
    const saved = localStorage.getItem("devcollab_role");
    return saved ? (saved as Role) : null;
  });

  const setRole = (newRole: Role) => {
    setManualRole(newRole);
    localStorage.setItem("devcollab_role", newRole);
  };

  const currentUserId = currentUser?.id?.toString() || "";
  const activeWorkspace = workspaces?.find(w => Number(w.id) === Number(activeWorkspaceId)) || workspaces?.[0];

  // Check workspace ownership first (highest priority)
  const isWorkspaceOwner = Boolean(
    activeWorkspace && currentUserId && (Number(activeWorkspace.ownerId || activeWorkspace.createdBy) === Number(currentUserId))
  );

  // Combine store members and query members
  const memberList = (wsMembers && wsMembers.length > 0) ? wsMembers : storeMembers;
  const currentWsMember = memberList.find((m: any) => 
    (m.id && String(m.id) === currentUserId) || 
    (m.userId && String(m.userId) === currentUserId) ||
    (m.email && currentUser?.email && m.email.toLowerCase() === currentUser.email.toLowerCase())
  );

  let workspaceRole: Role = "MEMBER";
  if (isWorkspaceOwner) {
    workspaceRole = "OWNER";
  } else if (currentWsMember?.role) {
    const rawRole = currentWsMember.role.toUpperCase();
    if (rawRole === "OWNER" || rawRole === "ADMIN" || rawRole === "MEMBER" || rawRole === "VIEWER") {
      workspaceRole = rawRole as Role;
    } else if (rawRole === "TEAM_LEAD") {
      workspaceRole = "ADMIN";
    }
  } else if (manualRole) {
    workspaceRole = manualRole;
  }

  // Check if inside a project route
  const projectMatch = location.pathname.match(/\/projects\/(\d+)/);
  const currentProjectId = projectMatch ? Number(projectMatch[1]) : null;
  const { data: projectMembersList = [] } = useProjectMembers(currentProjectId || undefined);

  let role: Role = workspaceRole;
  if (currentProjectId && currentProjectId > 0) {
    if (workspaceRole === "OWNER" || workspaceRole === "ADMIN") {
      // Workspace Admin/Owner has automatic full Admin UX in all projects
      role = workspaceRole;
    } else {
      // For workspace members or viewers, check their explicit project membership
      const currentProjMember = projectMembersList.find((pm: any) =>
        (pm.id && String(pm.id) === currentUserId) ||
        (pm.userId && String(pm.userId) === currentUserId) ||
        (pm.email && currentUser?.email && pm.email.toLowerCase() === currentUser.email.toLowerCase())
      );
      if (currentProjMember?.role) {
        const rawProjRole = currentProjMember.role.toUpperCase();
        if (rawProjRole === "OWNER" || rawProjRole === "ADMIN" || rawProjRole === "TEAM_LEAD") {
          role = "ADMIN";
        } else if (rawProjRole === "MEMBER") {
          role = "MEMBER";
        } else if (rawProjRole === "VIEWER") {
          role = "VIEWER";
        }
      }
    }
  }

  const permissions = buildPermissionsForRole(role, currentUserId);

  return (
    <RBACContext.Provider value={{ role, setRole, permissions, currentUserId }}>
      {children}
    </RBACContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error("usePermissions must be used within an RBACProvider");
  }
  return context.permissions;
};

export const useRole = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error("useRole must be used within an RBACProvider");
  }
  return { role: context.role, setRole: context.setRole, permissions: context.permissions, currentUserId: context.currentUserId };
};
