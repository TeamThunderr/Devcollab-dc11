import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/Dialog";
import { useJoinWorkspace } from "../../hooks/useWorkspaces";
import { Loader2 } from "lucide-react";

interface JoinWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (workspaceId: number) => void;
}

export function JoinWorkspaceModal({ isOpen, onClose, onSuccess }: JoinWorkspaceModalProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  
  const joinMutation = useJoinWorkspace();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Please enter an invitation code.");
      return;
    }

    joinMutation.mutate(
      code.trim(),
      {
        onSuccess: (data) => {
          setCode("");
          onClose();
          onSuccess(data.workspaceId);
        },
        onError: (err: any) => {
          setError(err?.response?.data?.message || "Failed to join workspace. Please check the code and try again.");
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Workspace</DialogTitle>
          <DialogDescription>
            Enter the invitation code of the workspace you've been invited to join.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="code" className="text-sm font-medium">Invitation Code</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. DEV-1A2B3C4D"
              className="w-full px-3 py-2 border rounded-lg outline-none transition-all dark:bg-[#111] border-black/10 dark:border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase"
              required
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
