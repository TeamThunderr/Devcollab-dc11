import React from "react";

interface StatsGridProps {
  firstValue?: string;
  firstLabel?: string;
  secondValue?: string;
  secondLabel?: string;
  thirdValue?: string;
  thirdLabel?: string;
}

export function StatsGrid({
  firstValue = "1",
  firstLabel = "Active Projects",
  secondValue = "1",
  secondLabel = "Team Members",
  thirdValue = "0",
  thirdLabel = "Tasks Across Projects"
}: StatsGridProps) {
  return (
    <div className="grid grid-cols-3 gap-8 mb-16 border-b border-gray-200 dark:border-[#2C2C2C] pb-8">
      <StatItem value={firstValue} label={firstLabel} />
      <StatItem value={secondValue} label={secondLabel} />
      <StatItem value={thirdValue} label={thirdLabel} />
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[2rem] font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-none">{value}</div>
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}
