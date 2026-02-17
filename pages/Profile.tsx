import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { User, Project, Invite, TaskStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Check, X, Bell } from 'lucide-react';

export const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
      const u = await api.getCurrentUser();
      setUser(u);
      
      const all = await api.getProjects();
      setProjects(all);
      
      if (u) {
        const myInvites = await api.getInvitesForUser(u.id);
        setInvites(myInvites);
      }
  };

  const handleAcceptInvite = async (inviteId: string) => {
      await api.acceptInvite(inviteId);
      loadProfile();
  };

  const handleDeclineInvite = async (inviteId: string) => {
      await api.declineInvite(inviteId);
      loadProfile();
  };

  if (!user) return null;

  // Stats Calculation
  const totalCompleted = projects.reduce(
    (acc, p) =>
      acc +
      p.phases
        .flatMap((ph) => ph.tasks)
        .filter((t) => t.status === TaskStatus.COMPLETED).length,
    0
  );

  const totalBacklog = projects.reduce(
    (acc, p) =>
      acc +
      p.phases
        .flatMap((ph) => ph.tasks)
        .filter(
          (t) =>
            t.status === TaskStatus.BACKLOG ||
            (t.backlogs && t.backlogs.length > 0)
        ).length,
    0
  );

  // Weekly activity based on real completed tasks (last 7 days)
  const computeWeeklyActivity = (allProjects: Project[]) => {
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = Array(7).fill(0);

    const now = new Date();
    const start = new Date();
    start.setDate(now.getDate() - 6); // last 7 days including today

    allProjects.forEach((p) => {
      p.phases.forEach((ph) => {
        ph.tasks.forEach((t) => {
          if (t.status === TaskStatus.COMPLETED && t.completedAt) {
            const d = new Date(t.completedAt);
            if (!isNaN(d.getTime()) && d >= start && d <= now) {
              const weekday = d.getDay(); // 0 (Sun) - 6 (Sat)
              const index = weekday === 0 ? 6 : weekday - 1; // map to Mon-Sun
              counts[index] += 1;
            }
          }
        });
      });
    });

    return dayLabels.map((name, idx) => ({
      name,
      tasks: counts[idx],
    }));
  };

  const activityData = computeWeeklyActivity(projects);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:space-x-8 mb-10 text-center md:text-left">
        <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-primary to-orange-500 mb-4 md:mb-0">
          <img src={user.avatarUrl} alt="Profile" className="w-full h-full rounded-full object-cover border-4 border-background" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">{user.username}</h1>
          <p className="text-gray-400 text-lg mb-4">Full Stack Developer</p>
          <div className="flex justify-center md:justify-start space-x-6">
             <div className="text-center">
                 <div className="text-2xl font-bold text-orange-500">{user.streak}</div>
                 <div className="text-xs text-gray-500 uppercase tracking-wide">Day Streak</div>
             </div>
             <div className="text-center">
                 <div className="text-2xl font-bold text-secondary">{totalCompleted}</div>
                 <div className="text-xs text-gray-500 uppercase tracking-wide">Completed</div>
             </div>
             <div className="text-center">
                 <div className="text-2xl font-bold text-yellow-500">{totalBacklog}</div>
                 <div className="text-xs text-gray-500 uppercase tracking-wide">Backlogs</div>
             </div>
          </div>
        </div>
      </div>

      {/* Invites Section */}
      {invites.length > 0 && (
          <div className="mb-8 bg-surface border border-primary/30 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <Bell className="mr-2 text-primary" size={20} /> Pending Invites
              </h3>
              <div className="space-y-3">
                  {invites.map(invite => (
                      <div key={invite.id} className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                          <div>
                              <p className="text-white font-medium">Invited to <span className="text-primary">{invite.projectName}</span></p>
                              <p className="text-sm text-gray-400">by {invite.inviterName}</p>
                          </div>
                          <div className="flex space-x-2">
                              <button onClick={() => handleAcceptInvite(invite.id)} className="p-2 bg-secondary/20 text-secondary rounded-lg hover:bg-secondary/30">
                                  <Check size={18} />
                              </button>
                              <button onClick={() => handleDeclineInvite(invite.id)} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30">
                                  <X size={18} />
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Activity Chart */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Weekly Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <XAxis dataKey="name" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip 
                  contentStyle={{backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff'}}
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                />
                <Bar dataKey="tasks" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Stats */}
        <div className="bg-surface border border-border rounded-2xl p-6">
           <h3 className="text-lg font-bold text-white mb-6">Involved Projects</h3>
           <div className="space-y-4">
             {projects.map(p => (
               <div key={p.id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                 <div>
                   <h4 className="font-bold text-white">{p.name}</h4>
                   <p className="text-xs text-gray-400">{p.mode || 'Standard'} • {p.members.length} members</p>
                 </div>
                 <div className="text-right">
                   <div className="text-xl font-bold text-white">🔥 {p.streak}</div>
                 </div>
               </div>
             ))}
             {projects.length === 0 && <p className="text-gray-500">No active projects.</p>}
           </div>
        </div>

      </div>
    </div>
  );
};