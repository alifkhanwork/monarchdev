import { useState } from 'react';
import type { AcademyTask, AcademyTaskStatus, Subject } from '@/types';
import CalendarDayDetailPanel from './CalendarDayDetailPanel';

interface AcademyCalendarViewProps {
  tasks: AcademyTask[];
  subjects: Subject[];
  onToggleTaskStatus: (taskId: string, currentStatus: AcademyTaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask?: (task: AcademyTask) => void;
  onOpenAddModalWithDate: (dateKey: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AcademyCalendarView({
  tasks,
  subjects: _subjects,
  onToggleTaskStatus,
  onDeleteTask,
  onEditTask,
  onOpenAddModalWithDate,
}: AcademyCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const jumpToToday = () => setCurrentDate(new Date());

  // Generate calendar grid
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const todayKey = new Date().toISOString().slice(0, 10);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Map tasks by dateKey (YYYY-MM-DD)
  const tasksByDate = new Map<string, AcademyTask[]>();
  for (const t of tasks) {
    if (!t.dueDate) continue;
    if (!tasksByDate.has(t.dueDate)) {
      tasksByDate.set(t.dueDate, []);
    }
    tasksByDate.get(t.dueDate)!.push(t);
  }

  // Create calendar cell items
  const calendarCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push({ key: `prev-${i}`, dayNum: null, dateKey: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = String(d).padStart(2, '0');
    const monthStr = String(month + 1).padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;
    calendarCells.push({ key: dateKey, dayNum: d, dateKey });
  }

  const handleCellClick = (dateKey: string, dayTasks: AcademyTask[]) => {
    if (dayTasks.length > 0) {
      setSelectedDayKey(dateKey);
    } else {
      onOpenAddModalWithDate(dateKey);
    }
  };

  const selectedDayTasks = selectedDayKey ? tasksByDate.get(selectedDayKey) || [] : [];

  return (
    <div className="glass-panel space-y-4">
      {/* Calendar Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <h3 className="text-base sm:text-lg font-bold text-white font-mono-data tracking-wide">
            📅 {monthName}
          </h3>
          <button
            type="button"
            onClick={jumpToToday}
            className="workout-bulk-btn workout-bulk-btn-muted !px-2.5 !py-1 text-[11px]"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="workout-bulk-btn workout-bulk-btn-muted !px-3 !py-1 text-xs"
          >
            ◀ Prev
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="workout-bulk-btn workout-bulk-btn-muted !px-3 !py-1 text-xs"
          >
            Next ▶
          </button>
          <button
            type="button"
            onClick={() => onOpenAddModalWithDate(todayKey)}
            className="journal-action-btn text-xs ml-2"
          >
            + Add Task
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 text-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      {/* Calendar Cells Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {calendarCells.map((cell) => {
          if (!cell.dateKey) {
            return (
              <div
                key={cell.key}
                className="min-h-[70px] sm:min-h-[90px] rounded-lg bg-slate-950/20 border border-slate-900/40"
              />
            );
          }

          const dayTasks = tasksByDate.get(cell.dateKey) || [];
          const isToday = cell.dateKey === todayKey;

          return (
            <div
              key={cell.dateKey}
              onClick={() => cell.dateKey && handleCellClick(cell.dateKey, dayTasks)}
              className={`min-h-[75px] sm:min-h-[95px] p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-start group ${
                isToday
                  ? 'bg-cyan-950/20 border-cyan-500/50 shadow-cyan-950/40'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold font-mono-data ${
                    isToday
                      ? 'w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center'
                      : 'text-slate-300'
                  }`}
                >
                  {cell.dayNum}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[9px] font-mono-data text-slate-400">
                    {dayTasks.length}
                  </span>
                )}
              </div>

              {/* Task Chips */}
              <div className="space-y-1 overflow-y-auto max-h-[60px] sm:max-h-[70px] pr-0.5">
                {dayTasks.map((task) => {
                  const sub = typeof task.subject === 'object' ? task.subject : null;
                  const subColor = sub?.color || '#3b82f6';
                  const isDone = task.status === 'Completed';

                  return (
                    <div
                      key={task._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCellClick(cell.dateKey!, dayTasks);
                      }}
                      title={`${task.title} (${task.status}) — Click to view day details`}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-all ${
                        isDone
                          ? 'opacity-50 line-through bg-slate-950/80 text-slate-400 border border-slate-800'
                          : 'text-white border border-white/20 shadow-sm'
                      }`}
                      style={!isDone ? { backgroundColor: `${subColor}dd` } : undefined}
                    >
                      <span className="truncate flex-1">{task.title}</span>
                      {isDone && <span className="text-[9px]">✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Calendar Day Detail Panel */}
      <CalendarDayDetailPanel
        isOpen={Boolean(selectedDayKey)}
        dateKey={selectedDayKey || ''}
        tasks={selectedDayTasks}
        onClose={() => setSelectedDayKey(null)}
        onToggleStatus={onToggleTaskStatus}
        onDeleteTask={onDeleteTask}
        onEditTask={onEditTask}
        onAddTaskForDate={onOpenAddModalWithDate}
      />
    </div>
  );
}
