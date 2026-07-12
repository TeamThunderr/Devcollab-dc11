import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/Dialog";
import { useJoinWorkspace } from "../../hooks/useWorkspaces";
import { useStore } from "../../store/useStore";
import { Loader2, Link as LinkIcon } from "lucide-react";

interface JoinWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinWorkspaceModal({ isOpen, onClose }: JoinWorkspaceModalProps) {
  const [slugInput, setSlugInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState("");
  const joinMutation = useJoinWorkspace();
  const { setActiveWorkspace } = useStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanSlug = slugInput.trim();
    let extractedCode = codeInput.trim();

    try {
      if (cleanSlug.includes("http://") || cleanSlug.includes("https://") || cleanSlug.includes("?")) {
        const urlObj = new URL(cleanSlug.startsWith("http") ? cleanSlug : `https://dummy.com/${cleanSlug}`);
        const parts = urlObj.pathname.split("/").filter(Boolean);
        if (parts.length > 0) {
          cleanSlug = parts[parts.length - 1] || "";
        }
        const codeParam = urlObj.searchParams.get("code");
        if (codeParam && !extractedCode) {
          extractedCode = codeParam;
        }
      } else {
        cleanSlug = cleanSlug.split("/").pop() || "";
      }
    } catch {
      cleanSlug = cleanSlug.split("/").pop() || "";
    }

    if (!cleanSlug) {
      setError("Please enter a valid workspace slug or invitation link");
      return;
    }
    if (!extractedCode) {
      setError("Please enter the invitation code provided by your admin");
      return;
    }
    setError("");
    try {
      const res = await joinMutation.mutateAsync({ slug: cleanSlug, code: extractedCode });
      setSlugInput("");
      setCodeInput("");
      onClose();
      if (res?.workspaceId) {
        setActiveWorkspace(res.workspaceId);
      }
      await queryClient.invalidateQueries({ queryKey: ["my-workspaces"] });
      window.dispatchEvent(new Event("workspace:changed"));
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to join workspace. Invalid slug or code.";
      setError(msg);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Workspace</DialogTitle>
          <DialogDescription>
            Enter the URL slug (or invite link) and invitation code provided by your team administrator.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="slugInput" className="text-sm font-medium">Workspace Slug / Invite Link</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="slugInput"
                type="text"
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                placeholder="e.g. acme-corp or https://devcollab.com/invite/acme-corp?code=ABC12345"
                className="w-full pl-9 pr-3 py-2 border rounded-lg outline-none transition-all dark:bg-[#111] border-black/10 dark:border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="codeInput" className="text-sm font-medium">Invitation Code</label>
            <input
              id="codeInput"
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="e.g. ABC12345"
              className="w-full px-3 py-2 border rounded-lg outline-none transition-all dark:bg-[#111] border-black/10 dark:border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase tracking-wider font-mono"
              required
            />
            <p className="text-xs text-gray-500">If using a full invite URL with `?code=`, this will auto-fill or can be typed manually.</p>
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
              disabled={joinMutation.isPending}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {joinMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Joining...
                </>
              ) : (
                "Join Workspace"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
