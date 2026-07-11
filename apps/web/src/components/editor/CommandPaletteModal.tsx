import React, { useState, useEffect, useRef } from "react";
import { Search, FileCode, FileText, FileJson, TerminalSquare, FolderOpen, Play, Save, Plus, FileUp, X, ChevronRight } from "lucide-react";
import { ProjectFile } from "../../lib/fileSystemAccess";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  onSelectFile: (file: ProjectFile) => void;
  onRunCommand: (commandId: string) => void;
  initialMode?: "files" | "commands";
}

interface CommandItem {
  id: string;
  label: string;
  category: string;
  icon: React.ReactNode;
  shortcut?: string;
}

export function CommandPaletteModal({
  isOpen,
  onClose,
  files,
  onSelectFile,
  onRunCommand,
  initialMode = "commands",
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialMode === "commands" ? ">" : "");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialMode]);

  // Flatten file tree for searching
  const flattenFiles = (fileList: ProjectFile[], path = ""): { file: ProjectFile; fullPath: string }[] => {
    let list: { file: ProjectFile; fullPath: string }[] = [];
    for (const f of fileList) {
      const currentPath = path ? `${path}/${f.name}` : f.name;
      if (f.isFolder && f.children) {
        list = list.concat(flattenFiles(f.children, currentPath));
      } else if (!f.isFolder) {
        list.push({ file: f, fullPath: currentPath });
      }
    }
    return list;
  };

  const allFiles = flattenFiles(files);

  const commands: CommandItem[] = [
    { id: "new_file", label: "New File...", category: "File", icon: <Plus className="w-4 h-4 text-blue-400" />, shortcut: "Ctrl+N" },
    { id: "open_file", label: "Open File (System)...", category: "File", icon: <FileUp className="w-4 h-4 text-blue-400" />, shortcut: "Ctrl+O" },
    { id: "open_folder", label: "Open Folder (System)...", category: "File", icon: <FolderOpen className="w-4 h-4 text-amber-400" />, shortcut: "Ctrl+K Ctrl+O" },
    { id: "save_file", label: "Save Active File", category: "File", icon: <Save className="w-4 h-4 text-emerald-400" />, shortcut: "Ctrl+S" },
    { id: "save_all", label: "Save All Files", category: "File", icon: <Save className="w-4 h-4 text-emerald-400" />, shortcut: "Ctrl+K S" },
    { id: "toggle_terminal", label: "Toggle Terminal Panel", category: "View", icon: <TerminalSquare className="w-4 h-4 text-purple-400" />, shortcut: "Ctrl+`" },
    { id: "toggle_find", label: "Toggle Find & Replace", category: "Edit", icon: <Search className="w-4 h-4 text-yellow-400" />, shortcut: "Ctrl+F" },
    { id: "run_file", label: "Run Active File", category: "Run", icon: <Play className="w-4 h-4 text-emerald-400" />, shortcut: "F5" },
    { id: "new_terminal", label: "Create New Terminal Session", category: "Terminal", icon: <Plus className="w-4 h-4 text-purple-400" />, shortcut: "Ctrl+Shift+`" },
  ];

  const isCommandMode = query.startsWith(">");
  const cleanQuery = isCommandMode ? query.slice(1).trim().toLowerCase() : query.trim().toLowerCase();

  const filteredCommands = isCommandMode
    ? commands.filter(c => c.label.toLowerCase().includes(cleanQuery) || c.category.toLowerCase().includes(cleanQuery))
    : [];

  const filteredFiles = !isCommandMode
    ? allFiles.filter(f => f.fullPath.toLowerCase().includes(cleanQuery))
    : [];

  const totalItems = isCommandMode ? filteredCommands.length : filteredFiles.length;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (totalItems || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (totalItems || 1)) % (totalItems || 1));
    } else if (e.key === "Enter" && totalItems > 0) {
      e.preventDefault();
      if (isCommandMode) {
        const cmd = filteredCommands[selectedIndex];
        if (cmd) onRunCommand(cmd.id);
      } else {
        const item = filteredFiles[selectedIndex];
        if (item) onSelectFile(item.file);
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-center pt-12 select-none" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-[#252526] border border-[#454545] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[400px] animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Input Bar */}
        <div className="flex items-center px-3 py-2 border-b border-[#3c3c3d] bg-[#1e1e1e]">
          <Search className="w-4 h-4 text-[#858585] mr-2.5 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isCommandMode ? "Type a command..." : "Type the name of a file to open..."}
            className="flex-1 bg-transparent border-none text-sm text-[#cccccc] placeholder:text-[#6e6e6e] focus:outline-none font-mono"
            spellCheck="false"
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-1 hover:bg-[#333] rounded text-[#858585] hover:text-[#ccc]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
          {totalItems === 0 ? (
            <div className="py-8 text-center text-xs text-[#858585]">
              No matching {isCommandMode ? "commands" : "files"} found.
            </div>
          ) : isCommandMode ? (
            filteredCommands.map((cmd, idx) => (
              <div
                key={cmd.id}
                onClick={() => {
                  onRunCommand(cmd.id);
                  onClose();
                }}
                className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer ${
                  idx === selectedIndex ? "bg-[#04395e] text-white" : "text-[#cccccc] hover:bg-[#2a2d2e]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {cmd.icon}
                  <span className="font-semibold text-[11px] opacity-70">{cmd.category}:</span>
                  <span>{cmd.label}</span>
                </div>
                {cmd.shortcut && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${idx === selectedIndex ? "bg-white/10 text-white" : "bg-[#333] text-[#858585]"}`}>
                    {cmd.shortcut}
                  </span>
                )}
              </div>
            ))
          ) : (
            filteredFiles.map((item, idx) => {
              const isTs = item.file.name.endsWith(".ts") || item.file.name.endsWith(".tsx");
              const isJson = item.file.name.endsWith(".json");
              return (
                <div
                  key={item.file.id}
                  onClick={() => {
                    onSelectFile(item.file);
                    onClose();
                  }}
                  className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer ${
                    idx === selectedIndex ? "bg-[#04395e] text-white" : "text-[#cccccc] hover:bg-[#2a2d2e]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {isTs ? <FileCode className="w-4 h-4 text-blue-400 shrink-0" /> : isJson ? <FileJson className="w-4 h-4 text-yellow-400 shrink-0" /> : <FileText className="w-4 h-4 text-gray-400 shrink-0" />}
                    <span className="font-medium">{item.file.name}</span>
                    <span className={`text-[11px] truncate ${idx === selectedIndex ? "text-blue-200" : "text-[#858585]"}`}>
                      — {item.fullPath}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
                </div>
              );
            })
          )}
        </div>
        
        {/* Footer Hint */}
        <div className="px-3 py-1.5 bg-[#1e1e1e] border-t border-[#3c3c3d] flex items-center justify-between text-[10px] text-[#858585]">
          <span>Tip: Type <code className="bg-[#333] px-1 py-0.5 rounded text-[#ccc]">&gt;</code> to run commands, or remove it to search files.</span>
          <span><kbd className="bg-[#333] px-1 rounded">↑↓</kbd> to navigate, <kbd className="bg-[#333] px-1 rounded">Enter</kbd> to select</span>
        </div>
      </div>
    </div>
  );
}
