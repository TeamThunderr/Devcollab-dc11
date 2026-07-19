import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface ActivityItem {
  id: string | number;
  workspaceId?: string | number;
  projectId?: string | number | null;
  userId: string | number;
  action?: string;
  actionType?: string;
  metadata?: any;
  timestamp?: string;
  createdAt?: string;
}

export interface Notification {
  id: number | string;
  workspaceId?: number | string;
  recipientUserId?: number | string;
  userId?: number | string;
  actorUserId?: number | string | null;
  type: string;
  contextType?: string | null;
  contextId?: number | string | null;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
  read?: boolean;
}

export function useWorkspaceActivity(workspaceId: number | undefined) {
  return useQuery({
    queryKey: ['workspace-activity', workspaceId],
    queryFn: async () => {
      const { data } = await api.get<ActivityItem[]>(`/api/workspaces/${workspaceId}/activity`);
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useProjectActivity(projectId: number | undefined) {
  return useQuery({
    queryKey: ['project-activity', projectId],
    queryFn: async () => {
      const { data } = await api.get<ActivityItem[]>(`/api/projects/${projectId}/activity`);
      return data;
    },
    enabled: !!projectId,
  });
}

export function useNotifications(workspaceId?: number) {
  return useQuery({
    queryKey: ['notifications', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data } = await api.get<Notification[]>(`/api/workspaces/${workspaceId}/notifications`);
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useMarkNotificationRead(workspaceId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: number | string) => {
      if (!workspaceId) throw new Error('workspaceId is required');
      const { data } = await api.patch<Notification>(`/api/workspaces/${workspaceId}/notifications/${notificationId}/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead(workspaceId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!workspaceId) throw new Error('workspaceId is required');
      const { data } = await api.patch<{ success: boolean }>(`/api/workspaces/${workspaceId}/notifications/read-all`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
