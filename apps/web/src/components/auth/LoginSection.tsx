import React, { useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Github, Mail, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { loginSchema, LoginFormData } from "../../schemas/loginSchema";
import { AuthInput } from "./AuthInput";
import { SocialButton } from "./SocialButton";
import { PrimaryButton } from "./PrimaryButton";
import { AuthDivider } from "./AuthDivider";

interface LoginSectionProps {
  isRegister: boolean;
}

export function LoginSection({ isRegister }: LoginSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const { login } = useAuth();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/login', {
        email: data.email,
        password: data.password,
      });
      login(response.data.user);
      navigate("/select-workspace");
    } catch (error) {
      console.error("Login error:", error);
      alert("Invalid credentials or login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full md:w-1/2 h-full p-6 sm:p-10 flex flex-col justify-center bg-transparent transition-colors duration-300 z-10 pointer-events-auto">
      <motion.div
        initial={false}
        animate={{
          opacity: isRegister ? 0 : 1,
          x: isRegister ? -20 : 0,
          pointerEvents: isRegister ? "none" : "auto"
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-1.5 tracking-tight transition-colors duration-300">
            Sign in to DevCollab
          </h1>
          <p className="text-sm text-black/80 dark:text-zinc-400 transition-colors duration-300">
            Welcome back! Please enter your details.
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-4">
          <SocialButton
            icon={<svg className="w-5 h-5 text-current" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" /></svg>}
            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`}
            aria-label="Sign in with Google"
          />
          <SocialButton
            icon={<Github className="w-5 h-5 text-current" />}
            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/github`}
            aria-label="Sign in with GitHub"
          />
        </div>

        <AuthDivider text="or continue with email" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <AuthInput
            icon={Mail}
            label="Email address or username"
            type="text"
            placeholder="you@example.com or admin"
            {...register("email")}
            error={errors.email?.message}
          />

          <div className="space-y-1">
            <AuthInput
              icon={Lock}
              label="Password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              error={errors.password?.message}
            />
            <div className="flex justify-end pt-1">
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-black dark:text-white hover:text-black/60 dark:hover:text-zinc-300 transition-colors duration-300"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <PrimaryButton type="submit" isLoading={isLoading} className="mt-2">
            Continue
          </PrimaryButton>
        </form>
      </motion.div>
    </div>
  );
}
