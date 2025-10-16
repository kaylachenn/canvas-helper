import React, { useState, useEffect } from 'react';
import '../popup/popup.css';

const Popup = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Sending message to background script...');
      
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'fetchAssignments' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (!response) {
            reject(new Error('No response received'));
          } else {
            resolve(response);
          }
        });
      });
      
      console.log('Received response:', response);
      
      if (response.success) {
        setAssignments(response.assignments || []);
      } else {
        setError(response.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to communicate with extension');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const formatDueDate = (dueDateString) => {
    if (!dueDateString) return 'No due date';
    
    const dueDate = new Date(dueDateString);
    return dueDate.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatStartDate = (startDateString) => {
    if (!startDateString) return 'Start immediately';
    
    const startDate = new Date(startDateString);
    const now = new Date();
    
    if (startDate <= now) {
      return 'Start immediately';
    }
    
    return startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  // sets the priority
  const getUrgencyLabel = (urgency) => {
    switch (urgency) {
      case 'critical': return 'URGENT';
      case 'high': return 'HIGH PRIORITY';
      case 'medium': return 'MEDIUM PRIORITY';
      case 'low': return 'LOW PRIORITY';
      default: return 'NORMAL';
    }
  };

  const openCanvasTab = () => {
    chrome.tabs.create({ url: 'https://canvas.instructure.com' });
  };

  const refreshPage = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.reload(tabs[0].id);
        window.close();
      }
    });
  };

  return (
    <div className="popup-container">
      <div className="popup-header">
        <h2>Canvas Helper</h2>
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Fetching Assignments...</p>
        </div>
      )}

      {error && (
        <div className="error">
          <p>Error: {error}</p>
          {error.includes('refresh') && (
            <button onClick={refreshPage} className="canvas-button">
              Refresh Page
            </button>
          )}
          <button onClick={fetchAssignments} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="assignments-list">
          {assignments.length === 0 ? (
            <div className="no-assignments">
              <p>No upcoming assignments in the next 30 days!</p>
              <small>You're all caught up!</small>
            </div>
          ) : (
            <>
              <div className="assignments-count">
                {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} due in the next 30 days
              </div>
              {assignments.map((assignment) => (
                <div 
                  key={`${assignment.courseId}-${assignment.id}`} 
                  className={`assignment-item urgency-${assignment.urgency}`}
                >
                  <div className="assignment-header">
                    <div className="assignment-name">
                      <a 
                        href={assignment.htmlUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        title="Open assignment in Canvas"
                      >
                        {assignment.title}
                      </a>
                    </div>
                    <div className="urgency-badge">
                      {getUrgencyLabel(assignment.urgency)}
                    </div>
                  </div>
                  
                  <div className="assignment-details">
                    <div className="detail-row">
                      <span className="label">Course: </span>
                      <span className="value">{assignment.courseName}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="label">Due: </span>
                      <span className="value">{formatDueDate(assignment.dueDate)}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="label">Start by: </span>
                      <span className="value">{formatStartDate(assignment.suggestedStartDate)}</span>
                    </div>
                    
                  </div>
              
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Popup;
