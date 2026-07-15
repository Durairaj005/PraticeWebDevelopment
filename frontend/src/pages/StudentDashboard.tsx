import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, AlertCircle, CheckCircle2, Clock, Plus, X, Loader2,
  Bell, ChevronDown, ChevronUp, Paperclip, ArrowUpCircle, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ImageLightbox from '../components/ImageLightbox';

interface Attachment {
  file_url: string;
  file_type: string;
}

interface Complaint {
  id: number;
  title: string;
  description: string;
  status: string;
  category: string;
  is_anonymous: boolean;
  is_escalated: boolean;
  escalation_status: string;
  hod_remarks?: string;
  admin_remarks?: string;
  created_at: string;
  updated_at: string;
  attachments?: Attachment[];
}

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/* Helper: status config                                               */
/* ------------------------------------------------------------------ */
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:     { label: 'Pending',     color: 'text-warning',  bg: 'bg-warning/15',  border: 'border-warning/40' },
  in_progress: { label: 'In Progress', color: 'text-primary',  bg: 'bg-primary/15',  border: 'border-primary/40' },
  resolved:    { label: 'Resolved',    color: 'text-success',  bg: 'bg-success/15',  border: 'border-success/40' },
  dismissed:   { label: 'Dismissed',   color: 'text-white/40', bg: 'bg-white/5',     border: 'border-white/10'  },
};

const ESC_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  escalated:    { label: 'Escalated to Admin',     color: 'text-danger',  bg: 'bg-danger/15'  },
  acknowledged: { label: 'Admin Acknowledged',     color: 'text-warning', bg: 'bg-warning/15' },
  cleared:      { label: 'Admin Cleared',          color: 'text-success', bg: 'bg-success/15' },
};

/* ------------------------------------------------------------------ */
/* Progress pipeline steps                                             */
/* ------------------------------------------------------------------ */
const getPipelineSteps = (complaint: Complaint) => {
  const steps = [
    { key: 'submitted',   label: 'Submitted',    done: true },
    { key: 'in_progress', label: 'Under Review', done: complaint.status === 'in_progress' || complaint.status === 'resolved' },
    { key: 'resolved',    label: 'Resolved',     done: complaint.status === 'resolved' },
  ];

  if (complaint.is_escalated) {
    steps.splice(2, 0, {
      key: 'escalated',
      label: ESC_CONFIG[complaint.escalation_status]?.label ?? 'Escalated',
      done: !!complaint.escalation_status && complaint.escalation_status !== 'none',
    });
  }

  return steps;
};

