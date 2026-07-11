import React from "react";
import { Code2, Search, Save, Play, FolderOpen, FileUp, Plus, TerminalSquare, Undo, Redo, Scissors, Copy, Clipboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";

interface VSCodeMenuBarProps {
  onNewFile: () => void;
  onOpenFile: () => void;
  onOpenFolder: () => void;
  onSaveFile: () => void;
  onSaveAll: () => void;
  onCloseTab: () => void;
  onToggleTerminal: () => void;
  onToggleFind: () => void;
  onRunFile: () => void;
  onOpenCommandPalette: () => void;
  canCollaborate: boolean;
  hasUnsavedChanges: boolean;
  activeFileName?: string;
}

export function VSCodeMenuBar({
  onNewFile,
  onOpenFile,
  onOpenFolder,
  onSaveFile,
  onSaveAll,
  onCloseTab,
  onToggleTerminal,
  onToggleFind,
  onRunFile,
  onOpenCommandPalette,
  canCollaborate,
  hasUnsavedChanges,
  activeFileName,
}: VSCodeMenuBarProps) {
  return (
    <div className="h-9 flex items-center justify-between px-3 bg-[#323233] border-b border-[#1e1e1e] flex-shrink-0 text-[13px] select-none z-30">
      <div className="flex items-center gap-4">
        <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center font-bold shadow-sm">
          <Code2 className="w-3.5 h-3.5 text-black" />
        </div>
        
        <div className="flex items-center gap-1 text-[#cccccc]">
          {/* File Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <span className="cursor-pointer hover:bg-white/10 px-2 py-1 rounded text-xs transition-colors">File</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-[#252526] border-[#454545] text-[#cccccc] text-xs">
              <DropdownMenuItem onClick={onNewFile} disabled={!canCollaborate} className="flex justify-between cursor-pointer focus:bg-[#04395e] focus:text-white">
                <span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> New File...</span>
                <span className="text-[10px] text-[#858585]">Ctrl+N</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenFile} disabled={!canCollaborate} className="flex justify-between cursor-pointer focus:bg-[#04395e] focus:text-white">
                <span className="flex items-center gap-2"><FileUp className="w-3.5 h-3.5" /> Open File (System)...</span>
                <span className="text-[10px] text-[#858585]">Ctrl+O</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenFolder} disabled={!canCollaborate} className="flex justify-between cursor-pointer focus:bg-[#04395e] focus:text-white">
                <span className="flex items-center gap-2"><FolderOpen className="w-3.5 h-3.5" /> Open Folder (System)...</span>
                <span className="text-[10px] text-[#858585]">Ctrl+K Ctrl+O</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#454545]" />
              <DropdownMenuItem onClick={onSaveFile} disabled={!canCollaborate || !hasUnsavedChanges} className="flex justify-between cursor-pointer focus:bg-[#04395e] focus:text-white">
                <span className="flex items-center gap-2"><Save className="w-3.5 h-3.5" /> Save</span>
                <span className="text-[10px] text-[#858585]">Ctrl+S</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSaveAll} disabled={!canCollaborate} className="flex justify-between cursor-pointer focus:bg-[#04395e] focus:text-white">
                <span>Save All</span>
                <span className="text-[10px] text-[#858585]">Ctrl+K S</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#454545]" />
              <DropdownMenuItem onClick={onCloseTab} className="flex justify-between cursor-pointer focus:bg-[#04395e] focus:text-white">
                <span>Close Editor</span>
                <span className="text-[10px] text-[#858585]">Ctrl+W</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Edit Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <span className="cursor-pointer hover:bg-white/10 px-2 py-1 rounded text-xs transition-colors">Edit</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-[#252526] border-[#454545] text-[#cccccc] text-xs">
              <DropdownMenuItem onClick={() => document.execCommand('undo')} className="flex justify-between cursor-pointer focus:bg-[#04395e] focus:text-white">
                <span className="flex items-center gap-2"><Undo className="w-3.5 h-3.5" /> Undo</span>
                <span className="text-[10px] text-[#858585]">Ctrl+Z</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => document.execCommand('redo')} className="flex justify-between cursor-pointer focus:bg-[#04395e] focus:text-white">
                <span className="flex items-center gap-2"><Redo className="w-3.5 h-3.5" /> Redo</span>
                <span className="text-[10px] text-[#858585]">Ctrl+Y</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#454545]" />
              <DropdownMenuItem onClick={() => document.execCommand('cut')} className="flex justify-between cursor-pointer focus:bg-[#04395e] focus:text-white">
                <span className="flex items-center gap-2"><Scissors className="w-3.5 h-3.5" /> Cut</span>
                <span className="text-[10px] text-[#858585]">Ctrl+X</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => document.execCommand('copy')} className="flex justify-between cursor-pointer focus:bg-[#04395e] focus:text-white">
                <span className="flex items-center gap-2"><Copy className="w-3.5 h-3.5" /> Copy</span>
                <span className="text-[10px] text-[#858585]">Ctrl+C</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => document.execCommand('paste')} className="flex justify-between cursor-pointer focus:bg-[#04395e] focus:text-white">
                <span className="flex items-center gap-2"><Clipboard className="w-3.5 h-3.5" /> Paste</span>
                <span className="text-[10px] text-[#858585]">Ctrl+V</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#454545]" />
              <DropdownMenuItem onClick={onToggleFind} className="flex justify-between cursor-pointer focus:bg-[#04395e] focus:text-white">
                <span className="flex items-center gap-2"><Search className="w-3.5 h-3.5" /> Find & Replace</span>
                <span className="text-[10px] text-[#858585]">Ctrl+F</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <span className="cursor-pointer hover:bg-white/10 px-2 py-1 rounded text-xs transition-colors">View</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 bg-[#252526] border-[#454545] text-[#cccccc] text-xs">
              <DropdownMenuItem onClick={onOpenCommandPalette} className="flex justify-between cursor-pointer focus:bg-[#04395e] focus:text-white">
                <span>Command Palette...</span>
                <span className="text-[10px] text-[#858585]">Ctrl+Shift+P</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#454545]" />
              <DropdownMenuItem onClick={onToggleTerminal} className="flex justify-between cursor-pointer focus:bg-[#04395e] focus:text-white">
                <span className="flex items-center gap-2"><TerminalSquare className="w-3.5 h-3.5" /> Toggle Terminal</span>
                <span className="text-[10px] text-[#858585]">Ctrl+`</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Run Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <span className="cursor-pointer hover:bg-white/10 px-2 py-1 rounded text-xs transition-colors">Run</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 bg-[#252526] border-[#454545] text-[#cccccc] text-xs">
              <DropdownMenuItem onClick={onRunFile} className="flex justify-between cursor-pointer focus:bg-[#04395e] focus:text-white">
                <span className="flex items-center gap-2"><Play className="w-3.5 h-3.5 text-emerald-400" /> Run Active File</span>
                <span className="text-[10px] text-[#858585]">F5</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Terminal Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <span className="cursor-pointer hover:bg-white/10 px-2 py-1 rounded text-xs transition-colors">Terminal</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 bg-[#252526] border-[#454545] text-[#cccccc] text-xs">
              <DropdownMenuItem onClick={onToggleTerminal} className="flex justify-between cursor-pointer focus:bg-[#04395e] focus:text-white">
                <span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> New Terminal</span>
                <span className="text-[10px] text-[#858585]">Ctrl+Shift+`</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Center Search / Command Palette Bar */}
      <div className="flex-1 max-w-xl mx-4">
        <div 
          onClick={onOpenCommandPalette}
          className="bg-[#3c3c3d] border border-[#3c3c3d] hover:border-[#5a5a59] rounded-md h-6 flex items-center px-2 cursor-pointer transition-colors shadow-inner"
        >
          <Search className="w-3.5 h-3.5 text-[#a6a6a6] mr-2" />
          <span className="text-xs text-[#a6a6a6] truncate">
            {activeFileName ? `${activeFileName} — ` : ""}Search files or run commands (Ctrl+Shift+P)
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {hasUnsavedChanges && canCollaborate && (
          <button
            onClick={onSaveFile}
            className="bg-[#0e639c] hover:bg-[#1177bb] text-white px-3 py-0.5 rounded text-xs font-medium transition-colors flex items-center gap-1 shadow-sm"
          >
            <Save className="w-3 h-3" /> Save File
          </button>
        )}
        <span className="text-xs text-[#a6a6a6] bg-[#2d2d2d] px-2 py-0.5 rounded border border-[#3c3c3d]">
          {canCollaborate ? "Collaborator Mode" : "Read-Only Viewer"}
        </span>
      </div>
    </div>
  );
}
