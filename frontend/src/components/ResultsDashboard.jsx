import React from 'react';
import ResumeChatbot from './ResumeChatbot';

const ResultsDashboard = ({ data, apiKey, onReset }) => {
  if (!data) return null;

  const { 
    ats_score = 0, 
    extracted_skills = [], 
    missing_competencies = [], 
    matched_roles = [], 
    suggestions = [], 
    skill_development = [], 
    corpus_stats = {},
    resumeId,
    fileName,
    executive_summary
  } = data;

  // Score color calculation
  const scoreColor = ats_score >= 70 ? '#10b981' : ats_score >= 45 ? '#f59e0b' : '#ef4444';
  
  // SVG Ring calculation
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (ats_score / 100) * circumference;

  return (
    <div className="dashboard">

      {/* ATS Score & Summary Banner */}
      <div className="glass-panel ats-score-wrapper">
        <div className="ats-title">ATS Compatibility Score</div>
        <div className="ats-subtitle">Estimated rating based on keyword density, formatting, and database bench metrics.</div>

        <div className="ats-ring-wrapper">
          <div className="ats-glow" style={{ background: scoreColor }}></div>
          <svg className="ats-ring-svg" viewBox="0 0 160 160">
            <circle className="ats-ring-track" cx="80" cy="80" r={radius} />
            <circle
              className="ats-ring-progress"
              cx="80"
              cy="80"
              r={radius}
              stroke={scoreColor}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="ats-ring-center">
            <span className="ats-ring-value" style={{ color: scoreColor }}>{ats_score}</span>
            <span className="ats-ring-label">/ 100</span>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      {executive_summary && (
        <div className="exec-summary-card">
          <div className="panel-header">
            <div className="icon-box icon-success">✨</div>
            <h2 style={{ color: '#818cf8' }}>AI Executive Evaluation</h2>
          </div>
          <p className="exec-summary-text">"{executive_summary}"</p>
        </div>
      )}

      {/* Corpus Intelligence */}
      {corpus_stats.total_resumes_in_db > 0 && (
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div className="panel-header">
            <div className="icon-box icon-info">🧠</div>
            <h2 style={{ color: '#22d3ee' }}>Corpus Intelligence Benchmark</h2>
          </div>
          <div className="corpus-stats-row">
            <div className="corpus-stat">
              <span className="corpus-stat-number">{corpus_stats.total_resumes_in_db}</span>
              <span className="corpus-stat-label">Resumes in Database</span>
            </div>
            <div className="corpus-stat">
              <span className="corpus-stat-number">{corpus_stats.avg_similarity}%</span>
              <span className="corpus-stat-label">Avg Similarity Match</span>
            </div>
          </div>
          {corpus_stats.top_similar_resumes && corpus_stats.top_similar_resumes.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-500)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '10px' }}>
                Most Similar Stored Resumes
              </div>
              {corpus_stats.top_similar_resumes.map((r, i) => (
                <div key={i} className="corpus-similar-item">
                  <span style={{ color: 'var(--text-200)' }}>📄 {r.fileName}</span>
                  <span className="corpus-similarity-badge">{r.similarity}% Match</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="dashboard-row">
        {/* Identified Skills */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div className="panel-header">
            <div className="icon-box icon-success">✅</div>
            <h2 style={{ color: '#6ee7b7' }}>Identified Competencies</h2>
          </div>
          <div className="badge-container">
            {extracted_skills.length > 0 ? (
              extracted_skills.map((skill, i) => (
                <span key={i} className="badge badge-success" style={{ animationDelay: `${i * 0.05}s` }}>
                  {skill}
                </span>
              ))
            ) : (
              <p style={{ color: 'var(--text-500)', fontStyle: 'italic', fontSize: '0.875rem' }}>No technical skills identified.</p>
            )}
          </div>
        </div>

        {/* Missing Competencies */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div className="panel-header">
            <div className="icon-box icon-danger">⚠️</div>
            <h2 style={{ color: '#fca5a5' }}>Skill Gaps & Missing Terms</h2>
          </div>
          <div className="badge-container">
            {missing_competencies.length > 0 ? (
              missing_competencies.map((skill, i) => (
                <span key={i} className="badge badge-danger" style={{ animationDelay: `${i * 0.05}s` }}>
                  {skill}
                </span>
              ))
            ) : (
              <p style={{ color: 'var(--text-500)', fontStyle: 'italic', fontSize: '0.875rem' }}>No significant gaps detected!</p>
            )}
          </div>
        </div>
      </div>

      {/* Matched Roles */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div className="panel-header">
          <div className="icon-box icon-info">💼</div>
          <h2 style={{ color: '#818cf8' }}>Matched Target Roles</h2>
        </div>
        <div className="roles-grid">
          {matched_roles.map((role, i) => (
            <div key={i} className="glass-card role-card">
              <h3>{role.title}</h3>
              <div className="match-bar-container">
                <div className="match-labels">
                  <span className="label-title">Fit Rating</span>
                  <span className="label-score">{role.matchPercentage}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${role.matchPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div className="panel-header">
          <div className="icon-box icon-warning">💡</div>
          <h2 style={{ color: '#fde047' }}>Actionable Resume Improvements</h2>
        </div>
        <ul className="suggestions-list">
          {suggestions.map((suggestion, i) => (
            <li key={i} className="suggestion-item" style={{ animationDelay: `${i * 0.08}s` }}>
              <span className="suggestion-bullet">✦</span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Skill Development Pathways */}
      {skill_development.length > 0 && (
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div className="panel-header">
            <div className="icon-box" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>🚀</div>
            <h2 style={{ color: '#c4b5fd' }}>Skill Development Pathways</h2>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {skill_development.map((item, i) => (
              <div key={i} className="glass-card skill-dev-card">
                <div className="skill-dev-title">{item.skill}</div>
                <div className="skill-dev-text">{item.recommendation}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive AI Chatbot */}
      <ResumeChatbot
        resumeId={resumeId}
        fileName={fileName}
        apiKey={apiKey}
      />

      <div className="action-area">
        <button onClick={onReset} className="btn-primary">
          <span>🔄</span> Analyze Another Resume
        </button>
      </div>

    </div>
  );
};

export default ResultsDashboard;
