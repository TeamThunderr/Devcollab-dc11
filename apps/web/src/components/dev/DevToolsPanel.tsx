import { useRole, Role } from "../../context/RBACContext";
import { Settings2, ShieldCheck } from "lucide-react";
import { useState } from "react";

export function DevToolsPanel() {
  const { role, setRole } = useRole();
  const [isOpen, setIsOpen] = useState(false);

  // Hide entirely in production
  if (!import.meta.env.DEV) {
    return null;
  }

  const roles: Role[] = ["ADMIN", "MEMBER", "VIEWER"];

  return (
    <div className="fixed bottom-6 right-6 z-[200]">
      {isOpen ? (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-4 w-64">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Dev Tools
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              &times;
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-medium text-zinc-500 mb-1 block">Simulate Role</label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {roles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            
            <div className="text-[10px] text-zinc-500 dark:text-zinc-500 leading-relaxed bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded border border-zinc-100 dark:border-zinc-800/50">
              This panel is only visible in development builds (import.meta.env.DEV).
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center"
          title="RBAC Dev Tools"
        >
          <ShieldCheck className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
