import React, { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import InputBox from './InputBox';
import HealthToolsModal from './HealthToolsModal';
import SymptomCheckerModal from './SymptomCheckerModal';
import { 
  Menu, Trash2, Stethoscope, Sparkles, ShieldCheck, MessageSquare,
  Thermometer, FileText, Pill, AlertTriangle, Globe, ArrowRight, Download, Activity
} from 'lucide-react';

const ChatWindow = ({ 
  messages, 
  input, 
  setInput, 
  handleSend, 
  handleFileUpload, 
  isLoading, 
  currentChat,
  onClearSession,
  onToggleMobileSidebar,
  onOpenFeedback
}) => {

  const messagesEndRef = useRef(null);
  const [isHealthToolsOpen, setIsHealthToolsOpen] = useState(false);
  const [isSymptomCheckerOpen, setIsSymptomCheckerOpen] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleExportConsultation = () => {
    if (!messages || messages.length === 0) return;

    let content = `= HEALTHCARE AI CONSULTATION TRANSCRIPT =\n`;
    content += `Title: ${currentChat?.title || "Consultation"}\n`;
    content += `Date: ${new Date().toLocaleString()}\n`;
    content += `Session ID: ${currentChat?.id || "N/A"}\n`;
    content += `Compliance: HIPAA Encrypted Session\n`;
    content += `===========================================\n\n`;

    messages.forEach((msg, idx) => {
      const sender = msg.isUser ? "PATIENT" : "HEALTHCARE AI ASSISTANT";
      const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : "";
      content += `[${time}] ${sender}:\n${msg.text}\n\n-------------------------------------------\n\n`;
    });

    content += `\n[MEDICAL DISCLAIMER]: This AI consultation transcript is for informational purposes. Always consult a qualified medical professional for diagnosis or treatment.`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Consultation_Report_${currentChat?.id || 'session'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const quickPrompts = [
    {
      icon: FileText,
      category: "Rx Prescription Demo",
      title: "Doctor Prescription OCR",
      prompt: "I uploaded my Doctor Prescription report. Please analyze the prescribed medications, dosages (1-0-1), administration timings, dietary rules, and precautions.",
      color: "from-emerald-500/10 to-teal-500/10 border-emerald-200 text-emerald-700 hover:border-emerald-400"
    },
    {
      icon: Thermometer,
      category: "Symptom Check",
      title: "Fever & Chills",
      prompt: "I have a fever of 101°F with body ache and chills. What should I do?",
      color: "from-amber-500/10 to-orange-500/10 border-amber-200 text-amber-700 hover:border-amber-400"
    },
    {
      icon: Pill,
      category: "Medication Query",
      title: "Paracetamol & Dosage",
      prompt: "What is the recommended safe dosage for Paracetamol and what precautions should I take?",
      color: "from-blue-500/10 to-indigo-500/10 border-blue-200 text-blue-700 hover:border-blue-400"
    },
    {
      icon: FileText,
      category: "Lab Analysis",
      title: "CBC Blood Report",
      prompt: "How do I read a Complete Blood Count (CBC) report and what do HIGH/LOW flags mean?",
      color: "from-teal-500/10 to-emerald-500/10 border-teal-200 text-teal-700 hover:border-teal-400"
    },
    {
      icon: AlertTriangle,
      category: "Emergency Triage",
      title: "Chest Pain Warning",
      prompt: "I feel sudden chest pain and tightness. What are the immediate steps?",
      color: "from-rose-500/10 to-red-500/10 border-rose-200 text-rose-700 hover:border-rose-400"
    },
    {
      icon: Globe,
      category: "Hindi Consult",
      title: "हिंदी में पूछें",
      prompt: "मुझे 2 दिन से सिर दर्द और हल्का बुखार है, मुझे क्या करना चाहिए?",
      color: "from-purple-500/10 to-violet-500/10 border-purple-200 text-purple-700 hover:border-purple-400"
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full relative bg-slate-50/60 overflow-hidden">
      {/* Top Navigation Bar / Header */}
      <div className="h-16 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 flex items-center justify-between px-3 sm:px-6 shrink-0 z-20 sticky top-0 shadow-xs gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button 
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl active:bg-slate-200 transition-colors flex-shrink-0"
            title="Open Consultations"
          >
            <Menu size={20} />
          </button>
          <div className="flex flex-col min-w-0">
            <h2 className="font-bold text-slate-800 text-xs sm:text-sm md:text-base tracking-tight truncate max-w-[130px] xs:max-w-[180px] sm:max-w-xs md:max-w-md">
              {currentChat?.title || "New Consultation"}
            </h2>
            <span className="text-[10px] sm:text-[11px] text-teal-600 font-semibold flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse flex-shrink-0"></span>
              <span className="truncate">Secure HIPAA Active</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* AI Symptom & Vitals Checker Button */}
          <button
            onClick={() => setIsSymptomCheckerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 active:bg-teal-200 rounded-xl transition-all border border-teal-200/80 shadow-2xs"
            title="Open AI Symptom & Vitals Triage Checker"
          >
            <Stethoscope size={14} className="text-teal-600 flex-shrink-0" />
            <span className="hidden sm:inline">Symptom Checker</span>
          </button>

          {/* Advanced Health Tools Button */}
          <button
            onClick={() => setIsHealthToolsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 rounded-xl transition-all border border-indigo-200/80 shadow-2xs"
            title="Open Advanced Health Tools & BMI Calculators"
          >
            <Activity size={14} className="text-indigo-600 flex-shrink-0" />
            <span className="hidden sm:inline">Health Tools</span>
          </button>

          {/* Export Report Button */}
          <button
            onClick={handleExportConsultation}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-all border border-slate-200 shadow-2xs"
            title="Export Consultation Transcript as TXT File"
          >
            <Download size={14} className="text-slate-600 flex-shrink-0" />
            <span className="hidden md:inline">Export</span>
          </button>

          <button
            onClick={onOpenFeedback}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 active:bg-teal-200 rounded-xl transition-all border border-teal-200/80 shadow-2xs"
            title="Submit Feedback & Review"
          >
            <MessageSquare size={14} className="text-teal-600 flex-shrink-0" />
            <span className="hidden md:inline">Reviews</span>
          </button>
        </div>
      </div>

      {/* Messages / Main Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 flex flex-col gap-6 scroll-smooth">
        {messages.length <= 1 ? (
          <div className="max-w-4xl mx-auto w-full my-auto flex flex-col gap-6 py-4">
            
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-700 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-teal-900/10">
              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold tracking-wide uppercase text-teal-100 flex items-center gap-1.5 border border-white/20">
                    <Sparkles size={13} className="text-teal-300" /> AI Healthcare Assistant
                  </span>
                  <span className="px-3 py-1 bg-emerald-500/20 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                    <ShieldCheck size={13} /> HIPAA Compliant
                  </span>
                </div>
                
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  How can I help with your health today?
                </h1>
                
                <p className="text-sm sm:text-base text-teal-100/90 max-w-2xl leading-relaxed font-normal">
                  Describe your symptoms, ask about medications, or securely upload your medical reports (PDF/Images) for instant AI analysis and clinical guidance.
                </p>
              </div>
            </div>

            {/* Quick Prompt Test Presets Section */}
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Sparkles size={14} className="text-teal-500" />
                  Quick Test Prompts (Click to Run)
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">1-Click Execution</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {quickPrompts.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSend(item.prompt)}
                      disabled={isLoading}
                      className={`group text-left p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3 active:scale-[0.99] disabled:opacity-50 relative overflow-hidden`}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.color} border shadow-2xs`}>
                          <Icon size={18} />
                        </div>
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                          {item.category}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm group-hover:text-teal-600 transition-colors flex items-center justify-between">
                          <span>{item.title}</span>
                          <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-teal-600" />
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          "{item.prompt}"
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))
        )}
        
        {isLoading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border bg-teal-50 border-teal-200 text-teal-600">
               <Stethoscope size={20} className="animate-pulse" />
            </div>
            <div className="bg-white text-slate-800 rounded-2xl rounded-tl-xs px-5 py-4 shadow-sm border border-slate-200/80 flex items-center gap-2">
               <span className="text-xs font-semibold text-teal-600 mr-1">AI Assistant Thinking</span>
               <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
               <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
               <span className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Fixed Input Box at Bottom */}
      <InputBox 
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        handleFileUpload={handleFileUpload}
        isLoading={isLoading}
      />

      {/* Health Tools Modal */}
      <HealthToolsModal 
        isOpen={isHealthToolsOpen}
        onClose={() => setIsHealthToolsOpen(false)}
      />

      {/* Symptom Checker & Vitals Assessment Modal */}
      <SymptomCheckerModal
        isOpen={isSymptomCheckerOpen}
        onClose={() => setIsSymptomCheckerOpen(false)}
        onSendAssessment={(prompt) => handleSend(prompt)}
      />
    </div>
  );
};

export default ChatWindow;
