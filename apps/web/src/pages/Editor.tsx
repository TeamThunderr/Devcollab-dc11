import React, { useState, useEffect, useRef } from "react";
import MonacoEditor from "@monaco-editor/react";
import { useStore } from "../store/useStore";
import { useAuth } from "../context/AuthContext";
import { useParams } from "react-router-dom";
import { 
  Files, 
  Search, 
  GitMerge, 
  Play, 
  Blocks, 
  Settings,
  X,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Code2,
  TerminalSquare,
  FileCode,
  FileText,
  FileJson,
  Folder,
  FolderOpen,
  Save
} from "lucide-react";
import { toast } from "sonner";
import { useRole } from "../context/RBACContext";
import { getProjectPermissions } from "../lib/projectPermissions";
import { 
  ProjectFile, 
  openLocalDirectory, 
  openLocalFiles, 
  saveToLocalDisk, 
  readFilesFromInput,
  getLanguageFromName
} from "../lib/fileSystemAccess";
import { VSCodeMenuBar } from "../components/editor/VSCodeMenuBar";
import { CommandPaletteModal } from "../components/editor/CommandPaletteModal";
import { EditorFindReplace } from "../components/editor/EditorFindReplace";
import { InteractiveTerminal } from "../components/editor/InteractiveTerminal";

const defaultFiles: ProjectFile[] = [];

