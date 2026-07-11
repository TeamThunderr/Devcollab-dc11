import React, { useState } from "react";
import { useStore } from "../store/useStore";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { UserPlus, Crown, MoreHorizontal, Search, Check, Link as LinkIcon, Trash, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useWorkspaces } from "../hooks/useWorkspaces";
import { useProjects } from "../hooks/useProjects";
import { useTasks } from "../hooks/useTasks";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../components/ui/DropdownMenu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "../components/ui/Dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useRole } from "../context/RBACContext";
import { getProjectPermissions } from "../lib/projectPermissions";

export function Members() {
  const { projectId } = useParams();
  const { role: userRole } = useRole();
  const perms = getProjectPermissions(userRole);

  const { currentUser: profile } = useAuth();
  
  const { activeWorkspaceId } = useStore();
  const { data: workspaces } = useWorkspaces();
  const activeWorkspaceObj = workspaces?.find(w => Number(w.id) === Number(activeWorkspaceId)) || workspaces?.[0];
  const workspace = activeWorkspaceObj || { id: 0, name: 'Workspace', slug: 'workspace' };
  const workspaceId = workspace.id;

  const { data: projects = [] } = useProjects(workspaceId);
  const parsedId = parseInt(projectId || "0", 10);
  const { data: tasks = [] } = useTasks(parsedId || undefined);
  
  const members = useStore(state => state.members);
  const updateMemberRole = useStore(state => state.updateMemberRole);
  const removeMember = useStore(state => state.removeMember);
  const addMember = useStore(state => state.addMember);
  const activities = useStore(state => state.activities);

  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<any | null>(null);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("Member");
  const [isInviting, setIsInviting] = useState(false);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    await addMember(workspaceId, inviteEmail.trim(), inviteRole, inviteName.trim() || undefined);
    toast.success(`Invited ${inviteEmail} to the team!`);
    setInviteEmail("");
    setInviteName("");
    setInviteRole("Member");
    setIsInviting(false);
    setIsInviteOpen(false);
  };

  const handleCopyLink = () => {
    if (!perms.canManageMembers) {
      toast.error("You do not have permission to manage invitations.");
      return;
    }
    navigator.clipboard.writeText(`https://devcollab.app/invite/${workspace.slug}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRemoveMember = () => {
    if (!perms.canManageMembers) {
      toast.error("You do not have permission to manage members.");
      setMemberToRemove(null);
      return;
    }
    if (memberToRemove) {
      removeMember(memberToRemove.id);
      toast.success(`${memberToRemove.name} removed from workspace`);
      setMemberToRemove(null);
    }
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const content = (
      <div className={`flex flex-col h-full space-y-12 relative ${projectId ? 'p-8' : ''}`}>

        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <h1 className="text-[2.5rem] font-bold tracking-[-0.03em] text-gray-900 dark:text-gray-100 leading-tight">
              Team Members
            </h1>
            <p className="text-gray-500 text-[0.9rem]">
              {members.length} members in <span className="text-gray-900 dark:text-gray-100 font-medium">{workspace.name}</span>
            </p>
          </div>

          {perms.canManageMembers && (
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 bg-transparent text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#2C2C2C] px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#2C2C2C]/50 transition-colors shadow-sm w-[160px] justify-center relative overflow-hidden"
              >
                <AnimatePresence mode="wait">
                  {isCopied ? (
                    <motion.div
                      key="copied"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="w-4 h-4 text-green-500" />
                      Copied!
                    </motion.div>
                  ) : (
                    <motion.div
                      key="copy"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Copy Invite Link
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              <button onClick={() => setIsInviteOpen(true)} className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity shadow-sm">
                <UserPlus className="w-4 h-4" />
                Invite Member
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-md focus:outline-none focus:border-gray-400 dark:focus:border-gray-600 transition-all text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
          />
        </div>

        {/* Members Table */}
        <div className="border-t border-gray-200 dark:border-[#2C2C2C]">
          <div className="grid grid-cols-12 gap-4 pb-3 border-b border-gray-200 dark:border-[#2C2C2C] text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em] mt-8">
            <div className="col-span-5">User</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-3">Joined</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-[#2C2C2C]">
            {filteredMembers.map(member => (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="grid grid-cols-12 gap-4 py-3 items-center hover:bg-gray-50 dark:hover:bg-[#191919] transition-colors cursor-pointer group"
              >
                <div className="col-span-5 flex items-center gap-3">
                  <img src={member.avatarUrl || undefined} alt="Avatar" className="w-8 h-8 rounded-full border border-gray-200 dark:border-[#2C2C2C] shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[0.9rem] text-gray-900 dark:text-gray-100 truncate">{member.name}</span>
                      {member.name === profile?.name && (
                        <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-gray-100 dark:bg-[#2C2C2C] text-gray-500 uppercase tracking-wider">YOU</span>
                      )}
                      {member.status === 'Pending' && (
                        <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 uppercase tracking-wider">PENDING</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 truncate">{member.email}</span>
                  </div>
                </div>

                <div className="col-span-3 flex items-center" onClick={(e) => e.stopPropagation()}>
                  {member.role === 'Owner' || member.name === profile?.name ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-[#2C2C2C]/50 border border-gray-200 dark:border-gray-700">
                      {member.role === 'Owner' && <Crown className="w-3 h-3 text-amber-500" />}
                      {member.role}
                    </span>
                  ) : perms.canManageMembers ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-[#2C2C2C]/50 border border-gray-200 dark:border-[#2C2C2C] hover:bg-gray-100 dark:hover:bg-[#333] transition-colors">
                          {member.role}
                          <span className="text-[10px]">▼</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {['Admin', 'Member', 'Viewer'].map(role => (
                          <DropdownMenuItem
                            key={role}
                            onClick={() => {
                              if (!perms.canManageMembers) {
                                toast.error("You do not have permission to modify roles.");
                                return;
                              }
                              updateMemberRole(member.id, role);
                              toast.success(`Role updated to ${role}`);
                            }}
                          >
                            {role}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-[#2C2C2C]/50 border border-gray-200 dark:border-gray-700">
                      {member.role}
                    </span>
                  )}
                </div>

                <div className="col-span-3 flex items-center text-xs text-gray-500">
                  {new Date(member.joinedAt || member.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>

                <div className="col-span-1 flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                  {perms.canManageMembers && member.role !== 'Owner' && member.name !== profile?.name && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-[#2C2C2C] text-gray-400 opacity-0 group-hover:opacity-100 transition-all">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 focus:text-red-600" onClick={() => setMemberToRemove(member)}>
                          <Trash className="w-4 h-4 mr-2" /> Remove from workspace
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invite Member Dialog */}
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Invite a colleague to collaborate in {workspace.name}. They will receive an email invitation.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInviteSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Full Name (Optional)</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g., Sarah Connor"
                  className="w-full bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-md px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Email Address *</label>
                <input
                  required
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="sarah@acmcorp.com"
                  className="w-full bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-md px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Workspace Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-md px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm"
                >
                  <option value="Admin">Admin (Can manage settings and team)</option>
                  <option value="Member">Member (Can create and edit tasks/code)</option>
                  <option value="Viewer">Viewer (Read-only access)</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-[#2C2C2C]">
                <button type="button" onClick={() => setIsInviteOpen(false)} className="px-4 py-2 rounded-md border border-gray-200 dark:border-[#2C2C2C] text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#191919] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isInviting} className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                  {isInviting ? "Sending Invite..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Remove Member Dialog */}
        <Dialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove {memberToRemove?.name}?</DialogTitle>
              <DialogDescription>
                They will lose access to all projects in this workspace. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <DialogClose asChild>
                <button className="px-4 py-2 rounded-md border border-gray-200 dark:border-[#2C2C2C] text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#191919] transition-colors">
                  Cancel
                </button>
              </DialogClose>
              <button
                onClick={handleRemoveMember}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Member Detail Drawer */}
        <AnimatePresence>
          {selectedMember && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedMember(null)}
                className="fixed inset-0 bg-black/20 z-40"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
                className="fixed top-0 right-0 bottom-0 w-[400px] bg-white dark:bg-[#111] border-l border-gray-200 dark:border-[#2C2C2C] shadow-2xl z-50 overflow-y-auto flex flex-col"
              >
                <div className="p-6 pb-0 flex justify-end">
                  <button onClick={() => setSelectedMember(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#2C2C2C] text-gray-500 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-8 pb-8 flex flex-col gap-6">
                  <div className="flex flex-col items-center text-center gap-3">
                    <img src={selectedMember.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full border border-gray-200 dark:border-[#2C2C2C] shadow-sm" />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedMember.name}</h2>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-[#2C2C2C]/50 border border-gray-200 dark:border-[#2C2C2C] mt-2">
                        {selectedMember.role === 'Owner' && <Crown className="w-3 h-3 text-amber-500" />}
                        {selectedMember.role}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-2 flex flex-col gap-1">
                      <span>{selectedMember.email}</span>
                      <span>Joined {new Date(selectedMember.joinedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>

                  <hr className="border-gray-100 dark:border-[#2C2C2C]" />

                  {/* Assigned Tasks */}
                  <div>
                    <div className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em] mb-4">
                      Assigned Tasks
                    </div>
                    <div className="space-y-3">
                      {(() => {
                        const memberTasks = tasks.filter(t => t.assigneeId === selectedMember.id && t.status !== 'Done');
                        if (memberTasks.length === 0) return <p className="text-sm text-gray-500 italic">No tasks assigned yet</p>;
                        return memberTasks.map(task => {
                          const project = projects.find(p => p.id === task.projectId);
                          return (
                            <div key={task.id} className="p-3 rounded-lg border border-gray-200 dark:border-[#2C2C2C] bg-gray-50 dark:bg-[#191919] hover:border-gray-300 dark:hover:bg-[#2C2C2C] cursor-pointer transition-colors" onClick={() => navigate(`/projects/${task.projectId}`)}>
                              <div className="text-xs text-gray-500 mb-1">{project?.name || 'Unknown Project'}</div>
                              <div className="text-sm text-gray-900 dark:text-white font-medium flex items-center justify-between">
                                <span>{task.title}</span>
                                <div className="w-2 h-2 rounded-full bg-gray-900 dark:bg-white" />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  <hr className="border-gray-100 dark:border-[#2C2C2C]" />

                  {/* Recent Activity */}
                  <div>
                    <div className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em] mb-4">
                      Recent Activity
                    </div>
                    <div className="relative border-l border-gray-200 dark:border-[#2C2C2C] ml-2 pl-6 space-y-6">
                      {(() => {
                        const memberActivity = activities.filter(a => a.userId === selectedMember.id).slice(0, 5);
                        if (memberActivity.length === 0) return <p className="text-sm text-gray-500 italic -ml-6">No recent activity</p>;
                        return memberActivity.map(act => {
                          const project = projects.find(p => p.id === act.projectId);
                          return (
                            <div key={act.id} className="relative">
                              <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-[#111]" />
                              <p className="text-sm text-gray-600 dark:text-gray-300 leading-tight">
                                {act.actionType || act.action} {project && <span>in <span className="font-medium text-gray-900 dark:text-white">{project.name}</span></span>}
                              </p>
                              <span className="text-xs text-gray-400 mt-1 block">
                                {new Date(act.createdAt || act.timestamp || Date.now()).toLocaleDateString()}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
  );

  if (projectId) return content;
  return <DashboardLayout title="Members">{content}</DashboardLayout>;
}
