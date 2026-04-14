import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    {
      text: "Hello! I am your AI Health Assistant. How can I help you today? You can describe your symptoms in English, Hindi, or any other language, or upload medical reports for analysis.",
      isUser: false,
      isEmergency: false
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const sessionIdRef = useRef(`session-${Date.now()}-${Math.floor(Math.random() * 1000)}`);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input, session_id: sessionIdRef.current })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, { 
          text: data.response, 
          isUser: false, 
          isEmergency: data.is_emergency 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          text: `Error: ${data.detail || 'Something went wrong'}`, 
          isUser: false 
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        text: "Connection error. Is the backend running on http://localhost:8000?", 
        isUser: false 
      }]);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="app-container">
      <div className="blob"></div>
      <header className="glass-panel">
        <div className="header-title">
          <h1>HealthCare AI</h1>
          <p>Premium Multilingual Medical Support</p>
        </div>
        <div className="header-actions">
          {/* Postman is used for RAG file uploading in this version. */}
        </div>
      </header>

      <main className="chat-container glass-panel">
        <div className="messages" id="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.isUser ? 'user-message' : 'assistant-message'} ${msg.isEmergency ? 'emergency-alert' : ''}`}>
              <div className="avatar">{msg.isUser ? '👤' : '🏥'}</div>
              <div className="bubble" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }}></div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant-message">
              <div className="avatar">🏥</div>
              <div className="bubble">
                <div className="typing-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="input-area">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe symptoms or ask health questions..." 
            autoComplete="off" 
          />
          <button id="send-btn" onClick={handleSend} disabled={isLoading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
