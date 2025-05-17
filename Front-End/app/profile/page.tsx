"use client";
import { useAuth } from "@/hooks/useAuth";
import { useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [email] = useState(user?.email || '');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      // Update user metadata in Supabase Auth
      const { error: userError } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });
      // Update user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('email', email);
      if (userError || profileError) {
        throw userError || profileError;
      }
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
        variant: 'default',
      });
      setEditing(false);
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err.message || 'Could not update profile.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="p-8">You must be logged in to view your profile.</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <form onSubmit={handleSave} className="space-y-4" aria-label="Profile form">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium mb-1">Full Name</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full border rounded px-3 py-2"
            disabled={!editing || loading}
            aria-required="true"
            aria-label="Full Name"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            className="w-full border rounded px-3 py-2"
            disabled
            aria-label="Email"
          />
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded"
                disabled={loading}
                aria-busy={loading}
                aria-label="Save profile changes"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={() => setEditing(false)}
                disabled={loading}
                aria-label="Cancel editing"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className="bg-indigo-600 text-white px-4 py-2 rounded"
              onClick={() => setEditing(true)}
              aria-label="Edit profile"
            >
              Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
} 
