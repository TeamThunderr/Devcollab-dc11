import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Target, Hand } from 'lucide-react';

type Tab = 'home' | 'tasks' | 'docs' | 'chat';

const aiSuggestions: Record<Tab, { icon: React.ReactNode; text: string }[]> = {
  home: [
    { icon: <Sparkles className="w-3 h-3 text-black dark:text-white" />, text: "Summarize project" },
    { icon: <Target className="w-3 h-3 text-gray-700 dark:text-gray-300" />, text: "Find related tasks" }
  ],
  tasks: [
    { icon: <Sparkles className="w-3 h-3 text-black dark:text-white" />, text: "Identify blocked tasks" },
    { icon: <Target className="w-3 h-3 text-gray-700 dark:text-gray-300" />, text: "Create sprint report" }
  ],
  docs: [
    { icon: <Sparkles className="w-3 h-3 text-black dark:text-white" />, text: "Summarize document" },
    { icon: <Target className="w-3 h-3 text-gray-700 dark:text-gray-300" />, text: "Generate examples" }
  ],
  chat: [
    { icon: <Sparkles className="w-3 h-3 text-black dark:text-white" />, text: "Summarize chat" },
    { icon: <Target className="w-3 h-3 text-gray-700 dark:text-gray-300" />, text: "Extract action items" }
  ]
};

