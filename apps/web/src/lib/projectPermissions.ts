import { Role } from "../context/RBACContext";

export interface ProjectPermissions {
  canAdminister: boolean;
  canCollaborate: boolean;
  canManageMembers: boolean;
  canAccessEditor: boolean;
  canAccessSnippets: boolean;
  canAccessChat: boolean;
  canAccessAI: boolean;
  canAssignTasks: boolean;
  canViewAnalytics: boolean;
  canCreateTask: boolean;
  canDeleteWiki: boolean;
}

export function getProjectPermissions(role: Role): ProjectPermissions {
  switch (role) {
    case "ADMIN":
      return {
        canAdminister: true,
        canCollaborate: true,
        canManageMembers: true,
        canAccessEditor: true,
        canAccessSnippets: true,
        canAccessChat: true,
        canAccessAI: true,
        canAssignTasks: true,
        canViewAnalytics: true,
        canCreateTask: true,
        canDeleteWiki: true,
      };
    case "MEMBER":
      return {
        canAdminister: false,
        canCollaborate: true,
        canManageMembers: false,
        canAccessEditor: true,
        canAccessSnippets: true,
        canAccessChat: true,
        canAccessAI: true,
        canAssignTasks: false,
        canViewAnalytics: false,
        canCreateTask: true,
        canDeleteWiki: false,
      };
    case "VIEWER":
    default:
      return {
        canAdminister: false,
        canCollaborate: false,
        canManageMembers: false,
        canAccessEditor: false,
        canAccessSnippets: false,
        canAccessChat: false,
        canAccessAI: false,
        canAssignTasks: false,
        canViewAnalytics: false,
        canCreateTask: false,
        canDeleteWiki: false,
      };
  }
}
