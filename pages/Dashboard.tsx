import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Project } from '../types';
import { ProjectCard } from '../components/ProjectCard';
import { Plus } from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const data = await api.getProjects();
      setProjects(data);
      setLoading(false);
    };
    fetchProjects();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Track your development streaks and progress.</p>
        </div>
        <button 
          onClick={() => onNavigate('create-project')}
          className="bg-white text-black px-4 py-2 rounded-lg font-medium flex items-center hover:bg-gray-200 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          Create Organization
        </button>
      </header>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading projects...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onClick={(id) => onNavigate('project-details', { projectId: id })}
            />
          ))}
          
          {projects.length === 0 && (
             <div className="col-span-full text-center py-20 border-2 border-dashed border-border rounded-2xl">
               <p className="text-gray-500 mb-4">No projects yet.</p>
               <button 
                onClick={() => onNavigate('create-project')}
                className="text-primary hover:underline"
               >
                 Start your first streak
               </button>
             </div>
          )}
        </div>
      )}
    </div>
  );
};