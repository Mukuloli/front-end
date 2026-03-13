'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User, Shield, Settings, ChevronRight, LogOut, Sparkles, Mail, Hash } from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex items-center gap-3">
          <svg className="animate-spin w-5 h-5" style={{ color: 'var(--accent-start)' }} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span style={{ color: 'var(--text-secondary)' }}>Loading...</span>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Profile',
      description: 'Update your profile information',
      icon: <User className="w-5 h-5" />,
      color: 'from-indigo-500 to-violet-500',
      glow: 'rgba(99, 102, 241, 0.15)',
    },
    {
      title: 'Settings',
      description: 'Manage your account settings',
      icon: <Settings className="w-5 h-5" />,
      color: 'from-emerald-500 to-teal-500',
      glow: 'rgba(52, 211, 153, 0.15)',
    },
    {
      title: 'Security',
      description: 'Update password and security',
      icon: <Shield className="w-5 h-5" />,
      color: 'from-amber-500 to-orange-500',
      glow: 'rgba(245, 158, 11, 0.15)',
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Nav */}
      <nav className="chat-header sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md"
                style={{ boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)' }}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="btn-primary px-4 py-2 text-sm rounded-lg"
              >
                Go to Chat
              </button>
              <button
                onClick={handleLogout}
                className="btn-danger flex items-center gap-2 px-4 py-2 text-sm rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="dash-card p-6 sm:p-8 mb-8 animate-fade-in-up">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg"
              style={{ boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)' }}>
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Welcome, {user.displayName || user.email}!
              </h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Manage your account and settings
              </p>
            </div>
          </div>

          {/* Account Info */}
          <div className="border-t pt-6" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
              Account Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)' }}>
                <Mail className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                <div className="min-w-0">
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Email</p>
                  <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)' }}>
                <Hash className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                <div className="min-w-0">
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>User ID</p>
                  <p className="text-sm truncate font-mono" style={{ color: 'var(--text-primary)' }}>{user.uid}</p>
                </div>
              </div>
              {user.displayName && (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)' }}>
                  <User className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Display Name</p>
                    <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{user.displayName}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <h3 className="text-base font-semibold mb-4 px-1" style={{ color: 'var(--text-secondary)' }}>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, i) => (
            <div
              key={i}
              className="dash-card dash-card-accent p-5 cursor-pointer group animate-fade-in-up"
              style={{ animationDelay: `${(i + 1) * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md`}
                  style={{ boxShadow: `0 4px 15px ${action.glow}` }}>
                  <span className="text-white">{action.icon}</span>
                </div>
                <ChevronRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" style={{ color: 'var(--text-muted)' }} />
              </div>
              <h4 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{action.title}</h4>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{action.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
