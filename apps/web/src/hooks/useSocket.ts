import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

const SOCKET_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

export function useSocket(projectId?: number | string, workspaceId?: number | string) {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const activeProjectRef = useRef<number | null>(null);
  const activeWorkspaceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentUser) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['polling', 'websocket'],
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected');
      if (activeWorkspaceRef.current) {
        newSocket.emit('workspace:join', activeWorkspaceRef.current);
      }
      if (activeProjectRef.current) {
        newSocket.emit('project:join', activeProjectRef.current);
      }
    });

    // Task events
    const invalidateTasks = () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
    };
    newSocket.on('task:created', invalidateTasks);
    newSocket.on('task:updated', invalidateTasks);
    newSocket.on('task:deleted', invalidateTasks);
    (newSocket as any).on('task:assigned', invalidateTasks);

    // Snippet events
    const invalidateSnippets = () => {
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
    };
    newSocket.on('snippet:created', invalidateSnippets);
    newSocket.on('snippet:updated', invalidateSnippets);
    newSocket.on('snippet:deleted', invalidateSnippets);

    // Doc events
    const invalidateDocs = () => {
      queryClient.invalidateQueries({ queryKey: ['docs'] });
    };
    newSocket.on('doc:created', invalidateDocs);
    newSocket.on('doc:updated', invalidateDocs);
    newSocket.on('doc:deleted', invalidateDocs);
    newSocket.on('doc:edit', invalidateDocs);

    // Sprint events
    const invalidateSprints = () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
    };
    newSocket.on('sprint:created', invalidateSprints);
    newSocket.on('sprint:updated', invalidateSprints);
    newSocket.on('sprint:deleted', invalidateSprints);

    // Project events
    const invalidateProjects = () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    };
    newSocket.on('project:created', invalidateProjects);
    newSocket.on('project:updated', invalidateProjects);
    newSocket.on('project:deleted', invalidateProjects);

    // Project Members events
    const invalidateMembers = () => {
      queryClient.invalidateQueries({ queryKey: ['projectMembers'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    };
    newSocket.on('project:member_added', invalidateMembers);
    newSocket.on('project:member_removed', invalidateMembers);

    // Activity events
    newSocket.on('activity:new', () => {
      queryClient.invalidateQueries({ queryKey: ['project-activity'] });
    });

    // Comment events
    const invalidateComments = () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments'] });
    };
    newSocket.on('comment:added', invalidateComments);
    newSocket.on('comment:deleted', invalidateComments);

    // Chat events
    const invalidateChat = () => {
      queryClient.invalidateQueries({ queryKey: ['project-chat'] });
    };
    newSocket.on('chat:message', invalidateChat);

    // Notifications events
    const invalidateNotifications = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };
    newSocket.on('notification', invalidateNotifications);
    newSocket.on('notification:new', invalidateNotifications);

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser, queryClient]);

  // Handle dynamic room joins/leaves when projectId or workspaceId changes
  useEffect(() => {
    if (!socket) return;

    const numWsId = workspaceId && !isNaN(Number(workspaceId)) ? Number(workspaceId) : null;
    const numProjId = projectId && !isNaN(Number(projectId)) ? Number(projectId) : null;

    const joinRooms = () => {
      if (!socket.connected) return;
      if (numWsId && numWsId !== activeWorkspaceRef.current) {
        if (activeWorkspaceRef.current) {
          socket.emit('workspace:leave', activeWorkspaceRef.current);
        }
        socket.emit('workspace:join', numWsId);
        activeWorkspaceRef.current = numWsId;
      } else if (numWsId && activeWorkspaceRef.current === numWsId) {
        socket.emit('workspace:join', numWsId);
      }

      if (numProjId && numProjId !== activeProjectRef.current) {
        if (activeProjectRef.current) {
          socket.emit('project:leave', activeProjectRef.current);
        }
        socket.emit('project:join', numProjId);
        activeProjectRef.current = numProjId;
      } else if (numProjId && activeProjectRef.current === numProjId) {
        socket.emit('project:join', numProjId);
      }
    };

    joinRooms();
    socket.on('connect', joinRooms);

    return () => {
      socket.off('connect', joinRooms);
      if (socket.connected && activeProjectRef.current && numProjId === activeProjectRef.current) {
        socket.emit('project:leave', activeProjectRef.current);
        activeProjectRef.current = null;
      }
    };
  }, [socket, projectId, workspaceId]);

  return socket;
}
