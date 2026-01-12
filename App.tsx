import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { Task, TaskStatus, DailyReport } from './types';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import { Button } from './components/Button';
import { STATUS_LABELS } from './constants';
import * as geminiService from './services/geminiService';
import { getFirebase } from './services/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Sparkles, 
  BarChart3,
  CheckCircle2,
  Clock,
  Circle,
  LayoutDashboard
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  
  // AI Report State
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Firebase safely
  const { db } = useMemo(() => {
    try {
      return getFirebase();
    } catch (error) {
      console.error("Failed to initialize Firebase:", error);
      return { db: null };
    }
  }, []);

  const currentDateStr = useMemo(() => format(currentDate, 'yyyy-MM-dd'), [currentDate]);

  // Fetch tasks and report for the current date
  useEffect(() => {
    const fetchData = async () => {
      if (!db) return;
      
      setIsLoading(true);
      try {
        // Fetch Tasks
        const q = query(
          collection(db, 'tasks'),
          where('date', '==', currentDateStr)
        );
        const querySnapshot = await getDocs(q);
        const loadedTasks: Task[] = [];
        querySnapshot.forEach((doc) => {
          loadedTasks.push(doc.data() as Task);
        });
        setTasks(loadedTasks);

        // Fetch Report
        const reportDocRef = doc(db, 'daily_reports', currentDateStr);
        const reportSnap = await getDoc(reportDocRef);
        if (reportSnap.exists()) {
          setReport(reportSnap.data() as DailyReport);
        } else {
          setReport(null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [db, currentDateStr]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.DONE]: []
    };
    tasks.forEach(t => {
      if (grouped[t.status]) grouped[t.status].push(t);
    });
    return grouped;
  }, [tasks]);

  const handleCreateOrUpdateTask = async (taskData: Omit<Task, 'createdAt'>) => {
    if (!db) return;

    const isEdit = !!editingTask;
    let updatedTask: Task;

    if (isEdit) {
      updatedTask = { ...editingTask, ...taskData } as Task;
    } else {
      updatedTask = {
        ...taskData,
        createdAt: Date.now()
      };
    }

    // Optimistic Update
    setTasks(prev => {
      if (isEdit) {
        return prev.map(t => t.id === updatedTask.id ? updatedTask : t);
      }
      return [...prev, updatedTask];
    });

    setEditingTask(undefined);

    try {
      await setDoc(doc(db, 'tasks', updatedTask.id), updatedTask);
    } catch (error) {
      console.error("Error saving task:", error);
      // Revert optimistic update on failure could be implemented here
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!db) return;
    if (!confirm('Are you sure you want to delete this task?')) return;

    // Optimistic Update
    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    if (!db) return;

    const taskToUpdate = tasks.find(t => t.id === id);
    if (!taskToUpdate) return;

    const updatedTask = { ...taskToUpdate, status: newStatus };

    // Optimistic Update
    setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));

    try {
      await setDoc(doc(db, 'tasks', id), updatedTask);
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const openNewTaskModal = () => {
    setEditingTask(undefined);
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleGenerateReport = async () => {
    if (!db) return;
    if (tasks.length === 0) {
      alert("No tasks to report on for today.");
      return;
    }
    
    setIsGeneratingReport(true);
    try {
      const summary = await geminiService.generateDailySummary(currentDateStr, tasks);
      const newReport: DailyReport = {
        date: currentDateStr,
        summary,
        generatedAt: Date.now()
      };
      
      await setDoc(doc(db, 'daily_reports', currentDateStr), newReport);
      setReport(newReport);
      setShowReportModal(true);
    } catch (error) {
      console.error("Report generation failed:", error);
      alert("Failed to generate report. Please check your API key.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => addDays(prev, direction === 'prev' ? -1 : 1));
  };

  // Stats for the header
  const progress = useMemo(() => {
    const total = tasks.length;
    if (total === 0) return 0;
    const done = tasks.filter(t => t.status === TaskStatus.DONE).length;
    return Math.round((done / total) * 100);
  }, [tasks]);

  if (!db) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Initializing...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#E03A3E] rounded-lg shadow-sm">
              <LayoutDashboard className="text-white h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">WorkLog AI</h1>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button onClick={() => navigateDate('prev')} className="p-1 text-slate-500 hover:text-[#E03A3E] hover:bg-white rounded-md transition-all shadow-sm">
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-2 px-3 min-w-[140px] justify-center text-sm font-medium text-slate-700">
                <Calendar size={14} className="text-slate-400" />
                {format(currentDate, 'EEE, MMM d, yyyy')}
              </div>
              <button onClick={() => navigateDate('next')} className="p-1 text-slate-500 hover:text-[#E03A3E] hover:bg-white rounded-md transition-all shadow-sm">
                <ChevronRight size={18} />
              </button>
            </div>
            
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            <Button 
              variant="secondary" 
              onClick={() => {
                if (report) setShowReportModal(true);
                else handleGenerateReport();
              }}
              className="hidden sm:flex"
              disabled={isGeneratingReport}
              isLoading={isGeneratingReport}
            >
              <Sparkles size={16} className={report ? "text-[#E03A3E]" : "text-yellow-500"} />
              {report ? "View Report" : "Daily Summary"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full overflow-hidden flex flex-col">
        
        {/* Progress Bar */}
        <div className="mb-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-4 w-full sm:w-auto">
             <div className="relative h-12 w-12 flex items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path className="text-[#E03A3E] transition-all duration-1000 ease-out" strokeDasharray={`${progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                </svg>
                <span className="absolute text-xs font-bold text-slate-700">{progress}%</span>
             </div>
             <div>
               <h2 className="text-sm font-semibold text-slate-800">Daily Progress</h2>
               <p className="text-xs text-slate-500">
                 {isLoading ? "Loading..." : `${tasks.filter(t => t.status === TaskStatus.DONE).length} of ${tasks.length} tasks completed`}
               </p>
             </div>
           </div>
           
           <div className="w-full sm:w-auto flex gap-2">
             <Button onClick={openNewTaskModal} className="w-full sm:w-auto">
               <Plus size={18} /> Add Task
             </Button>
             <Button 
                variant="secondary"
                onClick={() => {
                  if (report) setShowReportModal(true);
                  else handleGenerateReport();
                }}
                className="w-full sm:w-auto sm:hidden"
                disabled={isGeneratingReport}
              >
                <Sparkles size={16} /> Summary
              </Button>
           </div>
        </div>

        {/* Kanban Columns */}
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-[800px] md:min-w-0 h-full">
            
            {/* To Do Column */}
            <div className="flex flex-col h-full bg-slate-100/50 rounded-xl p-4 border border-slate-200/60">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                  <h3 className="font-semibold text-slate-700">To Do</h3>
                  <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{tasksByStatus[TaskStatus.TODO].length}</span>
                </div>
              </div>
              <div className="space-y-3">
                {isLoading && <div className="text-center py-4 text-slate-400 text-xs">Loading tasks...</div>}
                {!isLoading && tasksByStatus[TaskStatus.TODO].map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onEdit={openEditTaskModal}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleStatusChange}
                  />
                ))}
                {!isLoading && tasksByStatus[TaskStatus.TODO].length === 0 && (
                   <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                      <p className="text-sm text-slate-400">No tasks pending</p>
                   </div>
                )}
                <button 
                  onClick={openNewTaskModal}
                  className="w-full py-2 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-[#E03A3E] hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all border-dashed"
                >
                  <Plus size={14} /> Add Task
                </button>
              </div>
            </div>

            {/* In Progress Column */}
            <div className="flex flex-col h-full bg-blue-50/30 rounded-xl p-4 border border-blue-100">
               <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <h3 className="font-semibold text-slate-700">In Progress</h3>
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">{tasksByStatus[TaskStatus.IN_PROGRESS].length}</span>
                </div>
              </div>
              <div className="space-y-3">
                {isLoading && <div className="text-center py-4 text-slate-400 text-xs">Loading tasks...</div>}
                {!isLoading && tasksByStatus[TaskStatus.IN_PROGRESS].map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onEdit={openEditTaskModal}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleStatusChange}
                  />
                ))}
                {!isLoading && tasksByStatus[TaskStatus.IN_PROGRESS].length === 0 && (
                   <div className="text-center py-8">
                      <p className="text-sm text-slate-400 italic">Nothing in progress</p>
                   </div>
                )}
              </div>
            </div>

            {/* Done Column */}
            <div className="flex flex-col h-full bg-green-50/30 rounded-xl p-4 border border-green-100">
               <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <h3 className="font-semibold text-slate-700">Completed</h3>
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">{tasksByStatus[TaskStatus.DONE].length}</span>
                </div>
              </div>
              <div className="space-y-3">
                {isLoading && <div className="text-center py-4 text-slate-400 text-xs">Loading tasks...</div>}
                {!isLoading && tasksByStatus[TaskStatus.DONE].map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onEdit={openEditTaskModal}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleStatusChange}
                  />
                ))}
                 {!isLoading && tasksByStatus[TaskStatus.DONE].length === 0 && (
                   <div className="text-center py-8">
                      <p className="text-sm text-slate-400 italic">No completed tasks yet</p>
                   </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Task Modal */}
      <TaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleCreateOrUpdateTask}
        initialTask={editingTask}
        currentDate={currentDateStr}
      />

      {/* Report Modal */}
      {showReportModal && report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-[#E03A3E] h-5 w-5" />
                  <h2 className="text-lg font-bold text-slate-800">Daily Summary Report</h2>
                </div>
                <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">
                  <span className="sr-only">Close</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
             </div>
             <div className="p-6 overflow-y-auto prose prose-slate prose-a:text-[#E03A3E] prose-strong:text-[#E03A3E] max-w-none text-sm">
                <ReactMarkdown>{report.summary}</ReactMarkdown>
             </div>
             <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
               <span className="text-xs text-slate-500">Generated on {format(report.generatedAt, 'MMM d, h:mm a')}</span>
               <div className="flex gap-2">
                 <Button variant="secondary" onClick={() => handleGenerateReport()} isLoading={isGeneratingReport}>
                    Regenerate
                 </Button>
                 <Button onClick={() => setShowReportModal(false)}>Close</Button>
               </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;