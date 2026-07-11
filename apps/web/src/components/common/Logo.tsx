import { cn } from "../../lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5 transition-colors duration-300", className)}>
      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-black dark:bg-white border border-[#262626] dark:border-white/10 shadow-sm transition-colors duration-300">
        <span className="text-white dark:text-black font-bold text-lg leading-none tracking-tighter transition-colors duration-300">&lt;/&gt;</span>
      </div>
      <span className="font-bold text-lg tracking-tight text-black dark:text-white transition-colors duration-300">
        DevCollab
      </span>
    </div>
  );
}
