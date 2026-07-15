import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, UserPlus, Trash2, X, Loader2, BarChart3, PieChart as PieChartIcon, CheckCircle2, AlertCircle, Eye, MessageSquare } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ImageLightbox from '../components/ImageLightbox';

interface SystemUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

const AdminDashboard = () => {
  const { user: currentUser, logout } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'analytics'
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('hod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [complaints, setComplaints] = useState<any[]>([]);

  // Escalation / Clear Problem modal state
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState<any | null>(null);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [usersRes, statsRes, complaintsRes] = await Promise.all([
        api.get('/users/'),
        api.get('/complaints/stats'),
        api.get('/complaints/all')
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
      setComplaints(complaintsRes.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      await api.post('/users/create-staff', {
        full_name: name,
        email,
        password,
        role
      });
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if(window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await api.delete(`/users/${id}`);
        fetchData();
      } catch (error: any) {
        alert(error.response?.data?.detail || "Failed to delete user");
      }
    }
  };

  const filteredUsers = users.filter(u => filter === 'all' || u.role === filter);

  const handleAcknowledge = async (complaint: any) => {
    setIsActionLoading(true);
    try {
      await api.put(`/complaints/${complaint.id}/status`, {
        escalation_status: 'acknowledged',
      });
      fetchData();
    } catch (err) {
      console.error('Failed to acknowledge', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const openClearModal = (complaint: any) => {
    setSelectedEscalation(complaint);
    setAdminRemarks(complaint.admin_remarks || '');
    setClearModalOpen(true);
  };

  const handleClearProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEscalation) return;
    setIsActionLoading(true);
    try {
      await api.put(`/complaints/${selectedEscalation.id}/status`, {
        escalation_status: 'cleared',
        admin_remarks: adminRemarks,
      });
      setClearModalOpen(false);
      setSelectedEscalation(null);
      setAdminRemarks('');
      fetchData();
    } catch (err) {
      console.error('Failed to clear problem', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const escalationStatusBadge = (status: string) => {
    switch (status) {
      case 'escalated':
        return <span className="bg-danger/20 text-danger px-2 py-1 rounded text-xs font-semibold uppercase">Escalated</span>;
      case 'acknowledged':
        return <span className="bg-warning/20 text-warning px-2 py-1 rounded text-xs font-semibold uppercase">Acknowledged</span>;
      case 'cleared':
        return <span className="bg-success/20 text-success px-2 py-1 rounded text-xs font-semibold uppercase">Cleared</span>;
      default:
        return <span className="bg-white/10 text-white/50 px-2 py-1 rounded text-xs font-semibold uppercase">{status}</span>;
    }
  };
  
  const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-slate p-6 md:p-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-danger/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Header */}
      <header className="flex justify-between items-center mb-12 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" /> Admin Control Panel
          </h1>
          <p className="text-white/60 mt-1">System Administration & Access Control</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-panel p-1 rounded-xl flex">
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${activeTab === 'users' ? 'bg-primary/20 text-primary' : 'text-white/60 hover:text-white'}`}
            >
              Directory
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-secondary/20 text-secondary' : 'text-white/60 hover:text-white'}`}
            >
              <BarChart3 className="w-4 h-4" /> Analytics
            </button>
            <button 
              onClick={() => setActiveTab('escalations')}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${activeTab === 'escalations' ? 'bg-danger/20 text-danger' : 'text-white/60 hover:text-white'}`}
            >
              <AlertCircle className="w-4 h-4" /> Escalations
            </button>
          </div>
          
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Add Staff
          </button>
          <button onClick={logout} className="glass-panel px-4 py-2 text-white/80 hover:text-white transition-colors">
            Logout
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 relative z-10">
        {[
          { label: 'Total Users', value: users.length, icon: <Users className="text-primary w-6 h-6"/> },
          { label: 'Students', value: users.filter(u => u.role === 'student').length, icon: <Users className="text-white/60 w-6 h-6"/> },
          { label: 'Total Complaints', value: stats?.total || 0, icon: <PieChartIcon className="text-warning w-6 h-6"/> },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, icon: <Shield className="text-danger w-6 h-6"/> },
        ].map((stat, i) => (
          <motion.div key={i} whileHover={{ y: -5 }} className="glass-panel p-6 flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm font-medium">{stat.label}</p>
              <h2 className="text-2xl font-bold text-white mt-1">{stat.value}</h2>
            </div>
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
              {stat.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {activeTab === 'users' ? (
        <div className="glass-panel rounded-2xl overflow-hidden relative z-10 flex flex-col min-h-[500px]">
          {/* Users Table */}
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">User Directory</h3>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field w-auto py-1.5 [&>option]:text-black"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="hod">HODs</option>
              <option value="admin">Admins</option>
            </select>
          </div>


        <div className="flex-1 p-6">
          {isLoading ? (
            <div className="h-full flex justify-center items-center">
               <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 text-sm">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 text-white/80">#{u.id}</td>
                      <td className="py-4 text-white font-medium">{u.full_name}</td>
                      <td className="py-4 text-white/60">{u.email}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
                          u.role === 'admin' ? 'bg-danger/20 text-danger' :
                          u.role === 'hod' ? 'bg-warning/20 text-warning' :
                          'bg-primary/20 text-primary'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4">
                        {u.is_active ? 
                           <span className="text-success text-sm flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Active</span> :
                           <span className="text-white/40 text-sm">Inactive</span>
                        }
                      </td>
                      <td className="py-4">
                        {u.id !== currentUser?.id && (
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-danger hover:text-danger/80 transition-colors p-2 hover:bg-danger/10 rounded-lg"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      ) : activeTab === 'analytics' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
          <div className="glass-panel p-6 rounded-2xl h-[400px]">
            <h3 className="text-xl font-semibold text-white mb-6">Complaint Status Distribution</h3>
            {stats && stats.status_distribution ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.status_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats.status_distribution.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-white/50">Loading data...</div>
            )}
          </div>
          
          <div className="glass-panel p-6 rounded-2xl h-[400px]">
             <h3 className="text-xl font-semibold text-white mb-6">Complaints by Category</h3>
             {stats && stats.category_distribution ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={stats.category_distribution}>
                   <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                   <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                   <YAxis stroke="rgba(255,255,255,0.5)" />
                   <RechartsTooltip 
                     contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                     cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                   />
                   <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             ) : (
               <div className="flex h-full items-center justify-center text-white/50">Loading data...</div>
             )}
          </div>

          <div className="glass-panel p-6 rounded-2xl h-[400px] lg:col-span-2">
             <h3 className="text-xl font-semibold text-white mb-6">Monthly Trend</h3>
             {stats && stats.trend_data ? (
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={stats.trend_data}>
                   <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                   <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                   <YAxis stroke="rgba(255,255,255,0.5)" />
                   <RechartsTooltip 
                     contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                   />
                   <Line type="monotone" dataKey="complaints" stroke="#10b981" strokeWidth={3} dot={{ r: 6, fill: '#10b981', strokeWidth: 0 }} />
                 </LineChart>
               </ResponsiveContainer>
             ) : (
               <div className="flex h-full items-center justify-center text-white/50">Loading data...</div>
             )}
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden relative z-10 flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-white">Escalated Complaints</h3>
              <p className="text-sm text-white/60 mt-1">Issues escalated by Department HODs requiring Admin intervention.</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="bg-danger/20 text-danger px-2 py-1 rounded font-semibold">Escalated</span>
              <span className="bg-warning/20 text-warning px-2 py-1 rounded font-semibold">Acknowledged</span>
              <span className="bg-success/20 text-success px-2 py-1 rounded font-semibold">Cleared</span>
            </div>
          </div>
          <div className="flex-1 p-6">
            {isLoading ? (
              <div className="h-full flex justify-center items-center">
                 <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50 text-sm">
                      <th className="pb-3 font-medium">ID</th>
                      <th className="pb-3 font-medium">Title</th>
                      <th className="pb-3 font-medium">Escalation Status</th>
                      <th className="pb-3 font-medium">HOD Remarks</th>
                      <th className="pb-3 font-medium">Admin Remarks</th>
                      <th className="pb-3 font-medium">Evidence</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.filter(c => c.is_escalated).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-white/50">No escalated complaints at this time.</td>
                      </tr>
                    ) : complaints.filter(c => c.is_escalated).map((c) => (
                      <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 text-white/80">#{c.id}</td>
                        <td className="py-4 text-white font-medium max-w-[150px] truncate" title={c.title}>{c.title}</td>
                        <td className="py-4">{escalationStatusBadge(c.escalation_status || 'escalated')}</td>
                        <td className="py-4 text-white/70 text-sm max-w-[130px] truncate" title={c.hod_remarks || ''}>
                          {c.hod_remarks || <span className="text-white/30 italic">None</span>}
                        </td>
                        <td className="py-4 text-white/70 text-sm max-w-[130px] truncate" title={c.admin_remarks || ''}>
                          {c.admin_remarks || <span className="text-white/30 italic">None</span>}
                        </td>
                        <td className="py-4">
                          {c.attachments && c.attachments.length > 0 ? (
                            <div className="flex gap-2 flex-wrap">
                              {c.attachments.map((att: any, idx: number) => (
                                <div key={idx} className="w-8 h-8 rounded overflow-hidden cursor-pointer border border-white/10 hover:border-white/50 transition-colors shrink-0" onClick={() => setLightboxUrl(att.file_url)}>
                                  <img src={att.file_url} alt="Evidence" className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-white/30 italic text-sm">None</span>
                          )}
                        </td>
                        <td className="py-4">
                          <div className="flex gap-2 flex-wrap">
                            {c.escalation_status !== 'acknowledged' && c.escalation_status !== 'cleared' && (
                              <button
                                onClick={() => handleAcknowledge(c)}
                                disabled={isActionLoading}
                                title="Mark as acknowledged"
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-warning/20 text-warning hover:bg-warning/30 transition-colors disabled:opacity-50"
                              >
                                <Eye className="w-3.5 h-3.5" /> Acknowledge
                              </button>
                            )}
                            {c.escalation_status !== 'cleared' && (
                              <button
                                onClick={() => openClearModal(c)}
                                disabled={isActionLoading}
                                title="Clear problem and notify HOD"
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-success/20 text-success hover:bg-success/30 transition-colors disabled:opacity-50"
                              >
                                <MessageSquare className="w-3.5 h-3.5" /> Clear Problem
                              </button>
                            )}
                            {c.escalation_status === 'cleared' && (
                              <span className="text-success/70 text-xs italic flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clear Problem Modal */}
      <AnimatePresence>
        {clearModalOpen && selectedEscalation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-lg p-6 rounded-2xl relative"
            >
              <button
                onClick={() => { setClearModalOpen(false); setSelectedEscalation(null); }}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Clear Problem</h2>
                  <p className="text-white/50 text-xs">Complaint #{selectedEscalation.id}</p>
                </div>
              </div>

              <div className="mt-4 mb-5 p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm font-semibold text-white mb-1">{selectedEscalation.title}</p>
                {selectedEscalation.hod_remarks && (
                  <p className="text-xs text-white/50">
                    <span className="text-white/70 font-medium">HOD Remarks:</span> {selectedEscalation.hod_remarks}
                  </p>
                )}
              </div>

              <p className="text-white/60 text-sm mb-5">
                Provide your resolution remarks. These will be visible to the HOD so they can take final action on this complaint.
              </p>

              <form onSubmit={handleClearProblem} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Admin Resolution Remarks <span className="text-danger">*</span>
                  </label>
                  <textarea
                    value={adminRemarks}
                    onChange={(e) => setAdminRemarks(e.target.value)}
                    className="input-field min-h-[100px]"
                    placeholder="Describe the action taken or resolution provided..."
                    required
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => { setClearModalOpen(false); setSelectedEscalation(null); }}
                    className="px-6 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isActionLoading || !adminRemarks.trim()}
                    className="btn-primary min-w-[140px] flex justify-center items-center gap-2 disabled:opacity-60"
                  >
                    {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Mark as Cleared</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-lg p-6 rounded-2xl relative"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl font-bold text-white mb-2">Provision Staff Account</h2>
              <p className="text-white/60 mb-6 text-sm">Create a new HOD or Admin user.</p>
              
              {error && (
                <div className="bg-danger/20 border border-danger/50 text-danger text-sm rounded-lg p-3 mb-6 text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateStaff} className="space-y-5">
                 <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Role</label>
                  <select 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                    className="input-field [&>option]:text-black"
                  >
                    <option value="hod">Head of Department (HOD)</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field" 
                    required 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field" 
                    required 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Temporary Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field" 
                    required 
                  />
                </div>

                <div className="flex justify-end gap-4 mt-8">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="btn-primary min-w-[120px] flex justify-center"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ImageLightbox 
        isOpen={!!lightboxUrl} 
        imageUrl={lightboxUrl} 
        onClose={() => setLightboxUrl(null)} 
      />
    </div>
  );
};

export default AdminDashboard;
