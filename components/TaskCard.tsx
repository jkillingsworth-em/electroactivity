import React from 'react';
import { Task, TaskStatus } from '../types';
import { STATUS_COLORS, STATUS_LABELS } from '../constants';
import { FileText, Link, Trash2, Edit2, CheckCircle2, Circle, Clock } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onStatusChange }) => {
  
  const statusIcon = {
    [TaskStatus.TODO]: <Circle size={16} />,
    [TaskStatus.IN_PROGRESS]: <Clock size={16} />,
    [TaskStatus.DONE]: <CheckCircle2 size={16} />,
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow group relative">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-slate-800 flex-1 pr-8 leading-tight">{task.title}</h3>
        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-2">
           <button 
            onClick={() => onEdit(task)}
            className="p-1.5 text-slate-400 hover:text-[#E03A3E] hover:bg-[#E03A3E]/10 rounded-md transition-colors"
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={() => onDelete(task.id)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-slate-50 border border-slate-200">
          <span className={`${
            task.status === TaskStatus.DONE ? 'text-green-500' : 
            task.status === TaskStatus.IN_PROGRESS ? 'text-blue-500' : 'text-slate-400'
          }`}>
             {statusIcon[task.status]}
          </span>
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
            className="bg-transparent border-none outline-none text-slate-600 cursor-pointer appearance-none hover:text-slate-900"
          >
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {(task.notes || task.links.length > 0) && (
        <div className="space-y-2 mt-3 pt-3 border-t border-slate-50">
          {task.notes && (
            <div className="flex gap-2 text-slate-500 text-xs line-clamp-2">
              <FileText size={12} className="flex-shrink-0 mt-0.5" />
              <span>{task.notes}</span>
            </div>
          )}
          
          {task.links.length > 0 && (
            <div className="flex gap-2 text-slate-500 text-xs">
              <Link size={12} className="flex-shrink-0 mt-0.5" />
              <span className="truncate">{task.links.length} attachment{task.links.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};