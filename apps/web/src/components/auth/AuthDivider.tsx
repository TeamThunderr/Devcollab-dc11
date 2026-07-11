import React from "react";

interface AuthDividerProps {
  text: string;
}

export function AuthDivider({ text }: AuthDividerProps) {
  return (
    <div className="relative flex items-center py-6">
      <div className="flex-grow border-t border-gray-200 dark:border-slate-700"></div>
      <span className="flex-shrink-0 px-4 text-sm text-black dark:text-gray-400">
        {text}
      </span>
      <div className="flex-grow border-t border-gray-200 dark:border-slate-700"></div>
    </div>
  );
}
