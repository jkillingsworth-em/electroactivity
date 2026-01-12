import { TaskStatus } from './types';

export const GEMINI_MODEL_FLASH = 'gemini-3-flash-preview';

export const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'To Do',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.DONE]: 'Completed',
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'bg-slate-100 text-slate-600 border-slate-200',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-50 text-blue-600 border-blue-200',
  [TaskStatus.DONE]: 'bg-green-50 text-green-600 border-green-200',
};
