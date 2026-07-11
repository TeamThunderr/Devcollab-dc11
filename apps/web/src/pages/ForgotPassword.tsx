import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthInput } from "../components/auth/AuthInput";
import { PrimaryButton } from "../components/auth/PrimaryButton";
import { motion } from "framer-motion";
import { toast } from "sonner";

export function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>();

  const onSubmit = async (data: { email: string }) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (res.ok) {
        toast.success(resData.message);
        navigate("/verify-reset-otp", { state: { email: data.email } });
      } else {
        toast.error(resData.message || "Failed to send OTP");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f4f5] dark:bg-[#000000] p-4 transition-colors duration-700">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[440px] w-full bg-white dark:bg-[#0a0a0a] p-8 sm:p-10 rounded-[32px] shadow-[0_20px_100px_rgba(0,0,0,0.08)] dark:shadow-[0_0_100px_rgba(255,255,255,0.03)] border border-black/5 dark:border-white/10 relative overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[140%] h-[140%] rounded-full opacity-[0.03] blur-3xl bg-black dark:bg-white"></div>
        </div>

        <div className="relative z-10 text-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="w-16 h-16 bg-black/5 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <Mail className="w-8 h-8 text-black dark:text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight mb-3 text-black dark:text-white">Forgot Password</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your email to receive a password reset OTP.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
          <div className="space-y-4">
            <AuthInput
              icon={Mail}
              label="Email address"
              type="email"
              placeholder="you@example.com"
              {...register("email", { required: "Email is required" })}
              error={errors.email?.message}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 bg-black text-white hover:bg-gray-900 hover:scale-[1.02] shadow-[0_5px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.2)] dark:bg-white dark:text-black dark:hover:bg-gray-100 dark:shadow-[0_0_20px_rgba(255,255,255,0.1)] dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] ${isLoading ? "opacity-70 cursor-not-allowed pointer-events-none" : ""}`}
          >
            {isLoading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
