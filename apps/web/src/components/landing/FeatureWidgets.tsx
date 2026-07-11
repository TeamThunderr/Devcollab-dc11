import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Clipboard, Search, BarChart, Rocket, CheckCircle, PartyPopper, AlertTriangle, Lightbulb } from 'lucide-react';

// --- Utilities ---
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const renderWithIcons = (text: string) => {
  if (typeof text !== 'string') return text;
  return text.split(/(✅|⚠️|🚀|💡|🎉)/).map((part, i) => {
    if (part === '✅') return <CheckCircle key={i} size={15} style={{ display: 'inline', verticalAlign: 'text-bottom', margin: '0 2px' }} color="#22c55e" />;
    if (part === '⚠️') return <AlertTriangle key={i} size={15} style={{ display: 'inline', verticalAlign: 'text-bottom', margin: '0 2px' }} color="#eab308" />;
    if (part === '🚀') return <Rocket key={i} size={15} style={{ display: 'inline', verticalAlign: 'text-bottom', margin: '0 2px' }} color="#3b82f6" />;
    if (part === '💡') return <Lightbulb key={i} size={15} style={{ display: 'inline', verticalAlign: 'text-bottom', margin: '0 2px' }} color="#f59e0b" />;
    if (part === '🎉') return <PartyPopper key={i} size={15} style={{ display: 'inline', verticalAlign: 'text-bottom', margin: '0 2px' }} color="#ec4899" />;
    return part;
  });
};

// --- Kanban Widget ---
const KANBAN_TASKS = [
  "Fix auth bug", "Design hero section", "API integration", 
  "Write unit tests", "Deploy to Vercel", "Code review PR#42"
];
const COL_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#22c55e'];
const COL_NAMES = ['TODO', 'IN PROGRESS', 'IN REVIEW', 'COMPLETED'];

export function KanbanWidget() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Fix auth bug', col: 0 },
    { id: 2, title: 'Design hero section', col: 0 },
    { id: 3, title: 'API integration', col: 0 },
    { id: 4, title: 'Write unit tests', col: 0 },
    { id: 5, title: 'Deploy to Vercel', col: 1 },
    { id: 6, title: 'Setup database', col: 1 },
    { id: 7, title: 'Analytics review', col: 2 },
  ]);
  const nextId = useRef(8);

  useEffect(() => {
    if (!isInView) return;
    let isActive = true;

    const runLoop = async () => {
      while (isActive) {
        await sleep(2500);
        if (!isActive) break;
        // Move TODO -> IN PROGRESS
        setTasks(prev => {
          const next = [...prev];
          const idx = next.findIndex(t => t.col === 0);
          if (idx !== -1) {
            const t = next[idx];
            if (t) next[idx] = { ...t, col: 1 };
          }
          return next;
        });

        await sleep(2500);
        if (!isActive) break;
        // Move IN PROGRESS -> IN REVIEW
        setTasks(prev => {
          const next = [...prev];
          const idx = next.findIndex(t => t.col === 1);
          if (idx !== -1) {
            const t = next[idx];
            if (t) next[idx] = { ...t, col: 2 };
          }
          return next;
        });

        await sleep(2500);
        if (!isActive) break;
        // Move IN REVIEW -> COMPLETED
        setTasks(prev => {
          const next = [...prev];
          const idx = next.findIndex(t => t.col === 2);
          if (idx !== -1) {
            const t = next[idx];
            if (t) next[idx] = { ...t, col: 3 };
          }
          return next;
        });

        await sleep(1500);
        if (!isActive) break;
        // Remove COMPLETED, spawn new TODO
        setTasks(prev => {
          const next = [...prev];
          const idx = next.findIndex(t => t.col === 3);
          if (idx !== -1) next.splice(idx, 1);
          next.push({ id: nextId.current++, title: KANBAN_TASKS[nextId.current % KANBAN_TASKS.length] || "Task", col: 0 });
          return next;
        });
      }
    };

    runLoop();
    return () => { isActive = false; };
  }, [isInView]);

  return (
    <div ref={ref} style={{ display: 'flex', gap: '16px', height: '100%', width: '100%' }}>
      {COL_NAMES.map((colName, colIdx) => (
        <div key={colName} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <span>{colName}</span>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', color: '#ccc' }}>
              {tasks.filter(t => t.col === colIdx).length}
            </span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <AnimatePresence>
              {tasks.filter(t => t.col === colIdx).map(task => (
                <motion.div
                  layout
                  layoutId={task.id.toString()}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  key={task.id}
                  style={{
                    backgroundColor: '#1a1a1a',
                    borderLeft: `4px solid ${COL_COLORS[colIdx]}`,
                    padding: '14px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#ccc',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {task.title}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Chat Widget ---
const CHAT_MESSAGES = [
  { id: 1, initial: 'B', name: 'Balaji', color: '#3b82f6', text: 'PR is ready for review 🚀', align: 'left' },
  { id: 2, initial: 'S', name: 'Smith', color: '#ec4899', text: 'Looks good! Merging now ✅', align: 'right' },
  { id: 3, initial: 'L', name: 'Libin', color: '#22c55e', text: 'Deploy done. Staging is live 🎉', align: 'left' },
  { id: 4, initial: 'B', name: 'Balaji', color: '#3b82f6', text: 'Awesome work team!', align: 'left' }
];

export function ChatWidget() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let isActive = true;
    const runLoop = async () => {
      while (isActive) {
        setVisibleCount(0);
        await sleep(500);
        if (!isActive) break;
        setVisibleCount(1);
        await sleep(1000);
        if (!isActive) break;
        setVisibleCount(2);
        await sleep(1000);
        if (!isActive) break;
        setVisibleCount(3);
        await sleep(1000);
        if (!isActive) break;
        setVisibleCount(4);
        await sleep(2000);
      }
    };
    runLoop();
    return () => { isActive = false; };
  }, [isInView]);

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 600, color: '#fff', fontSize: '15px' }}># general</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['#3b82f6', '#ec4899', '#22c55e'].map((c, i) => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />)}
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <AnimatePresence>
          {CHAT_MESSAGES.slice(0, visibleCount).map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: msg.align === 'right' ? 'row-reverse' : 'row', gap: '16px', alignItems: 'flex-end' }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: msg.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 600, flexShrink: 0 }}>
                {msg.initial}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.align === 'right' ? 'flex-end' : 'flex-start' }}>
                <span style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>{msg.name} · just now</span>
                <div style={{ background: msg.align === 'right' ? '#3b82f6' : '#1a1a1a', color: '#fff', padding: '14px 18px', borderRadius: '16px', fontSize: '14px', maxWidth: '360px' }}>
                  {renderWithIcons(msg.text)}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div style={{ marginTop: 'auto', background: '#1a1a1a', borderRadius: '24px', padding: '16px 24px', color: '#666', fontSize: '14px', display: 'flex', justifyContent: 'space-between' }}>
        Type a message...
        <span>➤</span>
      </div>
    </div>
  );
}