export function InteractiveDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 10, rotateY: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, rotateY: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
      className="relative z-10 w-full rounded-2xl bg-[#09090B] border border-black/5 dark:border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.25)] overflow-hidden flex flex-col h-[580px] text-black dark:text-white transform scale-[0.85] xl:scale-100 origin-top-right max-w-full"
    >
      <div className="flex flex-1 overflow-hidden h-full">
        {/* LEFT SIDEBAR */}
        <div className="w-[140px] xl:w-40 max-w-[160px] border-r border-black/5 dark:border-white/5 flex flex-col py-3 bg-[#0B0B0C] flex-shrink-0">
          <div className="px-4 py-2.5 mb-4 flex items-center gap-2 font-bold text-[11px] xl:text-xs text-black dark:text-white border-b border-black/5 dark:border-white/5">
            <svg className="w-3 xl:w-3.5 h-3 xl:h-3.5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M13 2 L3 14 h9 l-1 8 L21 10 h-9 z"/>
            </svg>
            <span>DevCollab</span>
          </div>
          
          <div className="flex flex-col gap-0.5 px-2 mb-4">
            <SidebarItem
              active={activeTab === 'home'}
              onClick={() => handleTabChange('home')}
              icon={<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
              label="Home"
            />
            <SidebarItem
              active={activeTab === 'tasks'}
              onClick={() => handleTabChange('tasks')}
              icon={<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
              label="Tasks"
            />
            <SidebarItem
              active={activeTab === 'docs'}
              onClick={() => handleTabChange('docs')}
              icon={<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
              label="Docs"
            />
            <SidebarItem
              active={activeTab === 'chat'}
              onClick={() => handleTabChange('chat')}
              icon={<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
              label="Chat"
            />
          </div>
          
          <div className="text-[8px] xl:text-[9px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 px-3 flex items-center justify-between uppercase tracking-wider">
            Favorites
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div className="flex flex-col gap-0.5 px-2">
            <div className="px-2 py-1 rounded-md text-[9px] xl:text-[10px] text-gray-700 dark:text-gray-300 flex items-center gap-2 hover:bg-white/[0.02] transition-colors cursor-default">
              <span className="w-1 h-1 xl:w-1.5 xl:h-1.5 rounded-full bg-gray-400"></span> Frontend Team
            </div>
            <div className="px-2 py-1 rounded-md text-[9px] xl:text-[10px] text-gray-700 dark:text-gray-300 flex items-center gap-2 hover:bg-white/[0.02] transition-colors cursor-default">
              <span className="w-1 h-1 xl:w-1.5 xl:h-1.5 rounded-full bg-gray-300"></span> API Integration
            </div>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#070708]">
          {/* TOP BAR */}
          <div className="h-10 border-b border-black/5 dark:border-white/5 flex items-center justify-between px-3 xl:px-4 bg-[#0A0A0B] flex-shrink-0">
            <div className="flex-1 max-w-[200px]">
              <div className="bg-[#121214] border border-black/5 dark:border-white/5 rounded px-2 py-1 text-[9px] xl:text-[10px] text-gray-700 dark:text-gray-300 flex items-center justify-between w-full transition-all duration-300 focus-within:ring-1 focus-within:ring-white/20">
                <div className="flex items-center gap-1.5 w-full">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
                  <input type="text" placeholder="Search anything..." className="bg-transparent border-none outline-none text-white w-full text-[9px] xl:text-[10px]" />
                </div>
                <span className="text-[7px] xl:text-[8px] font-mono text-gray-600 bg-black/5 dark:bg-theme-glow px-1 rounded flex-shrink-0">⌘K</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 xl:gap-3">
              <div className="relative text-gray-700 dark:text-gray-300 hover:text-black dark:text-white cursor-pointer transition-transform hover:scale-110">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
              </div>
              <div className="w-5 h-5 rounded-full overflow-hidden border border-black/5 dark:border-white/5 bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-[10px] font-bold text-black dark:text-white transition-transform hover:scale-105 cursor-pointer">
                T
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto relative h-full">
            <AnimatePresence mode="wait">
              {activeTab === 'home' && <HomeView key="home" />}
              {activeTab === 'tasks' && <TasksView key="tasks" />}
              {activeTab === 'docs' && <DocsView key="docs" />}
              {activeTab === 'chat' && <ChatView key="chat" />}
            </AnimatePresence>
          </div>
        </div>

        {/* AI Assistant Panel */}
        <div className="hidden sm:flex w-[160px] xl:w-[190px] border-l border-black/5 dark:border-white/5 bg-[#0B0B0C] flex-col flex-shrink-0 py-3">
          <div className="px-3 xl:px-4 pb-2.5 flex items-center gap-1.5 font-bold text-[10px] xl:text-xs text-black dark:text-white border-b border-black/5 dark:border-white/5">
            <Sparkles className="w-3 h-3 text-black dark:text-white" />
            <span>AI Assistant</span>
          </div>
          
          <div className="flex-1 p-2.5 flex flex-col gap-2 xl:gap-3 overflow-y-auto">
            <div className="bg-[#131316] border border-black/5 dark:border-white/5 rounded-lg p-2 text-[9px] xl:text-[10px] text-gray-700 dark:text-gray-300 leading-normal">
              What can I help you with today?
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-1"
              >
                {aiSuggestions[activeTab].map((suggestion, idx) => (
                  <div key={idx} className="flex items-center justify-between px-2 py-1.5 rounded bg-[#131316] border border-black/5 dark:border-white/5 text-[8px] xl:text-[9px] text-gray-700 dark:text-gray-300 hover:text-black dark:text-white hover:bg-white/[0.04] transition-colors cursor-pointer w-full group">
                    <div className="flex items-center gap-1.5">
                      {suggestion.icon}
                      <span>{suggestion.text}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
          
          <div className="p-2 border-t border-black/5 dark:border-white/5">
            <div className="bg-[#131316] border border-black/5 dark:border-white/5 rounded px-2 py-1.5 text-[8px] xl:text-[9px] text-gray-700 dark:text-gray-300 flex items-center justify-between gap-1 transition-colors hover:border-white/20 cursor-text">
              <span className="truncate">Ask anything...</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SidebarItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <div 
      onClick={onClick}
      className={`relative px-2 py-1.5 rounded-md text-[9px] xl:text-[10px] cursor-pointer flex items-center gap-2 transition-colors ${active ? 'text-black dark:text-white font-medium' : 'text-gray-700 dark:text-gray-300 hover:text-black dark:text-white hover:bg-white/[0.02]'}`}
    >
      {active && (
        <motion.div 
          layoutId="sidebarActiveIndicator" 
          className="absolute inset-0 bg-white/[0.04] rounded-md z-0" 
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <div className="relative z-10 flex items-center gap-2">
        {icon}
        {label}
      </div>
    </div>
  );
}

function HomeView() {
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      className="absolute inset-0 overflow-y-auto p-3 xl:p-4 flex flex-col gap-3 xl:gap-4"
    >
      <motion.div variants={item}>
        <h2 className="text-xs xl:text-sm font-bold text-black dark:text-white flex items-center gap-1.5">Good morning, Team <Hand className="w-3.5 h-3.5 text-yellow-500 mb-0.5" /></h2>
        <p className="text-gray-700 dark:text-gray-300 text-[9px] xl:text-[10px]">Here's what's happening with your team today.</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-4 gap-2 w-full flex-shrink-0">
        <StatCard title="Tasks" value="12" subtext="In progress" subtextColor="text-gray-700 dark:text-gray-300" />
        <StatCard title="Pull Requests" value="8" subtext="Open" subtextColor="text-green-400" />
        <StatCard title="Mentions" value="5" subtext="New" subtextColor="text-red-400" />
        <StatCard title="Deployments" value="3" subtext="Today" subtextColor="text-indigo-400" />
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0">
        <div className="flex flex-col gap-2 bg-[#0F0F11] border border-black/5 dark:border-white/5 rounded-lg p-3 overflow-hidden">
          <h3 className="text-[9px] xl:text-[10px] font-bold text-black dark:text-white uppercase tracking-wider mb-1">Recent Activity</h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[9px] text-gray-300">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
              <div><span className="font-semibold text-white">Ankush</span> moved "Fix login bug" to In Progress</div>
            </div>
            <div className="flex items-center gap-2 text-[9px] text-gray-300">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></div>
              <div><span className="font-semibold text-white">Riya</span> created a pull request</div>
            </div>
            <div className="flex items-center gap-2 text-[9px] text-gray-300">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0"></div>
              <div><span className="font-semibold text-white">Sarah</span> commented on "Add analytics"</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 bg-[#0F0F11] border border-black/5 dark:border-white/5 rounded-lg p-3">
          <h3 className="text-[9px] xl:text-[10px] font-bold text-black dark:text-white uppercase tracking-wider mb-1">Sprint Progress</h3>
          <div className="w-full bg-black/20 dark:bg-white/5 rounded-full h-2 mt-2 overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '65%' }}
              transition={{ duration: 1, delay: 0.2 }}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full"
            />
          </div>
          <div className="text-[8px] xl:text-[9px] text-gray-400 mt-1 flex justify-between">
            <span>65% Completed</span>
            <span>4 days left</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ title, value, subtext, subtextColor }: { title: string, value: string, subtext: string, subtextColor: string }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="bg-[#121214] border border-black/5 dark:border-white/5 rounded-lg p-2 flex flex-col min-w-0 h-[65px] xl:h-[70px] cursor-pointer"
    >
      <span className="text-[11px] text-gray-700 dark:text-gray-300 truncate">{title}</span>
      <span className="text-[22px] font-bold text-black dark:text-white leading-tight">{value}</span>
      <span className={`text-[8px] truncate mt-auto ${subtextColor}`}>{subtext}</span>
    </motion.div>
  );
}

function TasksView() {
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      className="absolute inset-0 p-3 xl:p-4 flex flex-col h-full overflow-hidden"
    >
      <motion.div variants={item} className="flex justify-between items-center mb-3">
        <h2 className="text-[10px] xl:text-xs font-bold text-black dark:text-white uppercase tracking-wider">Kanban Board</h2>
        <button className="bg-white text-black hover:bg-gray-200 transition-colors px-2 py-1 rounded text-[9px] font-semibold flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          New Task
        </button>
      </motion.div>
      
      <motion.div variants={item} className="grid grid-cols-3 gap-2 flex-1 min-h-0 pb-2">
        {/* To Do */}
        <div className="flex flex-col gap-1.5 bg-[#0F0F11] border border-black/5 dark:border-white/5 rounded-lg p-1.5 min-w-0 overflow-y-auto">
          <div className="text-[8px] xl:text-[9px] font-bold text-black dark:text-white mb-1 flex items-center justify-between px-1 sticky top-0 bg-[#0F0F11] z-10 py-1">
            <span className="flex items-center gap-1 truncate">To Do <span className="text-gray-700 dark:text-gray-300 text-[7px] xl:text-[8px] bg-black/5 dark:bg-theme-glow px-1.5 py-0.5 rounded-sm">3</span></span>
          </div>
          <KanbanCard title="Fix login bug" id="AUTH-123" type="bug" />
          <KanbanCard title="Add analytics" id="FEAT-456" type="feature" />
          <KanbanCard title="Update README" id="DOC-789" type="doc" />
        </div>

        {/* In Progress */}
        <div className="flex flex-col gap-1.5 bg-[#0F0F11] border border-black/5 dark:border-white/5 rounded-lg p-1.5 min-w-0 overflow-y-auto">
          <div className="text-[8px] xl:text-[9px] font-bold text-black dark:text-white mb-1 flex items-center justify-between px-1 sticky top-0 bg-[#0F0F11] z-10 py-1">
            <span className="flex items-center gap-1 truncate">In Progress <span className="text-gray-700 dark:text-gray-300 text-[7px] xl:text-[8px] bg-black/5 dark:bg-theme-glow px-1.5 py-0.5 rounded-sm">2</span></span>
          </div>
          <KanbanCard title="API integration" id="BACK-234" type="tech" />
          <KanbanCard title="Refactor code" id="TECH-345" type="tech" />
        </div>

        {/* Done */}
        <div className="flex flex-col gap-1.5 bg-[#0F0F11] border border-black/5 dark:border-white/5 rounded-lg p-1.5 min-w-0 overflow-y-auto opacity-70">
          <div className="text-[8px] xl:text-[9px] font-bold text-black dark:text-white mb-1 flex items-center justify-between px-1 sticky top-0 bg-[#0F0F11] z-10 py-1">
            <span className="flex items-center gap-1 truncate">Done <span className="text-gray-700 dark:text-gray-300 text-[7px] xl:text-[8px] bg-black/5 dark:bg-theme-glow px-1.5 py-0.5 rounded-sm">1</span></span>
          </div>
          <KanbanCard title="Setup CI/CD" id="OPS-101" type="tech" done />
        </div>
      </motion.div>
    </motion.div>
  );
}

function KanbanCard({ title, id, type, done }: { title: string, id: string, type: 'bug'|'feature'|'tech'|'doc', done?: boolean }) {
  const getBadgeColor = () => {
    switch(type) {
      case 'bug': return 'text-red-400 bg-red-500/10';
      case 'feature': return 'text-blue-400 bg-blue-500/10';
      case 'doc': return 'text-purple-400 bg-purple-500/10';
      default: return 'text-green-400 bg-green-500/10';
    }
  }

  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -2 }}
      className={`bg-[#131316] border border-black/5 dark:border-white/5 rounded p-2 flex flex-col gap-1.5 cursor-pointer shadow-sm ${done ? 'opacity-80 line-through' : ''}`}
    >
      <div className="text-[9px] xl:text-[10px] text-gray-200 font-medium leading-snug">{title}</div>
      <div className="flex items-center justify-between mt-1">
        <div className={`flex items-center gap-1 text-[7px] xl:text-[8px] font-semibold px-1.5 py-0.5 rounded truncate ${getBadgeColor()}`}>
          {id}
        </div>
        <div className="w-4 h-4 rounded-full bg-gray-700 flex-shrink-0"></div>
      </div>
    </motion.div>
  );
}

function DocsView() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      className="absolute inset-0 flex"
    >
      <div className="w-[120px] xl:w-[140px] border-r border-black/5 dark:border-white/5 bg-[#0A0A0B] flex flex-col p-2 overflow-y-auto flex-shrink-0">
        <div className="text-[9px] font-bold text-gray-500 mb-2 px-1 uppercase tracking-wider mt-1">Documents</div>
        <div className="text-[9px] xl:text-[10px] bg-white/[0.06] text-white p-1.5 rounded cursor-pointer font-medium mb-0.5">API Guidelines</div>
        <div className="text-[9px] xl:text-[10px] text-gray-400 hover:text-white hover:bg-white/[0.02] p-1.5 rounded cursor-pointer transition-colors mb-0.5">Onboarding</div>
        <div className="text-[9px] xl:text-[10px] text-gray-400 hover:text-white hover:bg-white/[0.02] p-1.5 rounded cursor-pointer transition-colors mb-0.5">Design System</div>
        <div className="text-[9px] xl:text-[10px] text-gray-400 hover:text-white hover:bg-white/[0.02] p-1.5 rounded cursor-pointer transition-colors">Release Notes</div>
      </div>
      <div className="flex-1 p-4 xl:p-6 overflow-y-auto">
        <h1 className="text-sm xl:text-lg font-bold text-white mb-2">API Guidelines</h1>
        <div className="text-[9px] xl:text-[10px] text-gray-400 mb-4 flex items-center gap-2">
          <span>Updated yesterday by Ankush</span>
        </div>
        
        <p className="text-[10px] xl:text-xs text-gray-300 mb-4 leading-relaxed">
          All API endpoints must follow standard REST conventions. Authentication is handled via Bearer tokens in the Authorization header.
        </p>
        
        <h3 className="text-xs font-semibold text-white mb-2">Endpoints</h3>
        <div className="bg-[#131316] border border-white/5 p-3 rounded-lg text-[9px] xl:text-[10px] text-gray-300 font-mono mb-4">
          <div className="text-blue-400 mb-1">GET /api/v1/users</div>
          <div className="text-green-400 mb-1">POST /api/v1/projects</div>
          <div className="text-yellow-400">PUT /api/v1/tasks/:id</div>
        </div>
        
        <p className="text-[10px] xl:text-xs text-gray-300 leading-relaxed">
          Ensure proper error handling with standardized JSON responses containing <code>error</code> and <code>message</code> fields.
        </p>
      </div>
    </motion.div>
  );
}

