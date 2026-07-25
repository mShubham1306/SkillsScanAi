import React, { useState } from 'react';

function ApiKeyConfig({ apiKey, onKeyChange, isBackendKeyAvailable }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey || '');
  const [showKey, setShowKey] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    onKeyChange(tempKey);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempKey('');
    onKeyChange('');
    setIsOpen(false);
  };

  const isConfigured = !!apiKey || isBackendKeyAvailable;

  return (
    <>
      <div 
        className={`stat-item stat-mode clickable ${isConfigured ? 'gemini-active' : 'local-active'}`}
        onClick={() => {
          setTempKey(apiKey || '');
          setIsOpen(true);
        }}
        style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
      >
        <span className="stat-badge">
          {isConfigured ? '✨ Gemini AI Mode' : '🧠 Local NLP Mode'}
        </span>
        <span className="stat-label" style={{ textDecoration: 'underline', color: '#93c5fd' }}>
          {isConfigured ? 'API Key Configured' : 'Configure Gemini API Key'}
        </span>
      </div>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', width: '90%', padding: '30px', position: 'relative' }}>
            <button className="modal-close" onClick={() => setIsOpen(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>
              &times;
            </button>
            <h3 style={{ margin: '0 0 10px 0', color: '#e8edf5', fontSize: '1.25rem' }}>Configure Gemini API Key</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '20px' }}>
              By adding a Gemini API Key, SkillScan AI will use advanced AI logic for resume scoring, executive summaries, targeted job matching, and an interactive career chatbot.
            </p>

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '20px', position: 'relative' }}>
                <label style={{ display: 'block', color: '#e8edf5', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Gemini API Key
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder="Enter your Gemini API key..."
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#e8edf5',
                      fontSize: '0.9rem',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    style={{
                      padding: '0 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {showKey ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {isBackendKeyAvailable && !tempKey && (
                  <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>✅ Default API Key detected in backend configuration.</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                {apiKey && (
                  <button
                    type="button"
                    onClick={handleClear}
                    style={{
                      padding: '10px 16px',
                      background: 'rgba(244, 63, 94, 0.1)',
                      border: '1px solid rgba(244, 63, 94, 0.2)',
                      borderRadius: '8px',
                      color: '#fda4af',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    Clear Key
                  </button>
                )}
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: '10px 20px',
                    fontSize: '0.85rem',
                  }}
                >
                  Save API Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default ApiKeyConfig;
