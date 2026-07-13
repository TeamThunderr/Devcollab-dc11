import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Book, Clock, Pin, FileText, Plus, Edit3, Trash2, Check, X } from "lucide-react";
import { useRole } from "../context/RBACContext";
import { getProjectPermissions } from "../lib/projectPermissions";
import { useStore, Doc } from "../store/useStore";
import { toast } from "sonner";

export function Wiki() {
  const { projectId } = useParams();
  const { role } = useRole();
  const perms = getProjectPermissions(role);

  const allDocs = useStore(state => state.docs || []);
  const createDoc = useStore(state => state.createDoc);
  const updateDoc = useStore(state => state.updateDoc);
  const deleteDoc = useStore(state => state.deleteDoc);

  const activeProjectId = projectId || '1';
  const projectDocs = allDocs.filter(d => String(d.projectId) === String(activeProjectId));

  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(projectDocs[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  React.useEffect(() => {
    setSelectedDoc(projectDocs[0] || null);
    setIsEditing(false);
    setIsCreating(false);
  }, [projectId, projectDocs.length]);

  const handleStartCreate = () => {
    if (!perms.canCollaborate) {
      toast.error("Read-only access.");
      return;
    }
    setTitle("");
    setContent("# New Documentation Page\n\nWrite your project notes, architecture guidelines, or sprint requirements here.\n\n## Overview\n- Point 1\n- Point 2\n");
    setIsCreating(true);
    setIsEditing(false);
    setSelectedDoc(null);
  };

  const handleStartEdit = (doc: Doc) => {
    if (!perms.canCollaborate) return;
    setTitle(doc.title);
    setContent(doc.content);
    setIsEditing(true);
    setIsCreating(false);
    setSelectedDoc(doc);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please provide both title and content.");
      return;
    }

    try {
      if (isCreating) {
        await createDoc(activeProjectId, title.trim(), content.trim());
        toast.success("Wiki page created successfully!");
      } else if (isEditing && selectedDoc) {
        await updateDoc(selectedDoc.id, {
          title: title.trim(),
          content: content.trim()
        });
        toast.success("Wiki page updated successfully!");
      }
      setIsCreating(false);
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to save wiki page.");
    }
  };

  const handleDelete = async (docId: string | number) => {
    if (!perms.canDeleteWiki && role !== 'ADMIN' && (role as string) !== 'OWNER') {
      toast.error("Only Admins can delete wiki pages.");
      return;
    }
    if (confirm("Are you sure you want to delete this wiki page?")) {
      await deleteDoc(docId);
      toast.success("Wiki page deleted.");
      if (selectedDoc?.id === docId) setSelectedDoc(null);
    }
  };

  // Simple Markdown renderer
  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, idx) => {
      if (line.startsWith("# ")) {
        return <h1 key={idx} className="text-2xl font-black text-gray-900 dark:text-white mt-6 mb-3 border-b border-gray-200 dark:border-gray-800 pb-2">{line.replace("# ", "")}</h1>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={idx} className="text-lg font-bold text-gray-900 dark:text-white mt-5 mb-2">{line.replace("## ", "")}</h2>;
      }
      if (line.startsWith("### ")) {
        return <h3 key={idx} className="text-base font-semibold text-gray-900 dark:text-white mt-4 mb-2">{line.replace("### ", "")}</h3>;
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-sm text-gray-700 dark:text-gray-300 my-1">
            {line.substring(2)}
          </li>
        );
      }
      if (line.startsWith("```")) {
        return null; // Handle basic code blocks or skip fence
      }
      if (!line.trim()) {
        return <div key={idx} className="h-3" />;
      }
      return <p key={idx} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed my-1.5">{line}</p>;
    });
  };

  return (
    <div className="flex h-full bg-white dark:bg-[#191919] text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Sidebar Tree */}
      <div className="w-72 border-r border-gray-200 dark:border-gray-800/80 bg-gray-50/50 dark:bg-[#0a0a0a] flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800/80 flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Knowledge Hub</h2>
          {perms.canCollaborate && (
            <button
              onClick={handleStartCreate}
              className="p-1 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
              title="New Wiki Page"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
          {/* Pinned / All Pages */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5 px-2">
              <Pin className="w-3 h-3" /> Project Documents
            </h3>
            <div className="space-y-1">
              {projectDocs.length === 0 ? (
                <div className="px-2 py-4 text-xs text-gray-400 text-center">No wiki pages created yet</div>
              ) : (
                projectDocs.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => { setSelectedDoc(doc); setIsCreating(false); setIsEditing(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-all text-left truncate ${
                      selectedDoc?.id === doc.id && !isCreating && !isEditing
                        ? "bg-white dark:bg-[#191919] text-gray-900 dark:text-white shadow-sm border border-black dark:border-white font-bold"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#181818] border border-transparent"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{doc.title}</span>
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
                {isCreating ? "Create New Wiki Page" : "Edit Wiki Page"}
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
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Page Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Architecture Overview & System Design"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Content (Markdown Supported) *</label>
                  <span className="text-[10px] text-gray-400">Use # for headings, - for lists</span>
                </div>
                <textarea
                  rows={18}
                  required
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg text-xs font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white resize-y leading-relaxed"
                />
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
                  className="px-5 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Save Page
                </button>
              </div>
            </form>
          </div>
        ) : selectedDoc ? (
          /* View Document Detail */
          <div className="max-w-4xl mx-auto w-full bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2C2C2C] rounded-xl p-8 shadow-sm space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-[#2C2C2C] pb-6">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{selectedDoc.title}</h1>
                <p className="text-xs text-gray-500 mt-1">
                  Last updated on {selectedDoc.createdAt || "Recently"} • Knowledge Hub
                </p>
              </div>

              <div className="flex items-center gap-2">
                {perms.canCollaborate && (
                  <button
                    onClick={() => handleStartEdit(selectedDoc)}
                    className="px-3 py-1.5 border border-gray-200 dark:border-[#2C2C2C] rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#191919] transition-colors flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Page
                  </button>
                )}
                {(role === 'ADMIN' || (role as string) === 'OWNER') && (
                  <button
                    onClick={() => handleDelete(selectedDoc.id)}
                    className="p-1.5 border border-gray-200 dark:border-[#2C2C2C] rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Delete Page"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Formatted Markdown Content */}
            <div className="prose dark:prose-invert max-w-none pt-2 pb-6">
              {renderMarkdown(selectedDoc.content)}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto my-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-[#111] rounded-2xl flex items-center justify-center mb-6 border border-gray-200 dark:border-[#2C2C2C]">
              <Book className="w-8 h-8 text-gray-400 dark:text-gray-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-2">
              Document Project Knowledge
            </h1>
            <p className="text-gray-500 text-xs mb-6 leading-relaxed">
              Create architecture docs, requirements, sprint goals, and technical guides to keep your team aligned.
            </p>
            {perms.canCollaborate && (
              <button
                onClick={handleStartCreate}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create First Page
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

