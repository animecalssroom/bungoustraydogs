'use client'

import TaskView from '@/frontend/components/ui/TaskView'

const tasks = [
  {
    title: "Phase 10a: Performance Hardening",
    status: "completed",
    items: [
      { task: "Supabase Query Optimization", status: "completed" },
      { task: "Realtime-to-Polling Migration", status: "completed" },
      { task: "Indexing Critical Tables", status: "completed" },
      { task: "Image Optimization (Next/Image)", status: "completed" }
    ]
  },
  {
    title: "Phase 10b: War Redesign - Foundation",
    status: "in-progress",
    items: [
      { 
        task: "MIA Recovery Mechanics", 
        status: "in-progress",
        subtasks: [
          { task: "Database Schema Update (recovery fields)", status: "completed" },
          { task: "UserModel Logic (setUserMIA, isUserMIA)", status: "completed" },
          { task: "MIA Visual States (VHS Static/Grayscale)", status: "completed" },
          { task: "Security Clearance (REDACTED bios/stats)", status: "in-progress" }
        ]
      },
      { 
        task: "Tactical Yokohama Map", 
        status: "todo",
        subtasks: [
          { task: "Mapbox GL Integration", status: "completed" },
          { task: "Yokohama City Markers", status: "todo" },
          { task: "Real-time Faction Borders", status: "todo" }
        ]
      }
    ]
  },
  {
    title: "Phase 10c: Combat Overhaul",
    status: "todo",
    items: [
      { task: "Special Ability Integration", status: "todo" },
      { task: "Battle Log Visualizer", status: "todo" },
      { task: "War Prize Distribution", status: "todo" }
    ]
  }
];

export default function OpsPage() {
  return <TaskView tasks={tasks as any} />
}
