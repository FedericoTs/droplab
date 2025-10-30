'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LogOut,
  User as UserIcon,
  Mail,
  Sparkles,
  Loader2
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }

    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img
              src="/images/logo_icon_tbg.png"
              alt="DropLab"
              className="h-12 w-auto object-contain"
            />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Welcome to DropLab
              </h1>
              <p className="text-slate-600">
                {user?.user_metadata?.full_name || user?.email}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Success Card */}
        <Card className="mb-8 border-2 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Sparkles className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  🎉 Supabase Authentication Working!
                </h3>
                <p className="text-green-800 mb-4">
                  You've successfully signed up and logged in using Supabase Auth.
                  This is the new Supabase version of DropLab running in parallel
                  with the SQLite version.
                </p>
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Your Account Details:
                  </h4>
                  <div className="space-y-1 text-sm text-slate-700">
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>User ID:</strong> {user?.id}</p>
                    <p><strong>Created:</strong> {new Date(user?.created_at).toLocaleString()}</p>
                    {user?.user_metadata?.full_name && (
                      <p><strong>Full Name:</strong> {user.user_metadata.full_name}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                AI Copywriting
              </CardTitle>
              <CardDescription>
                Generate campaign variations with AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600 mb-4">
                Coming soon in the Supabase version
              </div>
              <Button variant="outline" disabled className="w-full">
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple-600" />
                DM Creative
              </CardTitle>
              <CardDescription>
                Design personalized direct mail
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600 mb-4">
                Coming soon in the Supabase version
              </div>
              <Button variant="outline" disabled className="w-full">
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-green-600" />
                Data Axle
              </CardTitle>
              <CardDescription>
                Access 250M+ contacts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600 mb-4">
                Coming soon in the Supabase version
              </div>
              <Button variant="outline" disabled className="w-full">
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Development Info */}
        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Development Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-blue-800">
              <p>✅ <strong>Completed:</strong> Supabase authentication system</p>
              <p>✅ <strong>Completed:</strong> Protected dashboard route</p>
              <p>✅ <strong>Completed:</strong> Login/Signup pages</p>
              <p>⏳ <strong>Next:</strong> Build campaigns feature with Supabase database</p>
              <p>⏳ <strong>Next:</strong> Add Data Axle integration</p>
              <p className="pt-4 border-t border-blue-200 mt-4">
                <strong>SQLite Version:</strong> Still accessible on branch{' '}
                <code className="bg-blue-100 px-2 py-1 rounded">feature/clean-restart-from-oct28</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
