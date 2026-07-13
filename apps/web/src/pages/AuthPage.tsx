import React, { useState, useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeContext } from "../context/ThemeContext";
import { Github, Mail, Lock, Sun, Moon, ArrowRight, Zap, Layers, Sparkles, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import { useRole } from "../context/RBACContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export function AuthPage() {
  const { setRole } = useRole();
  const { login } = useAuth();
  const context = useContext(ThemeContext);
  // Default to dark theme logic if context is missing for some reason
  const theme = context?.theme || "dark";
  const toggleTheme = context?.toggleTheme || (() => {});
  
  const [isRegister, setIsRegister] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authStep, setAuthStep] = useState<"DETAILS" | "OTP">("DETAILS");
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const [countdown, setCountdown] = useState(60);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  
  const isDark = theme === "dark";

  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (location.state?.from) {
      localStorage.setItem('returnTo', location.state.from);
    }
  }, [location]);

  useEffect(() => {
    if (authStep === "OTP" && countdown > 0) {
      const timerId = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [countdown, authStep]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/api/auth/send-signup-otp', { email });
      setCountdown(60);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    }
  };

  const panelTransition = { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isRegister) {
        if (authStep === "DETAILS") {
          await api.post("/api/auth/send-signup-otp", { email });
          setAuthStep("OTP");
          setCountdown(60);
        } else {
          const otp = otpValues.join("");
          if (otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP.");
            setIsLoading(false);
            return;
          }
          const { data } = await api.post("/api/auth/register", { name, email, password, otp });
          login(data.user);
          navigate("/select-workspace");
        }
      } else {
        const { data } = await api.post("/api/auth/login", { email, password });
        login(data.user);
        
        const cleanEmail = email.trim().toLowerCase();
        if (cleanEmail.startsWith("admin")) {
          setRole("ADMIN");
        } else if (cleanEmail.startsWith("member")) {
          setRole("MEMBER");
        } else if (cleanEmail.startsWith("viewer")) {
          setRole("VIEWER");
        }
        
        navigate("/select-workspace");

      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || "An error occurred during authentication.";
      setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-8 transition-colors duration-700 ${isDark ? "bg-[#000000]" : "bg-[#f4f4f5]"}`}>
      
      {/* Theme Toggle (Top Right) */}
      <div className="absolute top-6 right-6 z-50">
        <button 
          onClick={toggleTheme}
          className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 ${
            isDark 
              ? "bg-white/10 hover:bg-white/20 text-white" 
              : "bg-black/5 hover:bg-black/10 text-black"
          }`}
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Card Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full max-w-[1100px] rounded-[32px] overflow-hidden flex flex-col md:block shadow-2xl transition-colors duration-700 ${
          isDark 
            ? "bg-[#0a0a0a] border border-white/10 shadow-[0_0_100px_rgba(255,255,255,0.03)]" 
            : "bg-white border border-black/10 shadow-[0_20px_100px_rgba(0,0,0,0.08)]"
        }`}
        style={{ minHeight: "680px" }}
      >
        
        {/* =========================================================
            BRANDING PANEL 
            Desktop: Absolute positioned, sliding 
            Mobile: Static, shown at top
            ========================================================= */}
        <motion.div
          animate={{ 
            x: isMobile ? 0 : (isRegister ? "100%" : "0%"),
            opacity: 1
          }}
          transition={panelTransition}
          className={`w-full md:absolute top-0 bottom-0 md:w-1/2 p-10 md:p-14 flex flex-col justify-between z-20 ${
            isDark ? "text-white bg-[#050505]" : "text-black bg-[#fafafa]"
          } md:shadow-[0_0_50px_rgba(0,0,0,0.1)]`}
        >
          {/* Subtle background glow effect on Branding Panel */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute -top-[20%] -left-[10%] w-[140%] h-[140%] rounded-full opacity-[0.03] blur-3xl ${isDark ? "bg-white" : "bg-black"}`}></div>
          </div>

          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 w-max">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-700 shadow-sm ${
                isDark ? "bg-white text-black" : "bg-black text-white"
              }`}>
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">DevCollab</span>
            </Link>
            
            <div className="mt-16 md:mt-24 space-y-8">
              <AnimatePresence mode="wait">
                <motion.h2 
                  key={isRegister ? "register" : "login"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-3xl lg:text-4xl font-bold leading-[1.2] tracking-tight"
                >
                  {isRegister ? "Join the next generation of engineering teams." : "Welcome back to your workspace."}
                </motion.h2>
              </AnimatePresence>
              
              <div className="space-y-6 pt-4">
                <div className="flex gap-4 group">
                  <div className={`mt-1 p-2.5 rounded-xl h-fit transition-all duration-300 ${isDark ? "bg-white/5 group-hover:bg-white/10" : "bg-black/5 group-hover:bg-black/10"}`}>
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Everything Your Team Needs</h3>
                    <p className={`text-sm leading-relaxed transition-colors duration-700 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Projects, tasks, documentation, snippets, and communication in one workspace.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 group">
                  <div className={`mt-1 p-2.5 rounded-xl h-fit transition-all duration-300 ${isDark ? "bg-white/5 group-hover:bg-white/10" : "bg-black/5 group-hover:bg-black/10"}`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">AI That Works Alongside Your Team</h3>
                    <p className={`text-sm leading-relaxed transition-colors duration-700 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Generate summaries, detect blockers, and review code with project-aware AI.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className={`relative z-10 text-sm transition-colors duration-700 mt-12 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
            © {new Date().getFullYear()} DevCollab Inc.
          </div>
        </motion.div>

        {/* =========================================================
            FORM PANEL 
            Desktop: Absolute positioned, sliding 
            Mobile: Static, shown below branding
            ========================================================= */}
        <motion.div
          animate={{ 
            x: isMobile ? 0 : (isRegister ? "-100%" : "0%"),
            opacity: 1
          }}
          transition={panelTransition}
          className={`w-full md:absolute top-0 bottom-0 right-0 md:w-1/2 p-10 md:p-16 flex flex-col justify-center z-10 ${
            isDark ? "bg-[#0a0a0a] text-white" : "bg-white text-black"
          }`}
        >
          {/* Active side shadow/glow */}
          <div className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
             isDark ? "shadow-[inset_0_0_120px_rgba(255,255,255,0.02)]" : "shadow-[inset_0_0_120px_rgba(0,0,0,0.02)]"
          }`}></div>

          <div className="max-w-[400px] w-full mx-auto relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={isRegister ? "register" : "login"}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="mb-10 text-center md:text-left">
                  <h1 className="text-3xl font-bold tracking-tight mb-2">
                    {isRegister ? "Create your account" : "Sign in to DevCollab"}
                  </h1>
                  <p className={`text-sm transition-colors duration-700 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {isRegister 
                      ? "Start collaborating with your team today." 
                      : "Enter your email and password to access your workspace."}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <button type="button" onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`} className={`flex-1 flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium border transition-all duration-300 ${
                    isDark 
                      ? "bg-[#111] border-white/10 hover:bg-white/5 hover:border-white/20 text-white" 
                      : "bg-white border-black/10 hover:bg-black/5 hover:border-black/20 text-black shadow-sm"
                  }`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" /></svg>
                    Google
                  </button>
                  <button type="button" onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/github`} className={`flex-1 flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium border transition-all duration-300 ${
                    isDark 
                      ? "bg-[#111] border-white/10 hover:bg-white/5 hover:border-white/20 text-white" 
                      : "bg-white border-black/10 hover:bg-black/5 hover:border-black/20 text-black shadow-sm"
                  }`}>
                    <Github className="w-5 h-5" />
                    GitHub
                  </button>
                </div>

                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className={`w-full border-t transition-colors duration-700 ${isDark ? "border-white/10" : "border-black/10"}`}></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className={`px-4 font-medium transition-colors duration-700 ${
                      isDark ? "bg-[#0a0a0a] text-gray-500" : "bg-white text-gray-400"
                    }`}>
                      Or continue with
                    </span>
                  </div>
                </div>

                {authStep === "DETAILS" ? (
                  <form className="space-y-4" onSubmit={handleAuthSubmit}>
                    <AnimatePresence>
                      {isRegister && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-1.5 overflow-hidden"
                      >
                        <label className="text-sm font-medium">Full Name</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Enter Your Name" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required={isRegister}
                            minLength={2}
                            className={`w-full px-4 py-3.5 rounded-xl border outline-none transition-all duration-300 ${
                              isDark 
                                ? "bg-[#111] border-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30 placeholder:text-gray-600" 
                                : "bg-[#f9f9f9] border-black/10 focus:border-black/30 focus:ring-1 focus:ring-black/30 placeholder:text-gray-400"
                            }`} 
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Email Address</label>
                    <div className="relative group">
                      <input 
                        type="email" 
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={`w-full pl-11 pr-4 py-3.5 rounded-xl border outline-none transition-all duration-300 ${
                          isDark 
                            ? "bg-[#111] border-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30 placeholder:text-gray-600" 
                            : "bg-[#f9f9f9] border-black/10 focus:border-black/30 focus:ring-1 focus:ring-black/30 placeholder:text-gray-400"
                        }`} 
                      />
                      <Mail className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                        isDark ? "text-gray-500 group-focus-within:text-white" : "text-gray-400 group-focus-within:text-black"
                      }`} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative group">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className={`w-full pl-11 pr-11 py-3.5 rounded-xl border outline-none transition-all duration-300 ${
                          isDark 
                            ? "bg-[#111] border-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30 placeholder:text-gray-600" 
                            : "bg-[#f9f9f9] border-black/10 focus:border-black/30 focus:ring-1 focus:ring-black/30 placeholder:text-gray-400"
                        }`} 
                      />
                      <Lock className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                        isDark ? "text-gray-500 group-focus-within:text-white" : "text-gray-400 group-focus-within:text-black"
                      }`} />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                          isDark ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-black"
                        }`}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {!isRegister && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex justify-end pt-1 overflow-hidden"
                      >
                        <Link to="/forgot-password" className={`text-sm font-medium hover:underline transition-colors duration-300 ${
                          isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"
                        }`}>
                          Forgot password?
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {error && (
                    <div className="text-red-500 text-sm font-medium p-2 bg-red-500/10 rounded-md border border-red-500/20">
                      {error}
                    </div>
                  )}

                  <button 
                    disabled={isLoading}
                    className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 mt-6 ${
                    isDark 
                      ? "bg-white text-black hover:bg-gray-100 hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]" 
                      : "bg-black text-white hover:bg-gray-900 hover:scale-[1.02] shadow-[0_5px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.2)]"
                  } ${isLoading ? "opacity-70 cursor-not-allowed pointer-events-none" : ""}`}>
                    {isLoading ? "Please wait..." : (isRegister ? "Create Account" : "Sign In")}
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
                ) : (
                  <motion.form 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6" 
                    onSubmit={handleAuthSubmit}
                  >
                    <button
                      type="button"
                      onClick={() => setAuthStep("DETAILS")}
                      className="text-sm font-medium mb-4 flex items-center hover:underline transition-colors"
                      style={{ color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)" }}
                    >
                      &larr; Back
                    </button>
                    
                    <div className="text-center mb-6">
                      <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        We've sent a 6-digit secure code to
                      </p>
                      <p className={`font-medium mt-1 ${isDark ? "text-white" : "text-black"}`}>
                        {email}
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between gap-2">
                        {otpValues.map((value, index) => (
                          <input
                            key={index}
                            type="text"
                            maxLength={1}
                            value={value}
                            ref={(el) => (inputRefs.current[index] = el)}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border outline-none transition-all duration-300 ${
                              isDark
                                ? "bg-[#111] border-white/10 focus:border-white/30 focus:ring-2 focus:ring-white/20 text-white shadow-sm"
                                : "bg-[#f9f9f9] border-black/10 focus:border-black/30 focus:ring-2 focus:ring-black/20 text-black shadow-sm"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {error && (
                      <div className="text-red-500 text-sm font-medium p-2 bg-red-500/10 rounded-md border border-red-500/20">
                        {error}
                      </div>
                    )}

                    <button 
                      disabled={isLoading}
                      className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 mt-6 ${
                      isDark 
                        ? "bg-white text-black hover:bg-gray-100 hover:scale-[1.02]" 
                        : "bg-black text-white hover:bg-gray-900 hover:scale-[1.02]"
                    } ${isLoading ? "opacity-70 cursor-not-allowed pointer-events-none" : ""}`}>
                      {isLoading ? "Verifying..." : "Verify & Sign Up"}
                    </button>

                    <div className="mt-6 text-center">
                      <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        Didn't receive the code?{" "}
                        <button 
                          type="button" 
                          onClick={handleResend}
                          disabled={countdown > 0}
                          className={`font-semibold hover:underline disabled:opacity-50 disabled:hover:no-underline transition-all ${
                            isDark ? "text-white" : "text-black"
                          }`}
                        >
                          {countdown > 0 ? `Resend in ${countdown}s` : "Click to resend"}
                        </button>
                      </p>
                    </div>
                  </motion.form>
                )}

                <div className="mt-8 text-center">
                  <p className={`text-sm transition-colors duration-700 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
                    <button 
                      onClick={() => {
                        setIsRegister(!isRegister);
                        setAuthStep("DETAILS");
                        setError("");
                      }}
                      className={`font-semibold hover:underline transition-colors duration-300 ${
                        isDark ? "text-white" : "text-black"
                      }`}
                    >
                      {isRegister ? "Sign In" : "Register"}
                    </button>
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
