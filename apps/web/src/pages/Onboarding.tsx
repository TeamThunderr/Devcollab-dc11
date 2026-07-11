import React, { useState, useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeContext } from "../context/ThemeContext";
import { Zap, Sun, Moon, Plus, Users, ArrowRight, Check, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCreateWorkspace } from "../hooks/useWorkspaces";

type FlowState = "selection" | "create" | "join";
type CreateStep = 1 | 2 | 3;

export function Onboarding() {
  const context = useContext(ThemeContext);
  const theme = context?.theme || "dark";
  const toggleTheme = context?.toggleTheme || (() => {});
  const isDark = theme === "dark";
  
  const navigate = useNavigate();
  const [flow, setFlow] = useState<FlowState>("selection");
  const [createStep, setCreateStep] = useState<CreateStep>(1);
  const [isCreating, setIsCreating] = useState(false);
  
  // Workspace Form State
  const [wsName, setWsName] = useState("");
  const [wsDesc, setWsDesc] = useState("");
  const [wsSlug, setWsSlug] = useState("");
  const [plan, setPlan] = useState<"free" | "pro">("pro");
  
  // Join Form State
  const [inviteCode, setInviteCode] = useState("");
  
  const createWorkspace = useCreateWorkspace();

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createStep < 3) {
      setCreateStep((prev) => (prev + 1) as CreateStep);
    } else {
      setIsCreating(true);
      try {
        await createWorkspace.mutateAsync({ name: wsName, slug: wsSlug, description: wsDesc });
        navigate("/dashboard");
      } catch (err) {
        console.error("Failed to create workspace", err);
        setIsCreating(false);
      }
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setIsCreating(true);
    setTimeout(() => {
      setIsCreating(false);
      navigate("/dashboard");
    }, 1500);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },

    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-8 transition-colors duration-700 ${isDark ? "bg-[#000000]" : "bg-[#f4f4f5]"}`}>
      
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <button 
          onClick={toggleTheme}
          className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 ${
            isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-black"
          }`}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full max-w-[800px] rounded-[32px] overflow-hidden flex flex-col shadow-2xl transition-colors duration-700 ${
          isDark ? "bg-[#0a0a0a] border border-white/10 shadow-[0_0_100px_rgba(255,255,255,0.03)]" : "bg-white border border-black/10 shadow-[0_20px_100px_rgba(0,0,0,0.08)]"
        }`}
        style={{ minHeight: "500px" }}
      >
        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
          isDark ? "shadow-[inset_0_0_120px_rgba(255,255,255,0.02)]" : "shadow-[inset_0_0_120px_rgba(0,0,0,0.02)]"
        }`}></div>

        <div className="flex flex-col flex-1 p-8 md:p-12 relative z-10">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-sm ${
              isDark ? "bg-white text-black" : "bg-black text-white"
            }`}>
              <Zap className="w-6 h-6" />
            </div>
            <h1 className={`text-2xl md:text-3xl font-bold tracking-tight text-center ${isDark ? "text-white" : "text-black"}`}>
              {flow === "selection" && "Welcome to DevCollab"}
              {flow === "create" && "Create your workspace"}
              {flow === "join" && "Join a workspace"}
            </h1>
            <p className={`mt-2 text-center text-sm md:text-base ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {flow === "selection" && "How would you like to start collaborating?"}
              {flow === "create" && `Step ${createStep} of 3`}
              {flow === "join" && "Enter your invite code below."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            
            {/* ===================== SELECTION VIEW ===================== */}
            {flow === "selection" && (
              <motion.div 
                key="selection"
                variants={containerVariants}
                initial="hidden" animate="visible" exit="exit"
                className="flex flex-col md:flex-row gap-6 mt-4 max-w-[700px] mx-auto w-full"
              >
                <button
                  onClick={() => setFlow("create")}
                  className={`flex-1 flex flex-col items-center text-center p-8 rounded-2xl border transition-all duration-300 group ${
                    isDark 
                      ? "bg-[#111] border-white/10 hover:bg-white/5 hover:border-white/30 text-white" 
                      : "bg-[#f9f9f9] border-black/10 hover:bg-white hover:border-black/30 hover:shadow-lg text-black"
                  }`}
                >
                  <div className={`p-4 rounded-full mb-6 transition-transform duration-300 group-hover:scale-110 ${
                    isDark ? "bg-white/10" : "bg-black/5"
                  }`}>
                    <Plus className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Create Workspace</h3>
                  <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Start a new workspace for your team and begin collaborating.
                  </p>
                </button>

                <button
                  onClick={() => setFlow("join")}
                  className={`flex-1 flex flex-col items-center text-center p-8 rounded-2xl border transition-all duration-300 group ${
                    isDark 
                      ? "bg-[#111] border-white/10 hover:bg-white/5 hover:border-white/30 text-white" 
                      : "bg-[#f9f9f9] border-black/10 hover:bg-white hover:border-black/30 hover:shadow-lg text-black"
                  }`}
                >
                  <div className={`p-4 rounded-full mb-6 transition-transform duration-300 group-hover:scale-110 ${
                    isDark ? "bg-white/10" : "bg-black/5"
                  }`}>
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Join Existing Workspace</h3>
                  <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Already have an invite code? Join your team instantly.
                  </p>
                </button>
              </motion.div>
            )}


            {/* ===================== CREATE WIZARD ===================== */}
            {flow === "create" && (
              <motion.div 
                key="create"
                variants={containerVariants}
                initial="hidden" animate="visible" exit="exit"
                className="max-w-[500px] mx-auto w-full"
              >
                <form onSubmit={handleCreateSubmit} className="space-y-6">
                  <AnimatePresence mode="wait">
                    
                    {/* STEP 1: Details */}
                    {createStep === 1 && (
                      <motion.div key="step1" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                        <div className="space-y-1.5">
                          <label className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}>Workspace Name</label>
                          <input 
                            required
                            minLength={2}
                            type="text" 
                            placeholder="e.g. Thunder Labs" 
                            value={wsName}
                            onChange={(e) => setWsName(e.target.value)}
                            className={`w-full px-4 py-3.5 rounded-xl border outline-none transition-all duration-300 ${
                              isDark ? "bg-[#111] border-white/10 focus:border-white/30 text-white placeholder:text-gray-600" 
                                     : "bg-[#f9f9f9] border-black/10 focus:border-black/30 text-black placeholder:text-gray-400"
                            }`} 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}>Description</label>
                          <input 
                            type="text" 
                            placeholder="AI-powered collaboration platform..." 
                            value={wsDesc}
                            onChange={(e) => setWsDesc(e.target.value)}
                            className={`w-full px-4 py-3.5 rounded-xl border outline-none transition-all duration-300 ${
                              isDark ? "bg-[#111] border-white/10 focus:border-white/30 text-white placeholder:text-gray-600" 
                                     : "bg-[#f9f9f9] border-black/10 focus:border-black/30 text-black placeholder:text-gray-400"
                            }`} 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}>Workspace URL</label>
                          <div className="relative flex items-center">
                            <span className={`absolute left-4 text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>devcollab.com/</span>
                            <input 
                              required
                              minLength={2}
                              type="text" 
                              placeholder="thunder-labs" 
                              value={wsSlug}
                              onChange={(e) => setWsSlug(e.target.value)}
                              className={`w-full pl-36 pr-4 py-3.5 rounded-xl border outline-none transition-all duration-300 ${
                                isDark ? "bg-[#111] border-white/10 focus:border-white/30 text-white placeholder:text-gray-600" 
                                       : "bg-[#f9f9f9] border-black/10 focus:border-black/30 text-black placeholder:text-gray-400"
                              }`} 
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 2: Plan Selection */}
                    {createStep === 2 && (
                      <motion.div key="step2" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col sm:flex-row gap-4">
                        {/* Free Plan */}
                        <div 
                          onClick={() => setPlan("free")}
                          className={`flex-1 relative cursor-pointer rounded-2xl p-6 border transition-all duration-300 ${
                            plan === "free" 
                              ? (isDark ? "bg-white/10 border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.05)]" : "bg-white border-black/40 shadow-lg")
                              : (isDark ? "bg-[#111] border-white/10 hover:border-white/20" : "bg-[#f9f9f9] border-black/10 hover:border-black/20")
                          }`}
                        >
                          {plan === "free" && <div className={`absolute top-4 right-4 rounded-full p-1 ${isDark ? "bg-white text-black" : "bg-black text-white"}`}><Check className="w-3 h-3" /></div>}
                          <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Best for Students</div>
                          <h3 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-black"}`}>Free</h3>
                          <ul className={`text-sm space-y-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                            <li>• 1 Workspace</li>
                            <li>• 3 Projects</li>
                            <li>• 5 Members</li>
                          </ul>
                        </div>

                        {/* Pro Plan */}
                        <div 
                          onClick={() => setPlan("pro")}
                          className={`flex-1 relative cursor-pointer rounded-2xl p-6 border transition-all duration-300 ${
                            plan === "pro" 
                              ? (isDark ? "bg-white/10 border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.05)]" : "bg-white border-black/40 shadow-lg")
                              : (isDark ? "bg-[#111] border-white/10 hover:border-white/20" : "bg-[#f9f9f9] border-black/10 hover:border-black/20")
                          }`}
                        >
                          {plan === "pro" && <div className={`absolute top-4 right-4 rounded-full p-1 ${isDark ? "bg-white text-black" : "bg-black text-white"}`}><Check className="w-3 h-3" /></div>}
                          <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 text-indigo-500`}>Recommended</div>
                          <h3 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-black"}`}>Pro</h3>
                          <ul className={`text-sm space-y-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                            <li>• Unlimited Workspaces</li>
                            <li>• AI Assistant & Code Review</li>
                            <li>• Unlimited Members</li>
                          </ul>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 3: Review */}
                    {createStep === 3 && (
                      <motion.div key="step3" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className={`p-6 rounded-2xl border ${isDark ? "bg-[#111] border-white/10" : "bg-[#f9f9f9] border-black/10"}`}>
                        <h3 className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-black"}`}>Review Workspace</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className={isDark ? "text-gray-400" : "text-gray-500"}>Name</span>
                            <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{wsName}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className={isDark ? "text-gray-400" : "text-gray-500"}>Slug</span>
                            <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>/{wsSlug}</span>
                          </div>
                          <div className="flex justify-between pb-2">
                            <span className={isDark ? "text-gray-400" : "text-gray-500"}>Plan</span>
                            <span className={`font-medium capitalize ${isDark ? "text-white" : "text-black"}`}>{plan} Plan</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-4 pt-6">
                    <button 
                      type="button"
                      onClick={() => createStep > 1 ? setCreateStep((prev) => (prev - 1) as CreateStep) : setFlow("selection")}
                      className={`flex-1 py-3.5 rounded-xl font-medium border transition-all duration-300 ${
                        isDark 
                          ? "bg-[#111] border-white/10 hover:bg-white/5 text-white" 
                          : "bg-white border-black/10 hover:bg-gray-50 text-black"
                      }`}
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      disabled={isCreating}
                      className={`flex-1 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                        isDark 
                          ? "bg-white text-black hover:bg-gray-100 hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                          : "bg-black text-white hover:bg-gray-900 hover:scale-[1.02] shadow-[0_5px_20px_rgba(0,0,0,0.15)]"
                      }`}
                    >
                      {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : (createStep < 3 ? "Continue" : "Create Workspace")}
                      {!isCreating && createStep < 3 && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ===================== JOIN WIZARD ===================== */}
            {flow === "join" && (
              <motion.div 
                key="join"
                variants={containerVariants}
                initial="hidden" animate="visible" exit="exit"
                className="max-w-[400px] mx-auto w-full"
              >
                <form onSubmit={handleJoinSubmit} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}>Invite Code</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. ABC-123-XYZ" 
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className={`w-full px-4 py-3.5 rounded-xl border outline-none transition-all duration-300 font-mono tracking-widest text-center text-lg uppercase ${
                        isDark ? "bg-[#111] border-white/10 focus:border-white/30 text-white placeholder:text-gray-700" 
                               : "bg-[#f9f9f9] border-black/10 focus:border-black/30 text-black placeholder:text-gray-300"
                      }`} 
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setFlow("selection")}
                      className={`px-4 py-3.5 rounded-xl font-medium border transition-all duration-300 ${
                        isDark 
                          ? "bg-[#111] border-white/10 hover:bg-white/5 text-white" 
                          : "bg-white border-black/10 hover:bg-gray-50 text-black"
                      }`}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <button 
                      type="submit"
                      disabled={isCreating || !inviteCode.trim()}
                      className={`flex-1 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 ${
                        isDark 
                          ? "bg-white text-black hover:bg-gray-100 hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                          : "bg-black text-white hover:bg-gray-900 hover:scale-[1.02] shadow-[0_5px_20px_rgba(0,0,0,0.15)]"
                      }`}
                    >
                      {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Join Workspace"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
            
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
