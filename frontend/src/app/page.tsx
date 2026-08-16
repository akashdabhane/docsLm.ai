'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { fetchMe, user, loading } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="text-xs font-semibold text-slate-300">Loading DocsLM Workspace...</span>
      </div>
    </div>
  );
}
