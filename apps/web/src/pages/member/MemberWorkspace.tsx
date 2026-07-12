import React, { useState } from "react";
import { useStore } from "../../store/useStore";
import { Code2, TerminalSquare, FileCode, Pin, Plus, Trash2, Copy, Check, ExternalLink, GitBranch, Clock } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { useRole } from "../../context/RBACContext";

interface MemberWorkspaceProps {
  projectId?: string;
}

export function MemberWorkspace({ projectId: propsId }: MemberWorkspaceProps = {}) {
  const { projectId: routeId } = useParams();
  const projects = useStore(state => state.projects);
  const activeProject = projects.find(p => String(p.id) === String(routeId || propsId)) || projects[0];
  const projectId = propsId || routeId || activeProject?.id;
  const { currentUserId } = useRole();
  const navigate = useNavigate();
  const snippets = useStore(state => state.snippets);
  const saveSnippet = useStore(state => state.saveSnippet);
  const deleteSnippet = useStore(state => state.deleteSnippet);
  const togglePinSnippet = useStore(state => state.togglePinSnippet);

  const [scratchTitle, setScratchTitle] = useState("");
  const [scratchCode, setScratchCode] = useState("// Draft your reusable code snippet or helper function here...\nconst formatResponse = (data) => {\n  return JSON.stringify(data, null, 2);\n};");
  const [scratchLang, setScratchLang] = useState("typescript");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSaveScratch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scratchTitle.trim()) {
      toast.error("Please provide a snippet title");
      return;
    }
    saveSnippet({
      projectId: projectId || "1",
      title: scratchTitle,
      code: scratchCode,
      language: scratchLang,
      category: "General",
      authorId: currentUserId || "1",
      pinned: false
    });
    toast.success("Snippet saved to project library!");
    setScratchTitle("");
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const recentSnippets = snippets.slice(0, 6);

  // Simulated recent project files edited by the contributor
  const recentFiles = [
    { name: "src/api/endpoints.ts", branch: "feature/auth-jwt", lastEdited: "10 mins ago", type: "typescript" },
    { name: "src/components/auth/LoginForm.tsx", branch: "feature/auth-jwt", lastEdited: "45 mins ago", type: "tsx" },
    { name: "src/store/useStore.ts", branch: "main", lastEdited: "2 hours ago", type: "typescript" },
    { name: "src/index.css", branch: "ui/theme-polish", lastEdited: "Yesterday", type: "css" },
  ];

  return (
    <div className="space-y-10 pb-16 max-w-7xl mx-auto px-6 sm:px-8 md:px-12 w-full py-10">
      {/* Monochrome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 dark:border-[#2C2C2C] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-gray-200 dark:border-[#2C2C2C] bg-gray-50 dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <TerminalSquare className="w-3.5 h-3.5" />
            My Workspace • Engineering Environment
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Code & Snippet Hub
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your recent project files, reusable code snippets, and active development scratchpad.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate(`/projects/${projectId}/snippets`)}
            className="px-4 py-2.5 rounded-md bg-white dark:bg-[#191919] hover:bg-gray-50 dark:hover:bg-[#2C2C2C] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#2C2C2C] font-medium text-xs transition-all shadow-sm flex items-center gap-2"
          >
            <Code2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            Full Snippet Library
          </button>
          <button
            onClick={() => navigate(`/projects/${projectId}/editor`)}
            className="px-5 py-2.5 rounded-md bg-black dark:bg-white text-white dark:text-black font-medium text-xs shadow-sm transition-opacity hover:opacity-90 flex items-center gap-2"
          >
            <TerminalSquare className="w-4 h-4" />
            Launch VS Code IDE
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Files & Pinned Snippets */}
        <div className="lg:col-span-7 space-y-8">
          {/* Recently Edited Project Files */}
          <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2C2C2C] pb-4">
              <div>
                <div className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em]">Active Files</div>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-0.5">Recently Edited Files</h2>
              </div>
              <span className="text-xs text-gray-500">Active branches</span>
            </div>

            <div className="space-y-2.5">
              {recentFiles.map((file, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/projects/${projectId}/editor`)}
                  className="p-3.5 rounded-md border border-gray-200 dark:border-[#2C2C2C] bg-gray-50/40 dark:bg-[#191919]/40 hover:bg-gray-100 dark:hover:bg-[#2C2C2C] transition-all cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-md border border-gray-200 dark:border-[#2C2C2C] bg-white dark:bg-[#191919] text-gray-700 dark:text-gray-300 shrink-0">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 block truncate group-hover:underline transition-all">
                        {file.name}
                      </span>
                      <span className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <GitBranch className="w-3 h-3 text-gray-400" /> {file.branch}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {file.lastEdited}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent & Pinned Snippets Grid */}
          <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2C2C2C] pb-4">
              <div>
                <div className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em]">Library</div>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-0.5">Recent & Pinned Snippets ({snippets.length})</h2>
              </div>
              <button
                onClick={() => navigate(`/projects/${projectId}/snippets`)}
                className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                View Library →
              </button>
            </div>

            {snippets.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs">No snippets stored yet. Use the scratchpad to save one!</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentSnippets.map(snippet => (
                  <div key={snippet.id} className="p-4 rounded-md border border-gray-200 dark:border-[#2C2C2C] bg-gray-50/50 dark:bg-[#191919]/50 flex flex-col justify-between gap-3 relative group">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-gray-900 dark:text-gray-100 truncate">{snippet.title}</span>
                        <button
                          onClick={() => togglePinSnippet(snippet.id)}
                          className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2C2C2C] transition-colors ${
                            snippet.pinned ? "text-gray-900 dark:text-white font-bold" : "text-gray-400"
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-gray-200 dark:border-[#2C2C2C] bg-white dark:bg-[#191919] text-gray-700 dark:text-gray-300 uppercase">
                        {snippet.language}
                      </span>
                    </div>

                    <pre className="text-[11px] font-mono bg-black dark:bg-[#141414] text-gray-200 p-2.5 rounded border border-gray-800 overflow-x-auto max-h-24">
                      <code>{snippet.code}</code>
                    </pre>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-gray-400">{snippet.updatedAt}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(snippet.code, String(snippet.id))}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2C2C2C] text-gray-500 dark:text-gray-400 transition-colors"
                          title="Copy Code"
                        >
                          {copiedId === snippet.id ? <Check className="w-3.5 h-3.5 text-gray-900 dark:text-white" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => deleteSnippet(snippet.id)}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2C2C2C] text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                          title="Delete Snippet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Code Scratchpad */}
        <div className="lg:col-span-5 bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <form onSubmit={handleSaveScratch} className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2C2C2C] pb-3">
              <div>
                <div className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em]">Drafting</div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-0.5">Code Scratchpad</h3>
              </div>
              <span className="text-[11px] text-gray-500">Instant draft</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Snippet Title</label>
                <input
                  type="text"
                  placeholder="e.g. JWT Validation Helper"
                  value={scratchTitle}
                  onChange={e => setScratchTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-[#2C2C2C] bg-white dark:bg-[#191919] text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Language</label>
                <select
                  value={scratchLang}
                  onChange={e => setScratchLang(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-[#2C2C2C] bg-white dark:bg-[#191919] text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all shadow-sm"
                >
                  <option value="typescript">TypeScript / TSX</option>
                  <option value="javascript">JavaScript / JSX</option>
                  <option value="python">Python</option>
                  <option value="css">CSS / Tailwind</option>
                  <option value="sql">SQL</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Code Draft</label>
                <textarea
                  rows={8}
                  value={scratchCode}
                  onChange={e => setScratchCode(e.target.value)}
                  className="w-full font-mono text-xs p-3 rounded-md border border-gray-200 dark:border-[#2C2C2C] bg-black dark:bg-[#141414] text-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all resize-none shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-md bg-black dark:bg-white text-white dark:text-black font-medium text-xs shadow-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Save Snippet to Library
            </button>
          </form>

          <div className="p-4 rounded-md border border-gray-200 dark:border-[#2C2C2C] bg-gray-50/50 dark:bg-[#191919]/50 text-xs text-gray-700 dark:text-gray-300 flex items-center justify-between">
            <span>Need AI code generation? Use the <button onClick={() => navigate(`/projects/${projectId}/ai`)} className="font-semibold underline">AI Assistant</button> to refactor snippets automatically.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