/* ================================================================== */
/* Main Component                                                      */
/* ================================================================== */
const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Academic');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  /* ---- data fetch ---- */
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Use allSettled so a notification 500 never kills the complaints fetch
      const [complaintsRes, notifRes] = await Promise.allSettled([
        api.get('/complaints/me'),
        api.get('/notifications/me'),
      ]);

      if (complaintsRes.status === 'fulfilled') {
        setComplaints(complaintsRes.value.data);
      } else {
        console.error('Failed to fetch complaints:', complaintsRes.reason);
      }

      if (notifRes.status === 'fulfilled') {
        setNotifications(notifRes.value.data);
      } else {
        console.error('Failed to fetch notifications:', notifRes.reason);
      }
    } catch (error) {
      console.error('Unexpected error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  /* ---- notifications ---- */
  const handleMarkAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  /* ---- submit complaint ---- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const res = await api.post('/complaints/', { title, description, category, is_anonymous: isAnonymous });
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        await api.post(`/complaints/${res.data.id}/upload-attachment`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setIsModalOpen(false);
      setTitle(''); setDescription(''); setFile(null); setIsAnonymous(false);
      fetchData();
    } catch (err: any) {
      setSubmitError(err.response?.data?.detail || 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filtered = complaints.filter(c => filterStatus === 'all' || c.status === filterStatus);

  /* ================================================================ */
  /* Render                                                            */
  /* ================================================================ */
  return (
    <div className="min-h-screen bg-slate p-6 md:p-10 relative overflow-hidden">
      {/* Background orb */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

      {/* ---- Header ---- */}
      <header className="flex justify-between items-center mb-10 relative z-50">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Student Dashboard</h1>
          <p className="text-white/60 mt-1">Welcome back, {user?.full_name}</p>
        </div>

        <div className="flex gap-3 items-center relative">
          {/* Notification bell */}
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-white/80 hover:text-white transition-colors"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full right-20 mt-2 w-80 glass-panel p-2 rounded-2xl shadow-xl shadow-black/50 z-50"
              >
                <div className="p-3 border-b border-white/10 flex justify-between items-center">
                  <h4 className="font-semibold text-white">Notifications</h4>
                  <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/60">{unreadCount} new</span>
                </div>
                <div className="max-h-80 overflow-y-auto p-1">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-white/50">No notifications yet.</div>
                  ) : notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                      className={`p-3 rounded-xl mb-1 cursor-pointer transition-colors ${n.is_read ? 'opacity-60 hover:bg-white/5' : 'bg-primary/10 hover:bg-primary/20 border border-primary/20'}`}
                    >
                      <h5 className="text-sm font-medium text-white mb-1">{n.title}</h5>
                      <p className="text-xs text-white/70 line-clamp-2">{n.message}</p>
                      <span className="text-[10px] text-white/40 mt-1 block">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Complaint
          </button>
          <button onClick={logout} className="glass-panel px-4 py-2 text-white/80 hover:text-white transition-colors">
            Logout
          </button>
        </div>
      </header>

      {/* ---- KPI Cards ---- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8 relative z-10">
        {[
          { label: 'Total Submitted', value: complaints.length,                                                  icon: <MessageSquare className="w-6 h-6 text-primary" />,  accent: 'primary' },
          { label: 'Pending',        value: complaints.filter(c => c.status === 'pending').length,              icon: <Clock className="w-6 h-6 text-warning" />,          accent: 'warning' },
          { label: 'In Progress',    value: complaints.filter(c => c.status === 'in_progress').length,          icon: <AlertCircle className="w-6 h-6 text-primary" />,     accent: 'primary' },
          { label: 'Resolved',       value: complaints.filter(c => c.status === 'resolved').length,             icon: <CheckCircle2 className="w-6 h-6 text-success" />,    accent: 'success' },
        ].map((stat, i) => (
          <motion.div key={i} whileHover={{ y: -4 }} className="glass-panel p-5 flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm font-medium">{stat.label}</p>
              <h2 className="text-3xl font-bold text-white mt-1">{stat.value}</h2>
            </div>
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
              {stat.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ---- Submissions List ---- */}
      <div className="glass-panel rounded-2xl overflow-hidden relative z-10">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">Your Submissions</h3>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="input-field w-auto py-1.5 text-sm [&>option]:text-black"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-white/50">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="font-medium">
                {filterStatus === 'all' ? "You haven't submitted any complaints yet." : `No ${filterStatus.replace('_', ' ')} complaints.`}
              </p>
              {filterStatus === 'all' && (
                <button onClick={() => setIsModalOpen(true)} className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4" /> Submit your first complaint
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(complaint => {
                const sc = STATUS_CONFIG[complaint.status] ?? STATUS_CONFIG.pending;
                const isExpanded = expandedId === complaint.id;
                const steps = getPipelineSteps(complaint);

                return (
                  <motion.div
                    key={complaint.id}
                    layout
                    className={`rounded-xl border transition-colors ${sc.border} ${sc.bg} overflow-hidden`}
                  >
                    {/* Card header — always visible */}
                    <div
                      className="p-5 flex items-start justify-between cursor-pointer hover:brightness-110 transition"
                      onClick={() => setExpandedId(isExpanded ? null : complaint.id)}
                    >
                      <div className="flex-1 min-w-0">
                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="bg-white/10 text-white/70 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide">
                            {complaint.category || 'General'}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${sc.bg} ${sc.color} border ${sc.border}`}>
                            {sc.label}
                          </span>
                          {complaint.is_escalated && complaint.escalation_status && complaint.escalation_status !== 'none' && (
                            <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${ESC_CONFIG[complaint.escalation_status]?.bg ?? 'bg-danger/15'} ${ESC_CONFIG[complaint.escalation_status]?.color ?? 'text-danger'}`}>
                              <ShieldAlert className="w-3 h-3" />
                              {ESC_CONFIG[complaint.escalation_status]?.label ?? 'Escalated'}
                            </span>
                          )}
                          {complaint.is_anonymous && (
                            <span className="bg-white/5 text-white/40 px-2.5 py-0.5 rounded-full text-xs">Anonymous</span>
                          )}
                        </div>

                        <h4 className="text-white font-semibold text-base truncate pr-4">{complaint.title}</h4>
                        <p className="text-white/50 text-sm mt-1 line-clamp-1">{complaint.description}</p>

                        {/* Progress pipeline */}
                        <div className="flex items-center gap-1 mt-3 flex-wrap">
                          {steps.map((step, idx) => (
                            <React.Fragment key={step.key}>
                              <div className={`flex items-center gap-1 text-xs font-medium ${step.done ? 'text-success' : 'text-white/30'}`}>
                                {step.done
                                  ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                                  : <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 flex-shrink-0" />
                                }
                                <span className="hidden sm:inline">{step.label}</span>
                              </div>
                              {idx < steps.length - 1 && (
                                <div className={`h-px w-5 rounded flex-shrink-0 ${step.done ? 'bg-success/50' : 'bg-white/10'}`} />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                        <span className="text-xs text-white/40">#{complaint.id}</span>
                        <span className="text-xs text-white/40">{new Date(complaint.created_at).toLocaleDateString()}</span>
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4 text-white/40 mt-1" />
                          : <ChevronDown className="w-4 h-4 text-white/40 mt-1" />
                        }
                      </div>
                    </div>

                    {/* Expanded detail panel */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-white/10 overflow-hidden"
                        >
                          <div className="p-5 space-y-4">
                            {/* Full description */}
                            <div>
                              <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-1">Description</p>
                              <p className="text-white/80 text-sm leading-relaxed">{complaint.description}</p>
                            </div>

                            {/* HOD Remarks */}
                            {complaint.hod_remarks && (
                              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                                <p className="text-xs font-semibold text-primary/80 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5" /> HOD Remarks
                                </p>
                                <p className="text-white/70 text-sm">{complaint.hod_remarks}</p>
                              </div>
                            )}

                            {/* Admin Remarks — shown when escalated and cleared */}
                            {complaint.admin_remarks && (
                              <div className="rounded-xl bg-success/10 border border-success/30 p-4">
                                <p className="text-xs font-semibold text-success uppercase tracking-wide mb-1 flex items-center gap-1.5">
                                  <ShieldAlert className="w-3.5 h-3.5" /> Admin Resolution
                                </p>
                                <p className="text-white/70 text-sm">{complaint.admin_remarks}</p>
                              </div>
                            )}

                            {/* Escalation note if escalated but no admin remarks yet */}
                            {complaint.is_escalated && !complaint.admin_remarks && (
                              <div className="rounded-xl bg-danger/10 border border-danger/20 p-4 flex items-start gap-3">
                                <ArrowUpCircle className="w-5 h-5 text-danger mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-danger">Escalated to Administrator</p>
                                  <p className="text-xs text-white/50 mt-0.5">
                                    {complaint.escalation_status === 'acknowledged'
                                      ? 'The administrator has acknowledged this escalation and is reviewing it.'
                                      : 'Your complaint has been escalated. The admin team will review it shortly.'}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Attachments */}
                            {complaint.attachments && complaint.attachments.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                  <Paperclip className="w-3.5 h-3.5" /> Attachments
                                </p>
                                <div className="flex gap-3 flex-wrap">
                                  {complaint.attachments.map((att, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => setLightboxUrl(att.file_url)}
                                      className="group relative w-24 h-24 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 cursor-pointer"
                                    >
                                      <img src={att.file_url} alt="attachment" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity">
                                        View Full
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Meta */}
                            <div className="flex gap-4 text-xs text-white/30 pt-1">
                              <span>Submitted: {new Date(complaint.created_at).toLocaleString()}</span>
                              <span>Updated: {new Date(complaint.updated_at).toLocaleString()}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ---- Submit Complaint Modal ---- */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate/80 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-lg p-6 rounded-2xl relative my-8"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold text-white mb-1">Submit a Complaint</h2>
              <p className="text-white/50 text-sm mb-6">Your submission will be reviewed by the department HOD.</p>

              {submitError && (
                <div className="bg-danger/20 border border-danger/50 text-danger text-sm rounded-lg p-3 mb-5">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="input-field [&>option]:text-black"
                  >
                    <option>Academic</option>
                    <option>Infrastructure</option>
                    <option>Hostel</option>
                    <option>Faculty</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="input-field"
                    placeholder="Brief summary of the issue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="input-field min-h-[120px] resize-none"
                    placeholder="Provide detailed information about the issue..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Attachment (Optional)</label>
                  <input
                    type="file"
                    onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 transition-colors"
                    accept="image/*"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${isAnonymous ? 'bg-primary' : 'bg-white/20'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isAnonymous ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">Submit anonymously</span>
                </label>

                <div className="flex justify-end gap-4 pt-2">
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
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit'}
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

export default StudentDashboard;