function ChatView() {
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      className="absolute inset-0 flex flex-col p-3 xl:p-4 bg-[#0A0A0B]"
    >
      <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-3">
        <div className="text-[11px] xl:text-xs font-bold text-white"># general</div>
        <div className="text-[9px] text-gray-500 border-l border-white/10 pl-2">Team wide announcements and chatter</div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2"
      >
        <motion.div variants={item} className="flex gap-2.5 group">
           <div className="w-6 h-6 rounded flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] text-white font-bold shadow-sm">A</div>
           <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                 <span className="text-[10px] xl:text-[11px] font-bold text-white">Ankush</span>
                 <span className="text-[7px] xl:text-[8px] text-gray-500">10:42 AM</span>
              </div>
              <div className="text-[9px] xl:text-[10px] text-gray-300 mt-0.5 leading-snug">Has anyone checked the new deployment on staging? Need to verify before pushing to prod.</div>
           </div>
        </motion.div>
        
        <motion.div variants={item} className="flex gap-2.5 group">
           <div className="w-6 h-6 rounded flex-shrink-0 bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
             <Sparkles className="w-3 h-3"/>
           </div>
           <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                 <span className="text-[10px] xl:text-[11px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">DevCollab AI</span>
                 <span className="text-[7px] xl:text-[8px] text-gray-500">10:43 AM</span>
                 <span className="text-[7px] bg-white/10 px-1 rounded text-gray-400 ml-1">BOT</span>
              </div>
              <div className="text-[9px] xl:text-[10px] text-gray-300 mt-0.5 leading-snug">
                Yes, the deployment completed successfully at 10:40 AM. 
                <br/>• 0 errors reported
                <br/>• All 42 e2e tests passed
                <br/>• Performance score: 98/100
              </div>
           </div>
        </motion.div>
      </motion.div>
      
      <div className="mt-3 bg-[#131316] border border-white/10 rounded-lg p-2.5 flex items-center focus-within:border-white/30 transition-colors">
         <span className="text-[9px] xl:text-[10px] text-gray-500 flex-1">Message #general...</span>
         <div className="w-4 h-4 rounded bg-white/10 flex items-center justify-center cursor-pointer">
           <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
         </div>
      </div>
    </motion.div>
  );
}
