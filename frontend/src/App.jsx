import React, { useState } from 'react';
import UploadZone from './components/UploadZone';
import ResultsDashboard from './components/ResultsDashboard';

function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = async (file) => {
    setIsScanning(true);
    setError(null);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze resume');
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>SkillScan AI</h1>
        <p>
          Upload your resume and let our intelligent engine analyze your skills, identify gaps, and match you with your ideal roles.
        </p>
      </div>

      {!analysisResult && !isScanning && (
        <UploadZone onUpload={handleUpload} error={error} />
      )}

      {isScanning && (
        <div className="glass-panel scanning-state">
           <div className="spinner"></div>
           <h3>Analyzing Document...</h3>
           <p>Extracting skills, inferring competencies, and finding the perfect match.</p>
        </div>
      )}

      {analysisResult && !isScanning && (
        <ResultsDashboard 
          data={analysisResult} 
          onReset={() => setAnalysisResult(null)} 
        />
      )}
    </div>
  );
}

export default App;
