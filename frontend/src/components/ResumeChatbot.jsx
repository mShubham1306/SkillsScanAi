import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../config';

// Simple helper to parse basic markdown tags (bold, lists, code blocks, line breaks) into HTML
function renderMarkdown(text) {
  if (!text) return '';
  
  let html = text
    // Escape HTML to prevent XSS
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bullet points
  html = html.replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>');
  // Wrap list items in <ul>
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  // Bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Inline code
  html = html.replace(/`(.*?)`/g, '<code class="chat-inline-code">$1</code>');
  // Line breaks
  html = html.replace(/\n/g, '<br />');

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function ResumeChatbot({ resumeId, fileName, apiKey }) {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      message: `Hi there! I'm your AI Career Coach. I've analyzed your resume **${fileName || 'Document'}** and crossed it with our database stats. Ask me anything! What would you like to explore?`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestionChips = [
    "What are my biggest skill gaps?",
    "How can I improve my ATS score?",
    "What roles fit me best?",
    "How does my resume compare to others in the DB?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend) => {
    if (!textToSend || textToSend.trim().length === 0) return;

    // Add user message to state
    const updatedMessages = [...messages, { role: 'user', message: textToSend }];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Map state history to match backend api structure: [{ role: 'user'|'model', message: string }]
      // Limit history to last 10 turns to conserve token limit
      const history = updatedMessages
        .slice(0, -1) // Exclude the user message we just added (backend adds it)
        .map(msg => ({
          role: msg.role,
          message: msg.message
        }))
        .slice(-10);

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-Key': apiKey || ''
        },
        body: JSON.stringify({
          message: textToSend,
          resumeId,
          history
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to get AI response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', message: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'model', 
          message: `⚠️ **Error:** ${error.message || 'Could not connect to the AI service. Please verify your Gemini API key and server connection.'}`
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
          <h2 style={{ color: '#c4b5fd', margin: 0, fontSize: '1.2rem' }}>AI Career Coach Chatbot</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Discussing: {fileName || 'Scanned Resume'}</span>
        </div>
      </div>

      {/* Message list */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {messages.map((msg, index) => (
          <div 
            key={index} 
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: msg.role === 'user' 
                ? 'linear-gradient(135deg, #4f46e5, #4338ca)' 
                : 'rgba(255, 255, 255, 0.03)',
              border: msg.role === 'user' 
                ? '1px solid rgba(79, 70, 229, 0.4)' 
                : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: msg.role === 'user' 
                ? '16px 16px 2px 16px' 
                : '16px 16px 16px 2px',
              padding: '12px 16px',
              color: '#e8edf5',
              fontSize: '0.9rem',
              lineHeight: '1.6',
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
            Thinking...
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
                border: '1px solid rgba(139, 92, 246, 0.15)',
                borderRadius: '20px',
                padding: '6px 12px',
                color: '#c4b5fd',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(139, 92, 246, 0.15)';
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(139, 92, 246, 0.08)';
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.15)';
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
          placeholder="Ask a question about this resume..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            color: '#e8edf5',
            fontSize: '0.9rem',
          }}
        />
        <button 
          type="submit" 
          disabled={isLoading || !inputValue.trim()} 
          className="btn-primary"
          style={{
            padding: '0 20px',
            borderRadius: '10px',
            fontSize: '0.9rem',
            opacity: isLoading || !inputValue.trim() ? 0.6 : 1,
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
