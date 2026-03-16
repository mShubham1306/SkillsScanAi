import React from 'react';

const ResultsDashboard = ({ data, onReset }) => {
  if (!data) return null;

  const { ats_score = 0, extracted_skills = [], missing_competencies = [], matched_roles = [], suggestions = [], skill_development = [] } = data;

  return (
    <div className="dashboard">
      
      <div className="dashboard-row">
        
        {/* ATS Score Presentation */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gridColumn: '1 / -1' }}>
           <h2 style={{ fontSize: '2rem', marginBottom: '10px', color: '#f8fafc' }}>ATS Resume Score</h2>
           <p style={{ color: '#94a3b8', marginBottom: '25px', textAlign: 'center' }}>Estimated performance against automated Applicant Tracking Systems.</p>
           
           <div className="ats-circle" style={{ 
               width: '150px', 
               height: '150px', 
               borderRadius: '50%', 
               background: `conic-gradient(var(--info) ${ats_score}%, rgba(255,255,255,0.1) 0)`, 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center',
               position: 'relative',
               boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)'
            }}>
             <div style={{
               width: '130px',
               height: '130px',
               borderRadius: '50%',
               background: 'var(--bg-dark)',
               display: 'flex',
               flexDirection: 'column',
               alignItems: 'center',
               justifyContent: 'center'
             }}>
               <span style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--info)' }}>{ats_score}</span>
               <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>/ 100</span>
             </div>
           </div>
        </div>

        {/* Identified Skills */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <div className="panel-header">
            <div className="icon-box icon-success">✅</div>
            <h2>Identified Skills</h2>
          </div>
          <div className="badge-container">
            {extracted_skills.length > 0 ? (
              extracted_skills.map((skill, i) => (
                <span key={i} className="badge badge-success">
                  {skill}
                </span>
              ))
            ) : (
              <p style={{ color: 'gray', fontStyle: 'italic' }}>No technical skills identified.</p>
            )}
          </div>
        </div>

        {/* Missing Competencies */}
        <div className="glass-panel" style={{ padding: '30px' }}>
           <div className="panel-header">
            <div className="icon-box icon-danger">❌</div>
            <h2 style={{ color: '#fca5a5' }}>Missing Competencies</h2>
          </div>
          <div className="badge-container">
            {missing_competencies.length > 0 ? (
              missing_competencies.map((skill, i) => (
                <span key={i} className="badge badge-danger">
                  {skill}
                </span>
              ))
            ) : (
              <p style={{ color: 'gray', fontStyle: 'italic' }}>No significant gaps detected.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Roles */}
      <div className="glass-panel" style={{ padding: '30px' }}>
        <div className="panel-header">
          <div className="icon-box icon-info">💼</div>
          <h2 style={{ color: '#93c5fd' }}>Best Fit Roles</h2>
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
      <div className="glass-panel" style={{ padding: '30px' }}>
        <div className="panel-header">
          <div className="icon-box icon-warning">✨</div>
          <h2>Actionable Suggestions</h2>
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
        <div className="glass-panel" style={{ padding: '30px' }}>
          <div className="panel-header">
            <div className="icon-box" style={{ background: 'rgba(168, 85, 247, 0.15)', borderColor: 'rgba(168, 85, 247, 0.3)' }}>🚀</div>
            <h2 style={{ color: '#d8b4fe' }}>Skill Development Roadmap</h2>
          </div>
          <div style={{ display: 'grid', gap: '20px' }}>
            {skill_development.map((item, i) => (
              <div key={i} className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #a855f7' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#e9d5ff' }}>{item.skill}</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: '1.5' }}>{item.recommendation}</p>
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
