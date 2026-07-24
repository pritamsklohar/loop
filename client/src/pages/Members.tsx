import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';

const inviteSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['ADMIN', 'ANALYST', 'VIEWER'])
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface Member {
  _id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'ANALYST' | 'VIEWER';
  workspaceId: string;
}

export const Members: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<boolean>(false);

  // NOTE: Hiding or disabling the UI actions here is strictly for user experience (UX). 
  // Client-side restrictions are easily bypassed. The actual security boundary is enforced 
  // on the server via `requireRole('ADMIN')` and `requireWorkspaceScope` middlewares.
  const isAdmin = user?.role === 'ADMIN';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: 'VIEWER'
    }
  });

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/workspace/members');
      setMembers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch workspace members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleRoleChange = async (memberId: string, newRole: 'ADMIN' | 'ANALYST' | 'VIEWER') => {
    // NOTE: If a non-admin bypasses the UI and triggers this call, the server will block 
    // it with a 403 Forbidden because of the `requireRole('ADMIN')` middleware check.
    try {
      const res = await api.patch(`/workspace/members/${memberId}/role`, { role: newRole });
      setMembers(members.map(m => m._id === memberId ? res.data : m));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update member role');
    }
  };

  const onInvite = async (data: InviteFormValues) => {
    // NOTE: The invite action is restricted to ADMIN only. Non-admins attempting to post 
    // to this endpoint directly will be rejected by the server's requireRole middleware.
    try {
      setInviteError(null);
      setInviteSuccess(false);
      const res = await api.post('/workspace/invite', data);
      setMembers([...members, res.data]);
      setInviteSuccess(true);
      reset();
    } catch (err: any) {
      setInviteError(err.response?.data?.error || 'Failed to invite member');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-7xl mx-auto w-full space-y-6 text-[#F2F2F3]">
      <div>
        <h1 className="text-3xl font-extrabold text-[#F2F2F3] tracking-tight">Members</h1>
        <p className="text-[#A0A0A6] mt-1 text-sm">Manage workspace members and control role-based access permissions.</p>
      </div>
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Middle: Members List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1C1C1F] border border-[#2A2A2E] rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-[#F2F2F3] mb-6">Team Members</h2>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-coral-500"></div>
              </div>
            ) : error ? (
              <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                {error}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#2A2A2E] text-[#A0A0A6] text-sm font-semibold">
                      <th className="pb-4">Name</th>
                      <th className="pb-4">Email</th>
                      <th className="pb-4">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {members.map((member) => (
                      <tr key={member._id} className="text-[#F2F2F3]">
                        <td className="py-4 font-medium text-[#F2F2F3]">{member.name}</td>
                        <td className="py-4">{member.email}</td>
                        <td className="py-4">
                          {/* NOTE: Disabling this select for non-admins is UX only. The server blocks unauthorized role modifications. */}
                          <select
                            value={member.role}
                            disabled={!isAdmin}
                            onChange={(e) => handleRoleChange(member._id, e.target.value as any)}
                            className="bg-[#0E0E10] border border-[#2A2A2E] text-[#F2F2F3] text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-coral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="ANALYST">Analyst</option>
                            <option value="VIEWER">Viewer</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Invite Form (ADMIN Only) */}
        <div>
          {isAdmin ? (
            <div className="bg-[#1C1C1F] border border-[#2A2A2E] rounded-xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#F2F2F3]">Invite Member</h3>
                <p className="text-[#A0A0A6] text-xs mt-1">Send an invitation to join your workspace</p>
              </div>

              {inviteError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {inviteError}
                </div>
              )}

              {inviteSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                  Invitation generated successfully! (Temp Password: TempPassword123!)
                </div>
              )}

              <form onSubmit={handleSubmit(onInvite)} className="space-y-4">
                <div>
                  <label className="block text-[#F2F2F3] text-xs font-semibold mb-1" htmlFor="name">Name</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    {...register('name')}
                    className={`w-full px-3 py-2 rounded-lg bg-[#0E0E10]/80 border text-[#F2F2F3] placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-coral-500 ${
                      errors.name ? 'border-rose-500/50' : 'border-[#2A2A2E]'
                    }`}
                  />
                  {errors.name && <p className="text-rose-400 text-2xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-[#F2F2F3] text-xs font-semibold mb-1" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    {...register('email')}
                    className={`w-full px-3 py-2 rounded-lg bg-[#0E0E10]/80 border text-[#F2F2F3] placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-coral-500 ${
                      errors.email ? 'border-rose-500/50' : 'border-[#2A2A2E]'
                    }`}
                  />
                  {errors.email && <p className="text-rose-400 text-2xs mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-[#F2F2F3] text-xs font-semibold mb-1" htmlFor="role">Role</label>
                  <select
                    id="role"
                    {...register('role')}
                    className="w-full px-3 py-2 rounded-lg bg-[#0E0E10]/80 border border-[#2A2A2E] text-[#F2F2F3] text-sm focus:outline-none focus:ring-1 focus:ring-coral-500"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="ANALYST">Analyst</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 px-4 rounded-lg bg-coral-600 hover:bg-coral-500 text-[#F2F2F3] font-semibold shadow-lg hover:shadow-indigo-500/20 text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Invite Member'
                  )}
                </button>
              </form>
            </div>
          ) : (
            // NOTE: Non-admins will see this UI state, but even if they force-render the admin controls,
            // the server routes are protected using requireRole('ADMIN') middleware.
            <div className="bg-[#1C1C1F] border border-[#2A2A2E] rounded-xl p-6 shadow-xl flex flex-col items-center justify-center text-center h-48">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#A0A0A6] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h4 className="font-semibold text-[#F2F2F3] text-sm">Access Restricted</h4>
              <p className="text-[#A0A0A6] text-xs mt-1 px-4">Only administrators can invite new members or change team roles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
