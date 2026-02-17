import { supabase } from './supabaseClient';
import { Project, User, TaskStatus, Task, ProjectMode, UserSkillLevel, Invite, ProjectPhase } from '../types';

// Helper to map DB user to App User
const mapUser = (profile: any): User => ({
  id: profile.id,
  username: profile.username || 'Unknown',
  avatarUrl: profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username || 'User'}&background=random`,
  streak: profile.streak || 0
});

export const api = {
  // --- Auth & User ---
  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Retry fetch logic in case trigger/backfill is slow.
    // Use a safe query that doesn't throw when 0 rows are returned.
    let profile: any = null;
    let attempts = 0;
    while (!profile && attempts < 3) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id);

        if (error) {
          console.error('Failed to load profile for user', user.id, error);
          break;
        }

        profile = (data && data.length > 0) ? data[0] : null;
        if (!profile) await new Promise(r => setTimeout(r, 500));
        attempts++;
    }

    // Fallback lightweight user if profile row doesn't exist yet
    if (!profile) {
      return {
        id: user.id,
        username: user.email || 'User',
        avatarUrl: '',
        streak: 0,
      };
    }

    return mapUser(profile);
  },

  signInWithGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
            access_type: 'offline',
            prompt: 'consent',
        },
      },
    });
  },

  signInWithEmail: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    return data;
  },

  signUpWithEmail: async (email: string, password: string, username: string) => {
      // We pass username in data so the Trigger can pick it up
      const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
              data: {
                  username: username
              }
          }
      });
      
      if (error) throw error;
      return data;
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },

  searchUsers: async (query: string): Promise<User[]> => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${query}%`)
      .limit(10);
      
    return (data || []).map(mapUser);
  },

  // --- Projects ---
  getProjects: async (): Promise<Project[]> => {
    const user = await api.getCurrentUser();
    if (!user) return [];

    // Get project IDs where user is a member
    const { data: memberRelations } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id);
    
    const projectIds = memberRelations?.map(r => r.project_id) || [];

    if (projectIds.length === 0) return [];

    // Fetch full project details
    const { data: projects } = await supabase
      .from('projects')
      .select(`
        *,
        members:project_members(user:profiles(*)),
        phases:phases(*, tasks(*))
      `)
      .in('id', projectIds);

    if (!projects) return [];

    // Map to Type
    return projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      gitRepoUrl: p.git_repo_url,
      ownerId: p.owner_id,
      createdAt: p.created_at,
      mode: p.mode as ProjectMode,
      skillLevel: p.skill_level as UserSkillLevel,
      streak: p.streak,
      members: p.members.map((m: any) => mapUser(m.user)),
      phases: p.phases.map((ph: any) => ({
        id: ph.id,
        title: ph.title,
        isExpanded: true,
        tasks: ph.tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status as TaskStatus,
          assigneeId: t.assignee_id,
          dueDate: t.due_date,
          completedAt: t.completed_at,
          proofImageUrl: t.proof_image_url,
          notes: t.notes,
          submissionDescription: t.submission_description,
          backlogs: t.backlogs
        }))
      }))
    }));
  },

  getProjectById: async (id: string): Promise<Project | undefined> => {
    const { data: p, error } = await supabase
      .from('projects')
      .select(`
        *,
        members:project_members(user:profiles(*)),
        phases:phases(*, tasks(*))
      `)
      .eq('id', id)
      .single();

    if (error || !p) return undefined;

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      gitRepoUrl: p.git_repo_url,
      ownerId: p.owner_id,
      createdAt: p.created_at,
      mode: p.mode as ProjectMode,
      skillLevel: p.skill_level as UserSkillLevel,
      streak: p.streak,
      members: p.members.map((m: any) => mapUser(m.user)),
      phases: p.phases.map((ph: any) => ({
        id: ph.id,
        title: ph.title,
        isExpanded: true,
        tasks: ph.tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status as TaskStatus,
          assigneeId: t.assignee_id,
          dueDate: t.due_date,
          completedAt: t.completed_at,
          proofImageUrl: t.proof_image_url,
          notes: t.notes,
          submissionDescription: t.submission_description,
          backlogs: t.backlogs
        }))
      }))
    };
  },

  createProject: async (projectData: Partial<Project>): Promise<Project> => {
    const currentUser = await api.getCurrentUser();
    if (!currentUser) throw new Error("Not logged in");

    // 1. Insert Project
    const { data: newProject, error: pError } = await supabase
      .from('projects')
      .insert({
        name: projectData.name,
        description: projectData.description,
        git_repo_url: projectData.gitRepoUrl,
        owner_id: currentUser.id,
        mode: projectData.mode,
        skill_level: projectData.skillLevel
      })
      .select()
      .single();

    if (pError) throw pError;

    // 2. Insert Members
    const members = projectData.members || [currentUser];
    const memberInserts = members.map(m => ({
      project_id: newProject.id,
      user_id: m.id
    }));
    await supabase.from('project_members').insert(memberInserts);

    // 3. Insert Phases & Tasks (if generated by AI)
    if (projectData.phases && projectData.phases.length > 0) {
       for (const phase of projectData.phases) {
           const { data: newPhase } = await supabase
             .from('phases')
             .insert({ project_id: newProject.id, title: phase.title })
             .select()
             .single();
           
           if (newPhase && phase.tasks) {
               const tasksToInsert = phase.tasks.map(t => ({
                   phase_id: newPhase.id,
                   title: t.title,
                   description: t.description,
                   status: t.status,
                   assignee_id: t.assigneeId
               }));
               await supabase.from('tasks').insert(tasksToInsert);
           }
       }
    }

    return (await api.getProjectById(newProject.id)) as Project;
  },

  updateProject: async (id: string, updates: Partial<Project>) => {
      // NOTE: Deep update of phases is complex. For this MVP, we mainly update project fields
      // or append new phases.
      
      // Update basic fields
      await supabase.from('projects').update({
          mode: updates.mode,
          skill_level: updates.skillLevel
      }).eq('id', id);

      // Handle new phases (simple logic: if incoming phases has no ID, insert it)
      if (updates.phases) {
          for (const phase of updates.phases) {
              if (phase.id.startsWith('ph-')) { // It's a temp ID from client
                   const { data: newPhase } = await supabase
                    .from('phases')
                    .insert({ project_id: id, title: phase.title })
                    .select()
                    .single();
                   
                   if (newPhase) {
                       const tasksToInsert = phase.tasks.map(t => ({
                           phase_id: newPhase.id,
                           title: t.title,
                           description: t.description,
                           status: t.status,
                           assignee_id: t.assigneeId
                       }));
                       await supabase.from('tasks').insert(tasksToInsert);
                   }
              }
          }
      }

      return api.getProjectById(id);
  },

  // --- Tasks ---
  addTask: async (projectId: string, phaseId: string, task: Task) => {
    await supabase.from('tasks').insert({
        phase_id: phaseId,
        title: task.title,
        description: task.description,
        status: task.status,
        assignee_id: task.assigneeId
    });
    return api.getProjectById(projectId);
  },

  deleteTask: async (projectId: string, phaseId: string, taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId);
    return api.getProjectById(projectId);
  },

  updateTask: async (projectId: string, phaseId: string, taskId: string, updates: Partial<Task>) => {
    await supabase.from('tasks').update({
        status: updates.status,
        submission_description: updates.submissionDescription,
        backlogs: updates.backlogs,
        notes: updates.notes,
        proof_image_url: updates.proofImageUrl,
        completed_at: updates.completedAt
    }).eq('id', taskId);
    
    return api.getProjectById(projectId);
  },

  // --- Invites ---
  sendInvite: async (projectId: string, inviteeId: string) => {
      const user = await api.getCurrentUser();
      if (!user) return;
      
      await supabase.from('invites').insert({
          project_id: projectId,
          inviter_id: user.id,
          invitee_id: inviteeId,
          status: 'pending'
      });
  },

  getInvitesForUser: async (userId: string): Promise<Invite[]> => {
      const { data } = await supabase
        .from('invites')
        .select('*, project:projects(name), inviter:profiles(username)')
        .eq('invitee_id', userId)
        .eq('status', 'pending');
        
      if (!data) return [];
      
      return data.map((i: any) => ({
          id: i.id,
          projectId: i.project_id,
          projectName: i.project.name,
          inviterId: i.inviter_id,
          inviterName: i.inviter.username,
          inviteeId: i.invitee_id,
          status: 'pending'
      }));
  },

  acceptInvite: async (inviteId: string) => {
      // 1. Update invite status
      const { data: invite } = await supabase
        .from('invites')
        .update({ status: 'accepted' })
        .eq('id', inviteId)
        .select()
        .single();
      
      if (invite) {
          // 2. Add to project_members
          await supabase.from('project_members').insert({
              project_id: invite.project_id,
              user_id: invite.invitee_id
          });
      }
  },

  declineInvite: async (inviteId: string) => {
    await supabase.from('invites').update({ status: 'declined' }).eq('id', inviteId);
  }
};