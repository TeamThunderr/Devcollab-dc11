import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Github, Mail, Lock, User, Link as LinkIcon, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

import { registerSchema, RegisterFormData } from "../../schemas/registerSchema";
import { AuthInput } from "./AuthInput";
import { SocialButton } from "./SocialButton";
import { PrimaryButton } from "./PrimaryButton";
import { AuthDivider } from "./AuthDivider";

interface RegisterSectionProps {
  isRegister: boolean;
}

type Step = "DETAILS" | "OTP";

export function RegisterSection({ isRegister }: RegisterSectionProps) {
  const [step, setStep] = useState<Step>("DETAILS");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    register("otp");
  }, [register]);

  useEffect(() => {
    if (step === "OTP" && countdown > 0) {
      const timerId = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [countdown, step]);

  const handleDetailsSubmit = async () => {
    const isValid = await trigger(["name", "email", "password", "githubUrl"]);
    if (!isValid) return;

    setIsLoading(true);
    try {
      const email = getValues("email");
      await api.post('/api/auth/send-signup-otp', { email });
      setStep("OTP");
      setCountdown(60);
      toast.success("Verification code sent to your email!");
    } catch (error: any) {
      console.error("OTP send error:", error);
      toast.error(error.response?.data?.message || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const email = getValues("email");
      await api.post('/api/auth/send-signup-otp', { email });
      setCountdown(60);
      toast.success("A new OTP has been sent.");
    } catch {
      toast.error("Failed to resend OTP");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);
    setValue("otp", newOtp.join(""), { shouldValidate: true });

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onSubmitFinal = async (data: RegisterFormData) => {
    if (!data.otp || data.otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        githubUrl: data.githubUrl,
        otp: data.otp,
      });
      login(response.data.user);
      navigate("/select-workspace");
      toast.success("Account created successfully!");
    } catch (error: any) {
      console.error("Register error:", error);
      toast.error(error.response?.data?.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute top-0 right-0 w-full md:w-1/2 h-full p-6 sm:p-10 flex flex-col justify-center bg-transparent transition-colors duration-300 z-10 pointer-events-auto overflow-y-auto">
      <motion.div
        initial={false}
        animate={{
          opacity: isRegister ? 1 : 0,
          x: isRegister ? 0 : 20,
          pointerEvents: isRegister ? "auto" : "none"
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="w-full max-w-md mx-auto"
      >
        <AnimatePresence mode="wait">
          {step === "DETAILS" ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-black dark:text-white mb-1.5 tracking-tight transition-colors duration-300">
                  Create an account
                </h1>
                <p className="text-sm text-black/80 dark:text-zinc-400 transition-colors duration-300">
                  Join the DevCollab community today.
                </p>
              </div>

              <div className="flex justify-center gap-4 mb-3">
                <SocialButton
                  icon={<svg className="w-5 h-5 text-current" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" /></svg>}
                  onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`}
                  aria-label="Sign up with Google"
                />
                <SocialButton
                  icon={<Github className="w-5 h-5 text-current" />}
                  onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/github`}
                  aria-label="Sign up with GitHub"
                />
              </div>

              <AuthDivider text="or register with email" />

              <div className="space-y-3">
                <AuthInput
                  icon={User}
                  label="Full name"
                  type="text"
                  placeholder="Jane Doe"
                  {...register("name")}
                  error={errors.name?.message}
                />

                <AuthInput
                  icon={Mail}
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  error={errors.email?.message}
                />

                <AuthInput
                  icon={Lock}
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  error={errors.password?.message}
                />

                <AuthInput
                  icon={LinkIcon}
                  label="GitHub Profile URL (Optional)"
                  type="url"
                  placeholder="https://github.com/username"
                  {...register("githubUrl")}
                  error={errors.githubUrl?.message}
                />

                <PrimaryButton onClick={handleDetailsSubmit} isLoading={isLoading} className="mt-4">
                  Continue
                </PrimaryButton>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col"
            >
              <button
                onClick={() => setStep("DETAILS")}
                className="flex items-center text-sm font-medium text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>

              <div className="text-center mb-8">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-16 h-16 bg-black/5 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6"
                >
                  <Mail className="w-8 h-8 text-black dark:text-white" />
                </motion.div>
                <h2 className="text-3xl font-bold tracking-tight mb-3 text-black dark:text-white">Verify Your Email</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  We've sent a 6-digit secure code to<br/>
                  <span className="font-medium text-black dark:text-white mt-1 inline-block">{getValues("email")}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmitFinal)} className="space-y-8">
                <div>
                  <div className="flex justify-between gap-2 sm:gap-3">
                    {otpValues.map((value, index) => (
                      <motion.input
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                        type="text"
                        maxLength={1}
                        value={value}
                        ref={(el) => (inputRefs.current[index] = el)}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        whileFocus={{ scale: 1.05, y: -2 }}
                        className={`w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16 text-center text-xl md:text-2xl font-bold rounded-xl md:rounded-2xl border outline-none transition-all duration-300 bg-[#f9f9f9] border-black/10 focus:border-black/30 focus:ring-2 focus:ring-black/20 focus:bg-white dark:bg-white/5 dark:border-white/10 dark:focus:border-white/30 dark:focus:ring-2 dark:focus:ring-white/20 dark:focus:bg-white/10 text-black dark:text-white shadow-sm`}
                      />
                    ))}
                  </div>
                  {errors.otp && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-red-500 text-sm mt-3 text-center font-medium"
                    >
                      {errors.otp.message}
                    </motion.p>
                  )}
                </div>

                <PrimaryButton type="submit" isLoading={isLoading} className="py-4 text-base">
                  Verify & Sign Up
                </PrimaryButton>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Didn't receive the code?{" "}
                  <button 
                    type="button" 
                    onClick={handleResend}
                    disabled={countdown > 0}
                    className="font-semibold text-black dark:text-white hover:underline disabled:opacity-50 disabled:hover:no-underline transition-all"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : "Click to resend"}
                  </button>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
