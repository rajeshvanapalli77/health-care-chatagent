import React, { useState, useEffect } from 'react';
import { 
  X, Star, ShieldCheck, Filter, Trash2, CheckCircle2, 
  Clock, AlertTriangle, RefreshCw, MessageSquare, Tag, Lock, KeyRound
} from 'lucide-react';

const AdminFeedbackDashboard = ({ isOpen, onClose, apiBaseUrl }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    avg_rating: 0,
    rating_breakdown: {},
    pending_count: 0,
    reviewed_count: 0,
    resolved_count: 0
  });

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [tempNote, setTempNote] = useState('');

  // Default Admin Passcode for instant demo access (can be entered or clicked)
  const ADMIN_PASSCODE = 'admin123';

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode.trim() === ADMIN_PASSCODE || passcode.trim().toLowerCase() === 'admin') {
      setIsAuthenticated(true);
      setAuthError('');
      fetchFeedbacksAndStats();
    } else {
      setAuthError('Invalid Admin Passcode. Try "admin123"');
    }
  };

  const fetchFeedbacksAndStats = async () => {
    setIsLoading(true);
    try {
      let queryParams = new URLSearchParams();
      if (categoryFilter !== 'All') queryParams.append('category', categoryFilter);
      if (statusFilter !== 'All') queryParams.append('status', statusFilter);
      if (ratingFilter > 0) queryParams.append('rating', ratingFilter.toString());

      const [resFeedbacks, resStats] = await Promise.all([
        fetch(`${apiBaseUrl}/api/feedback?${queryParams.toString()}`),
        fetch(`${apiBaseUrl}/api/feedback/stats`)
      ]);

      if (resFeedbacks.ok) {
        const dataF = await resFeedbacks.json();
        setFeedbacks(dataF.feedbacks || []);
      }
      if (resStats.ok) {
        const dataS = await resStats.json();
        setStats(dataS);
      }
    } catch (err) {
      console.error('Error fetching admin feedbacks', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchFeedbacksAndStats();
    }
  }, [isOpen, isAuthenticated, categoryFilter, statusFilter, ratingFilter]);

  const handleUpdateStatus = async (id, newStatus) => {
    setActionLoadingId(id);
    try {
      const response = await fetch(`${apiBaseUrl}/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        await fetchFeedbacksAndStats();
      }
    } catch (err) {
      console.error('Error updating status', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveNote = async (id) => {
    setActionLoadingId(id);
    try {
      const response = await fetch(`${apiBaseUrl}/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: tempNote })
      });
      if (response.ok) {
        setEditingNoteId(null);
        await fetchFeedbacksAndStats();
      }
    } catch (err) {
      console.error('Error saving admin note', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback item?')) return;
    setActionLoadingId(id);
    try {
      const response = await fetch(`${apiBaseUrl}/api/feedback/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchFeedbacksAndStats();
      }
    } catch (err) {
      console.error('Error deleting feedback', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-5xl w-full h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-2xl border border-teal-500/30">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Admin Feedback & Review Portal</span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-extrabold bg-teal-500/20 text-teal-300 rounded-full border border-teal-500/30">
                  LIVE METRICS
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage customer issue reports, ratings, and feedback.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={fetchFeedbacksAndStats}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                title="Refresh Data"
              >
                <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {!isAuthenticated ? (
          /* Authentication Screen */
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
            <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full flex flex-col gap-4 text-center">
              <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <KeyRound size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Admin Authentication Required</h3>
                <p className="text-xs text-slate-500 mt-1">Enter admin passcode to access customer reviews and issue management dashboard.</p>
              </div>

              {authError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                  {authError}
                </div>
              )}

              <div className="text-left">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Passcode</label>
                <input
                  type="password"
                  placeholder="Enter passcode (Default: admin123)"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition-all shadow-md"
                >
                  Unlock Admin Portal
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPasscode('admin123');
                  setIsAuthenticated(true);
                  fetchFeedbacksAndStats();
                }}
                className="text-xs text-teal-600 hover:underline font-semibold mt-1"
              >
                ⚡ Quick Auto-Fill Demo Passcode ("admin123")
              </button>
            </form>
          </div>
        ) : (
          /* Dashboard Main Content */
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 flex flex-col gap-6">
            
            {/* Stat Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Rating</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-extrabold text-slate-800">{stats.avg_rating}</span>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} fill={s <= Math.round(stats.avg_rating) ? '#F59E0B' : 'transparent'} className={s <= Math.round(stats.avg_rating) ? 'text-amber-400' : 'text-slate-300'} />
                    ))}
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 mt-1">out of 5 stars</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Feedbacks</span>
                <div className="text-2xl font-extrabold text-teal-700 mt-2">{stats.total}</div>
                <span className="text-[11px] text-slate-400 mt-1">Submitted by users</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Review</span>
                <div className="text-2xl font-extrabold text-amber-600 mt-2">{stats.pending_count}</div>
                <span className="text-[11px] text-amber-600 font-medium mt-1">Requires admin attention</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resolved Issues</span>
                <div className="text-2xl font-extrabold text-emerald-600 mt-2">{stats.resolved_count}</div>
                <span className="text-[11px] text-emerald-600 font-medium mt-1">Completed & addressed</span>
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Filter size={15} className="text-teal-600" />
                <span>Filters:</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="All">All Categories</option>
                  <option value="General Feedback">General Feedback</option>
                  <option value="Bug Report">Bug / Technical Issue</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Clinical Quality">Clinical Quality</option>
                  <option value="UI / UX Experience">UI / UX Experience</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending Only</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Resolved">Resolved</option>
                </select>

                {/* Rating Filter */}
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(Number(e.target.value))}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value={0}>All Ratings</option>
                  <option value={5}>5 Stars Only</option>
                  <option value={4}>4 Stars Only</option>
                  <option value={3}>3 Stars Only</option>
                  <option value={2}>2 Stars Only</option>
                  <option value={1}>1 Star Only</option>
                </select>
              </div>
            </div>

            {/* Feedback List */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-3">
              {feedbacks.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center text-slate-400 gap-2">
                  <MessageSquare size={36} className="text-slate-300" />
                  <p className="text-sm font-medium">No feedback items match your current filter.</p>
                </div>
              ) : (
                feedbacks.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col gap-3"
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        {/* Rating Stars */}
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={15}
                              fill={s <= item.rating ? '#F59E0B' : 'transparent'}
                              className={s <= item.rating ? 'text-amber-400' : 'text-slate-200'}
                            />
                          ))}
                        </div>

                        {/* Category Badge */}
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                          {item.category}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            item.status === 'Resolved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.status === 'Reviewed'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 font-medium">
                        {new Date(item.created_at * 1000).toLocaleString()}
                      </div>
                    </div>

                    {/* Customer Info & Message */}
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <span>{item.name}</span>
                        {item.email && <span className="text-slate-400 font-normal">({item.email})</span>}
                        {item.session_id && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-mono">
                            Session: {item.session_id.substring(0, 14)}...
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 mt-1.5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                        "{item.message}"
                      </p>
                    </div>

                    {/* Admin Notes Row */}
                    {item.admin_notes && editingNoteId !== item.id && (
                      <div className="text-xs bg-teal-50/60 p-2.5 rounded-xl border border-teal-100 text-teal-900 flex items-start justify-between">
                        <div>
                          <span className="font-bold">Admin Response Note: </span>
                          <span>{item.admin_notes}</span>
                        </div>
                        <button
                          onClick={() => {
                            setEditingNoteId(item.id);
                            setTempNote(item.admin_notes);
                          }}
                          className="text-[11px] text-teal-700 hover:underline font-semibold shrink-0 ml-2"
                        >
                          Edit Note
                        </button>
                      </div>
                    )}

                    {editingNoteId === item.id && (
                      <div className="flex flex-col gap-2">
                        <textarea
                          rows={2}
                          placeholder="Add internal resolution note or customer response..."
                          value={tempNote}
                          onChange={(e) => setTempNote(e.target.value)}
                          className="w-full p-2.5 text-xs rounded-xl border border-teal-300 focus:ring-2 focus:ring-teal-500/20"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="px-3 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveNote(item.id)}
                            className="px-3 py-1 text-xs font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-medium">Update Status:</span>
                        {['Pending', 'Reviewed', 'Resolved'].map((st) => (
                          <button
                            key={st}
                            disabled={actionLoadingId === item.id || item.status === st}
                            onClick={() => handleUpdateStatus(item.id, st)}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                              item.status === st
                                ? 'bg-slate-800 text-white cursor-default'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        {!editingNoteId && !item.admin_notes && (
                          <button
                            onClick={() => {
                              setEditingNoteId(item.id);
                              setTempNote('');
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200"
                          >
                            + Add Note
                          </button>
                        )}
                        <button
                          disabled={actionLoadingId === item.id}
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Feedback"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFeedbackDashboard;
