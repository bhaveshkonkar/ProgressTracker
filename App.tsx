import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { CreateProject } from './pages/CreateProject';
import { ProjectDetails } from './pages/ProjectDetails';
import { TaskSubmission } from './pages/TaskSubmission';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { api } from './services/api';
import { supabase } from './services/supabaseClient';
import { User } from './types';

// Simple Router Type
type Page = 'dashboard' | 'create-project' | 'project-details' | 'task-submission' | 'profile';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [pageParams, setPageParams] = useState<any>({});
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUser();
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.error("Supabase auth session check failed:", err);
      // In case of error (e.g. invalid URL), stop loading so we show Login page
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUser();
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUser = async () => {
    try {
      const user = await api.getCurrentUser();
      setCurrentUser(user);
    } catch (e) {
      console.error("Failed to fetch user profile:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (page: string, params: any = {}) => {
    setCurrentPage(page as Page);
    setPageParams(params);
    window.scrollTo(0, 0);
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-background text-white">Loading...</div>;

  if (!session || !currentUser) return <Login />;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'create-project':
        return <CreateProject onNavigate={handleNavigate} />;
      case 'project-details':
        return <ProjectDetails projectId={pageParams.projectId} onNavigate={handleNavigate} />;
      case 'task-submission':
        return (
          <TaskSubmission 
            projectId={pageParams.projectId} 
            taskId={pageParams.taskId} 
            initialTask={pageParams.task}
            onNavigate={handleNavigate} 
            onBack={() => handleNavigate('project-details', { projectId: pageParams.projectId })}
          />
        );
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-gray-100 font-sans">
      <Sidebar 
        currentUser={currentUser} 
        activePage={currentPage} 
        onNavigate={(p) => handleNavigate(p)} 
      />
      
      <main className="md:pl-64 min-h-screen transition-all duration-300">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;