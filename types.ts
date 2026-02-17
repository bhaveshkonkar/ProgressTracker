export enum UserSkillLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
  NONE = 'None' // For Direct Develop mode
}

export enum ProjectMode {
  LEARN_AND_DEVELOP = 'Learn & Develop',
  DIRECT_DEVELOP = 'Direct Develop'
}

export enum TaskStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  BACKLOG = 'Backlog'
}

export interface User {
  id: string;
  username: string;
  avatarUrl: string;
  streak: number;
}

export interface Invite {
  id: string;
  projectId: string;
  projectName: string;
  inviterId: string;
  inviterName: string;
  inviteeId: string; // The user receiving the invite
  status: 'pending' | 'accepted' | 'declined';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: string; // User ID
  dueDate?: string;
  
  // Submission fields
  completedAt?: string;
  proofImageUrl?: string;
  notes?: string;
  submissionDescription?: string;
  backlogs?: string; // "If any backlogs" field from submission
}

export interface ProjectPhase {
  id: string;
  title: string; // e.g., "Month 1: Fundamentals"
  tasks: Task[];
  isExpanded?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  gitRepoUrl?: string;
  members: User[];
  ownerId: string;
  createdAt: string;
  mode?: ProjectMode;
  skillLevel?: UserSkillLevel;
  phases: ProjectPhase[];
  streak: number;
}

export interface AnalyticsData {
  name: string;
  value: number;
}