export function Editor() {
  const { role } = useRole();
  const perms = getProjectPermissions(role);
  const { currentUser } = useAuth();
  const { projectId } = useParams();

  // User & Project Scoped Storage Prefix (clean_v1 ensures no old demo files are loaded)
  const storagePrefix = `devcollab_ide_clean_v1_${currentUser?.id || "anon"}_${projectId || "default"}_`;

  const [files, setFiles] = useState<ProjectFile[]>(() => {
    try {
      const saved = localStorage.getItem(storagePrefix + "files");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [openFileIds, setOpenFileIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storagePrefix + "openFileIds");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [activeFileId, setActiveFileId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(storagePrefix + "activeFileId");
      return saved ? saved : null;
    } catch { return null; }
  });

  const [fileContents, setFileContents] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(storagePrefix + "fileContents");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [unsavedFiles, setUnsavedFiles] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storagePrefix + "unsavedFiles");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storagePrefix + "expandedFolders");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [cursorPositions, setCursorPositions] = useState<Record<string, { line: number; col: number; start: number; top: number }>>(() => {
    try {
      const saved = localStorage.getItem(storagePrefix + "cursorPositions");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(storagePrefix + "isTerminalOpen");
      return saved !== null ? JSON.parse(saved) : true;
    } catch { return true; }
  });

  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [paletteMode, setPaletteMode] = useState<"commands" | "files">("commands");
  const [terminalCommandTrigger, setTerminalCommandTrigger] = useState<string>("");
  const [isCreatePromptOpen, setIsCreatePromptOpen] = useState(false);
  const [createPromptValue, setCreatePromptValue] = useState("");
  const [createPromptCallback, setCreatePromptCallback] = useState<((val: string) => void) | null>(null);

  const editorRef = useRef<any>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist state changes per user & project
  useEffect(() => {
    try {
      localStorage.setItem(storagePrefix + "files", JSON.stringify(files));
      localStorage.setItem(storagePrefix + "openFileIds", JSON.stringify(openFileIds));
      if (activeFileId) localStorage.setItem(storagePrefix + "activeFileId", activeFileId);
      localStorage.setItem(storagePrefix + "fileContents", JSON.stringify(fileContents));
      localStorage.setItem(storagePrefix + "unsavedFiles", JSON.stringify(unsavedFiles));
      localStorage.setItem(storagePrefix + "expandedFolders", JSON.stringify(expandedFolders));
      localStorage.setItem(storagePrefix + "cursorPositions", JSON.stringify(cursorPositions));
      localStorage.setItem(storagePrefix + "isTerminalOpen", JSON.stringify(isTerminalOpen));
    } catch {}
  }, [files, openFileIds, activeFileId, fileContents, unsavedFiles, expandedFolders, cursorPositions, isTerminalOpen, storagePrefix]);

  // Helper to find file by id
  const findFile = (fileList: ProjectFile[], id: string): ProjectFile | null => {
    for (const f of fileList) {
      if (f.id === id) return f;
      if (f.children) {
        const found = findFile(f.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const activeFile = activeFileId ? findFile(files, activeFileId) : null;

  // Restore cursor and scroll when switching active tab
  useEffect(() => {
    if (activeFileId && editorRef.current && cursorPositions[activeFileId]) {
      const pos = cursorPositions[activeFileId];
      const editor = editorRef.current;
      setTimeout(() => {
        const model = editor.getModel();
        if (model) {
          const position = model.getPositionAt(pos.start || 0);
          editor.setPosition(position);
          editor.setScrollTop(pos.top || 0);
        }
      }, 50);
    }
  }, [activeFileId]);

  const handleOpenFile = (file: ProjectFile) => {
    if (file.isFolder) {
      setExpandedFolders(prev => ({ ...prev, [file.id]: !prev[file.id] }));
      return;
    }
    if (!openFileIds.includes(file.id)) {
      setOpenFileIds(prev => [...prev, file.id]);
    }
    setActiveFileId(file.id);
  };

  const handleCloseTab = (id?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetId = id || activeFileId;
    if (!targetId) return;
    const newOpen = openFileIds.filter(fid => fid !== targetId);
    setOpenFileIds(newOpen);
    if (activeFileId === targetId) {
      setActiveFileId(newOpen.length > 0 ? (newOpen[newOpen.length - 1] || null) : null);
    }
  };

  const handleCodeChange = (newCode: string) => {
    if (!activeFileId) return;
    if (!perms.canCollaborate) {
      toast.error("Viewers have read-only access to code files.");
      return;
    }
    setFileContents(prev => ({ ...prev, [activeFileId]: newCode }));
    setUnsavedFiles(prev => ({ ...prev, [activeFileId]: true }));
  };

  const handleSaveFile = async () => {
    if (!activeFileId || !activeFile) return;
    if (!unsavedFiles[activeFileId]) {
      toast.info(`No changes to save in ${activeFile.name}`);
      return;
    }
    
    // Check if file is attached to a local disk handle
    const currentContent = fileContents[activeFileId] !== undefined ? fileContents[activeFileId] : activeFile.content;
    const updatedFile = { ...activeFile, content: currentContent };
    
    const savedToDisk = await saveToLocalDisk(updatedFile);
    
    setUnsavedFiles(prev => ({ ...prev, [activeFileId]: false }));
    if (savedToDisk && activeFile.fileHandle) {
      toast.success(`Saved ${activeFile.name} directly to local disk!`);
    } else {
      toast.success(`Saved ${activeFile.name} to workspace!`);
    }

    useStore.getState().addActivity({
      id: Math.random().toString(36).substr(2, 9),
      projectId: projectId || 'p1',
      userId: currentUser?.id || 'm1',
      action: `saved changes to code file "${activeFile.name}"`,
      timestamp: new Date().toISOString()
    });
  };

  const handleSaveAll = async () => {
    const dirtyIds = Object.keys(unsavedFiles).filter(id => unsavedFiles[id]);
    if (dirtyIds.length === 0) {
      toast.info("All files are already saved.");
      return;
    }
    for (const id of dirtyIds) {
      const file = findFile(files, id);
      if (file) {
        const content = fileContents[id] !== undefined ? fileContents[id] : file.content;
        await saveToLocalDisk({ ...file, content });
      }
    }
    setUnsavedFiles({});
    toast.success(`Saved all (${dirtyIds.length}) modified files!`);
  };

  const handleCreateFile = (customPath?: string, customContent?: string) => {
    if (!perms.canCollaborate) {
      toast.error("Viewers cannot create files.");
      return;
    }
    if (typeof customPath === "string") {
      const name = customPath.split("/").pop()!;
      createFileWithDetails(name, customContent);
    } else {
      setCreatePromptValue("");
      setCreatePromptCallback(() => (name: string) => {
        if (name.trim()) {
          createFileWithDetails(name.trim(), customContent);
        }
      });
      setIsCreatePromptOpen(true);
    }
  };

  const createFileWithDetails = (name: string, customContent?: string) => {
    const newId = "f_" + Math.random().toString(36).substring(2, 8);
    const content = customContent !== undefined ? customContent : "// New file: " + name + "\n\n";
    const newFile: ProjectFile = {
      id: newId,
      name: name,
      language: getLanguageFromName(name),
      content
    };
    setFiles(prev => [...prev, newFile]);
    setFileContents(prev => ({ ...prev, [newId]: content }));
    setOpenFileIds(prev => [...prev, newId]);
    setActiveFileId(newId);
    toast.success(`Created file ${name}`);
  };

  const handleDeleteFile = (fileIdOrPath: string) => {
    if (!perms.canCollaborate) return;
    let targetId = fileIdOrPath;
    if (fileIdOrPath.includes("/") || fileIdOrPath.includes(".")) {
      const found = files.find(f => f.name === fileIdOrPath.split("/").pop());
      if (found) targetId = found.id;
    }
    setFiles(prev => prev.filter(f => f.id !== targetId));
    setOpenFileIds(prev => prev.filter(id => id !== targetId));
    if (activeFileId === targetId) {
      setActiveFileId(openFileIds.length > 1 ? (openFileIds[0] || null) : null);
    }
  };

  // Local File System Access Handlers - use frontend dialogs directly to avoid localhost permission popups
  const handleOpenSystemFolder = async () => {
    folderInputRef.current?.click();
  };

  const handleOpenSystemFile = async () => {
    fileInputRef.current?.click();
  };

  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const loadedFiles = await readFilesFromInput(e.target.files);
      if (loadedFiles.length > 0) {
        const firstPath = e.target.files[0]?.webkitRelativePath || "";
        const folderName = firstPath.includes("/") ? firstPath.split("/")[0] : "OPENED_FOLDER";
        const rootFolder: ProjectFile = {
          id: "f_" + Math.random().toString(36).substring(2, 9),
          name: folderName || "OPENED_FOLDER",
          language: "folder",
          content: "",
          isFolder: true,
          children: loadedFiles
        };
        setFiles(prev => [rootFolder, ...prev]);
        setExpandedFolders(prev => ({ ...prev, [rootFolder.id]: true }));
        
        // Automatically open the first file or README if available
        const firstFile = loadedFiles.find(f => f.name.toLowerCase() === "readme.md") || loadedFiles[0];
        if (firstFile) {
          setFileContents(prev => ({ ...prev, [firstFile.id]: firstFile.content }));
          setOpenFileIds(prev => prev.includes(firstFile.id) ? prev : [...prev, firstFile.id]);
          setActiveFileId(firstFile.id);
        }
        
        toast.success(`Loaded folder "${folderName}" (${loadedFiles.length} files)!`);
      }
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const loadedFiles = await readFilesFromInput(e.target.files);
      if (loadedFiles.length > 0) {
        setFiles(prev => [...prev, ...loadedFiles]);
        const newContents: Record<string, string> = {};
        const newIds: string[] = [];
        loadedFiles.forEach(f => {
          newContents[f.id] = f.content;
          newIds.push(f.id);
        });
        setFileContents(prev => ({ ...prev, ...newContents }));
        setOpenFileIds(prev => [...prev, ...newIds]);
        setActiveFileId(newIds[0] || null);
        toast.success(`Opened ${loadedFiles.length} file(s)!`);
      }
    }
  };

  const handleRunFile = () => {
    if (!activeFile) return;
    setIsTerminalOpen(true);
    setTerminalCommandTrigger(`node ${activeFile.name}`);
  };

  const handleRunPaletteCommand = (commandId: string) => {
    switch (commandId) {
      case "new_file": handleCreateFile(); break;
      case "open_file": handleOpenSystemFile(); break;
      case "open_folder": handleOpenSystemFolder(); break;
      case "save_file": handleSaveFile(); break;
      case "save_all": handleSaveAll(); break;
      case "toggle_terminal": setIsTerminalOpen(prev => !prev); break;
      case "toggle_find": setIsFindOpen(prev => !prev); break;
      case "run_file": handleRunFile(); break;
      case "new_terminal": setIsTerminalOpen(true); break;
      default: break;
    }
  };

  // Track cursor line and column
  const handleTextareaSelect = () => {
    if (!activeFileId || !editorRef.current) return;
    const editor = editorRef.current;
    const position = editor.getPosition();
    if (!position) return;
    const model = editor.getModel();
    const start = model ? model.getOffsetAt(position) : 0;
    const top = editor.getScrollTop();
    const line = position.lineNumber;
    const col = position.column;

    setCursorPositions(prev => ({
      ...prev,
      [activeFileId]: { line, col, start, top }
    }));
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveFile();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "o" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        handleOpenSystemFile();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "p" && !e.shiftKey) {
        e.preventDefault();
        setPaletteMode("files");
        setIsCommandPaletteOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setPaletteMode("commands");
        setIsCommandPaletteOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setIsFindOpen(prev => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "`") {
        e.preventDefault();
        setIsTerminalOpen(prev => !prev);
      } else if (e.key === "F5") {
        e.preventDefault();
        handleRunFile();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFileId, unsavedFiles, files, fileContents]);

  const getFileIcon = (name: string, isFolder?: boolean, isOpen?: boolean) => {
    if (isFolder) return isOpen ? <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" /> : <Folder className="w-4 h-4 text-amber-400 shrink-0" />;
    if (name.endsWith(".ts") || name.endsWith(".tsx")) return <FileCode className="w-4 h-4 text-blue-400 shrink-0" />;
    if (name.endsWith(".json")) return <FileJson className="w-4 h-4 text-yellow-400 shrink-0" />;
    return <FileText className="w-4 h-4 text-gray-400 shrink-0" />;
  };

  const renderFileTree = (fileList: ProjectFile[], depth = 0) => {
    return fileList.map(file => {
      const isFolder = file.isFolder;
      const isOpen = expandedFolders[file.id];
      const isSelected = activeFileId === file.id;

      return (
        <React.Fragment key={file.id}>
          <div
            onClick={() => handleOpenFile(file)}
            style={{ paddingLeft: `${depth * 12 + 12}px` }}
            className={`flex items-center gap-2 py-1 text-[13px] cursor-pointer hover:bg-[#2a2d2e] transition-colors select-none ${
              isSelected ? "bg-[#37373d] text-white font-medium" : "text-[#cccccc]"
            }`}
          >
            {isFolder && (
              isOpen ? <ChevronDown className="w-3.5 h-3.5 text-[#cccccc]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#cccccc]" />
            )}
            {!isFolder && <span className="w-3.5" />}
            {getFileIcon(file.name, isFolder, isOpen)}
            <span className="truncate">{file.name}</span>
            {unsavedFiles[file.id] && <span className="w-2 h-2 rounded-full bg-white ml-auto mr-2 shrink-0" />}
          </div>
          {isFolder && isOpen && file.children && (
            <div>{renderFileTree(file.children, depth + 1)}</div>
          )}
        </React.Fragment>
      );
    });
  };

  const activeCursor = activeFileId && cursorPositions[activeFileId] ? cursorPositions[activeFileId] : { line: 1, col: 1 };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-[#cccccc] font-sans overflow-hidden relative">
      {/* Hidden fallback inputs for browsers without Web File System Access API */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderInputChange}
        style={{ display: "none" }}
        {...({ webkitdirectory: "", directory: "" } as any)}
        multiple
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        style={{ display: "none" }}
        multiple
      />

      {/* VS Code Top Menu Bar */}
      <VSCodeMenuBar
        onNewFile={() => handleCreateFile()}
        onOpenFile={handleOpenSystemFile}
        onOpenFolder={handleOpenSystemFolder}
        onSaveFile={handleSaveFile}
        onSaveAll={handleSaveAll}
        onCloseTab={() => handleCloseTab()}
        onToggleTerminal={() => setIsTerminalOpen(prev => !prev)}
        onToggleFind={() => setIsFindOpen(prev => !prev)}
        onRunFile={handleRunFile}
        onOpenCommandPalette={() => {
          setPaletteMode("commands");
          setIsCommandPaletteOpen(true);
        }}
        canCollaborate={perms.canCollaborate}
        hasUnsavedChanges={activeFileId ? !!unsavedFiles[activeFileId] : false}
        activeFileName={activeFile?.name}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Activity Bar (Thin Left Menu) */}
        <div className="w-12 bg-[#333333] flex flex-col items-center py-2 flex-shrink-0 justify-between select-none z-10">
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="w-full flex justify-center border-l-2 border-[#ffffff] cursor-pointer" title="Explorer">
              <Files className="w-6 h-6 text-white" />
            </div>
            <div 
              onClick={() => {
                setPaletteMode("files");
                setIsCommandPaletteOpen(true);
              }}
              className="w-full flex justify-center border-l-2 border-transparent opacity-40 hover:opacity-100 cursor-pointer" 
              title="Search Files (Ctrl+P)"
            >
              <Search className="w-6 h-6" />
            </div>
            <div className="w-full flex justify-center border-l-2 border-transparent opacity-40 hover:opacity-100 cursor-pointer" title="Source Control">
              <GitMerge className="w-6 h-6" />
            </div>
            <div onClick={handleRunFile} className="w-full flex justify-center border-l-2 border-transparent opacity-40 hover:opacity-100 cursor-pointer" title="Run & Debug (F5)">
              <Play className="w-6 h-6" />
            </div>
            <div className="w-full flex justify-center border-l-2 border-transparent opacity-40 hover:opacity-100 cursor-pointer" title="Extensions">
              <Blocks className="w-6 h-6" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 w-full mb-2">
            <div className="w-full flex justify-center border-l-2 border-transparent opacity-40 hover:opacity-100 cursor-pointer">
              <Settings className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Explorer Sidebar */}
        <div className="w-64 bg-[#252526] flex flex-col flex-shrink-0 border-r border-[#1e1e1e] select-none z-10">
          <div className="h-9 px-4 flex items-center justify-between uppercase text-[11px] font-semibold text-[#cccccc]">
            <span>Explorer</span>
            <div className="flex items-center gap-2">
              <button onClick={handleOpenSystemFolder} title="Open Local Folder" className="hover:text-white">
                <FolderOpen className="w-3.5 h-3.5" />
              </button>
              <MoreHorizontal className="w-4 h-4 cursor-pointer hover:text-white" />
            </div>
          </div>
          
          <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-[#cccccc] cursor-pointer hover:bg-[#2a2d2e] group">
            <div className="flex items-center gap-1 truncate">
              <ChevronDown className="w-4 h-4 shrink-0" />
              <span className="truncate">DEVCOLLAB-PROJECT</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={() => handleCreateFile()} title="New File" className="p-0.5 hover:bg-[#37373d] rounded">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
            {files.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#858585] flex flex-col items-center gap-2 mt-4 select-none">
                <p className="mb-1">No folder or file opened yet.</p>
                <button
                  onClick={handleOpenSystemFolder}
                  className="bg-[#0e639c] hover:bg-[#1177bb] text-white px-3 py-1.5 rounded text-[11px] font-medium transition-colors shadow-sm w-full flex items-center justify-center gap-1.5"
                >
                  <FolderOpen className="w-3.5 h-3.5" /> Open Folder
                </button>
                <button
                  onClick={handleOpenSystemFile}
                  className="bg-[#333] hover:bg-[#444] text-white px-3 py-1.5 rounded text-[11px] font-medium transition-colors shadow-sm w-full flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> Open File
                </button>
              </div>
            ) : (
              renderFileTree(files)
            )}
          </div>
        </div>

        {/* Editor & Terminal Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
          
          {/* Tab Bar */}
          <div className="h-9 bg-[#252526] flex items-center overflow-x-auto border-b border-[#1e1e1e] flex-shrink-0 custom-scrollbar select-none">
            {openFileIds.map(fid => {
              const file = findFile(files, fid);
              if (!file) return null;
              const isActive = activeFileId === fid;
              const isDirty = unsavedFiles[fid];

              return (
                <div
                  key={fid}
                  onClick={() => setActiveFileId(fid)}
                  className={`h-full px-3 flex items-center gap-2 border-r border-[#1e1e1e] text-[13px] cursor-pointer min-w-[120px] max-w-[200px] shrink-0 ${
                    isActive ? "bg-[#1e1e1e] text-white border-t-2 border-t-[#007acc]" : "bg-[#2d2d2d] text-[#969696] hover:bg-[#2b2b2c]"
                  }`}
                >
                  {getFileIcon(file.name)}
                  <span className="truncate flex-1">{file.name}</span>
                  {isDirty ? (
                    <span className="w-2 h-2 rounded-full bg-white ml-1 shrink-0" />
                  ) : (
                    <button
                      onClick={e => handleCloseTab(fid, e)}
                      className="p-0.5 hover:bg-[#333333] rounded opacity-60 hover:opacity-100 shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col relative overflow-hidden bg-[#1e1e1e]">
            {/* Find & Replace Floating Widget */}
            <EditorFindReplace
              isOpen={isFindOpen}
              onClose={() => setIsFindOpen(false)}
              content={activeFileId ? fileContents[activeFileId] || "" : ""}
              onReplaceContent={(newContent) => handleCodeChange(newContent)}
            />

            {activeFile ? (
              <div className="flex-1 flex overflow-hidden">
                <MonacoEditor
                  height="100%"
                  width="100%"
                  theme="vs-dark"
                  language={getLanguageFromName(activeFile.name)}
                  value={fileContents[activeFile.id] !== undefined ? fileContents[activeFile.id] : activeFile.content}
                  onChange={(val) => handleCodeChange(val || "")}
                  onMount={(editor) => {
                    editorRef.current = editor;
                    editor.onDidChangeCursorPosition(() => {
                      handleTextareaSelect();
                    });
                    editor.onDidScrollChange(() => {
                      handleTextareaSelect();
                    });
                  }}
                  options={{
                    fontSize: 13,
                    lineHeight: 20,
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: "on",
                    padding: { top: 12 },
                  }}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
                <Code2 className="w-20 h-20 text-[#3c3c3d] mb-4 animate-pulse" />
                <h2 className="text-lg text-[#cccccc] mb-2 font-semibold">No file open</h2>
                <p className="text-xs text-[#858585] mb-6 max-w-sm">Select a file from the Explorer sidebar, use <kbd className="bg-[#333] px-1 rounded text-[#ccc]">Ctrl+P</kbd> to quick open, or open a folder from your system.</p>
                <div className="flex items-center gap-3">
                  {perms.canCollaborate && (
                    <button
                      onClick={() => handleCreateFile()}
                      className="bg-[#0e639c] hover:bg-[#1177bb] text-white px-4 py-1.5 rounded text-xs font-medium transition-colors shadow-sm"
                    >
                      Create File
                    </button>
                  )}
                  <button
                    onClick={handleOpenSystemFolder}
                    className="bg-[#333] hover:bg-[#444] text-white px-4 py-1.5 rounded text-xs font-medium transition-colors shadow-sm"
                  >
                    Open System Folder...
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Panel (Terminal) */}
          <InteractiveTerminal
            isOpen={isTerminalOpen}
            onClose={() => setIsTerminalOpen(false)}
            files={files}
            fileContents={fileContents}
            onUpdateFileContent={(fid, content) => {
              setFileContents(prev => ({ ...prev, [fid]: content }));
              setUnsavedFiles(prev => ({ ...prev, [fid]: true }));
            }}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            userId={currentUser?.id}
            projectId={projectId}
          />

        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-[#007acc] text-white flex items-center justify-between px-3 text-[11px] flex-shrink-0 select-none z-30">
        <div className="flex items-center gap-4">
          <div onClick={() => setIsTerminalOpen(prev => !prev)} className="flex items-center gap-1 cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded transition-colors">
            <TerminalSquare className="w-3 h-3" />
            <span>DevCollab IDE Active</span>
          </div>
          <span className="cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded">main*</span>
          {activeFile && <span className="uppercase font-semibold">{activeFile.language}</span>}
        </div>
        <div className="flex items-center gap-3">
          {!isTerminalOpen && (
            <button onClick={() => setIsTerminalOpen(true)} className="hover:bg-white/20 px-1.5 py-0.5 rounded transition-colors">
              Show Terminal
            </button>
          )}
          <div className="cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded">UTF-8</div>
          <div className="cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded">Ln {activeCursor.line}, Col {activeCursor.col}</div>
          <div className="cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded font-semibold">DevCollab v2.5</div>
        </div>
      </div>

      {/* Command Palette / Quick File Open Overlay */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        files={files}
        onSelectFile={(f) => handleOpenFile(f)}
        onRunCommand={handleRunPaletteCommand}
        initialMode={paletteMode}
      />

      {/* Beautiful Frontend Create File Modal (replacing localhost native prompt) */}
      {isCreatePromptOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#252526] border border-[#454545] rounded-lg shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-semibold text-[#cccccc]">Create New File</h3>
            <input
              type="text"
              placeholder="e.g. utils.ts"
              value={createPromptValue}
              onChange={(e) => setCreatePromptValue(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#3c3c3d] rounded px-3 py-2 text-sm text-[#cccccc] focus:outline-none focus:border-[#007acc]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (createPromptCallback) createPromptCallback(createPromptValue);
                  setIsCreatePromptOpen(false);
                } else if (e.key === "Escape") {
                  setIsCreatePromptOpen(false);
                }
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setIsCreatePromptOpen(false)}
                className="px-4 py-1.5 rounded bg-[#333] hover:bg-[#444] text-[#ccc]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (createPromptCallback) createPromptCallback(createPromptValue);
                  setIsCreatePromptOpen(false);
                }}
                className="px-4 py-1.5 rounded bg-[#0e639c] hover:bg-[#1177bb] text-white"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
