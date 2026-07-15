import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Clock, AlertCircle, CheckCircle2, X, Loader2, Lock, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ImageLightbox from '../components/ImageLightbox';

interface Complaint {
  id: number;
  student_id: number;
  title: string;
  description: string;
  status: string;
  category: string;
  created_at: string;
  hod_remarks?: string;
  is_escalated?: boolean;
  escalation_status?: string;
  admin_remarks?: string;
  attachments?: { file_url: string; file_type: string }[];
}

const HODDashboard = () => {
  const { logout } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [filter, setFilter] = useState('all');

  const [hodRemarks, setHodRemarks] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/complaints/all');
      setComplaints(response.data);
    } catch (error) {
      console.error("Failed to fetch complaints", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSelectComplaint = async (complaint: Complaint) => {
    // Always fetch fresh data from server when opening the modal
    setIsAiLoading(true);
    setAiAnalysis(null);
    try {
      // Get fresh complaint data + AI analysis in parallel
      const [freshRes, analysisRes] = await Promise.allSettled([
        api.get(`/complaints/all`),
        api.get(`/complaints/${complaint.id}/analysis`),
      ]);

      // Use fresh complaint data from the full list
      if (freshRes.status === 'fulfilled') {
        const fresh = freshRes.value.data.find((c: Complaint) => c.id === complaint.id);
        setSelectedComplaint(fresh ?? complaint);
        setHodRemarks(fresh?.hod_remarks ?? complaint.hod_remarks ?? '');
      } else {
        setSelectedComplaint(complaint);
        setHodRemarks(complaint.hod_remarks || '');
      }

      if (analysisRes.status === 'fulfilled') {
        setAiAnalysis(analysisRes.value.data);
      }
    } catch (error) {
      console.error("Failed to fetch complaint detail", error);
      setSelectedComplaint(complaint);
      setHodRemarks(complaint.hod_remarks || '');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAction = async (actionData: any) => {
    if (!selectedComplaint) return;
    setIsUpdating(true);
    try {
      const res = await api.put(`/complaints/${selectedComplaint.id}/status`, actionData);
      // If we just changed status to resolved, close the modal and refresh
      if (actionData.status === 'resolved') {
        setSelectedComplaint(null);
      } else {
        // Keep modal open but update complaint with fresh data from server
        setSelectedComplaint(res.data);
      }
      fetchComplaints();
    } catch (error) {
      console.error("Failed to update complaint", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredComplaints = complaints.filter(c => filter === 'all' || c.status === filter);

  return (
    <div className="min-h-screen bg-slate p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Header */}
      <header className="flex justify-between items-center mb-12 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">HOD Dashboard</h1>
          <p className="text-white/60 mt-1">Department Oversight & Resolution</p>
        </div>
        <button onClick={logout} className="glass-panel px-4 py-2 text-white/80 hover:text-white transition-colors">
          Logout
        </button>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 relative z-10">
        {[
          { label: 'Total Complaints', value: complaints.length, icon: <Filter className="text-primary w-6 h-6"/> },
          { label: 'Pending', value: complaints.filter(c => c.status === 'pending').length, icon: <Clock className="text-warning w-6 h-6"/> },
          { label: 'In Progress', value: complaints.filter(c => c.status === 'in_progress').length, icon: <AlertCircle className="text-primary w-6 h-6"/> },
          { label: 'Resolved', value: complaints.filter(c => c.status === 'resolved').length, icon: <CheckCircle2 className="text-success w-6 h-6"/> },
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

      {/* Management Table */}
      <div className="glass-panel rounded-2xl overflow-hidden relative z-10 flex flex-col min-h-[500px]">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">Complaint Management</h3>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field w-auto py-1.5 [&>option]:text-black"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="flex-1 p-6">
          {isLoading ? (
            <div className="h-full flex justify-center items-center">
               <Loader2 className="w-8 h-8 text-secondary animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 text-sm">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Title</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.map((c) => (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 text-white/80">#{c.id}</td>
                      <td className="py-4 text-white font-medium">{c.title}</td>
                      <td className="py-4">
                        <span className="bg-white/10 px-2 py-1 rounded text-xs text-white/80">{c.category || 'General'}</span>
                      </td>
                      <td className="py-4 text-white/60 text-sm">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
                          c.status === 'resolved' ? 'bg-success/20 text-success' :
                          c.status === 'in_progress' ? 'bg-primary/20 text-primary' :
                          'bg-warning/20 text-warning'
                        }`}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4">
                        <button 
                          onClick={() => handleSelectComplaint(c)}
                          className="text-sm text-secondary hover:text-secondary/80 font-medium"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      <AnimatePresence>
        {selectedComplaint && (
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
                onClick={() => setSelectedComplaint(null)}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-3 mb-4 mt-2">
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs text-white/80 uppercase tracking-wide">
                  {selectedComplaint.category || 'General'}
                </span>
                <span className="text-white/40 text-sm">{new Date(selectedComplaint.created_at).toLocaleDateString()}</span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">{selectedComplaint.title}</h2>
              <p className="text-white/70 mb-6 bg-white/5 p-4 rounded-xl min-h-[100px]">
                {selectedComplaint.description}
              </p>

              {/* Attachments Section */}
              {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-white/80 mb-3">Attachments</h4>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {selectedComplaint.attachments.map((att, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden flex-shrink-0 w-32 h-32 border border-white/10 cursor-pointer" onClick={() => setLightboxUrl(att.file_url)}>
                        <img 
                          src={att.file_url} 
                          alt="Attachment" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div 
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold"
                        >
                          View Full
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Analysis Section */}
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> AI Analysis
                </h4>
                {isAiLoading ? (
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Analyzing complaint...
                  </div>
                ) : aiAnalysis ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                        aiAnalysis.priority === 'critical' ? 'bg-danger text-white animate-pulse' :
                        aiAnalysis.priority === 'high' ? 'bg-warning/20 text-warning' :
                        'bg-white/10 text-white/70'
                      }`}>
                        Priority: {aiAnalysis.priority}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-semibold uppercase bg-white/10 text-white/70">
                        Sentiment: {aiAnalysis.sentiment}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-semibold uppercase bg-white/10 text-white/70">
                        Emotion: {aiAnalysis.emotion}
                      </span>
                    </div>
                    <div>
                       <p className="text-sm text-white/80"><span className="font-medium text-white">Suggested Action:</span> {aiAnalysis.recommended_action}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white/50">AI Analysis not available.</p>
                )}
              </div>

              <div className="border-t border-white/10 pt-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-white/80 mb-2">HOD Remarks</label>
                  <textarea 
                    value={hodRemarks}
                    onChange={(e) => setHodRemarks(e.target.value)}
                    className="input-field min-h-[80px]"
                    placeholder="Add your internal notes or remarks here..."
                  />
                </div>

                {/* Admin Clearance Panel — shown when admin has cleared the escalation */}
                {selectedComplaint.escalation_status === 'cleared' && selectedComplaint.admin_remarks && (
                  <div className="mb-4 p-4 rounded-xl bg-success/10 border border-success/30">
                    <h4 className="text-sm font-semibold text-success mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Admin Clearance Received
                    </h4>
                    <p className="text-sm text-white/80">{selectedComplaint.admin_remarks}</p>
                    <p className="text-xs text-white/40 mt-2">You can now mark this complaint as Resolved.</p>
                  </div>
                )}

                {/* Pending admin acknowledgment banner */}
                {selectedComplaint.is_escalated && selectedComplaint.escalation_status === 'acknowledged' && (
                  <div className="mb-4 p-4 rounded-xl bg-warning/10 border border-warning/30">
                    <p className="text-sm text-warning flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-warning animate-pulse inline-block" />
                      Admin has acknowledged this escalation. Awaiting resolution remarks.
                    </p>
                  </div>
                )}

                {/* Pending admin action banner */}
                {selectedComplaint.is_escalated && (!selectedComplaint.escalation_status || selectedComplaint.escalation_status === 'escalated') && (
                  <div className="mb-4 p-4 rounded-xl bg-danger/10 border border-danger/30">
                    <p className="text-sm text-danger/80 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-danger animate-pulse inline-block" />
                      This complaint is escalated. Waiting for Admin to take action.
                    </p>
                  </div>
                )}
                
                <p className="text-sm font-medium text-white/60 mb-3">Update Resolution Status & Actions</p>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleAction({ status: 'pending', hod_remarks: hodRemarks })}
                      disabled={isUpdating || selectedComplaint.status === 'pending'}
                      className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${selectedComplaint.status === 'pending' ? 'bg-warning/20 text-warning border border-warning/50' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                    >
                      Pending
                    </button>
                    <button 
                      onClick={() => handleAction({ status: 'in_progress', hod_remarks: hodRemarks })}
                      disabled={isUpdating || selectedComplaint.status === 'in_progress'}
                      className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${selectedComplaint.status === 'in_progress' ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                    >
                      In Progress
                    </button>

                    {/* Resolve button — locked when escalated and not yet cleared */}
                    {(() => {
                      const isEscalatedAndNotCleared =
                        selectedComplaint.is_escalated &&
                        selectedComplaint.escalation_status !== 'cleared';
                      const isAlreadyResolved = selectedComplaint.status === 'resolved';

                      return (
                        <div className="flex-1 relative group">
                          <button
                            onClick={() => !isEscalatedAndNotCleared && !isAlreadyResolved && handleAction({ status: 'resolved', hod_remarks: hodRemarks })}
                            disabled={isUpdating || isAlreadyResolved || isEscalatedAndNotCleared}
                            className={`w-full py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-1.5 ${
                              isAlreadyResolved
                                ? 'bg-success/20 text-success border border-success/50 cursor-default'
                                : isEscalatedAndNotCleared
                                ? 'bg-white/5 text-white/25 border border-white/10 cursor-not-allowed'
                                : 'bg-white/5 text-white/60 hover:bg-success/20 hover:text-success border border-transparent'
                            }`}
                          >
                            {isEscalatedAndNotCleared
                              ? <><Lock className="w-3.5 h-3.5" /> Resolved</>
                              : 'Resolved'
                            }
                          </button>
                          {/* Tooltip for locked state */}
                          {isEscalatedAndNotCleared && (
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 bg-black/90 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 text-center">
                              Locked — waiting for Admin to clear this escalation first
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  
                  <button 
                    onClick={() => handleAction({ is_escalated: true, escalation_status: 'escalated', hod_remarks: hodRemarks })}
                    disabled={isUpdating || !!selectedComplaint.is_escalated}
                    className={`w-full py-2 mt-2 rounded-lg font-medium text-sm transition-colors border flex items-center justify-center gap-2 ${
                      selectedComplaint.is_escalated
                        ? 'bg-danger/10 text-danger/60 border-danger/30 cursor-not-allowed'
                        : 'bg-danger hover:bg-danger/90 text-white border-transparent'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    {selectedComplaint.is_escalated ? `Already Escalated (${selectedComplaint.escalation_status || 'escalated'})` : 'Escalate to Admin'}
                  </button>
                </div>
              </div>
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

export default HODDashboard;
