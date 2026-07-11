import React, { useState } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Building2, User, Bell, Palette, AlertTriangle, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWorkspaces, useUpdateWorkspace, useDeleteWorkspace } from "../hooks/useWorkspaces";
import { useTheme } from "../hooks/useTheme";
import { toast } from "sonner";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "../components/ui/Dialog";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api"
import { useStore } from "../store/useStore";

export function Settings() {
  const [activeTab, setActiveTab] = useState<'workspace' | 'profile' | 'notifications' | 'appearance' | 'danger'>('workspace');

  const TABS = [
    { id: 'workspace', label: 'Workspace', icon: <Building2 className="w-4 h-4" />, textClass: '', hoverClass: '' },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" />, textClass: '', hoverClass: '' },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, textClass: '', hoverClass: '' },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" />, textClass: '', hoverClass: '' },
    { id: 'danger', label: 'Danger Zone', icon: <AlertTriangle className="w-4 h-4" />, textClass: 'text-red-400', hoverClass: 'hover:bg-red-500/10 hover:text-red-400' },
  ] as const;

  return (
    <DashboardLayout title="Settings">
      <div className="flex flex-col md:flex-row gap-8 h-full">
        {/* Left Nav */}
        <div className="w-full md:w-[180px] shrink-0">
          <div className="flex flex-col gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-black/5 dark:bg-white/10 text-gray-900 dark:text-white font-medium'
                    : `text-gray-500 dark:text-gray-400 ${tab.hoverClass || 'hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`
                } ${tab.textClass && activeTab !== tab.id ? tab.textClass : ''}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-2xl pb-20">
          {activeTab === 'workspace' && <WorkspaceTab />}
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'appearance' && <AppearanceTab />}
          {activeTab === 'danger' && <DangerZoneTab />}
        </div>
      </div>
    </DashboardLayout>
  );
}

