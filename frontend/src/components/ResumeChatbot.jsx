import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../config';

function renderMarkdown(text) {
  if (!text) return '';
  
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`(.*?)`/g, '<code class="chat-inline-code">$1</code>');
  html = html.replace(/\n/g, '<br />');

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function ResumeChatbot({ resumeId, fileName }) {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      message: `Hello! I am your AI Career Strategist. I've conducted a full analysis of your profile **${fileName || 'Document'}**. How can I assist you today? Feel free to ask for bullet point optimizations, cover letters, or career advice!`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestionChips = [
    "What are my top skill gaps?",
    "How can I boost my ATS score?",
    "Which executive roles fit me best?",
    "Draft a professional summary for my resume"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend) => {
    if (!textToSend || textToSend.trim().length === 0) return;

    const updatedMessages = [...messages, { role: 'user', message: textToSend }];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const history = updatedMessages
        .slice(0, -1)
        .map(msg => ({
          role: msg.role,
          message: msg.message
        }))
        .slice(-10);

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          resumeId,
          history
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate AI response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', message: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'model', 
          message: `⚠️ ${error.message || 'Unable to connect to the AI Career Assistant. Please try again.'}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  return (
    <div className="glass-panel chatbot-container" style={{ display: 'flex', flexDirection: 'column', height: '520px', padding: '24px', position: 'relative' }}>
      <div className="panel-header" style={{ marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '12px' }}>
        <div className="icon-box" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.05))', border: '1px solid rgba(139, 92, 246, 0.3)' }}>🤖</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ color: '#c4b5fd', margin: 0, fontSize: '1.15rem' }}>AI Career Strategist</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Evaluating: {fileName || 'Scanned Document'}</span>
        </div>
      </div>

      {/* Message List */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {messages.map((msg, index) => (
          <div 
            key={index} 
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: msg.role === 'user' 
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' 
                : 'rgba(255, 255, 255, 0.03)',
              border: msg.role === 'user' 
                ? '1px solid rgba(99, 102, 241, 0.4)' 
                : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: msg.role === 'user' 
                ? '16px 16px 2px 16px' 
                : '16px 16px 16px 2px',
              padding: '12px 16px',
              color: '#e2e8f0',
              fontSize: '0.9rem',
              lineHeight: '1.65',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            {renderMarkdown(msg.message)}
          </div>
        ))}

        {isLoading && (
          <div 
            style={{
              alignSelf: 'flex-start',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '16px 16px 16px 2px',
              padding: '12px 16px',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <div className="typing-dots" style={{ display: 'flex', gap: '4px' }}>
              <span className="dot" style={{ width: '6px', height: '6px', backgroundColor: '#8b5cf6', borderRadius: '50%' }}></span>
              <span className="dot" style={{ width: '6px', height: '6px', backgroundColor: '#8b5cf6', borderRadius: '50%' }}></span>
              <span className="dot" style={{ width: '6px', height: '6px', backgroundColor: '#8b5cf6', borderRadius: '50%' }}></span>
            </div>
            AI Strategist is thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length === 1 && !isLoading && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          {suggestionChips.map((chip, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(chip)}
              style={{
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.18)',
                borderRadius: '20px',
                padding: '6px 14px',
                color: '#c4b5fd',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(139, 92, 246, 0.16)';
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(139, 92, 246, 0.08)';
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.18)';
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input panel */}
      <form onSubmit={handleFormSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Ask your AI Career Strategist anything..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            color: '#e2e8f0',
            fontSize: '0.9rem',
          }}
        />
        <button 
          type="submit" 
          disabled={isLoading || !inputValue.trim()} 
          className="btn-primary"
          style={{
            padding: '0 22px',
            borderRadius: '10px',
            fontSize: '0.9rem',
            opacity: isLoading || !inputValue.trim() ? 0.5 : 1,
            cursor: isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default ResumeChatbot;
