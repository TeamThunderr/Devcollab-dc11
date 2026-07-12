

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Plus, Search, MoreVertical, Pencil, Archive, Trash, Clock, LayoutGrid, List as ListIcon, Circle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "../components/ui/Dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../components/ui/DropdownMenu";
import { useWorkspaces } from "../hooks/useWorkspaces";
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from "../hooks/useProjects";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useRole } from "../context/RBACContext";

export function Projects() {
  const { role } = useRole();
  const triggerProjectTransition = useStore((state) => state.triggerProjectTransition);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('projectsViewMode') as 'grid' | 'list') || 'grid';
  });
  const [filter, setFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [newProjectName, setNewProjectName] = useState('');

  const { activeWorkspaceId } = useStore();
  const { data: workspaces } = useWorkspaces();
  const activeWorkspaceObj = workspaces?.find(w => Number(w.id) === Number(activeWorkspaceId)) || workspaces?.[0];
  const workspaceId = activeWorkspaceObj?.id;
  const workspace = activeWorkspaceObj || { name: 'Workspace' };

  const { data: projects = [] } = useProjects(workspaceId);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('projectsViewMode', viewMode);
  }, [viewMode]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    
    try {
      await createProject.mutateAsync({
        workspaceId,
        name: newProjectName,
      });
      setIsCreateModalOpen(false);
      setNewProjectName('');
      toast.success("Project created successfully!", {
        description: "You can now start adding tasks and members."
      });
    } catch (e) {
      toast.error("Failed to create project");
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'All') return true;
    if (filter === 'Active') return !p.isArchived;
    if (filter === 'Archived') return p.isArchived;
    if (filter === 'P0' || filter === 'P1' || filter === 'P2') return p.priority === filter;
    return true;
  });

  return (
    <DashboardLayout title="Projects">
      <div className="flex flex-col h-full space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em]">
              {workspace.name} workspace · free plan
            </div>
            <h1 className="text-[2.5rem] font-bold tracking-[-0.03em] text-gray-900 dark:text-gray-100 leading-tight">
              {workspace.name} <span className="text-gray-400">Projects</span>
            </h1>
            <p className="text-gray-500 text-[0.9rem]">
              Track project milestones, tasks status, and stream alignments inside a unified workspace.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-md p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-sm transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-[#2C2C2C] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-sm transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-[#2C2C2C] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>

            {(role === 'OWNER' || role === 'ADMIN') && (
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap shadow-sm">
                    <Plus className="w-4 h-4" />
                    New Project
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                      Enter the details for your new project. Click save when you're done.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateProject} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Project Name</label>
                      <input 
                        required 
                        type="text" 
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        className="w-full bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-md px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-all text-sm" 
                        placeholder="e.g. Marketing Site Redesign" 
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-[#2C2C2C]">
                      <DialogClose asChild>
                        <button type="button" className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">Cancel</button>
                      </DialogClose>
                      <button type="submit" className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md text-sm font-medium hover:opacity-90 transition-opacity">Create Project</button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="space-y-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-9 pr-4 h-11 bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-600 transition-all text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {['All', 'Active', 'Archived', 'P0', 'P1', 'P2'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${filter === f
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-gray-900 dark:border-white'
                    : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30'
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Project List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-10">
            {filteredProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="border border-gray-200 dark:border-[#2C2C2C] rounded-lg overflow-hidden bg-white dark:bg-[#191919] mb-10">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-200 dark:border-[#2C2C2C] text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em]">
              <div className="col-span-5">Name</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Tasks</div>
              <div className="col-span-2">Last Updated</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
              {filteredProjects.map(project => (
                <div key={project.id} className="grid grid-cols-12 gap-4 px-5 py-3 items-center hover:bg-gray-50 dark:hover:bg-[#2C2C2C]/50 transition-colors group cursor-pointer" onClick={() => triggerProjectTransition({ id: project.id, name: project.name })}>
                  <div className="col-span-5 flex items-center gap-3">
                    <Circle className={`w-2.5 h-2.5 fill-current ${project.status === 'active' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`} />
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{project.name}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 capitalize">{project.status}</span>
                  </div>
                  <div className="col-span-2 text-sm text-gray-500">{project.tasksCount || 0} Tasks</div>
                  <div className="col-span-2 text-sm text-gray-500">{project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : new Date(project.createdAt).toLocaleDateString()}</div>
                  <div className="col-span-1 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-400 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast('Edit clicked'); }}><Pencil className="w-4 h-4 mr-2" /> Edit Project</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateProject.mutate({ id: project.id, isArchived: !project.isArchived }); toast.success(project.isArchived ? 'Project unarchived' : 'Project archived'); }}><Archive className="w-4 h-4 mr-2" /> {project.isArchived ? 'Unarchive' : 'Archive'}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); deleteProject.mutate({ id: project.id, workspaceId: project.workspaceId }); toast.success('Project deleted'); }}><Trash className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function ProjectCard({ project }: { project: any }) {
  const navigate = useNavigate();
  const triggerProjectTransition = useStore((state) => state.triggerProjectTransition);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskName, setTaskName] = useState('');

  const projectMembers: any[] = project.members || [];

  const handleTaskSubmit = (e: React.KeyboardEvent | React.FocusEvent) => {
    if ('key' in e && e.key === 'Escape') {
      setIsAddingTask(false);
      setTaskName('');
      return;
    }
    if ('key' in e && e.key !== 'Enter') return;

    if (taskName.trim()) {
      toast.info('Task creation pending API integration for this component.');
      setTaskName('');
      setIsAddingTask(false);
    }
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      onClick={() => triggerProjectTransition({ id: project.id, name: project.name })}
      className="group relative flex flex-col p-5 rounded-lg bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{project.name}</h3>
          <Circle className={`w-2 h-2 fill-current ${project.status === 'active' ? 'text-gray-900 dark:text-white animate-pulse' : 'text-gray-400'}`} />
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-[#2C2C2C] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast('Edit clicked'); }}><Pencil className="w-4 h-4 mr-2" /> Edit Project</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateProject.mutate({ id: project.id, isArchived: !project.isArchived }); toast.success(project.isArchived ? 'Project unarchived' : 'Project archived'); }}><Archive className="w-4 h-4 mr-2" /> {project.isArchived ? 'Unarchive' : 'Archive'}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); deleteProject.mutate({ id: project.id, workspaceId: project.workspaceId }); toast.success('Project deleted'); }}><Trash className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 flex-1 mb-4">
        {project.description}
      </p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-[2px] flex-1 bg-gray-100 dark:bg-[#2C2C2C] overflow-hidden">
            <div className="h-full bg-black dark:bg-white" style={{ width: '0%' }}></div>
          </div>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-gray-100 dark:bg-[#2C2C2C] text-gray-500 uppercase tracking-wider">
            {project.tasksCount || 0} Tasks
          </span>
        </div>
      </div>

      <div className="mb-4" onClick={(e) => e.stopPropagation()}>
        {isAddingTask ? (
          <input
            autoFocus
            type="text"
            placeholder="Task name... (Press Enter)"
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500"
            value={taskName}
            onChange={e => setTaskName(e.target.value)}
            onKeyDown={handleTaskSubmit}
            onBlur={handleTaskSubmit}
          />
        ) : (
          <button
            onClick={() => setIsAddingTask(true)}
            className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Task
          </button>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-[#2C2C2C]">
        <div className="flex items-center -space-x-2">
          {projectMembers.slice(0, 3).map((member, i) => (
            <img key={member.id} src={member.avatarUrl} alt="Avatar" className="w-6 h-6 rounded-full border-2 border-white dark:border-[#191919] relative" style={{ zIndex: 10 - i }} />
          ))}
          {projectMembers.length > 3 && (
            <div className="w-6 h-6 rounded-full border-2 border-white dark:border-[#191919] bg-gray-100 dark:bg-[#2C2C2C] text-[9px] font-bold text-gray-600 dark:text-gray-300 flex items-center justify-center relative" style={{ zIndex: 0 }}>
              +{projectMembers.length - 3}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>Last edited {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : new Date(project.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  );
}