function WorkspaceTab() {
  const { activeWorkspaceId } = useStore();
  const { data: workspaces } = useWorkspaces();
  const activeWorkspaceObj = workspaces?.find(w => Number(w.id) === Number(activeWorkspaceId)) || workspaces?.[0];
  const workspace = activeWorkspaceObj || { id: 0, name: 'Workspace', slug: 'workspace', description: '' };
  const updateWorkspace = useUpdateWorkspace();
  
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description || "");

  React.useEffect(() => {
    if (activeWorkspaceObj) {
      setName(activeWorkspaceObj.name);
      setDescription(activeWorkspaceObj.description || "");
    }
  }, [workspaces]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateWorkspace.mutate({ workspaceId: workspace.id, name, description });
    toast.success("Workspace settings saved");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-1 border-b border-gray-200 dark:border-[#2C2C2C] pb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Workspace</h2>
        <p className="text-sm text-gray-500">Manage your workspace details and settings.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Workspace Name</label>
          <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-md px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 text-sm" />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Workspace Slug</label>
          <input readOnly type="text" value={workspace.slug || workspace.name?.toLowerCase().replace(/\s+/g, '-') || ''} className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#2C2C2C] rounded-md px-3 py-2 text-gray-500 focus:outline-none text-sm cursor-not-allowed" />
          <p className="text-xs text-gray-500">The slug is used in your workspace URL and cannot be changed.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Description</label>
          <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-md px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 text-sm resize-none"></textarea>
        </div>

        <div className="pt-4">
          <button type="submit" className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-sm">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

function ProfileTab() {
  const { currentUser, login } = useAuth();
  
  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [githubUrl, setGithubUrl] = useState(currentUser?.githubUrl || '');
  const [skills, setSkills] = useState<string[]>(currentUser?.skills || []);
  const [skillInput, setSkillInput] = useState('');

  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setBio(currentUser.bio || '');
      setGithubUrl(currentUser.githubUrl || '');
      setSkills(currentUser.skills || []);
    }
  }, [currentUser]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch('/api/users/me', data);
      return response.data;
    },
    onSuccess: (updatedUser) => {
      login(updatedUser);
      toast.success("Profile saved");
    }
  });

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = skillInput.trim();
      if (val && !skills.includes(val)) {
        setSkills([...skills, val]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name,
      bio: bio || null,
      skills: skills.length > 0 ? skills : [],
      githubLink: githubUrl ? githubUrl : null,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-1 border-b border-gray-200 dark:border-[#2C2C2C] pb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile</h2>
        <p className="text-sm text-gray-500">Manage your personal profile and skills.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Display Name</label>
          <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-md px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 text-sm" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Bio</label>
          <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-md px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 text-sm resize-none"></textarea>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900 dark:text-gray-100">GitHub URL</label>
          <input type="url" placeholder="https://github.com/username" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} className="w-full bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-md px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 text-sm" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Skills</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {skills.map(skill => (
              <span key={skill} className="inline-flex items-center gap-1 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white px-2 py-1 rounded text-xs">
                {skill}
                <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input type="text" placeholder="Type a skill and press Enter" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={handleAddSkill} className="w-full bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-md px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 text-sm" />
        </div>

        <div className="pt-4">
          <button type="submit" disabled={updateProfileMutation.isPending} className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50">
            {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}

function NotificationsTab() {
  const [preferences, setPreferences] = useState({
    taskAssigned: true,
    mentions: true,
    dueDates: true,
    newMember: false,
    projectStatus: true,
  });

  const toggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success("Preferences updated");
  };

  const ToggleSwitch = ({ checked, onClick }: { checked: boolean; onClick: () => void }) => (
    <button 
      onClick={onClick}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-white/10'}`}
    >
      <span className={`pointer-events-none absolute left-0.5 inline-block h-4 w-4 transform rounded-full bg-white dark:bg-[#111] shadow transition duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-1 border-b border-gray-200 dark:border-[#2C2C2C] pb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h2>
        <p className="text-sm text-gray-500">Choose what events you want to be notified about.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#2C2C2C]">
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">Task assigned to me</div>
            <div className="text-xs text-gray-500 mt-0.5">When someone assigns a task to you</div>
          </div>
          <ToggleSwitch checked={preferences.taskAssigned} onClick={() => toggle('taskAssigned')} />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#2C2C2C]">
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">@Mentions in comments</div>
            <div className="text-xs text-gray-500 mt-0.5">When someone mentions you anywhere</div>
          </div>
          <ToggleSwitch checked={preferences.mentions} onClick={() => toggle('mentions')} />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#2C2C2C]">
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">Task due date reminders</div>
            <div className="text-xs text-gray-500 mt-0.5">Get reminded 24h before a task is due</div>
          </div>
          <ToggleSwitch checked={preferences.dueDates} onClick={() => toggle('dueDates')} />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#2C2C2C]">
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">New member joins workspace</div>
            <div className="text-xs text-gray-500 mt-0.5">When a new user accepts an invite</div>
          </div>
          <ToggleSwitch checked={preferences.newMember} onClick={() => toggle('newMember')} />
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">Project status changes</div>
            <div className="text-xs text-gray-500 mt-0.5">When a project goes from Active to Archived etc.</div>
          </div>
          <ToggleSwitch checked={preferences.projectStatus} onClick={() => toggle('projectStatus')} />
        </div>
      </div>
    </div>
  );
}

function AppearanceTab() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-1 border-b border-gray-200 dark:border-[#2C2C2C] pb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Appearance</h2>
        <p className="text-sm text-gray-500">Customize the look and feel of your workspace.</p>
      </div>

      <div className="space-y-4">
        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Theme</label>
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          {/* Dark Mode Card */}
          <button 
            onClick={() => theme !== 'dark' && toggleTheme()}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-colors ${theme === 'dark' ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-white/5' : 'border-gray-200 dark:border-white/20 hover:border-gray-300 dark:hover:border-white/40 bg-white dark:bg-transparent'}`}
          >
            <div className="w-full aspect-[4/3] rounded-lg bg-[#111] border border-gray-800 flex flex-col gap-1.5 p-2 overflow-hidden relative shadow-sm">
              <div className="flex gap-1">
                <div className="w-2/3 h-2 rounded bg-white/10" />
                <div className="w-1/3 h-2 rounded bg-white/5" />
              </div>
              <div className="w-full h-8 rounded bg-white/5" />
              <div className="w-1/2 h-2 rounded bg-white/10 mt-auto" />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">Dark</span>
          </button>
          
          {/* Light Mode Card */}
          <button 
            onClick={() => theme !== 'light' && toggleTheme()}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-colors ${theme === 'light' ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-white/5' : 'border-gray-200 dark:border-white/20 hover:border-gray-300 dark:hover:border-white/40 bg-white dark:bg-transparent'}`}
          >
            <div className="w-full aspect-[4/3] rounded-lg bg-white border border-gray-200 flex flex-col gap-1.5 p-2 overflow-hidden relative shadow-sm">
              <div className="flex gap-1">
                <div className="w-2/3 h-2 rounded bg-gray-200" />
                <div className="w-1/3 h-2 rounded bg-gray-100" />
              </div>
              <div className="w-full h-8 rounded bg-gray-50 border border-gray-100" />
              <div className="w-1/2 h-2 rounded bg-gray-200 mt-auto" />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">Light</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function DangerZoneTab() {
  const { data: workspaces } = useWorkspaces();
  const activeWorkspaceId = localStorage.getItem('devcollab_active_workspace');
  const activeWorkspaceObj = workspaces?.find(w => Number(w.id) === Number(activeWorkspaceId)) || workspaces?.[0];
  const workspace = activeWorkspaceObj || { id: 0, name: 'Workspace' };
  const deleteWorkspace = useDeleteWorkspace();
  
  const { currentUser } = useAuth();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Assume they are owner for now since roles aren't fully wired for the frontend Settings page yet
  const isOwner = true;

  const handleLeave = () => {
    toast.error("Left workspace");
    // navigate out in a real app
  };

  const handleDelete = () => {
    deleteWorkspace.mutate(workspace.id);
    toast.success("Workspace deleted permanently");
    setIsDeleteDialogOpen(false);
    // navigate out in a real app
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-1 border-b border-gray-200 dark:border-[#2C2C2C] pb-4">
        <h2 className="text-xl font-bold text-red-500">Danger Zone</h2>
        <p className="text-sm text-gray-500">Irreversible and destructive actions.</p>
      </div>

      <div className="border border-red-900/50 rounded-lg p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Leave Workspace</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">You will lose access to all projects and data. Any tasks assigned to you will remain.</p>
          </div>
          <button 
            onClick={() => {
              if (confirm("Are you sure you want to leave this workspace?")) handleLeave();
            }}
            className="border border-red-500/50 text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0"
          >
            Leave Workspace
          </button>
        </div>

        {isOwner && (
          <>
            <hr className="border-red-900/30" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Delete Workspace</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">Permanently delete this workspace and all its data. This cannot be undone.</p>
              </div>
              
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <button className="bg-red-600/20 text-red-500 border border-red-600/50 hover:bg-red-600/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0">
                    Delete Workspace
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-red-500">Delete Workspace</DialogTitle>
                    <DialogDescription>
                      This will permanently delete <strong>{workspace.name}</strong> and all associated projects, tasks, and members.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Type '{workspace.name}' to confirm</label>
                      <input 
                        type="text" 
                        value={deleteConfirmText}
                        onChange={e => setDeleteConfirmText(e.target.value)}
                        className="w-full bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-md px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-500 text-sm" 
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-[#2C2C2C]">
                      <DialogClose asChild>
                        <button className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                          Cancel
                        </button>
                      </DialogClose>
                      <button 
                        disabled={deleteConfirmText !== workspace.name}
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Delete Workspace
                      </button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
