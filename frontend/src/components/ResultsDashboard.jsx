import React from 'react';

const ResultsDashboard = ({ data, onReset }) => {
  if (!data) return null;

  const { ats_score = 0, extracted_skills = [], missing_competencies = [], matched_roles = [], suggestions = [], skill_development = [], corpus_stats = {} } = data;

  // Color based on score
  const scoreColor = ats_score >= 70 ? '#06d6a0' : ats_score >= 40 ? '#fbbf24' : '#f43f5e';

  return (
    <div className="dashboard">

      {/* Corpus Intelligence */}
      {corpus_stats.total_resumes_in_db > 0 && (
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div className="panel-header">
            <div className="icon-box" style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(56, 189, 248, 0.05))', border: '1px solid rgba(56, 189, 248, 0.2)' }}>🧠</div>
            <h2 style={{ color: '#7dd3fc' }}>Corpus Intelligence</h2>
          </div>
          <div className="corpus-stats-row">
            <div className="corpus-stat">
              <span className="corpus-stat-number">{corpus_stats.total_resumes_in_db}</span>
              <span className="corpus-stat-label">Resumes Compared</span>
            </div>
            <div className="corpus-stat">
              <span className="corpus-stat-number">{corpus_stats.avg_similarity}%</span>
              <span className="corpus-stat-label">Avg. Similarity</span>
            </div>
          </div>
          {corpus_stats.top_similar_resumes && corpus_stats.top_similar_resumes.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ color: '#4a5a80', margin: '0 0 10px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 600 }}>Most Similar Resumes</h4>
              {corpus_stats.top_similar_resumes.map((r, i) => (
                <div key={i} className="corpus-similar-item">
                  <span>📄 {r.fileName}</span>
                  <span className="corpus-similarity-badge">{r.similarity}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="dashboard-row">

        {/* ATS Score */}
        <div className="glass-panel" style={{ padding: '35px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gridColumn: '1 / -1' }}>
           <h2 style={{ fontSize: '1.6rem', marginBottom: '8px', color: '#e8edf5', fontWeight: 700, letterSpacing: '-0.5px' }}>ATS Resume Score</h2>
           <p style={{ color: '#4a5a80', marginBottom: '28px', textAlign: 'center', fontSize: '0.9rem' }}>Estimated performance against Applicant Tracking Systems.</p>

           <div className="ats-circle" style={{
               width: '160px',
               height: '160px',
               borderRadius: '50%',
               background: `conic-gradient(${scoreColor} ${ats_score * 3.6}deg, rgba(124, 58, 237, 0.08) 0deg)`,
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               position: 'relative',
            }}>
             <div style={{
               width: '136px',
               height: '136px',
               borderRadius: '50%',
               background: 'var(--bg-dark)',
               display: 'flex',
               flexDirection: 'column',
               alignItems: 'center',
               justifyContent: 'center',
               boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)'
             }}>
               <span style={{ fontSize: '3rem', fontWeight: 800, color: scoreColor, fontFamily: "'JetBrains Mono', monospace" }}>{ats_score}</span>
               <span style={{ fontSize: '0.8rem', color: '#4a5a80', fontWeight: 500 }}>/ 100</span>
             </div>
           </div>
        </div>

        {/* Identified Skills */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div className="panel-header">
            <div className="icon-box icon-success">✅</div>
            <h2 style={{ color: '#6ee7b7' }}>Identified Skills</h2>
          </div>
          <div className="badge-container">
            {extracted_skills.length > 0 ? (
              extracted_skills.map((skill, i) => (
                <span key={i} className="badge badge-success">
                  {skill}
                </span>
              ))
            ) : (
              <p style={{ color: '#4a5a80', fontStyle: 'italic', fontSize: '0.9rem' }}>No technical skills identified.</p>
            )}
          </div>
        </div>

        {/* Missing Competencies */}
        <div className="glass-panel" style={{ padding: '28px' }}>
           <div className="panel-header">
            <div className="icon-box icon-danger">❌</div>
            <h2 style={{ color: '#fda4af' }}>Missing Competencies</h2>
          </div>
          <div className="badge-container">
            {missing_competencies.length > 0 ? (
              missing_competencies.map((skill, i) => (
                <span key={i} className="badge badge-danger">
                  {skill}
                </span>
              ))
            ) : (
              <p style={{ color: '#4a5a80', fontStyle: 'italic', fontSize: '0.9rem' }}>No significant gaps detected.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Roles */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div className="panel-header">
          <div className="icon-box icon-info">💼</div>
          <h2 style={{ color: '#7dd3fc' }}>Best Fit Roles</h2>
        </div>

        <div className="roles-grid">
          {matched_roles.map((role, i) => (
            <div key={i} className="glass-card role-card">
              <h3>{role.title}</h3>
              <div className="match-bar-container">
                <div className="match-labels">
                  <span className="label-title">Match Score</span>
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

      {/* Personalized Suggestions */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div className="panel-header">
          <div className="icon-box icon-warning">✨</div>
          <h2 style={{ color: '#fde68a' }}>Actionable Suggestions</h2>
        </div>
        <ul className="suggestions-list">
          {suggestions.map((suggestion, i) => (
            <li key={i} className="suggestion-item">
              <span className="suggestion-bullet">💡</span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Skill Development Pathways */}
      {skill_development.length > 0 && (
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div className="panel-header">
            <div className="icon-box" style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(124, 58, 237, 0.05))', border: '1px solid rgba(124, 58, 237, 0.2)' }}>🚀</div>
            <h2 style={{ color: '#c4b5fd' }}>Skill Development Roadmap</h2>
          </div>
          <div style={{ display: 'grid', gap: '14px' }}>
            {skill_development.map((item, i) => (
              <div key={i} className="glass-card" style={{ padding: '20px', borderLeft: '3px solid #7c3aed' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', color: '#c4b5fd', fontWeight: 600, letterSpacing: '-0.2px' }}>{item.skill}</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.88rem' }}>{item.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="action-area">
        <button onClick={onReset} className="btn-primary">
          <span>🔄</span> Analyze Another Resume
        </button>
      </div>

    </div>
  );
};

export default ResultsDashboard;
