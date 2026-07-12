import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import { useStore } from '../store/useStore';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';

export function Invite() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { setActiveWorkspace } = useStore();
  const { currentUser, logout } = useAuth();
  
  const intendedEmail = searchParams.get('email');
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEmailMismatch = intendedEmail && currentUser && currentUser.email.toLowerCase() !== intendedEmail.toLowerCase();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      setError('Please enter the invitation code.');
      return;
    }
    
    if (isEmailMismatch) {
      setError(`This invitation is for ${intendedEmail}. Please log out and sign in with the correct account.`);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const { data } = await api.post<{ workspaceId?: number }>(`/api/workspaces/join/${slug}`, { code });
      if (data?.workspaceId) {
        setActiveWorkspace(data.workspaceId);
      }
      await queryClient.invalidateQueries({ queryKey: ['my-workspaces'] });
      window.dispatchEvent(new Event('workspace:changed'));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join workspace. Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111] flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-[#191919] p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-[#2C2C2C]"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Join Workspace</h2>
          <p className="text-gray-500">Enter the invitation code from your email to join the workspace.</p>
        </div>

        {isEmailMismatch && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-400">
              <p className="font-semibold mb-1">Account Mismatch</p>
              <p>This invitation was sent to <strong>{intendedEmail}</strong>, but you are logged in as <strong>{currentUser?.email}</strong>.</p>
              <button 
                type="button"
                onClick={() => logout()}
                className="mt-2 font-medium underline hover:text-amber-900 dark:hover:text-amber-300"
              >
                Log out to switch accounts
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Invitation Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. DEV-1A2B3C4D"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-gray-900 dark:text-white uppercase"
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                Join Workspace
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
