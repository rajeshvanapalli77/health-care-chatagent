import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Calculator, Droplets, PhoneCall, HeartPulse, ShieldAlert } from 'lucide-react';

const HealthToolsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('bmi');

  // BMI Calculator State
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmiResult, setBmiResult] = useState(null);

  // Water Intake Calculator State
  const [weightKg, setWeightKg] = useState('');
  const [activityMinutes, setActivityMinutes] = useState('30');
  const [waterResult, setWaterResult] = useState(null);

  const calculateBMI = (e) => {
    e.preventDefault();
    const hM = parseFloat(height) / 100;
    const wKg = parseFloat(weight);
    if (!hM || !wKg || hM <= 0 || wKg <= 0) return;

    const bmi = (wKg / (hM * hM)).toFixed(1);
    let category = '';
    let color = '';
    let advice = '';

    if (bmi < 18.5) {
      category = 'Underweight';
      color = 'text-amber-600 bg-amber-50 border-amber-200';
      advice = 'Consider a balanced, nutrient-dense diet and consult a nutritionist.';
    } else if (bmi < 24.9) {
      category = 'Normal Weight';
      color = 'text-emerald-600 bg-emerald-50 border-emerald-200';
      advice = 'Great job! Maintain your healthy lifestyle with regular exercise and hydration.';
    } else if (bmi < 29.9) {
      category = 'Overweight';
      color = 'text-orange-600 bg-orange-50 border-orange-200';
      advice = 'Focus on portion control, daily physical activity, and whole foods.';
    } else {
      category = 'Obese';
      color = 'text-rose-600 bg-rose-50 border-rose-200';
      advice = 'Consult a healthcare professional for a personalized wellness and diet plan.';
    }

    setBmiResult({ bmi, category, color, advice });
  };

  const calculateWater = (e) => {
    e.preventDefault();
    const w = parseFloat(weightKg);
    const act = parseFloat(activityMinutes) || 0;
    if (!w || w <= 0) return;

    const baseLiters = (w * 0.035) + (act * 0.012);
    const liters = baseLiters.toFixed(1);
    const glasses = Math.round(baseLiters * 4);

    setWaterResult({ liters, glasses });
  };

  const emergencyContacts = [
    { title: 'National Emergency Number', number: '112', desc: 'All-in-one emergency response (India / Intl)', icon: ShieldAlert, color: 'text-rose-600 bg-rose-50' },
    { title: 'Ambulance Service', number: '108 / 102', desc: 'Immediate medical dispatch & trauma assistance', icon: PhoneCall, color: 'text-amber-600 bg-amber-50' },
    { title: 'Disaster & Medical Helpline', number: '1078', desc: 'National disaster management and rescue hotline', icon: HeartPulse, color: 'text-teal-600 bg-teal-50' },
    { title: 'Poison Control Center', number: '1800-116-117', desc: 'Toll-free national poison information center', icon: Activity, color: 'text-purple-600 bg-purple-50' },
  ];

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
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Advanced Health Tools</h3>
                <p className="text-xs text-slate-400">Clinical Calculators & Quick Emergency Directory</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-3 gap-2">
            <button
              onClick={() => setActiveTab('bmi')}
              className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs rounded-t-xl transition-all border-b-2 ${
                activeTab === 'bmi'
                  ? 'border-teal-600 text-teal-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Calculator size={15} />
              BMI Calculator
            </button>
            <button
              onClick={() => setActiveTab('water')}
              className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs rounded-t-xl transition-all border-b-2 ${
                activeTab === 'water'
                  ? 'border-teal-600 text-teal-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Droplets size={15} />
              Hydration Estimator
            </button>
            <button
              onClick={() => setActiveTab('emergency')}
              className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs rounded-t-xl transition-all border-b-2 ${
                activeTab === 'emergency'
                  ? 'border-rose-600 text-rose-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <PhoneCall size={15} />
              Emergency Hotlines
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {activeTab === 'bmi' && (
              <form onSubmit={calculateBMI} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Height (cm)</label>
                    <input
                      type="number"
                      placeholder="e.g. 175"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Weight (kg)</label>
                    <input
                      type="number"
                      placeholder="e.g. 70"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-all text-sm mt-1"
                >
                  Calculate Body Mass Index (BMI)
                </button>

                {bmiResult && (
                  <div className={`mt-3 p-4 rounded-2xl border ${bmiResult.color} flex flex-col gap-2`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider">Result Category</span>
                      <span className="text-2xl font-extrabold">{bmiResult.bmi} kg/m²</span>
                    </div>
                    <div className="font-bold text-base">{bmiResult.category}</div>
                    <p className="text-xs opacity-90 leading-relaxed">{bmiResult.advice}</p>
                  </div>
                )}
              </form>
            )}

            {activeTab === 'water' && (
              <form onSubmit={calculateWater} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Body Weight (kg)</label>
                    <input
                      type="number"
                      placeholder="e.g. 68"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Daily Exercise (Minutes)</label>
                    <input
                      type="number"
                      placeholder="e.g. 45"
                      value={activityMinutes}
                      onChange={(e) => setActivityMinutes(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-all text-sm mt-1"
                >
                  Estimate Daily Water Goal
                </button>

                {waterResult && (
                  <div className="mt-3 p-4 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-900 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-700">Daily Water Target</span>
                      <span className="text-2xl font-extrabold text-cyan-700">{waterResult.liters} Liters</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-cyan-800">
                      <Droplets size={16} className="text-cyan-600" />
                      <span>Equivalent to approx <strong>{waterResult.glasses} glasses</strong> (250ml each) daily.</span>
                    </div>
                  </div>
                )}
              </form>
            )}

            {activeTab === 'emergency' && (
              <div className="flex flex-col gap-3">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert size={18} className="text-rose-600 shrink-0" />
                  <span>If experiencing severe chest pain, shortness of breath, or sudden collapse, call emergency services immediately!</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  {emergencyContacts.map((contact, idx) => {
                    const Icon = contact.icon;
                    return (
                      <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-3">
                        <div className="flex items-start justify-between">
                          <div className={`p-2.5 rounded-xl ${contact.color}`}>
                            <Icon size={18} />
                          </div>
                          <span className="text-sm font-extrabold text-slate-900 px-2.5 py-1 bg-white rounded-lg border border-slate-200 shadow-2xs">
                            {contact.number}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{contact.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{contact.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default HealthToolsModal;
