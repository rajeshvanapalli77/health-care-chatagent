import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Stethoscope, Heart, Thermometer, ShieldAlert, Sparkles, Send } from 'lucide-react';

const SymptomCheckerModal = ({ isOpen, onClose, onSendAssessment }) => {
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [severity, setSeverity] = useState(4);
  const [durationDays, setDurationDays] = useState('2');
  const [feverTemp, setFeverTemp] = useState('98.6');
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [heartRate, setHeartRate] = useState('72');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [notes, setNotes] = useState('');

  const symptomsList = [
    { id: 'fever', label: 'Fever / Chills', category: 'general' },
    { id: 'fatigue', label: 'Fatigue & Body Pain', category: 'general' },
    { id: 'cough', label: 'Cough / Dry Throat', category: 'respiratory' },
    { id: 'breathless', label: 'Shortness of Breath', category: 'respiratory' },
    { id: 'headache', label: 'Headache / Migraine', category: 'neurological' },
    { id: 'dizziness', label: 'Dizziness & Lightheadedness', category: 'neurological' },
    { id: 'stomach', label: 'Abdominal Pain / Nausea', category: 'digestive' },
    { id: 'chest_pain', label: 'Chest Tightness', category: 'cardiac' }
  ];

  const toggleSymptom = (id) => {
    if (selectedSymptoms.includes(id)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== id));
    } else {
      setSelectedSymptoms([...selectedSymptoms, id]);
    }
  };

  const handleGenerateAssessment = (e) => {
    e.preventDefault();
    const symptomsText = selectedSymptoms.map(id => symptomsList.find(s => s.id === id)?.label).join(', ');
    
    let triageLevel = 'Low Risk';
    let triageColor = 'text-emerald-600 bg-emerald-50';

    if (selectedSymptoms.includes('chest_pain') || selectedSymptoms.includes('breathless') || severity >= 8) {
      triageLevel = 'Critical / Urgent Care Needed';
      triageColor = 'text-rose-600 bg-rose-50';
    } else if (severity >= 5 || parseFloat(feverTemp) > 101) {
      triageLevel = 'Moderate Risk';
      triageColor = 'text-amber-600 bg-amber-50';
    }

    const clinicalPrompt = 
      `[AI Vitals & Symptom Assessment]\n` +
      `• Primary Symptoms: ${symptomsText || 'General symptom evaluation'}\n` +
      `• Pain/Severity Rating: ${severity}/10\n` +
      `• Symptom Duration: ${durationDays} days\n` +
      `• Recorded Vitals: Temp: ${feverTemp}°F | BP: ${bloodPressure} | HR: ${heartRate} bpm\n` +
      `• Initial Triage Risk: ${triageLevel}\n` +
      `• Patient Notes: ${notes || 'None provided'}\n\n` +
      `Please provide a thorough clinical analysis, potential cause evaluation, home remedies, warning signs, and doctor guidance.`;

    onSendAssessment(clinicalPrompt);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/10 border border-white/20 text-teal-300">
                <Stethoscope size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                  <span>AI Symptom & Vitals Checker</span>
                  <span className="px-2 py-0.5 text-[10px] bg-teal-500/30 text-teal-200 font-extrabold rounded-full border border-teal-400/30 uppercase">Enterprise</span>
                </h3>
                <p className="text-xs text-teal-100/80">Guided Clinical Vitals & Symptom Triage Assessment</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-teal-200 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleGenerateAssessment} className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
            {/* Symptoms Selection Grid */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Select Active Symptoms:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {symptomsList.map((item) => {
                  const isSelected = selectedSymptoms.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleSymptom(item.id)}
                      className={`p-2.5 text-left rounded-xl border text-xs font-semibold transition-all ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50 text-teal-900 shadow-2xs'
                          : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Severity Slider & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Discomfort / Severity</label>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                    {severity} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={severity}
                  onChange={(e) => setSeverity(parseInt(e.target.value))}
                  className="w-full accent-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>
            </div>

            {/* Vitals Recording Grid */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Patient Vitals (Optional):
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl border border-slate-200 bg-white flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-amber-600 text-xs font-bold">
                    <Thermometer size={14} /> Temp (°F)
                  </div>
                  <input
                    type="text"
                    value={feverTemp}
                    onChange={(e) => setFeverTemp(e.target.value)}
                    className="w-full font-extrabold text-slate-800 text-sm outline-none"
                  />
                </div>

                <div className="p-3 rounded-2xl border border-slate-200 bg-white flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-rose-600 text-xs font-bold">
                    <Heart size={14} /> BP (mmHg)
                  </div>
                  <input
                    type="text"
                    value={bloodPressure}
                    onChange={(e) => setBloodPressure(e.target.value)}
                    className="w-full font-extrabold text-slate-800 text-sm outline-none"
                  />
                </div>

                <div className="p-3 rounded-2xl border border-slate-200 bg-white flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-teal-600 text-xs font-bold">
                    <Activity size={14} /> Heart Rate
                  </div>
                  <input
                    type="text"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    className="w-full font-extrabold text-slate-800 text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Patient Additional Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Additional Notes / History:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Diuretic allergy, diabetic, symptoms get worse at night..."
                rows={2}
                className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            {/* Submit Assessment Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold rounded-2xl shadow-md transition-all text-sm flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <Sparkles size={16} />
              <span>Run AI Triage & Clinical Assessment</span>
              <Send size={16} />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SymptomCheckerModal;
