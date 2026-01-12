import { Task, DailyReport } from '../types';

const TASKS_KEY = 'worklog_tasks';
const REPORTS_KEY = 'worklog_reports';

export const getTasks = (): Task[] => {
  try {
    const stored = localStorage.getItem(TASKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load tasks", e);
    return [];
  }
};

export const saveTasks = (tasks: Task[]): void => {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error("Failed to save tasks", e);
  }
};

export const getReports = (): DailyReport[] => {
  try {
    const stored = localStorage.getItem(REPORTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load reports", e);
    return [];
  }
};

export const saveReport = (report: DailyReport): void => {
  try {
    const reports = getReports();
    // Overwrite existing report for same date if exists
    const filtered = reports.filter(r => r.date !== report.date);
    localStorage.setItem(REPORTS_KEY, JSON.stringify([...filtered, report]));
  } catch (e) {
    console.error("Failed to save report", e);
  }
};
