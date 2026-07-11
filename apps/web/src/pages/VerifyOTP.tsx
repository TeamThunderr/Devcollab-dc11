import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { PrimaryButton } from "../components/auth/PrimaryButton";
import { motion } from "framer-motion";
import { toast } from "sonner";

export function VerifyOTP() {
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<{ otp: string }>();
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    register("otp", { required: "OTP is required", minLength: { value: 6, message: "Must be 6 digits" } });
  }, [register]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);
    setValue("otp", newOtp.join(""), { shouldValidate: true });

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timerId = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [countdown]);

  const handleResend = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      setCountdown(60);
      toast.success("A new OTP has been sent.");
    } catch {
      toast.error("Failed to resend OTP");
    }
  };

  const onSubmit = async (data: { otp: string }) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: data.otp })
      });
      const resData = await res.json();
      if (res.ok) {
        navigate("/reset-password", { state: { resetToken: resData.resetToken } });
      } else {
        toast.error(resData.message || "Invalid OTP");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f4f5] dark:bg-[#000000] p-4 transition-colors duration-700">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[440px] w-full bg-white dark:bg-[#0a0a0a] p-8 sm:p-10 rounded-[32px] shadow-[0_20px_100px_rgba(0,0,0,0.08)] dark:shadow-[0_0_100px_rgba(255,255,255,0.03)] border border-black/5 dark:border-white/10 relative overflow-hidden"
      >
        {/* Subtle background glow effect */}
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
            <svg className="w-8 h-8 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight mb-3 text-black dark:text-white">Verify Your Email</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            We've sent a 6-digit secure code to<br/>
            <span className="font-medium text-black dark:text-white mt-1 inline-block">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 relative z-10">
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
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  whileFocus={{ scale: 1.05, y: -2 }}
                  className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-2xl border outline-none transition-all duration-300 bg-[#f9f9f9] border-black/10 focus:border-black/30 focus:ring-2 focus:ring-black/20 focus:bg-white dark:bg-white/5 dark:border-white/10 dark:focus:border-white/30 dark:focus:ring-2 dark:focus:ring-white/20 dark:focus:bg-white/10 text-black dark:text-white shadow-sm`}
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

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 bg-black text-white hover:bg-gray-900 hover:scale-[1.02] shadow-[0_5px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.2)] dark:bg-white dark:text-black dark:hover:bg-gray-100 dark:shadow-[0_0_20px_rgba(255,255,255,0.1)] dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] ${isLoading ? "opacity-70 cursor-not-allowed pointer-events-none" : ""}`}
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <div className="mt-8 text-center relative z-10">
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
    </div>
  );
}
