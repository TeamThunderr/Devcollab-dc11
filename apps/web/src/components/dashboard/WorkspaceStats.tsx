import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useTheme } from "../../hooks/useTheme";
import { useTasks, useWorkspaceTasks } from "../../hooks/useTasks";
import { useWorkspaces } from "../../hooks/useWorkspaces"
import { useStore } from "../../store/useStore";

export function WorkspaceStats({ projectId }: { projectId?: string }) {
  const parsedId = projectId ? parseInt(projectId, 10) : undefined;
  
  const { activeWorkspaceId } = useStore();
  const { data: workspaces } = useWorkspaces();
  const activeWorkspaceObj = workspaces?.find(w => Number(w.id) === Number(activeWorkspaceId)) || workspaces?.[0];
  const workspaceId = activeWorkspaceObj?.id;

  const { data: projectTasks = [] } = useTasks(parsedId);
  const { data: workspaceTasks = [] } = useWorkspaceTasks(!parsedId ? workspaceId : undefined);
  
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const tasks = parsedId ? projectTasks : workspaceTasks;

  // Generate last 7 days data for LineChart
  const lineData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      
      // Count completed tasks on this day
      const completedOnDay = tasks.filter(t => {
        if (t.status !== 'DONE' || !t.updatedAt) return false;
        const compDate = new Date(t.updatedAt);
        return compDate.getDate() === d.getDate() && compDate.getMonth() === d.getMonth();
      }).length;
      
      result.push({ name: dayName, completed: completedOnDay });
    }
    return result;
  }, [tasks]);

  // Generate data for PieChart
  const pieData = useMemo(() => {
    const counts = { TO_DO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
    tasks.forEach(t => {
      if (t.status in counts) counts[t.status as keyof typeof counts]++;
    });
    return [
      { name: 'To Do', value: counts.TO_DO },
      { name: 'In Progress', value: counts.IN_PROGRESS },
      { name: 'In Review', value: counts.IN_REVIEW },
      { name: 'Done', value: counts.DONE },
    ].filter(d => d.value > 0);
  }, [tasks]);

  const pieColorsDark = ['#ffffff', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)'];
  const pieColorsLight = ['#000000', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)'];
  const COLORS = isDark ? pieColorsDark : pieColorsLight;
  
  const totalTasks = tasks.length;
  
  const lineColor = isDark ? '#ffffff' : '#000000';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const tooltipBg = isDark ? '#1a1a1a' : '#ffffff';
  const tooltipBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const tooltipColor = isDark ? '#ffffff' : '#000000';

  return (
    <div className="flex flex-col h-full">
      <div className="text-[0.65rem] font-semibold text-gray-500 uppercase tracking-widest mb-4">
        {projectId ? "Project Activity" : "Workspace Activity"}
      </div>
      
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Line Chart */}
        <div className="border border-gray-200 dark:border-[#2C2C2C] bg-white dark:bg-[#191919] rounded-lg p-4 h-[250px] flex flex-col">
          <div className="text-xs text-gray-500 mb-2">Tasks Completed (Last 7 Days)</div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, color: tooltipColor, fontSize: '12px', borderRadius: '6px' }}
                  itemStyle={{ color: tooltipColor }}
                  cursor={{ stroke: gridColor }}
                />
                <Line type="monotone" dataKey="completed" stroke={lineColor} strokeWidth={2} dot={{ r: 4, fill: lineColor }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="border border-gray-200 dark:border-[#2C2C2C] bg-white dark:bg-[#191919] rounded-lg p-4 h-[250px] flex flex-col items-center justify-center relative">
          <div className="absolute top-4 left-4 text-xs text-gray-500">Status Distribution</div>
          <div className="flex-1 w-full relative min-h-0 flex items-center justify-center mt-4">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, color: tooltipColor, fontSize: '12px', borderRadius: '6px' }}
                    itemStyle={{ color: tooltipColor }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-gray-500">No tasks available</div>
            )}
            
            {/* Center Label */}
            {pieData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-gray-900 dark:text-white leading-none">{totalTasks}</span>
                <span className="text-[10px] text-gray-500 mt-1">Tasks</span>
              </div>
            )}
          </div>
          
          {/* Legend */}
          {pieData.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {entry.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
