import { Project, User, TaskStatus, Task, ProjectMode, UserSkillLevel, Invite } from '../types';

// Mock Data Store
const MOCK_USERS: User[] = [
  { id: 'u1', username: 'alex_dev', avatarUrl: 'https://picsum.photos/200', streak: 12 },
  { id: 'u2', username: 'sarah_code', avatarUrl: 'https://picsum.photos/201', streak: 5 },
  { id: 'u3', username: 'mike_design', avatarUrl: 'https://picsum.photos/202', streak: 0 },
  { id: 'u4', username: 'jane_doe', avatarUrl: 'https://picsum.photos/203', streak: 2 },
];

let PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'E-Commerce Platform',
    description: 'A full-stack e-commerce app with Next.js and Stripe.',
    ownerId: 'u1',
    members: [MOCK_USERS[0], MOCK_USERS[1]],
    createdAt: new Date().toISOString(),
    gitRepoUrl: 'https://github.com/alex/shop',
    streak: 4,
    mode: ProjectMode.DIRECT_DEVELOP,
    phases: [
      {
        id: 'ph1',
        title: 'Month 1: Setup & Auth',
        isExpanded: true,
        tasks: [
          { id: 't1', title: 'Initialize Repo', description: 'Setup Next.js', status: TaskStatus.COMPLETED, assigneeId: 'u1', completedAt: new Date().toISOString() },
          { id: 't2', title: 'Database Schema', description: 'Design SQL schema', status: TaskStatus.PENDING, assigneeId: 'u2' }
        ]
      }
    ]
  }
];

let INVITES: Invite[] = [];

// Service Methods
export const mockService = {
  getCurrentUser: () => MOCK_USERS[0],
  
  searchUsers: async (query: string) => {
    return MOCK_USERS.filter(u => u.username.toLowerCase().includes(query.toLowerCase()));
  },

  getProjects: async () => {
    return [...PROJECTS];
  },

  getProjectById: async (id: string) => {
    return PROJECTS.find(p => p.id === id);
  },

  createProject: async (project: Partial<Project>) => {
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: project.name || 'Untitled',
      description: project.description || '',
      gitRepoUrl: project.gitRepoUrl,
      members: project.members || [],
      ownerId: MOCK_USERS[0].id,
      createdAt: new Date().toISOString(),
      phases: [],
      streak: 0,
    };
    PROJECTS.push(newProject);
    return newProject;
  },

  updateProject: async (id: string, updates: Partial<Project>) => {
    PROJECTS = PROJECTS.map(p => (p.id === id ? { ...p, ...updates } : p));
    return PROJECTS.find(p => p.id === id);
  },

  // Task Management
  addTask: async (projectId: string, phaseId: string, task: Task) => {
    const project = PROJECTS.find(p => p.id === projectId);
    if (!project) return null;
    const phase = project.phases.find(ph => ph.id === phaseId);
    if (!phase) return null;
    
    phase.tasks.push(task);
    return project;
  },

  deleteTask: async (projectId: string, phaseId: string, taskId: string) => {
    const project = PROJECTS.find(p => p.id === projectId);
    if (!project) return null;
    const phase = project.phases.find(ph => ph.id === phaseId);
    if (!phase) return null;

    phase.tasks = phase.tasks.filter(t => t.id !== taskId);
    return project;
  },

  updateTask: async (projectId: string, phaseId: string, taskId: string, updates: Partial<Task>) => {
    const project = PROJECTS.find(p => p.id === projectId);
    if (!project) return null;
    
    const phase = project.phases.find(ph => ph.id === phaseId);
    if (!phase) return null;

    phase.tasks = phase.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
    
    // Check if task completed, maybe update streak logic here (simplified)
    if (updates.status === TaskStatus.COMPLETED && !updates.completedAt) {
        updates.completedAt = new Date().toISOString();
    }

    return project;
  },

  // Invites
  sendInvite: async (projectId: string, inviteeId: string) => {
    const project = PROJECTS.find(p => p.id === projectId);
    const currentUser = MOCK_USERS[0]; // Assuming current user is inviter
    if (!project) return;

    const newInvite: Invite = {
      id: Math.random().toString(36).substr(2, 9),
      projectId,
      projectName: project.name,
      inviterId: currentUser.id,
      inviterName: currentUser.username,
      inviteeId,
      status: 'pending'
    };
    INVITES.push(newInvite);
    return newInvite;
  },

  getInvitesForUser: async (userId: string) => {
    return INVITES.filter(i => i.inviteeId === userId && i.status === 'pending');
  },

  acceptInvite: async (inviteId: string) => {
    const invite = INVITES.find(i => i.id === inviteId);
    if (!invite) return;

    invite.status = 'accepted';
    
    const project = PROJECTS.find(p => p.id === invite.projectId);
    const user = MOCK_USERS.find(u => u.id === invite.inviteeId);
    
    if (project && user) {
        // Add member if not already
        if (!project.members.find(m => m.id === user.id)) {
            project.members.push(user);
        }
    }
  },

  declineInvite: async (inviteId: string) => {
    INVITES = INVITES.filter(i => i.id !== inviteId);
  }
};