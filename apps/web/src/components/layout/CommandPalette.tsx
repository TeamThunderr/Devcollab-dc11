import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../../context/RBACContext";
import { 
  Search, 
  Kanban, 
  CheckSquare, 
  Activity, 
  Book, 
  Code, 
  Sparkles,
  Plus,
  Users
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const permissions = usePermissions();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const rawCommands = [
    { section: "Navigation", items: [
      { id: "workspace", label: "Open Workspace", icon: Activity, action: () => navigate("/projects/devcollab/workspace"), show: true },
      { id: "board", label: "Open Board", icon: Kanban, action: () => navigate("/projects/devcollab/board"), show: true },
      { id: "tasks", label: "Open Tasks", icon: CheckSquare, action: () => navigate("/projects/devcollab/tasks"), show: true },
      { id: "wiki", label: "Open Wiki", icon: Book, action: () => navigate("/projects/devcollab/wiki"), show: true },
      { id: "snippets", label: "Open Snippets", icon: Code, action: () => navigate("/projects/devcollab/snippets"), show: true },
      { id: "ai", label: "Open AI Copilot", icon: Sparkles, action: () => navigate("/projects/devcollab/ai"), show: true },
    ]},
    { section: "Actions", items: [
      { id: "create-task", label: "Create Task", icon: Plus, action: () => { console.log("Create task"); onClose(); }, show: permissions.canCreateTask },
      { id: "create-snippet", label: "Create Snippet", icon: Code, action: () => { console.log("Create snippet"); onClose(); }, show: permissions.canCreateSnippet },
      { id: "invite", label: "Invite Member", icon: Users, action: () => { console.log("Invite"); onClose(); }, show: permissions.canInviteMembers },
    ]}
  ];

  const commands = rawCommands.map(group => ({
    ...group,
    items: group.items.filter(item => item.show)
  })).filter(group => group.items.length > 0);

  const filteredCommands = commands.map(group => ({
    ...group,
    items: group.items.filter(item => item.label.toLowerCase().includes(search.toLowerCase()))
  })).filter(group => group.items.length > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[101] overflow-y-auto pt-[10vh] sm:pt-[20vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="max-w-2xl mx-auto bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[60vh]"
            >
              <div className="flex items-center px-4 border-b border-gray-800">
                <Search className="w-5 h-5 text-gray-500" />
                <input
                  autoFocus
                  className="w-full bg-transparent border-0 px-4 py-4 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-0 text-lg"
                  placeholder="Type a command or search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <kbd className="hidden sm:inline-flex px-2 py-1 text-[10px] font-mono text-gray-500 bg-gray-800 rounded border border-gray-700">ESC</kbd>
              </div>

              <div className="overflow-y-auto flex-1 custom-scrollbar p-2">
                {filteredCommands.length === 0 ? (
                  <div className="py-10 text-center text-gray-500 text-sm">No results found.</div>
                ) : (
                  filteredCommands.map((group) => (
                    <div key={group.section} className="mb-4 last:mb-0">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 tracking-wider uppercase">
                        {group.section}
                      </div>
                      <div className="space-y-1">
                        {group.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => { item.action(); onClose(); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-gray-100 hover:bg-indigo-500/10 hover:shadow-[inset_0_0_0_1px_rgba(99,102,241,0.2)] transition-colors group text-left"
                          >
                            <div className="w-6 h-6 rounded bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                              <item.icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-medium">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
