import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, Plus, UserPlus, Zap, Building, Users, FolderOpen, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMyWorkspaces, WorkspaceMy } from "../hooks/useWorkspaces";
import { useStore } from "../store/useStore";
import { useQueryClient } from "@tanstack/react-query";
import { ThemeContext } from "../context/ThemeContext";

export function WorkspaceSelection() {
  const { currentUser } = useAuth();
  const { data: workspaces, isLoading } = useMyWorkspaces();
  const { setActiveWorkspace, updateWorkspace } = useStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const context = React.useContext(ThemeContext);
  const isDark = context?.theme === "dark";

  const [search, setSearch] = useState("");
  
  const filteredWorkspaces = workspaces?.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleOpenWorkspace = (workspace: WorkspaceMy) => {
    setActiveWorkspace(workspace.id);
    updateWorkspace({ name: workspace.name, slug: workspace.slug, description: "" });
    queryClient.invalidateQueries();
    
    // Simulate socket reconnect / workspace change event
    window.dispatchEvent(new Event("workspace:changed"));
    
    navigate("/dashboard");
  };

  const handleCreateWorkspace = () => {
    if (currentUser?.plan === 'FREE' && workspaces && workspaces.some(w => w.role === 'OWNER')) {
      alert("Free plan users can only own one workspace. Please upgrade to Pro to create more.");
      return;
    }
    // For now, redirect to a generic create modal or page if we had one.
    // In a complete implementation, this would open a CreateWorkspaceModal.
    alert("Create workspace modal would open here");
  };

  const handleJoinWorkspace = () => {
    // In a complete implementation, this would open a JoinWorkspaceModal.
    alert("Join workspace modal would open here");
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen w-full flex flex-col items-center p-8 transition-colors duration-700 ${isDark ? "bg-[#000000] text-white" : "bg-[#f4f4f5] text-black"}`}>
        <div className="w-full max-w-4xl mt-12 mb-8">
          <div className="h-10 w-48 bg-gray-300 dark:bg-gray-800 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-300 dark:bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`h-48 rounded-2xl animate-pulse ${isDark ? "bg-[#111]" : "bg-white"}`} />
          ))}
        </div>
      </div>
    );
  }

  if (workspaces?.length === 0) {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center p-4 transition-colors duration-700 ${isDark ? "bg-[#000000] text-white" : "bg-[#f4f4f5] text-black"}`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`max-w-md w-full p-8 md:p-10 rounded-3xl text-center border shadow-2xl ${
            isDark ? "bg-[#0a0a0a] border-white/10 shadow-[0_0_100px_rgba(255,255,255,0.03)]" : "bg-white border-black/10 shadow-[0_20px_100px_rgba(0,0,0,0.08)]"
          }`}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm bg-indigo-500/10 text-indigo-500">
            <Zap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to DevCollab</h2>
          <p className={`text-sm mb-8 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            You don't belong to any workspaces yet. Get started by creating a new workspace for your team or joining an existing one.
          </p>
          
          <div className="space-y-3">
            <button 
              onClick={handleCreateWorkspace}
              className={`w-full py-3.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
                isDark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              <Plus className="w-4 h-4" />
              Create a Workspace
            </button>
            <button 
              onClick={handleJoinWorkspace}
              className={`w-full py-3.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 border ${
                isDark ? "border-white/10 hover:bg-white/5" : "border-black/10 hover:bg-black/5"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Join a Workspace
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full flex flex-col items-center p-6 md:p-12 transition-colors duration-700 ${isDark ? "bg-[#000000] text-white" : "bg-[#f4f4f5] text-black"}`}>
      
      {/* Header */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Select Workspace</h1>
          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Choose a workspace to enter, or create a new one.
          </p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <button 
            onClick={handleJoinWorkspace}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
              isDark ? "border-white/10 hover:bg-white/5" : "border-black/10 hover:bg-black/5"
            }`}
          >
            Join Workspace
          </button>
          <button 
            onClick={handleCreateWorkspace}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
              isDark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </motion.div>
      </div>

      {/* Search (only if > 5 workspaces) */}
      {(workspaces?.length || 0) > 5 && (
        <div className="w-full max-w-5xl mb-8 relative">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
          <input 
            type="text" 
            placeholder="Search workspaces..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full max-w-md pl-11 pr-4 py-3 rounded-xl border outline-none transition-all ${
              isDark 
                ? "bg-[#111] border-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30 placeholder:text-gray-600" 
                : "bg-white border-black/10 focus:border-black/30 focus:ring-1 focus:ring-black/30 shadow-sm placeholder:text-gray-400"
            }`}
          />
        </div>
      )}

      {/* Grid */}
      <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        <AnimatePresence>
          {filteredWorkspaces.map((workspace, index) => (
            <motion.div
              key={workspace.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleOpenWorkspace(workspace)}
              className={`group cursor-pointer rounded-2xl border p-5 md:p-6 transition-all duration-300 hover:scale-[1.02] flex flex-col ${
                isDark 
                  ? "bg-[#0a0a0a] border-white/10 hover:border-white/20 hover:bg-[#111]" 
                  : "bg-white border-black/10 hover:border-black/20 hover:shadow-lg shadow-sm"
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${
                  workspace.logo ? "" : isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"
                }`}>
                  {workspace.logo ? (
                    <img src={workspace.logo} alt={workspace.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    workspace.name.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full ${
                  workspace.plan === 'PRO' 
                    ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20" 
                    : isDark ? "bg-white/10 text-gray-300" : "bg-black/5 text-gray-600"
                }`}>
                  {workspace.plan}
                </div>
              </div>

              <div className="mb-4 flex-grow">
                <h3 className="font-semibold text-lg mb-1 truncate">{workspace.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-indigo-500 font-medium">
                  <Building className="w-3.5 h-3.5" />
                  {workspace.role}
                </div>
              </div>

              <div className={`flex items-center gap-4 text-sm mt-auto pt-4 border-t ${
                isDark ? "border-white/10 text-gray-400" : "border-black/5 text-gray-500"
              }`}>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{workspace.memberCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4" />
                  <span>{workspace.projectCount}</span>
                </div>
                <div className={`ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-8 h-8 rounded-full ${
                  isDark ? "bg-white/10" : "bg-black/5"
                }`}>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredWorkspaces.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No workspaces found matching "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
