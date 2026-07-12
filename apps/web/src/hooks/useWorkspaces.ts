import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdBy: number;
  ownerId?: number;
  createdAt: string;
}

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data } = await api.get<Workspace[]>('/api/workspaces');
      return data;
    },
  });
}

export interface WorkspaceMy {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  role: string;
  plan: string;
  memberCount: number;
  projectCount: number;
}

export function useMyWorkspaces() {
  return useQuery({
    queryKey: ['my-workspaces'],
    queryFn: async () => {
      const { data } = await api.get<WorkspaceMy[]>('/api/workspaces/my');
      return data;
    },
  });
}

export interface WorkspaceStats {
  activeProjects: number;
  teamMembers: number;
  totalTasks: number;
}

export function useWorkspaceStats(workspaceId: number | undefined) {
  return useQuery({
    queryKey: ['workspace-stats', workspaceId],
    queryFn: async () => {
      const { data } = await api.get<WorkspaceStats>(`/api/workspaces/${workspaceId}/stats`);
      return data;
    },
    enabled: !!workspaceId,
  });
}

export interface WorkspaceMember {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  joinedAt: string;
}

export function useWorkspaceMembers(workspaceId: number | undefined) {
  return useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: async () => {
      const { data } = await api.get<WorkspaceMember[]>(`/api/workspaces/${workspaceId}/members`);
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; slug: string; description?: string }) => {
      const { data } = await api.post<Workspace>('/api/workspaces', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      return queryClient.invalidateQueries({ queryKey: ['my-workspaces'] });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workspaceId, ...payload }: { workspaceId: number; name?: string; description?: string }) => {
      const { data } = await api.patch<Workspace>(`/api/workspaces/${workspaceId}`, payload);
      return data;
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workspaceId: number) => {
      await api.delete(`/api/workspaces/${workspaceId}`);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workspaceId, email, role }: { workspaceId: number; email: string; role: string }) => {
      const { data } = await api.post(`/api/workspaces/${workspaceId}/invite`, { email, role });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', variables.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-stats', variables.workspaceId] });
    },
  });
}

export function useJoinWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { slug: string; code: string } | string) => {
      const slug = typeof params === 'string' ? params : params.slug;
      const code = typeof params === 'string' ? params : params.code;
      const { data } = await api.post<{ workspaceId: number; joined: boolean }>(`/api/workspaces/join/${slug}`, { code });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['my-workspaces'] });
      if (data?.workspaceId) {
        queryClient.invalidateQueries({ queryKey: ['workspace-members', data.workspaceId] });
      }
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workspaceId, userId, role }: { workspaceId: number; userId: number; role: string }) => {
      const { data } = await api.patch(`/api/workspaces/${workspaceId}/members/${userId}`, { role });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', variables.workspaceId] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workspaceId, userId }: { workspaceId: number; userId: number }) => {
      await api.delete(`/api/workspaces/${workspaceId}/members/${userId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', variables.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-stats', variables.workspaceId] });
    },
  });
}
