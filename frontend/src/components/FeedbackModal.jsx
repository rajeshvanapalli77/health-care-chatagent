import React, { useState } from 'react';
import { Star, X, Send, CheckCircle2, AlertCircle, MessageSquare, HeartHandshake } from 'lucide-react';

const CATEGORIES = [
  { id: 'General Feedback', label: 'General Feedback', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'Bug Report', label: 'Bug / Technical Issue', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'Feature Request', label: 'Feature Request', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'Clinical Quality', label: 'Clinical Advice Quality', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { id: 'UI / UX Experience', label: 'UI / App Experience', color: 'bg-amber-50 text-amber-700 border-amber-200' },
];

const FeedbackModal = ({ isOpen, onClose, sessionId, apiBaseUrl }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('General Feedback');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg('Please describe your feedback or problem.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'Anonymous Patient',
          email: email.trim(),
          rating,
          category,
          message: message.trim(),
          session_id: sessionId || ''
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          // Reset form after delay
          setSuccess(false);
          setMessage('');
          setName('');
          setEmail('');
          setRating(5);
          onClose();
        }, 2200);
      } else {
        setErrorMsg(data.detail || 'Failed to submit feedback. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Network error. Unable to connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 relative transition-all">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-md">
              <HeartHandshake size={24} className="text-teal-100" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Customer Feedback & Reviews</h2>
              <p className="text-xs text-teal-100/90 mt-0.5">Share your experience or report an issue directly to our team.</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        {success ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Thank You for Your Feedback!</h3>
            <p className="text-sm text-slate-500 max-w-xs">
              Your feedback has been received and sent to our admin team to help us continuously improve.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
            
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Rating Stars */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Overall Experience Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-amber-400 focus:outline-hidden transition-transform active:scale-95"
                  >
                    <Star
                      size={28}
                      fill={(hoverRating || rating) >= star ? '#F59E0B' : 'transparent'}
                      className={(hoverRating || rating) >= star ? 'text-amber-400' : 'text-slate-300'}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  {rating === 5 ? '5/5 Excellent' : rating === 4 ? '4/5 Good' : rating === 3 ? '3/5 Average' : rating === 2 ? '2/5 Below Expectation' : '1/5 Poor'}
                </span>
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Feedback Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      category === cat.id
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name & Email (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Your Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh V."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-hidden transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Message / Feedback Details */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Your Feedback or Issue Details <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Describe any issues you faced, suggestions for improvement, or what you liked..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-hidden transition-all resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white text-xs font-bold rounded-xl shadow-md hover:from-teal-700 hover:to-teal-800 transition-all disabled:opacity-50 active:scale-95"
              >
                {isSubmitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Submit Feedback</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
