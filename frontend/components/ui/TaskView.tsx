'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Clock, ChevronRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

type Status = 'todo' | 'in-progress' | 'completed';

interface SubTask {
  task: string;
  status: Status;
}

interface TaskListItem {
  task: string;
  status: Status;
  subtasks?: SubTask[];
}

interface Task {
  title: string;
  status: Status;
  items: TaskListItem[];
}

const StatusIcon = ({ status, className }: { status: Status; className?: string }) => {
  switch (status) {
    case 'completed': return <CheckCircle2 className={cn("text-emerald-500", className)} />;
    case 'in-progress': return <Clock className={cn("text-amber-500 animate-pulse", className)} />;
    default: return <Circle className={cn("text-gray-300 dark:text-gray-700", className)} />;
  }
};

const TaskItem = ({ item }: { item: TaskListItem }) => {
  const [showSubtasks, setShowSubtasks] = useState(true);
  const has_subtasks = item.subtasks && item.subtasks.length > 0;
  const totalSubtasks = item.subtasks?.length || 0;
  const completedSubtasks = item.subtasks?.filter(s => s.status === 'completed').length || 0;

  return (
    <li className="list-none">
      <div className="flex items-start group py-1.5">
        <span className="mr-3 mt-1 shrink-0">
          <StatusIcon status={item.status} className="w-5 h-5" />
        </span>
        <div className="flex-1">
          <span className={cn(
            "text-base transition-colors",
            item.status === 'completed' 
              ? "text-gray-400 line-through decoration-gray-300" 
              : "text-gray-700 dark:text-gray-200 font-medium"
          )}>
            {item.task}
          </span>
        </div>
      </div>
      
      {has_subtasks && (
        <div className="mt-1 ml-8">
          <div className="flex items-center space-x-2 mb-2 p-1 border rounded bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setShowSubtasks(!showSubtasks)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded text-gray-400 transition-colors"
              title={showSubtasks ? "Collapse subtasks" : "Expand subtasks"}
            >
              {showSubtasks ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              {completedSubtasks}/{totalSubtasks} Unit Actions
            </div>
          </div>
          
          {showSubtasks && (
            <ul className="space-y-2 border-l border-gray-100 dark:border-gray-800 ml-2.5 pl-4 pb-2">
              {item.subtasks!.map((subtask, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2.5 mt-1 opacity-70">
                    <StatusIcon status={subtask.status} className="w-3.5 h-3.5" />
                  </span>
                  <span className={cn(
                    "text-xs",
                    subtask.status === 'completed' 
                      ? "text-gray-400 line-through" 
                      : "text-gray-500 dark:text-gray-400"
                  )}>
                    {subtask.task}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
};

const TaskList = ({ tasks }: { tasks: Task[] }) => (
  <div className="space-y-6">
    {tasks.map((task, index) => (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        key={index} 
        className="relative p-6 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all hover:shadow-md overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-indigo-600" />
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-black mr-4 border border-indigo-100 dark:border-indigo-900">
              {String(index + 1).padStart(2, '0')}
            </span>
            {task.title}
          </h2>
          <span className={cn(
            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
            task.status === 'completed' && "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900",
            task.status === 'in-progress' && "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
            task.status === 'todo' && "bg-gray-50 text-gray-500 border-gray-100 dark:bg-gray-900 dark:text-gray-500 dark:border-gray-800"
          )}>
            {task.status.replace('-', ' ')}
          </span>
        </div>
        
        <ul className="space-y-4">
          {task.items.map((item, idx) => (
            <TaskItem key={idx} item={item} />
          ))}
        </ul>
      </motion.div>
    ))}
  </div>
);

export default function TaskView({ tasks }: { tasks: Task[] }) {
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = Math.round((completedTasks / tasks.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-12">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="inline-block px-3 py-1 mb-4 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100 dark:border-indigo-900">
                Operations Log
              </div>
              <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                Project Progress
              </h1>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-950 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Efficiency Rating</span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{progress}%</span>
            </div>
            <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-1">
              <motion.div 
                className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: 'circOut' }}
              />
            </div>
            <div className="mt-6 flex items-center gap-6">
              <div className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                {completedTasks} Secured
              </div>
              <div className="flex items-center text-xs font-bold text-amber-600 dark:text-amber-400">
                <div className="w-2 h-2 rounded-full bg-amber-500 mr-2 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                {tasks.filter(t => t.status === 'in-progress').length} Active
              </div>
            </div>
          </div>
        </header>

        <TaskList tasks={tasks} />
      </div>
    </div>
  );
}
