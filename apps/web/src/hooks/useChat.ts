import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface ChatMessage {
  id: number | string;
  projectId: number;
  userId: number;
  channel: string;
  content: string;
  createdAt: string;
  senderName: string;
  senderRole: string;
  avatarUrl?: string | null;
}

export function useChat(projectId: number | undefined, channel: string = 'general') {
  return useQuery({
    queryKey: ['project-chat', projectId, channel],
    queryFn: async () => {
      const { data } = await api.get<ChatMessage[]>(`/api/projects/${projectId}/chat?channel=${encodeURIComponent(channel)}`);
      return data;
    },
    enabled: !!projectId && !isNaN(Number(projectId)),
    refetchInterval: 5000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, channel, content }: { projectId: number; channel: string; content: string }) => {
      const { data } = await api.post<ChatMessage>(`/api/projects/${projectId}/chat`, {
        channel,
        content,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-chat', variables.projectId, variables.channel] });
    },
  });
}
