'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { BookOpen, LogOut, User, FolderKanban, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotebookStore } from '@/stores/useNotebookStore';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { currentNotebook } = useNotebookStore();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isNotebookPage = pathname?.startsWith('/notebook/');

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard" className="flex items-center space-x-2 text-blue-500 font-bold text-lg hover:opacity-90 transition">
          <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-lg">
            <BookOpen className="h-5 w-5 text-blue-400" />
          </div>
          <span className="tracking-tight text-white">DocsLM<span className="text-blue-500">.ai</span></span>
        </Link>

        {isNotebookPage && currentNotebook && (
          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <span>/</span>
            <div className="flex items-center space-x-1 font-medium text-slate-200 bg-slate-900 border border-slate-800 px-3 py-1 rounded-md">
              <FolderKanban className="h-4 w-4 text-blue-400" />
              <span className="truncate max-w-50">{currentNotebook.title}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {user ? (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs text-slate-300">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
                alt="Avatar"
                className="w-5 h-5 rounded-full bg-slate-800"
              />
              <span className="font-medium text-slate-200">{user.name}</span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 transition"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg shadow-sm transition"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
