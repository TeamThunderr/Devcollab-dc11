import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/Dialog";
import { useCreateWorkspace } from "../../hooks/useWorkspaces";
import { Loader2 } from "lucide-react";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWorkspaceModal({ isOpen, onClose }: CreateWorkspaceModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  
  const createMutation = useCreateWorkspace();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    // Auto-generate slug from name if user hasn't typed a custom slug, or just always update for simplicity
    if (!slug || slug === name.slice(0, -1).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")) {
        setSlug(newName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (name.length < 2) {
      setError("Workspace name must be at least 2 characters.");
      return;
    }
    if (slug.length < 2) {
      setError("Workspace URL slug must be at least 2 characters.");
      return;
    }

    createMutation.mutate(
      { name, slug, description },
      {
        onSuccess: () => {
          setName("");
          setSlug("");
          setDescription("");
          onClose();
        },
        onError: (err: any) => {
          setError(err?.response?.data?.message || "Failed to create workspace. Slug might already be in use.");
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Workspace</DialogTitle>
          <DialogDescription>
            Workspaces are where your team can collaborate on projects, manage tasks, and share code snippets.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium">Workspace Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Acme Corp"
              className="w-full px-3 py-2 border rounded-lg outline-none transition-all dark:bg-[#111] border-black/10 dark:border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="slug" className="text-sm font-medium">Workspace URL Slug</label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="acme-corp"
              className="w-full px-3 py-2 border rounded-lg outline-none transition-all dark:bg-[#111] border-black/10 dark:border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="text-sm font-medium">Description (Optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of your workspace..."
              rows={3}
              className="w-full px-3 py-2 border rounded-lg outline-none transition-all dark:bg-[#111] border-black/10 dark:border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                </>
              ) : (
                "Create Workspace"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
