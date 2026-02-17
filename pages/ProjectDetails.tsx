import React, { useEffect, useState } from 'react';
import { Project, ProjectPhase, TaskStatus, Task, User } from '../types';
import { api } from '../services/api';
import { ChevronDown, ChevronRight, CheckCircle, Circle, Plus, Trash2, UserPlus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ProjectDetailsProps {
  projectId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ projectId, onNavigate }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteResults, setInviteResults] = useState<User[]>([]);
  
  const [showAddTask, setShowAddTask] = useState<string | null>(null); // phaseId
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingPhase, setIsAddingPhase] = useState(false);
  const [newPhaseTitle, setNewPhaseTitle] = useState('');

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    setLoading(true);
    const p = await api.getProjectById(projectId);
    if (p) {
      setProject(p);
      if (p.phases.length > 0 && Object.keys(expandedPhases).length === 0) {
        setExpandedPhases({ [p.phases[0].id]: true });
      }
    }
    setLoading(false);
  };

  const handleAddPhase = async () => {
    if (!project || !newPhaseTitle.trim()) return;
    setIsAddingPhase(true);
    try {
      const newPhase: ProjectPhase = {
        id: `ph-manual-${Date.now()}`,
        title: newPhaseTitle.trim(),
        isExpanded: true,
        tasks: [],
      };
      await api.updateProject(project.id, { phases: [newPhase] });
      setNewPhaseTitle('');
      setExpandedPhases(prev => ({ ...prev, [newPhase.id]: true }));
      await loadProject();
    } finally {
      setIsAddingPhase(false);
    }
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => ({ ...prev, [phaseId]: !prev[phaseId] }));
  };

  const handleTaskClick = (task: any) => {
    onNavigate('task-submission', { projectId: project?.id, phaseId: 'find-parent-later', taskId: task.id, task });
  };

  // --- Task Management ---
  const handleAddTask = async (phaseId: string) => {
      if (!newTaskTitle.trim() || !project) return;
      const newTask: Task = {
          id: `t-manual-${Date.now()}`,
          title: newTaskTitle,
          description: 'Added manually',
          status: TaskStatus.PENDING,
          assigneeId: project.ownerId // Default to owner, allows simple logic
      };
      await api.addTask(project.id, phaseId, newTask);
      setNewTaskTitle('');
      setShowAddTask(null);
      await loadProject();
  };

  const handleDeleteTask = async (phaseId: string, taskId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!project) return;
      if (confirm('Are you sure you want to delete this task?')) {
          await api.deleteTask(project.id, phaseId, taskId);
          await loadProject();
      }
  };

  // --- Invite Logic ---
  const handleInviteSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
      setInviteSearch(e.target.value);
      if (e.target.value.length > 1) {
          const res = await api.searchUsers(e.target.value);
          // Filter out existing members
          setInviteResults(res.filter(u => !project?.members.find(m => m.id === u.id)));
      } else {
          setInviteResults([]);
      }
  };

  const sendInvite = async (userId: string) => {
      if (!project) return;
      await api.sendInvite(project.id, userId);
      alert('Invite sent!');
      setInviteSearch('');
      setInviteResults([]);
      setShowInviteModal(false);
  };

  if (loading || !project) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  // Chart Data Preparation
  const chartData = project.phases.map(p => ({
      name: p.title.length > 15 ? p.title.substring(0, 15) + '...' : p.title,
      Completed: p.tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
      Pending: p.tasks.filter(t => t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS).length,
      Backlog: p.tasks.filter(t => t.status === TaskStatus.BACKLOG || (t.backlogs && t.backlogs.length > 0)).length
  }));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 relative">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
          <p className="text-gray-400 max-w-2xl">{project.description}</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-end md:items-center space-y-2 md:space-y-0 md:space-x-4">
           
           {/* Member Stack */}
           <div className="flex -space-x-3 mr-2">
              {project.members.map(m => (
                <img 
                  key={m.id} 
                  src={m.avatarUrl} 
                  alt={m.username} 
                  title={m.username}
                  className="w-10 h-10 rounded-full border-2 border-background object-cover" 
                />
              ))}
           </div>

           {project.streak > 0 && (
             <div className="px-4 py-2 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-lg flex items-center font-bold">
               🔥 {project.streak} Day Streak
             </div>
           )}
           <button 
             onClick={() => setShowInviteModal(!showInviteModal)}
             className="px-4 py-2 bg-surface border border-border text-white rounded-lg hover:bg-white/5 flex items-center"
           >
               <UserPlus size={18} className="mr-2" /> Invite
           </button>
           
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
          <div className="absolute top-24 right-4 md:right-8 z-20 w-80 bg-surface border border-border rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-4">
              <h3 className="text-white font-bold mb-3">Invite Collaborators</h3>
              <input 
                  type="text" 
                  placeholder="Search username..." 
                  className="w-full bg-black/20 border border-border rounded-lg px-3 py-2 text-white mb-2 focus:outline-none focus:border-primary"
                  value={inviteSearch}
                  onChange={handleInviteSearch}
              />
              <div className="max-h-48 overflow-y-auto space-y-2">
                  {inviteResults.map(u => (
                      <div key={u.id} className="flex justify-between items-center p-2 hover:bg-white/5 rounded">
                          <div className="flex items-center">
                              <img src={u.avatarUrl} className="w-6 h-6 rounded-full mr-2"/>
                              <span className="text-gray-200 text-sm">{u.username}</span>
                          </div>
                          <button onClick={() => sendInvite(u.id)} className="text-xs bg-primary text-white px-2 py-1 rounded">Add</button>
                      </div>
                  ))}
                  {inviteResults.length === 0 && inviteSearch.length > 1 && (
                      <p className="text-gray-500 text-sm text-center py-2">No users found</p>
                  )}
              </div>
          </div>
      )}

      {/* Content Area: Manual plan view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: SDLC & High Level */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* SDLC Visualization (Simplified) */}
            <div className="bg-surface border border-border rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-wider">Project Lifecycle</h3>
              <div className="relative border-l-2 border-gray-700 ml-3 space-y-8 py-2">
                {project.phases.map((phase, idx) => {
                  const isCompleted = phase.tasks.every(t => t.status === TaskStatus.COMPLETED);
                  return (
                    <div key={idx} className="relative pl-8">
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${isCompleted ? 'bg-secondary border-secondary' : 'bg-surface border-gray-500'}`}></div>
                      <p className={`font-medium ${isCompleted ? 'text-secondary' : 'text-white'}`}>{phase.title}</p>
                      <p className="text-xs text-gray-500">{phase.tasks.filter(t => t.status === TaskStatus.COMPLETED).length} / {phase.tasks.length} tasks</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Analytical Progress Chart */}
            <div className="bg-surface border border-border rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-wider">Task Analysis</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{fontSize: 10}} stroke="#52525b" />
                    <YAxis stroke="#52525b" fontSize={10} />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#18181b', borderColor: '#27272a'}}
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    />
                    <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                    <Bar dataKey="Completed" stackId="a" fill="#10b981" />
                    <Bar dataKey="Pending" stackId="a" fill="#6366f1" />
                    <Bar dataKey="Backlog" stackId="a" fill="#eab308" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Right Column: Detailed Tasks */}
          <div className="lg:col-span-2 space-y-4">
             <div className="flex justify-between items-center mb-2">
               <h2 className="text-xl font-bold text-white">Roadmap</h2>
             </div>

             {/* Add Phase */}
             <div className="bg-surface border border-dashed border-gray-700 rounded-xl p-4 flex items-center space-x-3 mb-2">
               <input
                 type="text"
                 value={newPhaseTitle}
                 onChange={(e) => setNewPhaseTitle(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleAddPhase()}
                 placeholder="Add a new phase (e.g., Phase 1: Setup)"
                 className="flex-1 bg-transparent border-b border-gray-600 focus:border-primary focus:outline-none text-white text-sm pb-1"
               />
               <button
                 onClick={handleAddPhase}
                 disabled={isAddingPhase || !newPhaseTitle.trim()}
                 className="text-xs bg-primary text-white px-3 py-1 rounded disabled:opacity-50"
               >
                 {isAddingPhase ? 'Adding...' : 'Add Phase'}
               </button>
             </div>

             {project.phases.map((phase) => (
               <div key={phase.id} className="bg-surface border border-border rounded-xl overflow-hidden transition-all">
                 <div className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors">
                   <button 
                    onClick={() => togglePhase(phase.id)}
                    className="flex items-center font-bold text-gray-200"
                   >
                       {expandedPhases[phase.id] ? <ChevronDown size={18} className="mr-2"/> : <ChevronRight size={18} className="mr-2"/>}
                       {phase.title}
                   </button>
                   <div className="flex items-center">
                     <span className="text-xs bg-black/40 px-2 py-1 rounded mr-3 text-gray-400">
                       {phase.tasks.length} Tasks
                     </span>
                     <button 
                        onClick={() => setShowAddTask(showAddTask === phase.id ? null : phase.id)}
                        className="text-primary hover:text-white p-1"
                        title="Add Task"
                     >
                         <Plus size={18} />
                     </button>
                   </div>
                 </div>

                 {expandedPhases[phase.id] && (
                   <div className="divide-y divide-white/5">
                     {/* Add Task Input */}
                     {showAddTask === phase.id && (
                         <div className="p-4 bg-black/20 flex items-center">
                             <input 
                                type="text" 
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="New task title..."
                                className="flex-1 bg-transparent border-b border-gray-600 focus:border-primary focus:outline-none text-white mr-4"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTask(phase.id)}
                             />
                             <button onClick={() => handleAddTask(phase.id)} className="text-xs bg-primary text-white px-3 py-1 rounded">Add</button>
                         </div>
                     )}

                     {phase.tasks.map(task => {
                       const assignee = project.members.find(m => m.id === task.assigneeId) || project.members[0];
                       const isDone = task.status === TaskStatus.COMPLETED;

                       return (
                         <div key={task.id} className="p-4 flex items-start group hover:bg-white/[0.02] transition-colors relative">
                           <button 
                             onClick={() => handleTaskClick(task)}
                             className={`mt-1 mr-4 flex-shrink-0 ${isDone ? 'text-secondary' : 'text-gray-600 group-hover:text-gray-400'}`}
                           >
                             {isDone ? <CheckCircle size={20} /> : <Circle size={20} />}
                           </button>
                           
                           <div className="flex-1 cursor-pointer" onClick={() => handleTaskClick(task)}>
                             <h4 className={`text-sm font-medium mb-1 ${isDone ? 'text-gray-500 line-through' : 'text-white'}`}>
                               {task.title}
                             </h4>
                             <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>
                           </div>

                           <div className="ml-4 flex items-center flex-shrink-0">
                             <img src={assignee.avatarUrl} alt={assignee.username} title={assignee.username} className="w-6 h-6 rounded-full border border-gray-700" />
                             
                             <button 
                               onClick={(e) => handleDeleteTask(phase.id, task.id, e)}
                               className="ml-3 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                                 <Trash2 size={16} />
                             </button>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 )}
               </div>
             ))}

          </div>

      </div>
    </div>
  );
};