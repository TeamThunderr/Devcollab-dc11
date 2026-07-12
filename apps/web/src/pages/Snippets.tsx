import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Code2, Search, Plus, Star, Clock, FolderGit2, Copy, Check, Trash2, Edit3, MessageSquare, Send, TerminalSquare } from "lucide-react";
import { useRole } from "../context/RBACContext";
import { getProjectPermissions } from "../lib/projectPermissions";
import { useStore, Snippet } from "../store/useStore";
import { toast } from "sonner";
import { api } from "../lib/api";

interface Comment {
  id: string | number;
  authorName: string;
  content: string;
  createdAt: string;
}

export function Snippets() {
  const { projectId: routeId } = useParams();
  const projects = useStore(state => state.projects);
  const activeProject = projects.find(p => String(p.id) === String(routeId)) || projects[0];
  const projectId = routeId || activeProject?.id || '1';
  const { role, currentUserId } = useRole();
  const perms = getProjectPermissions(role);

  const allSnippets = useStore(state => state.snippets || []);
  const createSnippet = useStore(state => state.createSnippet);
  const updateSnippet = useStore(state => state.updateSnippet);
  const deleteSnippet = useStore(state => state.deleteSnippet);

  const projectSnippets = allSnippets.filter(s => String(s.projectId) === String(projectId));

  // Local state
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [category, setCategory] = useState("Frontend");

  // Comments state
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newCommentText, setNewCommentText] = useState("");

  const filteredSnippets = projectSnippets.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "All" || (s.tags && s.tags.includes(selectedCategory)) || selectedCategory === "Recently Used";
    return matchesSearch && matchesCat;
  });

  const handleStartCreate = () => {
    if (!perms.canCollaborate) {
      toast.error("Viewers have read-only access to snippets.");
      return;
    }
    setTitle("");
    setCode("// Write or paste code here...\n\n");
    setLanguage("typescript");
    setCategory("Frontend");
    setIsCreating(true);
    setIsEditing(false);
    setSelectedSnippet(null);
  };

  const handleStartEdit = (snip: Snippet) => {
    if (!perms.canCollaborate) return;
    setTitle(snip.title);
    setCode(snip.code);
    setLanguage(snip.language || "typescript");
    setCategory(snip.tags?.[0] || "Frontend");
    setIsEditing(true);
    setIsCreating(false);
    setSelectedSnippet(snip);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) {
      toast.error("Please provide both title and code.");
      return;
    }

    try {
      if (isCreating) {
        await createSnippet(projectId, title.trim(), code.trim(), language, [category]);
        toast.success("Snippet created successfully!");
      } else if (isEditing && selectedSnippet) {
        await updateSnippet(selectedSnippet.id, {
          title: title.trim(),
          code: code.trim(),
          language,
          tags: [category]
        });
        toast.success("Snippet updated successfully!");
      }
      setIsCreating(false);
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to save snippet.");
    }
  };

  const handleDelete = async (snipId: string | number) => {
    if (confirm("Are you sure you want to delete this snippet?")) {
      await deleteSnippet(snipId);
      toast.success("Snippet deleted.");
      if (selectedSnippet?.id === snipId) setSelectedSnippet(null);
    }
  };

  const handleCopy = (codeText: string, id: string | number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedId(id);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddComment = (snipId: string | number, e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const commentObj: Comment = {
      id: Math.random().toString(),
      authorName: "You",
      content: newCommentText.trim(),
      createdAt: "Just now"
    };
    setComments(prev => ({
      ...prev,
      [String(snipId)]: [...(prev[String(snipId)] || []), commentObj]
    }));
    setNewCommentText("");
    toast.success("Comment added");
  };

  return (
    <div className="flex h-full bg-white dark:bg-[#191919] text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-72 border-r border-gray-200 dark:border-gray-800/80 bg-gray-50/50 dark:bg-[#0a0a0a] flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Snippet Library</h2>
            {perms.canCollaborate && (
              <button
                onClick={handleStartCreate}
                className="p-1 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
                title="Create New Snippet"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search library..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-md py-1.5 pl-8 pr-3 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
          {/* Library Categories */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 px-2">Library</h3>
            <div className="space-y-0.5">
              <button 
                onClick={() => setSelectedCategory("All")}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors text-left ${
                  selectedCategory === "All" ? "bg-white dark:bg-[#191919] text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-[#2C2C2C]" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                }`}
              >
                <span className="flex items-center gap-2"><Code2 className="w-3.5 h-3.5" /> All Snippets</span>
                <span className="text-[10px] bg-gray-200 dark:bg-[#2C2C2C] px-1.5 py-0.5 rounded-full">{projectSnippets.length}</span>
              </button>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 px-2">Categories</h3>
            <div className="space-y-0.5">
              {['Frontend', 'Backend', 'Database', 'DevOps'].map(cat => {
                const count = projectSnippets.filter(s => s.tags?.includes(cat)).length;
                return (
                  <button 
                    key={cat} 
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors text-left ${
                      selectedCategory === cat ? "bg-white dark:bg-[#191919] text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-[#2C2C2C]" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <span className="flex items-center gap-2"><FolderGit2 className="w-3.5 h-3.5" /> {cat}</span>
                    <span className="text-[10px] bg-gray-200 dark:bg-[#2C2C2C] px-1.5 py-0.5 rounded-full">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Snippet List in Sidebar */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 px-2">Snippets List</h3>
            <div className="space-y-1">
              {filteredSnippets.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-400">No snippets found</div>
              ) : (
                filteredSnippets.map(snip => (
                  <button
                    key={snip.id}
                    onClick={() => { setSelectedSnippet(snip); setIsCreating(false); setIsEditing(false); }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                      selectedSnippet?.id === snip.id && !isCreating && !isEditing
                        ? "bg-white dark:bg-[#191919] border-black dark:border-white shadow-sm"
                        : "border-transparent hover:bg-gray-100 dark:hover:bg-[#181818]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{snip.title}</span>
                      <span className="text-[9px] font-mono uppercase bg-gray-100 dark:bg-[#2C2C2C] text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-800">
                        {snip.language}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate font-mono">
                      {snip.code.split('\n')[0] || '// code snippet'}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-y-auto p-8 bg-[#FBFBFA] dark:bg-[#09090b]">
        {isCreating || isEditing ? (
          /* Create / Edit Form */
          <div className="max-w-4xl mx-auto w-full bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2C2C2C] rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2C2C2C] pb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {isCreating ? "Create New Snippet" : "Edit Snippet"}
              </h2>
              <button
                type="button"
                onClick={() => { setIsCreating(false); setIsEditing(false); }}
                className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1 space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Debounce Hook"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Language</label>
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none"
                  >
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="sql">SQL</option>
                    <option value="json">JSON</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none"
                  >
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Database">Database</option>
                    <option value="DevOps">DevOps</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Code Content *</label>
                <div className="relative border border-gray-200 dark:border-[#2C2C2C] rounded-lg overflow-hidden bg-[#1e1e1e]">
                  <div className="bg-[#252526] px-4 py-1.5 text-[11px] font-mono text-gray-400 border-b border-[#3c3c3d] flex items-center justify-between">
                    <span>{language} editor</span>
                    <span>Spaces: 2</span>
                  </div>
                  <textarea
                    rows={14}
                    required
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full p-4 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs focus:outline-none resize-y leading-relaxed"
                    spellCheck="false"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setIsEditing(false); }}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-[#2C2C2C] text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
                >
                  Save Snippet
                </button>
              </div>
            </form>
          </div>
        ) : selectedSnippet ? (
          /* View Snippet Detail */
          <div className="max-w-4xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2C2C2C] rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">{selectedSnippet.title}</h1>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-gray-100 dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-800">
                    {selectedSnippet.language}
                  </span>
                  {selectedSnippet.tags?.map(t => (
                    <span key={t} className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-[#2C2C2C] text-gray-600 dark:text-gray-400 rounded">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Added on {selectedSnippet.createdAt || "Recently"} • Available to project members
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(selectedSnippet.code, selectedSnippet.id)}
                  className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm"
                >
                  {copiedId === selectedSnippet.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === selectedSnippet.id ? "Copied!" : "Copy Code"}
                </button>
                {perms.canCollaborate && (
                  <>
                    <button
                      onClick={() => handleStartEdit(selectedSnippet)}
                      className="p-2 border border-gray-200 dark:border-[#2C2C2C] rounded-lg text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#191919] transition-colors"
                      title="Edit Snippet"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(selectedSnippet.id)}
                      className="p-2 border border-gray-200 dark:border-[#2C2C2C] rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Delete Snippet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Code Box with Syntax Highlighting Styling */}
            <div className="border border-gray-200 dark:border-[#2C2C2C] rounded-xl overflow-hidden bg-[#1e1e1e] shadow-md">
              <div className="bg-[#252526] px-4 py-2 text-xs font-mono text-gray-400 border-b border-[#3c3c3d] flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TerminalSquare className="w-3.5 h-3.5 text-blue-400" />
                  {selectedSnippet.title.toLowerCase().replace(/\s+/g, '-')}.{selectedSnippet.language === 'python' ? 'py' : selectedSnippet.language === 'sql' ? 'sql' : 'ts'}
                </span>
                <span className="text-[10px] text-gray-500">UTF-8 • Monospace</span>
              </div>
              <div className="p-6 overflow-x-auto bg-[#1e1e1e] font-mono text-xs leading-relaxed text-[#d4d4d4]">
                <pre className="select-all">
                  <code>{selectedSnippet.code}</code>
                </pre>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2C2C2C] rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-500" />
                Discussion & Comments
              </h3>

              <div className="space-y-3">
                {(comments[String(selectedSnippet.id)] || []).length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">No comments yet. Start the conversation!</p>
                ) : (
                  (comments[String(selectedSnippet.id)] || []).map(c => (
                    <div key={c.id} className="p-3 bg-gray-50 dark:bg-[#191919] rounded-lg border border-gray-100 dark:border-[#2C2C2C] space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-gray-900 dark:text-gray-200">{c.authorName}</span>
                        <span className="text-gray-400">{c.createdAt}</span>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {perms.canCollaborate && (
                <form onSubmit={e => handleAddComment(selectedSnippet.id, e)} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={e => setNewCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  />
                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" /> Comment
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto my-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-[#111] rounded-2xl flex items-center justify-center mb-6 border border-gray-200 dark:border-[#2C2C2C]">
              <Code2 className="w-8 h-8 text-gray-400 dark:text-gray-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-2">
              Select or Create a Snippet
            </h1>
            <p className="text-gray-500 text-xs mb-6 leading-relaxed">
              Choose a snippet from the sidebar library to view its code, copy it to your clipboard, or join the discussion.
            </p>
            {perms.canCollaborate && (
              <button
                onClick={handleStartCreate}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create First Snippet
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

