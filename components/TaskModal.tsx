import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, LinkAttachment } from '../types';
import { Button } from './Button';
import { X, Plus, Trash2, Link as LinkIcon, ExternalLink } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'createdAt'>) => void;
  initialTask?: Task;
  currentDate: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, initialTask, currentDate }) => {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [notes, setNotes] = useState('');
  const [links, setLinks] = useState<LinkAttachment[]>([]);
  
  // Link inputs
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialTask) {
        setTitle(initialTask.title);
        setStatus(initialTask.status);
        setNotes(initialTask.notes);
        setLinks(initialTask.links);
      } else {
        setTitle('');
        setStatus(TaskStatus.TODO);
        setNotes('');
        setLinks([]);
      }
      setShowLinkInput(false);
      setNewLinkUrl('');
      setNewLinkLabel('');
    }
  }, [isOpen, initialTask]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) return;
    
    onSave({
      id: initialTask?.id || crypto.randomUUID(),
      title,
      status,
      notes,
      links,
      date: initialTask?.date || currentDate,
    });
    onClose();
  };

  const addLink = () => {
    if (!newLinkUrl.trim()) return;
    const link: LinkAttachment = {
      id: crypto.randomUUID(),
      url: newLinkUrl,
      label: newLinkLabel || newLinkUrl
    };
    setLinks([...links, link]);
    setNewLinkUrl('');
    setNewLinkLabel('');
    setShowLinkInput(false);
  };

  const removeLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">
            {initialTask ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-700 rounded-lg focus:ring-2 focus:ring-[#E03A3E] focus:border-[#E03A3E] outline-none transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {(Object.keys(TaskStatus) as Array<keyof typeof TaskStatus>).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(TaskStatus[s])}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                    status === TaskStatus[s] 
                      ? 'bg-white text-[#E03A3E] shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add details, observations, or thoughts..."
              className="w-full px-3 py-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-700 rounded-lg focus:ring-2 focus:ring-[#E03A3E] focus:border-[#E03A3E] outline-none transition-all resize-none"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-slate-700">References & Links</label>
              <button 
                onClick={() => setShowLinkInput(true)}
                className="text-xs flex items-center gap-1 text-[#E03A3E] hover:text-[#C02E32] font-medium"
              >
                <Plus size={14} /> Add Link
              </button>
            </div>

            {showLinkInput && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-3 space-y-2">
                 <input
                  type="text"
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                  placeholder="Label (optional)"
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md"
                />
                <input
                  type="text"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setShowLinkInput(false)} className="!py-1 !px-2 !text-xs">Cancel</Button>
                  <Button variant="primary" onClick={addLink} className="!py-1 !px-2 !text-xs">Add</Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {links.map(link => (
                <div key={link.id} className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-lg group hover:border-[#E03A3E]/30 transition-colors">
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#E03A3E] hover:underline truncate flex-1">
                    <LinkIcon size={14} className="flex-shrink-0" />
                    <span className="truncate">{link.label}</span>
                    <ExternalLink size={12} className="opacity-50" />
                  </a>
                  <button onClick={() => removeLink(link.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity px-2">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {links.length === 0 && !showLinkInput && (
                <p className="text-sm text-slate-400 italic">No links attached.</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Task</Button>
        </div>
      </div>
    </div>
  );
};