export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export interface LinkAttachment {
  id: string;
  url: string;
  label: string;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  notes: string;
  links: LinkAttachment[];
  date: string; // ISO Date YYYY-MM-DD
  createdAt: number;
}

export interface DailyReport {
  date: string;
  summary: string;
  generatedAt: number;
}
