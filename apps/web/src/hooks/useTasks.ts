import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toFrontendStatus, toBackendStatus } from '../store/useStore';

export interface Task {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigneeId: number | null;
  dueDate: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export function useTasks(projectId: number | undefined) {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const { data } = await api.get<Task[]>(`/api/projects/${projectId}/tasks`);
      return data.map(t => ({ ...t, status: toFrontendStatus(t.status) }));
    },
    enabled: !!projectId,
  });
}

export function useWorkspaceTasks(workspaceId: number | undefined) {
  return useQuery({
    queryKey: ['workspace-tasks', workspaceId],
    queryFn: async () => {
      const { data } = await api.get<Task[]>(`/api/workspaces/${workspaceId}/tasks`);
      return data.map(t => ({ ...t, status: toFrontendStatus(t.status) }));
    },
    enabled: !!workspaceId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, status, ...payload }: { projectId: number; title: string; description?: string; status?: string; priority?: string; assigneeId?: number; dueDate?: string }) => {
      const normalizedStatus = status ? toBackendStatus(status) : undefined;
      const { data } = await api.post<Task>(`/api/projects/${projectId}/tasks`, { ...payload, ...(normalizedStatus && { status: normalizedStatus }) });
      return { ...data, status: toFrontendStatus(data.status) };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-activity'] });
      queryClient.invalidateQueries({ queryKey: ['project-activity', variables.projectId] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, status, ...payload }: { taskId: number; title?: string; description?: string; status?: string; priority?: string; assigneeId?: number; dueDate?: string }) => {
      const normalizedStatus = status ? toBackendStatus(status) : undefined;
      const { data } = await api.patch<Task>(`/api/tasks/${taskId}`, { ...payload, ...(normalizedStatus && { status: normalizedStatus }) });
      return { ...data, status: toFrontendStatus(data.status) };
    },
    onMutate: async (variables) => {
      // Optimistically update workspace-tasks
      await queryClient.cancelQueries({ queryKey: ['workspace-tasks'] });
      
      const previousWorkspaceTasks = queryClient.getQueriesData({ queryKey: ['workspace-tasks'] });
      
      queryClient.setQueriesData({ queryKey: ['workspace-tasks'] }, (old: Task[] | undefined) => {
        if (!old) return old;
        return old.map(t => 
          String(t.id) === String(variables.taskId) 
            ? { ...t, ...variables, status: variables.status ? toFrontendStatus(variables.status) : t.status } 
            : t
        );
      });

      return { previousWorkspaceTasks };
    },
    onError: (err: any, variables, context: any) => {
      console.error("Task update failed:", err);
      if (typeof window !== 'undefined') {
        alert("Failed to update task: " + (err?.response?.data?.message || err.message || "Unknown error"));
      }
      // Revert optimistic update
      if (context?.previousWorkspaceTasks) {
        context.previousWorkspaceTasks.forEach(([queryKey, data]: any) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['tasks', data.projectId] });
        queryClient.invalidateQueries({ queryKey: ['project-activity', data.projectId] });
      }
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-activity'] });
    },
  });
}
