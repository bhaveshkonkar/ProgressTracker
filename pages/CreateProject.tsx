import React, { useState } from 'react';
import { User, ProjectPhase } from '../types';
import { api } from '../services/api';
import { Search, X, Github } from 'lucide-react';

interface CreateProjectProps {
  onNavigate: (page: string, params?: any) => void;
}

export const CreateProject: React.FC<CreateProjectProps> = ({ onNavigate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize current user
  React.useEffect(() => {
      api.getCurrentUser().then(u => {
          if (u) {
              setCurrentUser(u);
              setMembers([u]);
          }
      });
  }, []);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 1) {
      const results = await api.searchUsers(query);
      setSearchResults(results.filter(u => !members.find(m => m.id === u.id)));
    } else {
      setSearchResults([]);
    }
  };

  const addMember = (user: User) => {
    setMembers([...members, user]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeMember = (userId: string) => {
    if (userId === currentUser?.id) return;
    setMembers(members.filter(m => m.id !== userId));
  };

  const handleSubmit = async () => {
    if (!name || !description || !currentUser) return;
    setIsSaving(true);

    let generatedPhases: ProjectPhase[] = [];
    
    const newProject = await api.createProject({
      name,
      description,
      gitRepoUrl: repoUrl,
      members,
      mode: undefined,
      skillLevel: undefined,
      phases: generatedPhases
    });

    setIsSaving(false);
    onNavigate('project-details', { projectId: newProject.id });
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto flex flex-col justify-center min-h-screen">
      <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        <h2 className="text-2xl font-bold text-white mb-6">Start a New Streak</h2>
        
        <div className="space-y-8">
          {/* Section 1: Basic Info */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Project Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. AI SaaS Platform"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center">
                  <Github size={16} className="mr-2" /> Git Repository (Optional)
                </label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="https://github.com/username/repo"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Project Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors h-24 resize-none"
                placeholder="Describe your idea, goals, and what you plan to build."
              />
            </div>
          </div>

          {/* Section 2: Team */}
          <div className="border-t border-border pt-6">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-400">Team Members</label>
              <div className="relative">
                <div className="flex items-center bg-background border border-border rounded-lg px-3 py-1.5 focus-within:border-primary transition-colors">
                  <Search size={16} className="text-gray-500 mr-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearch}
                    className="bg-transparent border-none text-sm text-white focus:outline-none w-48"
                    placeholder="Search users..."
                  />
                </div>
                
                {searchResults.length > 0 && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-surface border border-border rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                    {searchResults.map(user => (
                      <button
                        key={user.id}
                        onClick={() => addMember(user)}
                        className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center transition-colors"
                      >
                        <img src={user.avatarUrl} className="w-6 h-6 rounded-full mr-2" alt={user.username} />
                        <span className="text-sm text-gray-200">{user.username}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {members.map(member => (
                <div key={member.id} className="flex items-center bg-white/5 border border-white/10 rounded-full px-1 pl-1 pr-3 py-1">
                  <img src={member.avatarUrl} className="w-8 h-8 rounded-full mr-2" alt={member.username} />
                  <span className="text-sm text-gray-300 mr-2">{member.username}</span>
                  {member.id !== currentUser?.id && (
                    <button onClick={() => removeMember(member.id)} className="text-gray-500 hover:text-red-400">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Roadmap Note */}
          <div className="border-t border-border pt-6">
            <p className="text-sm text-gray-400">
              After creating the project, you can manually add phases and tasks from the project details page to build your roadmap.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSubmit}
              disabled={!name || !description || isSaving}
              className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center ${
                name && description && !isSaving
                  ? 'bg-primary text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Creating project...
                  </>
              ) : (
                  <>
                    Create Project
                  </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};