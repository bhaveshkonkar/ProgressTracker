import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { api } from '../services/api';
import { ArrowLeft, Upload, Check } from 'lucide-react';

interface TaskSubmissionProps {
  projectId: string;
  taskId: string;
  initialTask?: Task; 
  onNavigate: (page: string, params?: any) => void;
  onBack: () => void;
}

export const TaskSubmission: React.FC<TaskSubmissionProps> = ({ projectId, taskId, initialTask, onBack }) => {
  const [task, setTask] = useState<Task | null>(initialTask || null); 
  const [description, setDescription] = useState(task?.submissionDescription || '');
  const [backlogs, setBacklogs] = useState(task?.backlogs || '');
  const [notes, setNotes] = useState(task?.notes || '');
  const [imagePreview, setImagePreview] = useState<string | null>(task?.proofImageUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!task) return <div className="p-8 text-white">Task not found.</div>;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const project = await api.getProjectById(projectId);
    if (!project) return;
    
    const phase = project.phases.find(p => p.tasks.find(t => t.id === task.id));
    if (!phase) return;

    await api.updateTask(projectId, phase.id, task.id, {
      status: TaskStatus.COMPLETED,
      submissionDescription: description,
      backlogs: backlogs,
      notes: notes,
      proofImageUrl: imagePreview || undefined,
      completedAt: new Date().toISOString()
    });

    setTimeout(() => {
        setIsSubmitting(false);
        onBack();
    }, 800);
  };

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center bg-background">
      <div className="w-full max-w-5xl animate-fade-in-up">
        
        <button 
            onClick={onBack}
            className="mb-6 flex items-center text-gray-400 hover:text-white transition-colors group"
        >
            <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" /> 
            Back to Roadmap
        </button>

        {/* Main Card Container */}
        <div className="border border-border rounded-3xl p-8 bg-surface/50 backdrop-blur-xl shadow-2xl relative">
            
            {/* Header: Date and Time */}
            <div className="text-center mb-8">
                <p className="text-primary font-bold uppercase tracking-widest text-xs mb-2">Submission Protocol</p>
                <h2 className="text-white text-2xl font-light">{currentDate}</h2>
            </div>

            {/* Task Title */}
            <div className="bg-gradient-to-r from-white/5 to-transparent border border-white/10 rounded-xl p-6 mb-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                <h1 className="text-3xl font-bold text-white tracking-tight">{task.title}</h1>
                <p className="text-gray-400 mt-2">{task.description}</p>
            </div>

            {/* Split Grid: Upload and Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                
                {/* Upload Box */}
                <div className="group relative">
                    <div className={`border-2 border-dashed border-gray-700 rounded-2xl p-4 flex flex-col h-72 relative overflow-hidden transition-all ${!imagePreview ? 'hover:border-primary/50 hover:bg-white/5' : 'border-none bg-black'}`}>
                        {imagePreview ? (
                            <>
                                <img src={imagePreview} className="w-full h-full object-cover rounded-xl" alt="Proof" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button 
                                        onClick={() => setImagePreview(null)}
                                        className="bg-red-500/80 text-white px-4 py-2 rounded-full hover:bg-red-600 backdrop-blur-sm"
                                    >
                                        Remove Image
                                    </button>
                                </div>
                            </>
                        ) : (
                            <label className="flex-1 flex flex-col items-center justify-center cursor-pointer w-full h-full">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Upload className="text-gray-400 w-8 h-8 group-hover:text-primary transition-colors" />
                                </div>
                                <span className="text-gray-300 font-medium text-center px-4">
                                    Upload Proof of Work
                                </span>
                                <span className="text-gray-500 text-sm mt-2">Screenshot or JPEG</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        )}
                    </div>
                </div>

                {/* Description Box */}
                <div className="relative">
                    <div className="border border-white/10 bg-black/20 rounded-2xl h-72 flex flex-col focus-within:border-primary/50 focus-within:bg-black/40 transition-all">
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what you accomplished today..."
                            className="w-full h-full bg-transparent text-white placeholder-gray-500 text-lg p-6 focus:outline-none resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Backlogs Input */}
            <div className="mb-6">
                <div className="border border-white/10 bg-black/20 rounded-xl focus-within:border-yellow-500/50 transition-colors">
                    <input 
                        type="text"
                        value={backlogs}
                        onChange={(e) => setBacklogs(e.target.value)}
                        placeholder="Any backlogs or blockers? (Optional)"
                        className="w-full bg-transparent text-white px-6 py-4 placeholder-gray-500 focus:outline-none"
                    />
                </div>
            </div>

            {/* Notes Input */}
            <div className="mb-8">
                <div className="border border-white/10 bg-black/20 rounded-xl h-32 focus-within:border-primary/50 transition-colors">
                    <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional notes, learnings, or references..."
                        className="w-full h-full bg-transparent text-white placeholder-gray-500 p-4 focus:outline-none resize-none"
                    />
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-white/5">
                <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-primary to-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <>
                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                         Submitting...
                        </>
                    ) : (
                        <>
                        <Check className="mr-2" size={20} /> Submit Work
                        </>
                    )}
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};