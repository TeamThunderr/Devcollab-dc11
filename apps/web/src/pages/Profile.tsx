import React, { useState } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { ArrowLeft, Mail, Menu, Code, Github, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/Dialog";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";

export function Profile() {
  const navigate = useNavigate();
  const { currentUser: user, login } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    skills: user?.skills?.join(", ") || "",
    githubUrl: user?.githubUrl || "",
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch('/api/users/me', data);
      return response.data;
    },
    onSuccess: (updatedUser) => {
      login(updatedUser);
      setIsOpen(false);
    }
  });
  
  if (!user) return null;

  const initials = user.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name: formData.name,
      bio: formData.bio || null,
      skills: formData.skills ? formData.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      githubLink: formData.githubUrl ? formData.githubUrl : null,
    });
  };

  return (
    <DashboardLayout title="Profile">
      <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto w-full">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors w-fit font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header Section */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
            Your Profile
          </h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <button className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                Edit Profile
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:border-blue-500 min-h-[80px]"
                    placeholder="Tell us about yourself"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Skills (comma separated)</label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    placeholder="React, Node.js, TypeScript"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">GitHub Profile URL</label>
                  <input
                    type="url"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    placeholder="https://github.com/username"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800/60 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {updateProfileMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Profile Card */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 overflow-hidden flex flex-col">
          
          {/* Cover Area */}
          <div className="h-32 bg-black/10 dark:bg-white/10 w-full relative">
            {/* We can add a subtle pattern or just leave it as a solid tint */}
          </div>

          {/* Profile Info Area */}
          <div className="px-8 pb-8 relative">
            {/* Avatar overlapping cover */}
            <div className="absolute -top-12 flex items-end gap-6">
              <div className="w-24 h-24 rounded-full bg-black dark:bg-white border-4 border-white dark:border-black flex items-center justify-center text-3xl font-bold text-white dark:text-black shadow-sm overflow-hidden">
                {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" /> : initials}
              </div>
              <div className="mb-2 space-y-1">
                <h2 className="text-2xl font-bold text-black dark:text-white">{user.name}</h2>
                <div className="flex items-center gap-2 text-black/60 dark:text-white/60 text-sm">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            {/* Spacer to account for the absolutely positioned avatar block */}
            <div className="h-16"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8">
              
              {/* Left Column */}
              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-black dark:text-white font-semibold">
                    <Menu className="w-5 h-5" />
                    <h3>About Me</h3>
                  </div>
                  <p className={`text-sm ${user.bio ? "text-black/80 dark:text-white/80" : "text-black/50 dark:text-white/50 italic"}`}>
                    {user.bio || "No bio provided yet."}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-black dark:text-white font-semibold">
                    <Code className="w-5 h-5" />
                    <h3>Skills</h3>
                  </div>
                  {user.skills && user.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 rounded-md text-xs font-medium bg-black/10 dark:bg-white/10 text-black dark:text-white">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-black/50 dark:text-white/50 text-sm italic">
                      No skills added yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-black/50 dark:text-white/50 uppercase tracking-wider mb-4">
                  Connect
                </h3>
                <div className="flex items-center gap-3 text-sm">
                  <Github className="w-5 h-5 text-black/50 dark:text-white/50" />
                  {user.githubUrl ? (
                    <a href={user.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                      GitHub Profile
                    </a>
                  ) : (
                    <span className="text-black/50 dark:text-white/50">Not connected</span>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
