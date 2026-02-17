import React from 'react';
import { Project } from '../types';
import { GitBranch, Users, ArrowRight } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onClick: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  // Calculate progress
  const allTasks = project.phases.flatMap(p => p.tasks);
  const completedTasks = allTasks.filter(t => t.status === 'Completed').length;
  const totalTasks = allTasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div 
      onClick={() => onClick(project.id)}
      className="group bg-surface border border-border rounded-2xl p-6 hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-primary/5 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="text-primary" />
      </div>

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{project.name}</h3>
          <p className="text-sm text-gray-400 line-clamp-2 h-10">{project.description}</p>
        </div>
      </div>

      <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
        <div 
          className="bg-gradient-to-r from-primary to-purple-500 h-2 rounded-full transition-all duration-500" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Users size={16} className="mr-1" />
            <span>{project.members.length}</span>
          </div>
          {project.gitRepoUrl && (
            <div className="flex items-center">
              <GitBranch size={16} className="mr-1" />
              <span>Git</span>
            </div>
          )}
        </div>
        <div className="flex items-center text-orange-400 font-medium">
          🔥 {project.streak}
        </div>
      </div>
    </div>
  );
};