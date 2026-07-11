import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../../lib/utils";

export interface SelectOption {
  value: string | number;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select option",
  disabled = false,
  className,
  triggerClassName,
  dropdownClassName,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full px-2.5 py-1.5 bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-medium flex items-center justify-between gap-2 shadow-2xs transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:border-gray-300 dark:hover:border-[#3C3C3C]",
          isOpen && "ring-1 ring-black dark:ring-white border-gray-400 dark:border-[#444]",
          triggerClassName
        )}
      >
        <span className="truncate flex items-center gap-1.5 text-left">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-150",
            isOpen && "rotate-180 text-gray-600 dark:text-gray-200"
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1.5 w-full min-w-[120px] max-h-60 overflow-y-auto rounded-xl border border-gray-200 dark:border-[#2C2C2C] bg-white dark:bg-[#191919] p-1 text-gray-900 dark:text-white shadow-xl animate-in fade-in-0 zoom-in-95 duration-100 custom-scrollbar",
            dropdownClassName
          )}
        >
          {options.length === 0 ? (
            <div className="py-2 px-2.5 text-xs text-gray-400 text-center">No options available</div>
          ) : (
            options.map((option, idx) => {
              const isSelected = String(option.value) === String(value);
              return (
                <button
                  key={`${option.value}-${idx}`}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => {
                    if (!option.disabled) {
                      onChange(option.value);
                      setIsOpen(false);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left cursor-pointer select-none transition-colors outline-none",
                    isSelected
                      ? "bg-gray-100 dark:bg-[#2A2A2A] text-gray-900 dark:text-white font-semibold"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222] hover:text-gray-900 dark:hover:text-white",
                    option.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className="truncate flex items-center gap-1.5">
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <span>{option.label}</span>
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-black dark:text-white" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