// --- Editor Widget ---
const SNIPPET_1 = `import { getUser } from './api'\n\nexport async function loadUser() {\n  const user = await getUser()\n  if (!user) return null\n  return user.name\n}`;
const SNIPPET_2 = `import { db } from './db'\n\nexport async function saveUser(data) {\n  await db.users.insert(data)\n  return { success: true }\n}`;

export function EditorWidget() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [text, setText] = useState('');
  const [tab, setTab] = useState('index.ts');

  useEffect(() => {
    if (!isInView) return;
    let isActive = true;
    const runLoop = async () => {
      let toggle = false;
      while (isActive) {
        const target = toggle ? SNIPPET_2 : SNIPPET_1;
        setTab(toggle ? 'api.ts' : 'index.ts');
        setText('');
        await sleep(500);
        
        for (let i = 1; i <= target.length; i++) {
          if (!isActive) return;
          setText(target.substring(0, i));
          await sleep(40);
        }
        
        await sleep(1500);
        if (!isActive) break;
        setText('');
        toggle = !toggle;
      }
    };
    runLoop();
    return () => { isActive = false; };
  }, [isInView]);

  const highlight = (code: string) => {
    return code
      .replace(/import|from|export|async|function|const|await|if|return/g, '<span style="color:#c586c0">$&</span>')
      .replace(/'\.\/api'|'\.\/db'/g, '<span style="color:#22c55e">$&</span>')
      .replace(/loadUser|getUser|saveUser/g, '<span style="color:#3b82f6">$&</span>')
      .replace(/\n/g, '<br/>')
      .replace(/ /g, '&nbsp;');
  };

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#1e1e1e', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Editor Header */}
      <div style={{ background: '#111', display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid #333' }}>
        <div style={{ display: 'flex', gap: '8px', marginRight: '32px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#eab308' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e' }} />
        </div>
        <div style={{ display: 'flex', paddingTop: '10px' }}>
          <div style={{ padding: '10px 20px', background: tab === 'index.ts' ? '#1e1e1e' : 'transparent', color: tab === 'index.ts' ? '#fff' : '#888', fontSize: '14px', borderRadius: '8px 8px 0 0' }}>index.ts</div>
          <div style={{ padding: '10px 20px', background: tab === 'api.ts' ? '#1e1e1e' : 'transparent', color: tab === 'api.ts' ? '#fff' : '#888', fontSize: '14px', borderRadius: '8px 8px 0 0' }}>api.ts</div>
        </div>
      </div>
      
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <div style={{ width: '160px', borderRight: '1px solid #333', padding: '20px', fontSize: '14px', color: '#858585' }}>
          <div style={{ marginBottom: '12px' }}>📁 src</div>
          <div style={{ paddingLeft: '20px', color: tab === 'index.ts' ? '#fff' : '#858585', marginBottom: '8px' }}>📄 index.ts</div>
          <div style={{ paddingLeft: '20px', color: tab === 'api.ts' ? '#fff' : '#858585', marginBottom: '8px' }}>📄 api.ts</div>
          <div style={{ paddingLeft: '20px' }}>📄 types.ts</div>
        </div>
        {/* Editor Body */}
        <div style={{ padding: '24px', fontSize: '15px', fontFamily: 'monospace', color: '#d4d4d4', lineHeight: 1.7, flex: 1, display: 'flex' }}>
          <div style={{ color: '#555', textAlign: 'right', paddingRight: '20px', userSelect: 'none' }}>
            1<br/>2<br/>3<br/>4<br/>5<br/>6<br/>7
          </div>
          <div style={{ position: 'relative' }}>
            <span dangerouslySetInnerHTML={{ __html: highlight(text) }} />
            <motion.span 
              animate={{ opacity: [1, 0] }} 
              transition={{ repeat: Infinity, duration: 0.8 }}
              style={{ borderRight: '2px solid #fff', marginLeft: '2px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Wiki Widget ---
export function WikiWidget() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [highlightWord, setHighlightWord] = useState('');

  useEffect(() => {
    if (!isInView) return;
    let isActive = true;
    const runLoop = async () => {
      while (isActive) {
        await sleep(2000);
        if (!isActive) break;
        setHighlightWord('Bearer');
        await sleep(1000);
        if (!isActive) break;
        setHighlightWord('JWT');
        await sleep(1000);
        if (!isActive) break;
        setHighlightWord('');
      }
    };
    runLoop();
    return () => { isActive = false; };
  }, [isInView]);

  return (
    <div ref={ref} style={{ height: '100%', width: '100%', background: '#fff', borderRadius: '12px', overflow: 'hidden', color: '#333', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 32px', borderBottom: '1px solid #eee', fontSize: '14px', color: '#555' }}>
        Docs / API / Authentication
      </div>
      <div style={{ padding: '16px 32px', borderBottom: '1px solid #eee', display: 'flex', gap: '20px', color: '#666', fontSize: '16px', fontWeight: 600 }}>
        <span>B</span><span>I</span><span>U</span> <span style={{ color: '#ddd' }}>|</span> <span>H1</span><span>H2</span> <span style={{ color: '#ddd' }}>|</span> <span>•</span>
      </div>
      <div style={{ padding: '40px 32px', flex: 1, fontSize: '16px', lineHeight: 1.9 }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 20px 0', color: '#000' }}>Authentication</h1>
        <p style={{ margin: '0 0 24px 0', color: '#444' }}>
          Use <motion.span 
            animate={{ backgroundColor: highlightWord === 'Bearer' ? 'rgba(250,200,0,0.4)' : 'transparent' }} 
            style={{ padding: '2px 6px', borderRadius: '6px' }}
          >
            {highlightWord || 'Bearer'}
          </motion.span> tokens in all API requests. Tokens expire after 24 hours. Ensure you store them securely.
        </p>
        <ul style={{ margin: 0, paddingLeft: '24px', color: '#444' }}>
          <li style={{ marginBottom: '12px' }}>Refresh via /auth/refresh</li>
          <li>Include in Authorization header<motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} style={{ borderRight: '2px solid #000' }} /></li>
        </ul>
      </div>
      <div style={{ padding: '20px 32px', fontSize: '13px', color: '#888', borderTop: '1px solid #eee' }}>
        Last edited by Balaji · 2 min ago
      </div>
    </div>
  );
}

// --- AI Widget ---
const AI_P1 = "Summarize today's standup →";
const AI_R1 = "✅ 3 tasks completed today.\n⚠️ 2 blockers flagged by Libin.\n🚀 Deployment scheduled for Friday.\n💡 Recommendation: Unblock @Libin on auth issue before EOD.";
const AI_P2 = "Review PR #42 code →";
const AI_R2 = "Found 2 potential issues in api.ts.\nNull check missing on line 34.\nConsider adding rate limiting to prevent abuse.";

export function AIWidget() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [prompt, setPrompt] = useState(AI_P1);
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | typing

  useEffect(() => {
    if (!isInView) return;
    let isActive = true;
    const runLoop = async () => {
      let toggle = false;
      while (isActive) {
        setPrompt(toggle ? AI_P2 : AI_P1);
        setResponse('');
        setStatus('idle');
        await sleep(1000);
        if (!isActive) break;
        
        setStatus('loading');
        await sleep(1500);
        if (!isActive) break;
        
        setStatus('typing');
        const words = (toggle ? AI_R2 : AI_R1).split(' ');
        let currentText = '';
        for (const word of words) {
          if (!isActive) return;
          currentText += word + ' ';
          setResponse(currentText);
          await sleep(70);
        }
        
        setStatus('idle');
        await sleep(3000);
        toggle = !toggle;
      }
    };
    runLoop();
    return () => { isActive = false; };
  }, [isInView]);

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <motion.div animate={{ opacity: [0.4, 1] }} transition={{ repeat: Infinity, duration: 1, repeatType: 'reverse' }} style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ fontWeight: 600, color: '#fff', fontSize: '15px' }}>DevCollab AI</span>
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ background: '#1a1a1a', padding: '14px 20px', borderRadius: '24px', display: 'inline-block', color: '#fff', fontSize: '15px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
          {prompt}
        </div>
        
        <div style={{ color: '#ccc', fontSize: '15px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {status === 'loading' && <motion.span animate={{ opacity: [0.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>...</motion.span>}
          {status === 'typing' && renderWithIcons(response)}
          {status === 'idle' && renderWithIcons(response)}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
        {[
          { text: 'Standup', icon: <Clipboard size={14} /> },
          { text: 'Code Review', icon: <Search size={14} /> },
          { text: 'Sprint Plan', icon: <BarChart size={14} /> }
        ].map(chip => (
          <div key={chip.text} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', color: '#888' }}>
            {chip.icon}
            <span>{chip.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Realtime Widget ---
const AVATARS = [
  { id: 'B', color: '#3b82f6' },
  { id: 'S', color: '#ec4899' },
  { id: 'L', color: '#22c55e' },
  { id: 'S', color: '#f59e0b' }
];

export function RealtimeWidget() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (!isInView) return;
    let isActive = true;
    const msgs = ["Sanjay joined the workspace", "Smith is editing Task #3", "Libin moved to Review"];
    let i = 0;
    const runLoop = async () => {
      while (isActive) {
        await sleep(2000);
        if (!isActive) break;
        setToastMsg(msgs[i % msgs.length] || '');
        i++;
        await sleep(2000);
        if (!isActive) break;
        setToastMsg('');
        await sleep(2000);
      }
    };
    runLoop();
    return () => { isActive = false; };
  }, [isInView]);

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ color: '#888', fontSize: '14px' }}>Online now</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {AVATARS.map((a, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: a.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '16px' }}>{a.id}</div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e', border: '2px solid #0d0d0d' }} />
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex' }}>
        <div style={{ flex: 1, color: '#ccc', fontSize: '17px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#555' }}>[ ]</span> 
            <span style={{ position: 'relative' }}>
              Fix auth bug
              <motion.div animate={{ x: [0, 30, 0] }} transition={{ repeat: Infinity, duration: 2 }} style={{ position: 'absolute', left: 0, top: 0, width: '2px', height: '24px', background: '#3b82f6' }}>
                <div style={{ position: 'absolute', top: '-20px', left: '-4px', background: '#3b82f6', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>Balaji</div>
              </motion.div>
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
            <span style={{ color: '#22c55e' }}>[✓]</span> <span>Design hero section</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#555' }}>[ ]</span> 
            <span style={{ position: 'relative' }}>
              API integration
              <motion.div animate={{ x: [50, 100, 50] }} transition={{ repeat: Infinity, duration: 3 }} style={{ position: 'absolute', left: 0, top: 0, width: '2px', height: '24px', background: '#ec4899' }}>
                <div style={{ position: 'absolute', top: '-20px', left: '-4px', background: '#ec4899', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>Smith</div>
              </motion.div>
            </span>
          </div>
        </div>
        
        <div style={{ width: '220px', borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '24px', fontSize: '13px', color: '#666', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div><span style={{ color: '#22c55e' }}>●</span> Balaji opened Task #3<br/>2s ago</div>
          <div><span style={{ color: '#a855f7' }}>●</span> Smith commented<br/>5s ago</div>
          <div><span style={{ color: '#3b82f6' }}>●</span> Libin moved to Review<br/>8s ago</div>
        </div>
      </div>

      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{ position: 'absolute', bottom: '0', right: '0', background: '#fff', color: '#000', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
