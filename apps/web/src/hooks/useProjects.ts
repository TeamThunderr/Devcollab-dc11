import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Project {
  id: number;
  workspaceId: number;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  tasksCount?: number;
  members?: any[];
  createdBy?: number | null;
  visibility?: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export function useProjects(workspaceId: number | undefined) {
  return useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: async () => {
      const { data } = await api.get<Project[]>(`/api/workspaces/${workspaceId}/projects`);
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workspaceId, ...payload }: { workspaceId: number; name: string; description?: string; status?: string; priority?: string }) => {
      const { data } = await api.post<Project>(`/api/workspaces/${workspaceId}/projects`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: number; name?: string; description?: string | null; status?: string; priority?: string; isArchived?: boolean }) => {
      const { data } = await api.patch<Project>(`/api/projects/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', data.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: number; workspaceId: number }) => {
      await api.delete(`/api/projects/${id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useProjectMembers(projectId: number | undefined) {
  return useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: async () => {
      const { data } = await api.get<any[]>(`/api/projects/${projectId}/members`);
      return data;
    },
    enabled: !!projectId,
  });
}

export function useAddProjectMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, userId, role }: { projectId: number; userId: number; role: string }) => {
      const { data } = await api.post(`/api/projects/${projectId}/members`, { userId, role });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projectMembers', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useRemoveProjectMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: number; userId: number }) => {
      await api.delete(`/api/projects/${projectId}/members/${userId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projectMembers', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
