import React, { useState, useEffect } from 'react';
import './popup.css';
import { FaUser, FaRobot } from "react-icons/fa";
import Preferences from './Preferences';

const Popup = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPreferences, setShowPreferences] = useState(false);

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

  if (showPreferences) {
    return <Preferences onBack={() => {
      setShowPreferences(false);
      fetchAssignments(); // refresh assignments when returning from preferences
    }} />;
  }

  return (
    <div className="w-96 max-h-[600px] p-0 font-['Open_Sans',sans-serif] bg-white overflow-y-auto pb-10px">
      <div className="flex justify-between items-center px-5 py-4 bg-[#d8dddd] text-[#798e9d] m-0 mb-4">
        <h2 className="m-0 text-2xl font-semibold italic font-['Playfair_Display',serif]">Canvas Helper</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreferences(true)}
            className="p-2 hover:bg-gray-300 rounded-full transition-colors"
            title="Settings"
          >
            <FaUser className="text-lg" />
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-10 px-5 text-gray-600">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#798e9d] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-medium italic font-['Playfair_Display',serif]">Fetching Assignments...</p>
        </div>
      )}

      {error && (
        <div className="text-center p-5 text-red-600 bg-red-50 mx-4 rounded-lg">
          <p className="font-medium italic font-['Playfair_Display',serif]">Error: {error}</p>
          {error.includes('refresh') && (
            <button 
              onClick={refreshPage} 
              className="bg-blue-500 text-white border-0 px-4 py-2 rounded cursor-pointer mx-2 my-1 hover:bg-[#798e9d] transition-colors"
            >
              Refresh Page
            </button>
          )}
          <button 
            onClick={fetchAssignments} 
            className="bg-gray-500 text-white border-0 px-4 py-2 rounded cursor-pointer mx-2 my-1 hover:bg-gray-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="px-5 pb-5 pt-4">
          {(() => {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            today.setHours(0, 0, 0, 0); // set to start of today

            // group the  assignments based on start date
            const startToday = assignments.filter(a => {
              if (!a.suggestedStartDate) return true; // so start date means to start immediately
              const startDate = new Date(a.suggestedStartDate);
              startDate.setHours(0, 0, 0, 0); // set to start of day for comparison
              return startDate <= today; // include if start date is today or earlier
            });

            const upcoming = assignments.filter(a => {
              if (!a.suggestedStartDate) return false; // already included in startToday
              const startDate = new Date(a.suggestedStartDate);
              startDate.setHours(0, 0, 0, 0);
              return startDate > today; // only include future start dates
            });

            return (
              <>
                {startToday.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 font-['Playfair_Display',serif] italic border-b-2 border-gray-400 pb-1">
                      Start Working Now ({startToday.length})
                    </h3>
                    {startToday.map((assignment) => (
                      <div 
                        key={`${assignment.courseId}-${assignment.id}`} 
                        className={`border border-gray-200 rounded-lg p-4 mb-3 bg-white transition-all duration-200 relative hover:shadow-lg hover:-translate-y-0.5 urgency-${assignment.urgency}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <a 
                              href={assignment.htmlUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              title="Open assignment in Canvas"
                              className="font-semibold text-base text-gray-800 no-underline hover:text-[#798e9d] hover:underline"
                            >
                              {assignment.title}
                            </a>
                          </div>
                          <div className="text-xs font-bold px-2 py-1 rounded bg-gray-200 text-gray-700 ml-2">
                            {getUrgencyLabel(assignment.urgency)}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex">
                            <span className="text-gray-500 text-sm font-medium min-w-20">Course: </span>
                            <span className="text-gray-700 text-sm">{assignment.courseName}</span>
                          </div>
                          
                          <div className="flex">
                            <span className="text-gray-500 text-sm font-medium min-w-20">Due: </span>
                            <span className="text-gray-700 text-sm">{formatDueDate(assignment.dueDate)}</span>
                          </div>
                          
                          <div className="flex items-center">
                            <span className="text-gray-500 text-sm font-medium min-w-20">Start by: </span>
                            <span className="text-gray-700 text-sm">{formatStartDate(assignment.suggestedStartDate)}</span>
                            {assignment.aiAnalyzed && (
                              <span className="ml-2 text-[#798e9d] text-xs flex items-center gap-1" title="AI-analyzed start date">
                                <FaRobot /> AI Analyzed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {upcoming.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 font-['Playfair_Display',serif] italic border-b-2 border-gray-400 pb-1">
                      Upcoming Assignments ({upcoming.length})
                    </h3>
                    {upcoming.map((assignment) => (
                      <div 
                        key={`${assignment.courseId}-${assignment.id}`} 
                        className={`border border-gray-200 rounded-lg p-4 mb-3 bg-white transition-all duration-200 relative hover:shadow-lg hover:-translate-y-0.5 urgency-${assignment.urgency}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <a 
                              href={assignment.htmlUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              title="Open assignment in Canvas"
                              className="font-semibold text-base text-gray-800 no-underline hover:text-[#798e9d] hover:underline"
                            >
                              {assignment.title}
                            </a>
                          </div>
                          <div className="text-xs font-bold px-2 py-1 rounded bg-gray-200 text-gray-700 ml-2">
                            {getUrgencyLabel(assignment.urgency)}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex">
                            <span className="text-gray-500 text-sm font-medium min-w-20">Course: </span>
                            <span className="text-gray-700 text-sm">{assignment.courseName}</span>
                          </div>
                          
                          <div className="flex">
                            <span className="text-gray-500 text-sm font-medium min-w-20">Due: </span>
                            <span className="text-gray-700 text-sm">{formatDueDate(assignment.dueDate)}</span>
                          </div>
                          
                          <div className="flex items-center">
                            <span className="text-gray-500 text-sm font-medium min-w-20">Start by: </span>
                            <span className="text-gray-700 text-sm">{formatStartDate(assignment.suggestedStartDate)}</span>
                            {assignment.aiAnalyzed && (
                              <span className="ml-2 text-[#798e9d] text-xs flex items-center gap-1" title="AI-analyzed start date">
                                <FaRobot /> AI Analyzed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {assignments.length === 0 && (
                  <div className="text-center py-10 text-gray-500">
                    <p className="font-medium italic font-['Playfair_Display',serif]">No upcoming assignments found!</p>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default Popup;
