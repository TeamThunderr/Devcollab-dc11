import React, { createContext, useContext, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";

export type Role = "ADMIN" | "MEMBER" | "VIEWER";




export interface Permissions {
  // Task Permissions
  canCreateTask: boolean;
  canEditTask: (resourceOwnerId: string) => boolean;
  canDeleteTask: (resourceOwnerId: string) => boolean;
  
  // Project Permissions
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
  const isAdmin = role === "ADMIN";
  const isMember = role === "MEMBER";
  const atLeastMember = isAdmin || isMember;

  return {
    // Task Permissions
    canCreateTask: isAdmin,
    canEditTask: (resourceOwnerId) => isAdmin || (isMember && resourceOwnerId === currentUserId),
    canDeleteTask: (resourceOwnerId) => isAdmin || (isMember && resourceOwnerId === currentUserId),

    // Project Permissions
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

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export const RBACProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  
  const [role, setRoleState] = useState<Role>(() => {
    const saved = localStorage.getItem("devcollab_role");
    return (saved as Role) || "MEMBER";
  });

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    localStorage.setItem("devcollab_role", newRole);
  };

  const currentUserId = currentUser?.id?.toString() || "";


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
  return { role: context.role, setRole: context.setRole, currentUserId: context.currentUserId };
};
