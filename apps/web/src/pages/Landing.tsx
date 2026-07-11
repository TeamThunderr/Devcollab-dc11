import { useEffect, useRef, useState, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { Zap, Sparkles, Target, Hand } from 'lucide-react';
import './Landing.css';
import { InteractiveDashboard } from '../components/landing/InteractiveDashboard';
const KanbanWidget = lazy(() => import('../components/landing/FeatureWidgets').then(m => ({ default: m.KanbanWidget })));
const ChatWidget = lazy(() => import('../components/landing/FeatureWidgets').then(m => ({ default: m.ChatWidget })));
const EditorWidget = lazy(() => import('../components/landing/FeatureWidgets').then(m => ({ default: m.EditorWidget })));
const WikiWidget = lazy(() => import('../components/landing/FeatureWidgets').then(m => ({ default: m.WikiWidget })));
const AIWidget = lazy(() => import('../components/landing/FeatureWidgets').then(m => ({ default: m.AIWidget })));
const RealtimeWidget = lazy(() => import('../components/landing/FeatureWidgets').then(m => ({ default: m.RealtimeWidget })));

export function Landing() {
  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const aiStreamBodyRef = useRef<HTMLDivElement>(null);
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    // Intersection Observer for scroll animations
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.landing-page .animate-on-scroll');
    elements.forEach((el) => {
      observer.observe(el);
    });

    return () => {
      elements.forEach((el) => {
        observer.unobserve(el);
      });
    };
  }, []);
  useEffect(() => {
    // Hero Terminal Typing Animation
    const terminalLines = [
      '[12:04:01] task.moved → "Fix login bug" — Kanban: In Progress',
      '[12:04:03] @bala mentioned you in #backend',
      '[12:04:06] AI: Generated 8 subtasks for "Auth Module"',
      '[12:04:12] commit.pushed → 7a92f0 "auth flow complete"',
      '[12:04:15] build.status → [✓] Success (1.2s)',
      '[12:04:20] presence.update → @sarah joined workspace',
    ];

    let currentLine = 0;
    let currentChar = 0;
    let typingTimeout: ReturnType<typeof setTimeout>;
    let isTyping = true;

    const terminalBody = terminalBodyRef.current;

    function typeLine() {
      if (!isTyping || !terminalBody) return;

      if (currentLine >= terminalLines.length) {
        typingTimeout = setTimeout(() => {
          if (!isTyping || !terminalBody) return;
          terminalBody.innerHTML = '<span class="cursor"></span>';
          currentLine = 0;
          typeLine();
        }, 3000);
        return;
      }

      const text = terminalLines[currentLine];

      if (currentChar === 0) {
        const lineElement = document.createElement('span');
        lineElement.className = 'terminal-line';
        terminalBody.insertBefore(lineElement, terminalBody.lastElementChild);
      }

      const currentLineElements = terminalBody.querySelectorAll('.terminal-line');
      const targetLineElement = currentLineElements[currentLineElements.length - 1];

      if (text && targetLineElement && currentChar < text.length) {
        targetLineElement.textContent += text.charAt(currentChar);
        currentChar++;
        typingTimeout = setTimeout(typeLine, Math.random() * 30 + 20);
      } else {
        currentLine++;
        currentChar = 0;
        typingTimeout = setTimeout(typeLine, 800);
      }
    }

    typingTimeout = setTimeout(typeLine, 1500);

    return () => {
      isTyping = false;
      clearTimeout(typingTimeout);
    };
  }, []);

  useEffect(() => {
    // AI Mockup Streaming Animation
    const aiStreamLines = [
      'Found 3 blocked tasks in current sprint.',
      'Generating standup report...',
      '<br><span>Yesterday:</span> Completed auth refactor.',
      '<span>Today:</span> Resolving 2 critical bugs.',
      '<span>Blockers:</span> Waiting on design for profile view.',
      '<br>Report ready. Share to #standup?',
    ];

    let aiLineIndex = 0;
    let aiTimeout: ReturnType<typeof setTimeout>;
    let isStreaming = true;

    const aiStreamBody = aiStreamBodyRef.current;

    function streamAI() {
      if (!isStreaming || !aiStreamBody) return;
      if (aiLineIndex >= aiStreamLines.length) return;

      const streamText = aiStreamLines[aiLineIndex];
      if (!streamText) return;

      const line = document.createElement('div');
      line.style.opacity = '0';
      line.style.transform = 'translateY(10px)';
      line.style.transition = 'all 0.4s ease';
      line.innerHTML = streamText;

      aiStreamBody.appendChild(line);

      // Trigger reflow
      void line.offsetWidth;

      line.style.opacity = '1';
      line.style.transform = 'translateY(0)';

      aiLineIndex++;
      aiTimeout = setTimeout(streamAI, 1200);
    }

    const aiObserver = new IntersectionObserver((entries) => {
      if (entries[0] && entries[0].isIntersecting) {
        aiTimeout = setTimeout(streamAI, 800);
        aiObserver.disconnect();
      }
    });

    const spotlightSection = document.querySelector('.landing-page .ai-spotlight');
    if (spotlightSection) {
      aiObserver.observe(spotlightSection);
    }

    return () => {
      isStreaming = false;
      clearTimeout(aiTimeout);
      aiObserver.disconnect();
    };
  }, []);

  return (
    <div className="landing-page dark bg-[#050505] text-white min-h-screen">
      {/* Navbar */}
      <nav className="landing-nav border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md">
        <div className="landing-container nav-content flex items-center justify-between py-4">
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="logo mono flex items-center gap-2 font-bold text-lg text-black dark:text-white cursor-pointer"
          >
            {/* <ThemeToggle className="relative lg:fixed top-4 left-4 lg:top-6 lg:left-6 !right-auto z-[60]" /> */}
            <Zap className="w-5 h-5 fill-current" /> DevCollab
          </div>
          <div className="nav-links hidden md:flex items-center gap-8 text-sm text-gray-700 dark:text-gray-300">
            <a href="#features" className="hover:text-black dark:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-black dark:text-white transition-colors">Pricing</a>
            <Link to="/login" className="hover:text-black dark:text-white transition-colors">Product</Link>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:text-white transition-colors hidden sm:block">Sign in</Link>
            <Link to="/register" className="text-sm font-medium bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-5 py-2.5 rounded-lg transition-colors">
              Get Early Access
            </Link>
          </div>
        </div>
      </nav>

      {/* Split-Screen Hero */}
      <section className="relative w-full min-h-[90vh] flex flex-col xl:flex-row items-center justify-center pt-24 pb-20 overflow-hidden bg-[#0A0A0A] text-black dark:text-white border-b border-black/5 dark:border-white/5">
        
        {/* Violet radial gradient glow in upper-right background area */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-black/10 dark:bg-white/10 rounded-full blur-[150px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
        {/* Subtle Grid Texture */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] opacity-40 pointer-events-none" />

        <div className="relative z-10 w-full max-w-[1500px] mx-auto px-6 lg:px-12 flex flex-col xl:flex-row items-center gap-12 xl:gap-8">
          
          {/* Left Column: Marketing Content */}
          <div className="w-full xl:w-[45%] flex flex-col items-start pt-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="bg-black/5 dark:bg-[#050505]/50 border border-black/5 dark:border-white/5 text-xs font-semibold text-gray-700 dark:text-gray-300 rounded-full px-4 py-1.5 backdrop-blur-md mono inline-flex items-center gap-2">
                <span className="text-black dark:text-white">✦</span>
                Built for developer teams
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] text-black dark:text-white">
                One platform<br />
                Every tool your team needs
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-xl mb-10"
            >
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                DevCollab replaces Jira, Notion, Slack, and VS Code with a single AI-powered workspace — built for how engineers actually work.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-10"
            >
              <Link to="/register" className="px-8 py-3.5 rounded-lg font-medium bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-center shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.25)] flex items-center justify-center gap-2">
                Start for free &rarr;
              </Link>

            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap gap-3"
            >
              <div className="bg-black/5 dark:bg-theme-glow border border-black/5 dark:border-white/5 rounded-full px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 backdrop-blur-sm">
                <svg className="w-3.5 h-3.5 text-black dark:text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                </svg>
                AI Assistant
              </div>
              <div className="bg-black/5 dark:bg-theme-glow border border-black/5 dark:border-white/5 rounded-full px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 backdrop-blur-sm">
                <svg className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect width="7" height="7" x="3" y="3" rx="1"/>
                  <rect width="7" height="7" x="14" y="3" rx="1"/>
                  <rect width="7" height="7" x="14" y="14" rx="1"/>
                  <rect width="7" height="7" x="3" y="14" rx="1"/>
                </svg>
                Unified Workspace
              </div>
              <div className="bg-black/5 dark:bg-theme-glow border border-black/5 dark:border-white/5 rounded-full px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 backdrop-blur-sm">
                <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M13 2 L3 14 h9 l-1 8 L21 10 h-9 z"/>
                </svg>
                Real-time Sync
              </div>
              <div className="bg-black/5 dark:bg-theme-glow border border-black/5 dark:border-white/5 rounded-full px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 backdrop-blur-sm">
                <svg className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="m18 16 4-4-4-4M6 8l-4 4 4 4M14.5 4l-5 16"/>
                </svg>
                Open API
              </div>
            </motion.div>
          </div>

          {/* Right Column: Interactive Mockup */}
          <div className="w-full xl:w-[55%] relative mt-16 xl:mt-0 perspective-[2000px] max-w-full">
            {/* PURPLE GLOW */}
            <div 
              className="absolute z-0 w-[60%] h-full right-0 top-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 60%)' }}
            />

            <InteractiveDashboard />
          </div>
        </div>
      </section>


      {/* Premium Features Redesign */}
      <section id="features" className="relative w-full bg-[#050505] text-black dark:text-white pt-32 pb-40 overflow-hidden">
        {/* Ambient Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-black/10 dark:bg-white/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-black/5 dark:bg-theme-glow rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-black/5 dark:bg-theme-glow rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          {/* Section Header */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="text-center mb-32 max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-black to-gray-500 dark:from-white dark:to-gray-500">
              Stop switching between 8 different tools.
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300">
              Tasks, chat, docs, AI, code reviews, and project planning — all in one workspace.
            </p>
          </motion.div>

          {/* Feature 1: AI */}
          <div className="flex flex-col lg:flex-row items-center gap-16 mb-40">
            <motion.div 
              className="w-full lg:w-1/2 order-2 lg:order-1"
              initial={{ opacity: 0, x: -120 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <div className="relative w-full group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[rgba(255,255,255,0.1)] to-transparent rounded-[26px] blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
                <div className="relative p-1 rounded-2xl bg-gradient-to-b from-[rgba(255,255,255,0.1)] to-transparent">
                  <div className="bg-zinc-100 dark:bg-[#09090B] rounded-xl overflow-hidden border border-black/5 dark:border-white/5 relative h-[380px] p-6 flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.25)]">
                  <Suspense fallback={<div className="flex items-center justify-center h-full text-black dark:text-white/50">Loading...</div>}><AIWidget /></Suspense>
                </div>
              </div>
              </div>
            </motion.div>
            <motion.div 
              className="w-full lg:w-1/2 order-1 lg:order-2"
              initial={{ opacity: 0, x: 120 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <h3 className="text-3xl font-bold mb-4">AI That Understands Your Project</h3>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                Unlike generic AI tools, DevCollab reads your tasks, docs, discussions, and team activity before generating insights.
              </p>
            </motion.div>
          </div>

          {/* Feature 2: Tasks */}
          <div className="flex flex-col lg:flex-row items-center gap-16 mb-40">
            <motion.div 
              className="w-full lg:w-1/2"
              initial={{ opacity: 0, x: -120 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <h3 className="text-3xl font-bold mb-4">Tasks Connected To Everything</h3>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                Every task automatically links to discussions, documentation, code reviews, and project updates.
              </p>
            </motion.div>
            <motion.div 
              className="w-full lg:w-1/2"
              initial={{ opacity: 0, x: 120 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <div className="relative w-full group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[rgba(255,255,255,0.1)] to-transparent rounded-[26px] blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
                <div className="relative p-1 rounded-2xl bg-gradient-to-b from-[rgba(255,255,255,0.1)] to-transparent">
                  <div className="bg-zinc-100 dark:bg-[#09090B] rounded-xl overflow-hidden border border-black/5 dark:border-white/5 relative h-[380px] p-6 flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.25)]">
                  <Suspense fallback={<div className="flex items-center justify-center h-full text-black dark:text-white/50">Loading...</div>}><KanbanWidget /></Suspense>
                </div>
              </div>
              </div>
            </motion.div>
          </div>

          {/* Feature 3: Chat */}
          <div className="flex flex-col lg:flex-row items-center gap-16 mb-40">
            <motion.div 
              className="w-full lg:w-1/2 order-2 lg:order-1"
              initial={{ opacity: 0, x: -120 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <div className="relative w-full group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[rgba(255,255,255,0.1)] to-transparent rounded-[26px] blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
                <div className="relative p-1 rounded-2xl bg-gradient-to-b from-[rgba(255,255,255,0.1)] to-transparent">
                  <div className="bg-zinc-100 dark:bg-[#09090B] rounded-xl overflow-hidden border border-black/5 dark:border-white/5 relative h-[380px] p-6 flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.25)]">
                  <Suspense fallback={<div className="flex items-center justify-center h-full text-black dark:text-white/50">Loading...</div>}><ChatWidget /></Suspense>
                </div>
              </div>
              </div>
            </motion.div>
            <motion.div 
              className="w-full lg:w-1/2 order-1 lg:order-2"
              initial={{ opacity: 0, x: 120 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <h3 className="text-3xl font-bold mb-4">Conversations Where Work Happens</h3>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                Discuss tasks, review PRs, and collaborate in real time without leaving your workspace.
              </p>
            </motion.div>
          </div>

          {/* Feature 4: Wiki */}
          <div className="flex flex-col lg:flex-row items-center gap-16 mb-40">
            <motion.div 
              className="w-full lg:w-1/2"
              initial={{ opacity: 0, x: -120 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <h3 className="text-3xl font-bold mb-4">Documentation That Stays Up To Date</h3>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                Create, organize, and maintain project knowledge with AI-assisted documentation.
              </p>
            </motion.div>
            <motion.div 
              className="w-full lg:w-1/2"
              initial={{ opacity: 0, x: 120 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <div className="relative w-full group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[rgba(255,255,255,0.1)] to-transparent rounded-[26px] blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
                <div className="relative p-1 rounded-2xl bg-gradient-to-b from-[rgba(255,255,255,0.1)] to-transparent">
                  <div className="bg-zinc-100 dark:bg-[#09090B] rounded-xl overflow-hidden border border-black/5 dark:border-white/5 relative h-[380px] p-6 flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.25)]">
                  <Suspense fallback={<div className="flex items-center justify-center h-full text-black dark:text-white/50">Loading...</div>}><WikiWidget /></Suspense>
                </div>
              </div>
              </div>
            </motion.div>
          </div>

          {/* Feature 5: Real-time */}
          <div className="flex flex-col lg:flex-row items-center gap-16 mb-40">
            <motion.div 
              className="w-full lg:w-1/2 order-2 lg:order-1"
              initial={{ opacity: 0, x: -120 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <div className="relative w-full group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[rgba(255,255,255,0.1)] to-transparent rounded-[26px] blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
                <div className="relative p-1 rounded-2xl bg-gradient-to-b from-[rgba(255,255,255,0.1)] to-transparent">
                  <div className="bg-zinc-100 dark:bg-[#09090B] rounded-xl overflow-hidden border border-black/5 dark:border-white/5 relative h-[380px] p-6 flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.25)]">
                  <Suspense fallback={<div className="flex items-center justify-center h-full text-black dark:text-white/50">Loading...</div>}><RealtimeWidget /></Suspense>
                </div>
              </div>
              </div>
            </motion.div>
            <motion.div 
              className="w-full lg:w-1/2 order-1 lg:order-2"
              initial={{ opacity: 0, x: 120 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <h3 className="text-3xl font-bold mb-4">Real-Time Team Collaboration</h3>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                See teammates typing, editing, reviewing, and updating tasks live across the workspace.
              </p>
            </motion.div>
          </div>

          {/* Feature 6: AI Engineer (Editor) */}
          <div className="flex flex-col lg:flex-row items-center gap-16 mb-40">
            <motion.div 
              className="w-full lg:w-1/2"
              initial={{ opacity: 0, x: -120 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <h3 className="text-3xl font-bold mb-4">Your Team's AI Engineer</h3>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                Generate standups, sprint plans, code reviews, risk reports, and project summaries in one click.
              </p>
            </motion.div>
            <motion.div 
              className="w-full lg:w-1/2"
              initial={{ opacity: 0, x: 120 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <div className="relative w-full group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[rgba(255,255,255,0.1)] to-transparent rounded-[26px] blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
                <div className="relative p-1 rounded-2xl bg-gradient-to-b from-[rgba(255,255,255,0.1)] to-transparent">
                  <div className="bg-zinc-100 dark:bg-[#09090B] rounded-xl overflow-hidden border border-black/5 dark:border-white/5 relative h-[380px] p-6 flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.25)]">
                    <Suspense fallback={<div className="flex items-center justify-center h-full text-black dark:text-white/50">Loading...</div>}><EditorWidget /></Suspense>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>


        </div>
      </section>

      {/* AI Spotlight Redesign */}
      <section className="relative w-full bg-[#050505] text-black dark:text-white pt-32 pb-24 overflow-hidden">
        {/* Blurred Radial Gradients */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-black/10 dark:bg-white/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-[#4F46E5]/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#2563EB]/15 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Subtle Grid Texture */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgwem0yMCAyMGgyMHYyMEgyMHptLTIwIDBoMjB2MjBIMHptMjAtMjBoMjB2MjBIMjB6IiBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDIiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] opacity-[0.03] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Left Content */}
            <motion.div 
              className="w-full lg:w-5/12 flex flex-col items-start"
              initial={{ opacity: 0, x: -120 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <div className="px-4 py-1.5 mb-6 rounded-full bg-black/5 dark:bg-theme-glow border border-black/5 dark:border-white/5 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 backdrop-blur-md">
                <span className="text-sm">✨</span> AI Powered
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
                Your project data,<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-300 to-gray-500">
                  understood by AI.
                </span>
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                DevCollab's AI reads your actual tasks, wikis, and activity — not generic inputs. Get standup reports, code reviews, risk signals, and sprint plans without copy-pasting context.
              </p>
              <div className="flex items-center gap-4">
                <button className="px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition-colors">
                  Try AI Features
                </button>
                <button className="px-6 py-3 rounded-lg bg-black/5 dark:bg-theme-glow border border-black/5 dark:border-white/5 text-black dark:text-white font-semibold hover:bg-black/10 dark:bg-white/10 transition-colors">
                  Read Docs
                </button>
              </div>
            </motion.div>

            {/* Right Dashboard Mockup */}
            <motion.div 
              className="w-full lg:w-7/12"
              initial={{ opacity: 0, x: 120 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
            >
              <div className="relative group">
                {/* Outer Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[rgba(255,255,255,0.1)] to-transparent rounded-[26px] blur-xl opacity-50 group-hover:opacity-75 transition duration-1000" />
                
                {/* Glass Panel */}
                <div className="relative bg-[#0A0A0C]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[24px] p-6 shadow-2xl flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-black dark:text-white text-xs">
                        ✨
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-black dark:text-white">Project Intelligence</div>
                        <div className="text-[10px] text-gray-700 dark:text-gray-300">Analyzing latest commits & tasks</div>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-black/20 dark:bg-white/20" />
                      <div className="w-2.5 h-2.5 rounded-full bg-black/20 dark:bg-white/20" />
                    </div>
                  </div>

                  {/* Dashboard Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Block 1 */}
                    <div className="bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl p-4 hover:bg-white/[0.04] transition-colors cursor-default">
                      <div className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider mb-2">Standup Summary</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                        <span className="text-green-400">✓</span> 3 PRs merged<br/>
                        <span className="text-yellow-400">!</span> API auth is blocking Frontend<br/>
                        <span className="text-gray-700 dark:text-gray-300">→</span> Next: Deploy staging
                      </div>
                    </div>
                    
                    {/* Block 2 */}
                    <div className="bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl p-4 hover:bg-white/[0.04] transition-colors cursor-default">
                      <div className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Sprint Velocity</div>
                      <div className="flex items-end gap-2 h-10 mb-1">
                        <div className="w-1/4 bg-gray-300/20 rounded-t h-[40%]" />
                        <div className="w-1/4 bg-gray-300/40 rounded-t h-[60%]" />
                        <div className="w-1/4 bg-gray-300/60 rounded-t h-[80%]" />
                        <div className="w-1/4 bg-gray-300 rounded-t h-full" />
                      </div>
                      <div className="text-[10px] text-gray-700 dark:text-gray-300">Team is operating 15% faster</div>
                    </div>

                    {/* Block 3 */}
                    <div className="col-span-2 bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl p-4 hover:bg-white/[0.04] transition-colors cursor-default">
                      <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">Risk Detection</div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg text-red-400 text-xs mt-0.5">⚠️</div>
                        <div>
                          <div className="text-sm text-black dark:text-white font-medium mb-1">Database connection leak</div>
                          <div className="text-xs text-gray-700 dark:text-gray-300 mb-3">Found in PR #42. The `Pool.connect()` is called without `release()` in the error handler block.</div>
                          <button className="text-[10px] font-semibold bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:bg-white/20 text-black dark:text-white px-3 py-1.5 rounded transition-colors">
                            View Suggested Fix
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Modern Tech Stack Section */}
      <section className="relative w-full bg-[#050505] pt-12 pb-32 border-b border-black/5 dark:border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center mb-12">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide uppercase">
            Built on technologies trusted by modern engineering teams
          </p>
        </div>
        
        {/* Marquee Row 1 */}
        <div className="relative w-full flex overflow-hidden group [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="custom-animate-marquee w-max whitespace-nowrap flex items-center py-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-12 pr-12">
                <div className="flex items-center gap-3 bg-black/5 dark:bg-theme-glow border border-black/5 dark:border-white/5 rounded-full px-6 py-3 text-black dark:text-white font-medium hover:bg-black/10 dark:bg-white/10 transition-colors cursor-default">
                  <svg className="w-5 h-5 text-[#61DAFB]" viewBox="-11.5 -10.2 23 20.4" fill="currentColor"><circle cx="0" cy="0" r="2.05"/><g stroke="currentColor" strokeWidth="1" fill="none"><ellipse rx="11" ry="4.2"/><ellipse rx="11" ry="4.2" transform="rotate(60)"/><ellipse rx="11" ry="4.2" transform="rotate(120)"/></g></svg>
                  React
                </div>
                <div className="flex items-center gap-3 bg-black/5 dark:bg-theme-glow border border-black/5 dark:border-white/5 rounded-full px-6 py-3 text-black dark:text-white font-medium hover:bg-black/10 dark:bg-white/10 transition-colors cursor-default">
                  <svg className="w-5 h-5 text-[#3178C6]" viewBox="0 0 24 24" fill="currentColor"><path d="M21 21H3V3h18v18zM14.7 15.6c-.7 1.2-1.9 1.7-3.4 1.7-2.6 0-3.6-1.5-3.6-3.8V9h1.7v4.3c0 1.7.5 2.5 2 2.5 1 0 1.8-.4 2.2-1.2l1.1 1zM9.4 9H4.3v1.5h1.7V17h1.7v-6.5h1.7V9z"/></svg>
                  TypeScript
                </div>
                <div className="flex items-center gap-3 bg-black/5 dark:bg-theme-glow border border-black/5 dark:border-white/5 rounded-full px-6 py-3 text-black dark:text-white font-medium hover:bg-black/10 dark:bg-white/10 transition-colors cursor-default">
                  <svg className="w-5 h-5 text-[#336791]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                  PostgreSQL
                </div>
                <div className="flex items-center gap-3 bg-black/5 dark:bg-theme-glow border border-black/5 dark:border-white/5 rounded-full px-6 py-3 text-black dark:text-white font-medium hover:bg-black/10 dark:bg-white/10 transition-colors cursor-default">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  Gemini AI
                </div>
                <div className="flex items-center gap-3 bg-black/5 dark:bg-theme-glow border border-black/5 dark:border-white/5 rounded-full px-6 py-3 text-black dark:text-white font-medium hover:bg-black/10 dark:bg-white/10 transition-colors cursor-default">
                  <svg className="w-5 h-5 text-[#000] bg-white rounded-full" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  Socket.IO
                </div>
                <div className="flex items-center gap-3 bg-black/5 dark:bg-theme-glow border border-black/5 dark:border-white/5 rounded-full px-6 py-3 text-black dark:text-white font-medium hover:bg-black/10 dark:bg-white/10 transition-colors cursor-default">
                  <svg className="w-5 h-5 text-[#DC382D]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                  Redis
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Marquee Row 2 */}
        <div className="relative w-full flex overflow-hidden group mt-4 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="custom-animate-marquee w-max whitespace-nowrap flex items-center py-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-12 pr-12">
                <div className="flex items-center gap-3 bg-black/5 dark:bg-theme-glow border border-black/5 dark:border-white/5 rounded-full px-6 py-3 text-black dark:text-white font-medium hover:bg-black/10 dark:bg-white/10 transition-colors cursor-default">
                  <svg className="w-5 h-5 text-black dark:text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z"/></svg>
                  Vercel
                </div>
                <div className="flex items-center gap-3 bg-black/5 dark:bg-theme-glow border border-black/5 dark:border-white/5 rounded-full px-6 py-3 text-black dark:text-white font-medium hover:bg-black/10 dark:bg-white/10 transition-colors cursor-default">
                  <svg className="w-5 h-5 text-[#FF4154]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
                  Figma
                </div>
                <div className="flex items-center gap-3 bg-black/5 dark:bg-theme-glow border border-black/5 dark:border-white/5 rounded-full px-6 py-3 text-black dark:text-white font-medium hover:bg-black/10 dark:bg-white/10 transition-colors cursor-default">
                  <svg className="w-5 h-5 text-[#F05032]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22A10 10 0 102 12a10 10 0 0010 10zM12 4a8 8 0 11-8 8 8 8 0 018-8z"/></svg>
                  Git
                </div>
                <div className="flex items-center gap-3 bg-black/5 dark:bg-theme-glow border border-black/5 dark:border-white/5 rounded-full px-6 py-3 text-black dark:text-white font-medium hover:bg-black/10 dark:bg-white/10 transition-colors cursor-default">
                  <svg className="w-5 h-5 text-[#339933]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22a10 10 0 1110-10 10 10 0 01-10 10zm-3-12h6v2H9v-2z"/></svg>
                  Node.js
                </div>
                <div className="flex items-center gap-3 bg-black/5 dark:bg-theme-glow border border-black/5 dark:border-white/5 rounded-full px-6 py-3 text-black dark:text-white font-medium hover:bg-black/10 dark:bg-white/10 transition-colors cursor-default">
                  <svg className="w-5 h-5 text-[#000] bg-white rounded-full" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                  GitHub
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Pricing Section */}
      <section id="pricing" className="relative w-full bg-[#050505] text-black dark:text-white py-[120px]">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-black/10 dark:bg-white/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-black dark:text-white tracking-wide uppercase mb-4 block">
              Simple, transparent pricing
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Pricing that scales with your team
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-10">
              Start free. Upgrade when your team grows.
            </p>
            
            {/* Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${!isAnnual ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>Monthly</span>
              <button 
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-14 h-7 rounded-full bg-black/10 dark:bg-white/10 border border-black/5 dark:border-white/5 relative transition-colors focus:outline-none flex items-center"
              >
                <motion.div 
                  className="w-5 h-5 rounded-full bg-white absolute"
                  animate={{ left: isAnnual ? '30px' : '6px' }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isAnnual ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>Annually</span>
                <span className="bg-black/20 dark:bg-white/20 text-gray-700 dark:text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.2)]">Save 20%</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
            {/* Free Plan */}
            <motion.div 
              className="relative group bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-3xl p-10 hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-2"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="text-2xl font-bold mb-2">Free</div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-bold tracking-tight">₹0</span>
                <span className="text-gray-700 dark:text-gray-300">/month</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-8 h-12">Perfect for individuals and small teams getting started.</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-black dark:text-white">✓</span> Up to 3 team members
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-black dark:text-white">✓</span> Unlimited tasks
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-black dark:text-white">✓</span> 7-day message history
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-black dark:text-white">✓</span> Community support
                </li>
              </ul>
              <Link to="/register" className="block w-full py-3 px-4 rounded-xl border border-black/5 dark:border-white/5 text-center font-semibold hover:bg-black/10 dark:bg-white/10 transition-colors">
                Start for free
              </Link>
            </motion.div>

            {/* Pro Plan (Featured) */}
            <motion.div 
              className="relative group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              {/* Animated Glow Border Wrapper */}
              <div className="absolute -inset-[2px] bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-[26px] opacity-70 group-hover:opacity-100 blur-[2px] transition duration-500" />
              
              <div className="relative bg-[#0A0A0C] border border-black/5 dark:border-white/5 rounded-3xl p-10 shadow-2xl scale-[1.02] hover:-translate-y-2 transition-transform duration-300">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-white to-gray-300 text-black text-black dark:text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Most Popular
                </div>
                <div className="text-2xl font-bold mb-2">Pro</div>
                <div className="flex items-baseline gap-1 mb-6">
                  <motion.span
                    key={isAnnual ? 'annual' : 'monthly'}
                    initial={{ rotateX: 90, opacity: 0 }}
                    animate={{ rotateX: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-5xl font-bold tracking-tight inline-block min-w-[120px] text-left"
                  >
                    ₹{isAnnual ? '239' : '299'}
                  </motion.span>
                  <span className="text-gray-700 dark:text-gray-300">/user/month</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-8 h-12">
                  {isAnnual ? 'Billed ₹2,868 per user annually.' : 'Everything you need to scale your engineering team.'}
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <span className="text-black dark:text-white">✓</span> Unlimited team members
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-black dark:text-white">✓</span> Advanced AI Intelligence
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-black dark:text-white">✓</span> Unlimited history
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-black dark:text-white">✓</span> Priority support
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-black dark:text-white">✓</span> Custom integrations
                  </li>
                </ul>
                <Link to="/register" className="block w-full py-3 px-4 rounded-xl bg-gradient-to-r from-white to-gray-300 text-black text-center font-semibold text-black dark:text-white shadow-lg shadow-white/25 hover:shadow-white/50 transition-shadow">
                  Upgrade to Pro
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="landing-container animate-on-scroll">
          <h2>Ready to ship faster as a team?</h2>
          <p>Join DevCollab and bring your entire dev workflow into one place.</p>
          <Link to="/register" className="btn btn-primary btn-lg" style={{ fontSize: '1rem', padding: '16px 32px' }}>Get Early Access &rarr;</Link>
          <span className="sub-text">Free to start. No credit card required.</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-container">
        <div className="footer-grid">
          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#">Integrations</a></li>
              <li><a href="#pricing">Pricing</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>About Us</h4>
            <ul>
              <li className="text-sm text-gray-500 mb-2">Built by team thunder</li>
              <li><Link to="/login">Go to Product</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div>© 2026 DevCollab</div>
          <div>Made with ♥ for developers</div>
        </div>
      </footer>
    </div>
  );
}
