import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, AlertCircle, Clock, Trash2, CalendarDays } from "lucide-react";
import { Task, Member, toFrontendStatus } from "../../store/useStore";
import { cn } from "../../lib/utils";

interface CalendarViewProps {
  tasks: Task[];
  members: Member[];
  onOpenTaskDetail: (task: Task) => void;
  onOpenCreateTask: (date?: string) => void;
  canCreateTask?: boolean;
}

export function CalendarView({
  tasks,
  members,
  onOpenTaskDetail,
  onOpenCreateTask,
  canCreateTask = true,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    // Day of the week for the 1st of the month (0 = Sunday, 1 = Monday, etc.)
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: { date: Date; isCurrentMonth: boolean; key: string }[] = [];

    // Prev month padding days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        key: `prev-${d}`,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const currentMonthDate = new Date(year, month, i);
      days.push({
        date: currentMonthDate,
        isCurrentMonth: true,
        key: `curr-${i}`,
      });
    }

    // Next month padding days
    const totalSlots = 42; // 6 rows of 7 days
    const remainingSlots = totalSlots - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        key: `next-${i}`,
      });
    }

    return days;
  }, [year, month]);

  // Map tasks to their dates
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      if (task.dueDate) {
        // Normalize date to YYYY-MM-DD local format
        try {
          const dateStr = new Date(task.dueDate).toISOString().split("T")[0] || "";
          if (dateStr) {
            if (!map[dateStr]) map[dateStr] = [];
            map[dateStr].push(task);
          }
        } catch (e) {
          // Fallback if invalid date
        }
      }
    });
    return map;
  }, [tasks]);

  // Tasks with no due date
  const unscheduledTasks = useMemo(() => {
    return tasks.filter((t) => !t.dueDate);
  }, [tasks]);

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "P0":
        return "bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30";
      case "P1":
        return "bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30";
      case "P2":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400 border border-gray-500/30";
    }
  };

  const formatMonthYear = () => {
    return currentDate.toLocaleString("default", { month: "long", year: "numeric" });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[500px]">
      {/* Calendar Grid Section */}
      <div className="flex-1 bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-[#2C2C2C] shadow-xs flex flex-col overflow-hidden">
        {/* Calendar Navigation Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#2C2C2C] bg-gray-50/50 dark:bg-[#141414]/50">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white font-sans">
              {formatMonthYear()}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222] transition-colors"
            >
              Today
            </button>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#191919] p-0.5 rounded-lg border border-gray-200 dark:border-[#2C2C2C]">
              <button
                onClick={handlePrevMonth}
                className="p-1 hover:bg-white dark:hover:bg-[#2C2C2C] rounded-md transition-colors text-gray-500 dark:text-gray-400"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-white dark:hover:bg-[#2C2C2C] rounded-md transition-colors text-gray-500 dark:text-gray-400"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-[#2C2C2C] text-center bg-gray-50/20 dark:bg-[#141414]/20 select-none">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 grid-rows-6 flex-1 divide-x divide-y divide-gray-200 dark:divide-[#2C2C2C] border-l border-t border-transparent">
          {calendarDays.map(({ date, isCurrentMonth, key }) => {
            const dateStr = date.toISOString().split("T")[0] || "";
            const dayTasks: Task[] = tasksByDate[dateStr] || [];
            const isToday = new Date().toDateString() === date.toDateString();

            return (
              <div
                key={key}
                className={cn(
                  "min-h-[85px] p-1.5 flex flex-col gap-1 transition-colors relative group hover:bg-gray-50/50 dark:hover:bg-[#181818]/30",
                  !isCurrentMonth && "bg-gray-50/30 dark:bg-[#141414]/10 text-gray-400 dark:text-gray-600"
                )}
              >
                {/* Cell Header */}
                <div className="flex items-center justify-between mb-1.5 select-none">
                  <span
                    className={cn(
                      "text-[11px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[20px] h-[20px]",
                      isToday
                        ? "bg-black text-white dark:bg-white dark:text-black font-extrabold"
                        : isCurrentMonth
                        ? "text-gray-800 dark:text-gray-300"
                        : "text-gray-400 dark:text-gray-600"
                    )}
                  >
                    {date.getDate()}
                  </span>
                  
                  {canCreateTask && (
                    <button
                      onClick={() => onOpenCreateTask(dateStr)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 dark:hover:bg-[#2C2C2C] rounded transition-all text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      title="Add task on this day"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Day Tasks Stack */}
                <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[75px] custom-scrollbar">
                  {dayTasks.map((task: Task) => {
                    const assignee = members.find((m) => String(m.id) === String(task.assigneeId));
                    return (
                      <div
                        key={task.id}
                        onClick={() => onOpenTaskDetail(task)}
                        className={cn(
                          "px-1.5 py-1 rounded text-[10px] font-medium cursor-pointer transition-all duration-150 flex items-center justify-between gap-1 shadow-2xs border hover:scale-[1.01] hover:translate-x-0.5",
                          task.status === "Done"
                            ? "bg-gray-100 dark:bg-gray-900/60 text-gray-400 dark:text-gray-500 line-through border-gray-200 dark:border-gray-800"
                            : "bg-white dark:bg-[#1C1C1E] text-gray-800 dark:text-gray-200 border-gray-200 dark:border-[#2C2C2C]"
                        )}
                      >
                        <span className="truncate flex-1 leading-snug">{task.title}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {task.status !== "Done" && (
                            <span className={cn("px-1 py-0.2 rounded-[3px] text-[8px] font-bold uppercase", getPriorityColor(task.priority))}>
                              {task.priority || "P1"}
                            </span>
                          )}
                          {assignee?.avatarUrl ? (
                            <img
                              src={assignee.avatarUrl}
                              alt={assignee.name}
                              className="w-3.5 h-3.5 rounded-full border border-gray-200 dark:border-gray-700 object-cover"
                            />
                          ) : assignee ? (
                            <div className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-[7px] text-gray-500 font-bold border border-gray-300 dark:border-gray-700">
                              {assignee.name.slice(0, 1).toUpperCase()}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar - Unscheduled Tasks */}
      <div className="w-full lg:w-72 bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-[#2C2C2C] p-4 flex flex-col max-h-[600px] shadow-xs shrink-0 select-none">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-200 dark:border-[#2C2C2C] pb-3">
          <CalendarDays className="w-4 h-4 text-gray-500" />
          <h3 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">Unscheduled Tasks</h3>
          <span className="ml-auto text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            {unscheduledTasks.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 custom-scrollbar">
          {unscheduledTasks.length === 0 ? (
            <div className="h-24 flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-800 rounded-lg text-center p-4">
              <span className="text-[11px] text-gray-400 dark:text-gray-600">All tasks scheduled!</span>
            </div>
          ) : (
            unscheduledTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onOpenTaskDetail(task)}
                className="p-2.5 bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#262626] rounded-xl hover:border-gray-300 dark:hover:border-[#3C3C3C] transition-all cursor-pointer flex flex-col gap-1.5 shadow-2xs hover:translate-x-0.5 duration-150"
              >
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100 leading-snug">
                  {task.title}
                </span>
                <div className="flex items-center justify-between text-[10px]">
                  <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase", getPriorityColor(task.priority))}>
                    {task.priority || "P1"}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {toFrontendStatus(task.status)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
