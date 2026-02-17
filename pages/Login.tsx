import React, { useState } from 'react';
import { api } from '../services/api';
import { Sparkles, AlertCircle, Mail, Lock, User, ArrowRight, Info } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseClient';

export const Login: React.FC = () => {
  // Default to Sign Up to encourage Email/Pass usage since Google Auth requires config
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured) {
      alert("Supabase is not configured. Please check your environment variables.");
      return;
    }
    try {
      await api.signInWithGoogle();
    } catch (error) {
      console.error("Login failed", error);
      setError("Google Login failed. Please check Supabase configuration.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      if (!isSupabaseConfigured) {
          setError("Supabase not configured.");
          setLoading(false);
          return;
      }

      try {
          if (isSignUp) {
              if (!username) {
                  setError("Username is required for sign up.");
                  setLoading(false);
                  return;
              }
              await api.signUpWithEmail(email, password, username);
          } else {
              await api.signInWithEmail(email, password);
          }
      } catch (err: any) {
          console.error(err);
          setError(err.message || "Authentication failed");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[100px]" />

        <div className="bg-surface border border-border p-8 md:p-12 rounded-3xl shadow-2xl max-w-md w-full text-center z-10 transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-tr from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/25">
                <span className="text-3xl font-bold text-white">S</span>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to DevStreak</h1>
            <p className="text-gray-400 mb-6">
                Build habits, track progress, and learn efficiently.
            </p>

            {!isSupabaseConfigured && (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start text-left">
                <AlertCircle className="text-yellow-500 w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-200">
                  Backend not connected. Check environment variables.
                </p>
              </div>
            )}

            {error && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm">
                    {error}
                </div>
            )}

            {/* Email/Pass Form */}
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                {isSignUp && (
                    <div className="relative">
                        <User className="absolute left-3 top-3.5 text-gray-500 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Username" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-black/20 border border-border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                )}
                <div className="relative">
                    <Mail className="absolute left-3 top-3.5 text-gray-500 w-5 h-5" />
                    <input 
                        type="email" 
                        placeholder="Email address" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/20 border border-border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
                    />
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-gray-500 w-5 h-5" />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/20 border border-border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
                    />
                </div>

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center hover:bg-indigo-600 transition-colors shadow-lg shadow-primary/25"
                >
                    {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                    {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
                </button>
            </form>

            <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
                <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(null); }} className="hover:text-white underline">
                    {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                </button>
            </div>

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-surface text-gray-500">Or continue with</span></div>
            </div>

            <div className="space-y-3">
              <button 
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full bg-white text-black font-bold py-3 px-6 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6 mr-3" alt="Google" />
                  Google
              </button>
              
              <div className="flex items-start text-xs text-gray-500 text-left bg-white/5 p-2 rounded-lg">
                  <Info size={14} className="mr-2 mt-0.5 flex-shrink-0 text-primary" />
                  <span>
                    <strong>Getting a 403 error?</strong> That means the Google Login isn't configured for this domain yet. 
                    Please use the <strong>Email/Password</strong> form above instead.
                  </span>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-center text-gray-500 text-sm">
                <Sparkles size={16} className="mr-2 text-primary" />
                Powered by Gemini & Supabase
            </div>
        </div>
    </div>
  );
};