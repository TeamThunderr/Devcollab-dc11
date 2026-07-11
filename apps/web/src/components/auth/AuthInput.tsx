import React, { forwardRef, useState } from "react";
import { cn } from "../../lib/utils";
import { LucideIcon, Eye, EyeOff } from "lucide-react";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon;
  label: string;
  error?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ icon: Icon, label, error, className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const currentType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-sm font-medium text-black dark:text-zinc-300 transition-colors duration-300">
          {label}
        </label>
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-black/50 dark:text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors duration-300">
            <Icon size={18} />
          </div>
          <input
            ref={ref}
            type={currentType}
            className={cn(
              "w-full h-12 pl-10 pr-10 rounded-xl outline-none transition-all duration-300",
              "bg-[#FFFFFF] dark:bg-[#111111]",
              "border border-[#D4D4D8] dark:border-[#262626]",
              "text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-zinc-500",
              "focus:bg-white dark:focus:bg-[#111111]",
              "focus:border-[#18181B] dark:focus:border-[#FFFFFF]",
              "focus:ring-1 focus:ring-[#18181B] dark:focus:ring-[#FFFFFF]",
              error &&
                "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500 dark:focus:border-red-500",
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors duration-300 focus:outline-none"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && (
          <span className="text-xs text-red-500 dark:text-red-400 font-medium ml-1">
            {error}
          </span>
        )}
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";
