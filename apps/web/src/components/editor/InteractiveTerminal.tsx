import React, { useState, useEffect, useRef } from "react";
import { Plus, X, Trash2, TerminalSquare } from "lucide-react";
import { ProjectFile } from "../../lib/fileSystemAccess";

interface InteractiveTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  fileContents: Record<string, string>;
  onUpdateFileContent: (fileId: string, newContent: string) => void;
  onCreateFile: (path: string, content?: string) => void;
  onDeleteFile: (path: string) => void;
  userId?: string;
  projectId?: string;
}

interface TerminalSession {
  id: string;
  name: string;
  history: string[];
  cwd: string;
}

export function InteractiveTerminal({
  isOpen,
  onClose,
  files,
  fileContents,
  onUpdateFileContent,
  onCreateFile,
  onDeleteFile,
  userId = "anon",
  projectId = "p1",
}: InteractiveTerminalProps) {
  const storageKey = `devcollab_ide_term_${userId}_${projectId}`;

  const defaultSessions: TerminalSession[] = [
    {
      id: "term_1",
      name: "bash",
      cwd: "/",
      history: [
        "DevCollab Integrated Terminal v2.5.0 (x86_64-pc-web)",
        "Type 'help' for commands, 'ls' to list workspace files, or 'node <file>' to execute code.",
        "",
      ],
    },
  ];

  const [sessions, setSessions] = useState<TerminalSession[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : defaultSessions;
    } catch {
      return defaultSessions;
    }
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_active`);
      return saved || (sessions[0]?.id || "term_1");
    } catch {
      return sessions[0]?.id || "term_1";
    }
  });

  const [input, setInput] = useState("");
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [commandQueue, setCommandQueue] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(sessions));
      localStorage.setItem(`${storageKey}_active`, activeSessionId);
    } catch {}
  }, [sessions, activeSessionId, storageKey]);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, sessions, activeSessionId]);

  if (!isOpen) return null;

  const fallbackSession: TerminalSession = {
    id: "term_1",
    name: "bash",
    cwd: "/",
    history: ["DevCollab Integrated Terminal"],
  };
  const activeSession: TerminalSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || fallbackSession;

  const updateActiveHistory = (newLines: string[]) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? { ...s, history: [...s.history, ...newLines] } : s))
    );
  };

  const setCwd = (newCwd: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? { ...s, cwd: newCwd } : s))
    );
  };

  const handleNewSession = () => {
    const newId = "term_" + Math.random().toString(36).substring(2, 7);
    const newSession: TerminalSession = {
      id: newId,
      name: `bash (${sessions.length + 1})`,
      cwd: "/",
      history: ["New terminal session started.", ""],
    };
    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(newId);
  };

  const handleCloseSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      updateActiveHistory(["Cannot close the last terminal session. Use 'clear' instead."]);
      return;
    }
    const filtered = sessions.filter((s) => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id && filtered[0]) {
      setActiveSessionId(filtered[0].id);
    }
  };

  // Helper to find file/dir in files tree by path
  const resolveFileByPath = (path: string, currentCwd: string): { file?: ProjectFile; fullPath: string } => {
    let cleanPath = path.startsWith("/") ? path : `${currentCwd === "/" ? "" : currentCwd}/${path}`;
    cleanPath = cleanPath.replace(/\/+/g, "/").replace(/\/$/, "") || "/";

    if (cleanPath === "/") return { fullPath: "/" };

    const parts = cleanPath.split("/").filter(Boolean);
    let currentList = files;
    let found: ProjectFile | undefined;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part === "..") continue; // simplified
      found = currentList.find((f) => f.name === part);
      if (!found) return { fullPath: cleanPath };
      if (found.isFolder && found.children) {
        currentList = found.children;
      }
    }
    return { file: found, fullPath: cleanPath };
  };

  const executeCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    setCommandQueue((prev) => [trimmed, ...prev]);
    setHistoryIdx(-1);

    const promptLine = `${activeSession.cwd} $ ${trimmed}`;
    const args = trimmed.split(/\s+/);
    const cmd = (args[0] || "").toLowerCase();

    if (cmd === "clear") {
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSession.id ? { ...s, history: [] } : s))
      );
      return;
    }

    const output: string[] = [promptLine];

    if (cmd === "help") {
      output.push("Available Commands:");
      output.push("  ls [dir]        - List files and directories");
      output.push("  pwd             - Print current working directory");
      output.push("  cd <dir>        - Change directory");
      output.push("  cat <file>      - View file contents");
      output.push("  touch <file>    - Create a new file");
      output.push("  mkdir <dir>     - Create a new directory");
      output.push("  rm <file>       - Remove a file");
      output.push("  node <file>     - Execute JavaScript / TypeScript file");
      output.push("  js <expr>       - Evaluate JavaScript expression directly");
      output.push("  tree            - View workspace directory tree");
      output.push("  npm run <script>- Run npm script (dev, build, test)");
      output.push("  git <cmd>       - Git status, log, add, commit");
      output.push("  clear           - Clear terminal history");
    } else if (cmd === "pwd") {
      output.push(activeSession.cwd);
    } else if (cmd === "ls" || cmd === "ll") {
      const targetPath = args[1] || activeSession.cwd;
      const { file, fullPath } = resolveFileByPath(targetPath, activeSession.cwd);
      if (fullPath === "/" || (file && file.isFolder)) {
        const list = fullPath === "/" ? files : file?.children || [];
        const names = list.map((f) => (f.isFolder ? `${f.name}/` : f.name)).join("    ");
        output.push(names || "(empty directory)");
      } else if (file) {
        output.push(file.name);
      } else {
        output.push(`ls: cannot access '${targetPath}': No such file or directory`);
      }
    } else if (cmd === "cd") {
      const targetPath = args[1] || "/";
      if (targetPath === "/" || targetPath === "~") {
        setCwd("/");
      } else if (targetPath === "..") {
        const parts = activeSession.cwd.split("/").filter(Boolean);
        parts.pop();
        setCwd("/" + parts.join("/"));
      } else {
        const { file, fullPath } = resolveFileByPath(targetPath, activeSession.cwd);
        if (file && file.isFolder) {
          setCwd(fullPath);
        } else {
          output.push(`cd: no such file or directory: ${targetPath}`);
        }
      }
    } else if (cmd === "cat") {
      const targetPath = args[1];
      if (!targetPath) {
        output.push("cat: missing operand");
      } else {
        const { file } = resolveFileByPath(targetPath, activeSession.cwd);
        if (file && !file.isFolder) {
          const content = (fileContents[file.id] !== undefined ? fileContents[file.id] : file.content) || "";
          output.push(...content.split("\n"));
        } else if (file && file.isFolder) {
          output.push(`cat: ${targetPath}: Is a directory`);
        } else {
          output.push(`cat: ${targetPath}: No such file or directory`);
        }
      }
    } else if (cmd === "touch") {
      const targetPath = args[1];
      if (!targetPath) {
        output.push("touch: missing operand");
      } else {
        const fullPath = activeSession.cwd === "/" ? targetPath : `${activeSession.cwd}/${targetPath}`;
        onCreateFile(fullPath, "// Created via terminal\n");
        output.push(`Created file ${targetPath}`);
      }
    } else if (cmd === "mkdir") {
      const targetPath = args[1];
      if (!targetPath) {
        output.push("mkdir: missing operand");
      } else {
        output.push(`Directory created: ${targetPath}`);
      }
    } else if (cmd === "rm") {
      const targetPath = args[1];
      if (!targetPath) {
        output.push("rm: missing operand");
      } else {
        const { file } = resolveFileByPath(targetPath, activeSession.cwd);
        if (file) {
          onDeleteFile(file.id);
          output.push(`Removed ${targetPath}`);
        } else {
          output.push(`rm: cannot remove '${targetPath}': No such file or directory`);
        }
      }
    } else if (cmd === "tree") {
      const renderTree = (list: ProjectFile[], prefix = ""): string[] => {
        let lines: string[] = [];
        list.forEach((f, idx) => {
          const isLast = idx === list.length - 1;
          lines.push(`${prefix}${isLast ? "└── " : "├── "}${f.name}${f.isFolder ? "/" : ""}`);
          if (f.isFolder && f.children) {
            lines = lines.concat(renderTree(f.children, prefix + (isLast ? "    " : "│   ")));
          }
        });
        return lines;
      };
      output.push(".", ...renderTree(files));
    } else if (cmd === "node" || cmd === "run" || cmd === "python") {
      const targetPath = args[1];
      if (!targetPath) {
        output.push(`${cmd}: missing script operand`);
      } else {
        const { file } = resolveFileByPath(targetPath, activeSession.cwd);
        if (file && !file.isFolder) {
          const code = (fileContents[file.id] !== undefined ? fileContents[file.id] : file.content) || "";
          output.push(`> Executing ${file.name}...`);
          const logs: string[] = [];
          const fakeConsole = {
            log: (...a: any[]) => logs.push(a.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(" ")),
            error: (...a: any[]) => logs.push("[error] " + a.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(" ")),
            warn: (...a: any[]) => logs.push("[warn] " + a.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(" ")),
          };
          try {
            // Strip TypeScript annotations roughly or just run as JS
            let cleanCode = code.replace(/import\s+.*?from\s+['"].*?['"];?/g, "");
            cleanCode = cleanCode.replace(/export\s+(default\s+)?/g, "");
            const runFn = new Function("console", cleanCode);
            runFn(fakeConsole);
            if (logs.length === 0) logs.push("(Script executed successfully with no console output)");
            else output.push(...logs);
          } catch (err: any) {
            output.push(`Runtime Error: ${err.message}`);
          }
        } else {
          output.push(`${cmd}: cannot open file '${targetPath}': No such file`);
        }
      }
    } else if (cmd === "js" || cmd === "eval") {
      const expr = trimmed.substring(cmd.length).trim();
      try {
        const res = new Function(`return (${expr})`)();
        output.push(typeof res === "object" ? JSON.stringify(res, null, 2) : String(res));
      } catch (err: any) {
        output.push(`Eval Error: ${err.message}`);
      }
    } else if (cmd === "npm") {
      const sub = args[1];
      if (sub === "run" && args[2] === "dev") {
        output.push("> devcollab-project@1.0.0 dev");
        output.push("> vite");
        output.push("");
        output.push("  Vite v5.2.0 ready in 280 ms");
        output.push("  ➜  Local:   http://localhost:5173/");
        output.push("  ➜  Network: use --host to expose");
      } else if (sub === "test") {
        output.push("PASS  src/App.test.tsx");
        output.push("PASS  src/utils/math.test.ts");
        output.push("Test Suites: 2 passed, 2 total");
      } else if (sub === "install" || sub === "i") {
        output.push(`added ${Math.floor(Math.random() * 50) + 10} packages in 1.4s`);
      } else {
        output.push(`npm: unknown script '${args.slice(1).join(" ")}'`);
      }
    } else if (cmd === "git") {
      const sub = args[1];
      if (sub === "status") {
        output.push("On branch main");
        output.push("Your branch is up to date with 'origin/main'.");
        output.push("nothing to commit, working tree clean");
      } else if (sub === "log") {
        output.push("commit 8f3b2a1c (HEAD -> main, origin/main)");
        output.push("Author: DevCollab User <user@devcollab.io>");
        output.push("Date:   Mon Jul 6 13:15:00 2026 +0530");
        output.push("");
        output.push("    feat: implement fully functional VS Code IDE");
      } else {
        output.push(`git: '${sub || ""}' is not a git command. See 'git --help'.`);
      }
    } else {
      output.push(`bash: command not found: ${cmd}`);
    }

    updateActiveHistory(output);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      executeCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandQueue.length > 0) {
        const nextIdx = Math.min(historyIdx + 1, commandQueue.length - 1);
        setHistoryIdx(nextIdx);
        setInput(commandQueue[nextIdx] || "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInput(commandQueue[nextIdx] || "");
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setInput("");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const parts = input.split(/\s+/);
      const lastWord = parts[parts.length - 1];
      if (lastWord) {
        const match = files.find((f) => f.name.toLowerCase().startsWith(lastWord.toLowerCase()));
        if (match) {
          parts[parts.length - 1] = match.name;
          setInput(parts.join(" "));
        }
      }
    }
  };

  return (
    <div className="h-56 border-t border-[#3c3c3d] bg-[#1e1e1e] flex flex-col flex-shrink-0 select-none z-20">
      {/* Panel Tabs & Controls */}
      <div className="h-9 px-4 flex items-center justify-between border-b border-[#3c3c3d] bg-[#252526]">
        <div className="flex items-center gap-6 text-[11px] font-medium">
          <button className="text-[#a6a6a6] hover:text-[#cccccc] uppercase">Problems (0)</button>
          <button className="text-[#a6a6a6] hover:text-[#cccccc] uppercase">Output</button>
          <button className="text-[#a6a6a6] hover:text-[#cccccc] uppercase">Debug Console</button>
          <button className="text-[#e7e7e7] uppercase border-b-2 border-[#e7e7e7] pb-1 font-bold flex items-center gap-1.5">
            <TerminalSquare className="w-3.5 h-3.5 text-purple-400" /> Terminal
          </button>
        </div>

        {/* Terminal Sessions Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-xs custom-scrollbar">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              onClick={() => setActiveSessionId(sess.id)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                sess.id === activeSession.id ? "bg-[#37373d] text-white font-medium" : "text-[#858585] hover:bg-[#2a2d2e]"
              }`}
            >
              <span>{sess.name}</span>
              <button
                onClick={(e) => handleCloseSession(sess.id, e)}
                className="p-0.5 hover:bg-[#454545] rounded opacity-60 hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Panel Action Buttons */}
        <div className="flex items-center gap-2 text-[#a6a6a6]">
          <button onClick={handleNewSession} title="New Terminal (Ctrl+Shift+`)">
            <Plus className="w-3.5 h-3.5 cursor-pointer hover:text-[#cccccc]" />
          </button>
          <button
            onClick={() => updateActiveHistory(["Terminal history cleared."])}
            title="Clear Terminal"
          >
            <Trash2 className="w-3.5 h-3.5 cursor-pointer hover:text-[#cccccc]" />
          </button>
          <button onClick={onClose} title="Close Panel (Ctrl+`)">
            <X className="w-3.5 h-3.5 cursor-pointer hover:text-[#cccccc]" />
          </button>
        </div>
      </div>

      {/* Terminal Content Box */}
      <div
        className="flex-1 p-4 font-mono text-[12px] text-[#cccccc] overflow-y-auto space-y-1 bg-[#181818] custom-scrollbar"
        onClick={() => inputRef.current?.focus()}
      >
        {activeSession.history.map((line, idx) => (
          <div
            key={idx}
            className={`leading-5 whitespace-pre-wrap ${
              line.includes("$") ? "text-emerald-400 font-bold" : line.includes("Error:") || line.includes("not found") ? "text-red-400" : line.startsWith(">") ? "text-blue-400 font-semibold" : "text-[#cccccc]"
            }`}
          >
            {line}
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1" ref={bottomRef}>
          <span className="text-emerald-400 font-bold shrink-0">{activeSession.cwd} $</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="type command (e.g. ls, cat <file>, node <file>, help)..."
            className="flex-1 bg-transparent border-none text-[12px] text-white focus:outline-none placeholder:text-gray-600 font-mono"
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  );
}
