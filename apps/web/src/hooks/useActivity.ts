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
  id: number;
  userId: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
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

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get<Notification[]>('/api/me/notifications');
      return data;
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: number) => {
      const { data } = await api.patch<Notification>(`/api/me/notifications/${notificationId}/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch<{ success: boolean }>('/api/me/notifications/read-all');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
