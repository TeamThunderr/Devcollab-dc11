import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Loader2, XCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function RejectInvite() {
  const [searchParams] = useSearchParams();
  const slug = searchParams.get('slug');
  const email = searchParams.get('email');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!slug || !email) {
      setStatus('error');
      setErrorMessage('Invalid rejection link. Missing required parameters.');
      return;
    }

    const rejectInvitation = async () => {
      try {
        await api.post(`/api/workspaces/join/${slug}/reject`, { email });
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.response?.data?.message || 'This invitation has expired or is no longer valid.');
      }
    };

    rejectInvitation();
  }, [slug, email]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111] flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-[#191919] p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-[#2C2C2C] text-center"
      >
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-gray-400 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Processing Rejection...</h2>
            <p className="text-gray-500 mt-2">Please wait while we securely decline this invitation.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invitation Rejected</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Your invitation has been declined.<br/><br/>
              Your invitation code has been permanently invalidated and can no longer be used.
            </p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-500">
              You may safely close this window.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Unable to Process</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{errorMessage}</p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-500">
              You may safely close this window.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
