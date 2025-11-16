import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import './popup.css';

const Preferences = ({ onBack }) => {
  const [bufferDays, setBufferDays] = useState(3);
  const [enableAI, setEnableAI] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load preferences from Chrome storage on mount
  useEffect(() => {
    if (chrome?.storage?.sync) {
      chrome.storage.sync.get(['bufferDays', 'enableAI'], (result) => {
        console.log('Loaded preferences:', result);
        if (result.bufferDays !== undefined) {
          setBufferDays(parseInt(result.bufferDays));
        }
        if (result.enableAI !== undefined) {
          setEnableAI(result.enableAI);
        }
      });
    }
  }, []);

  const handleSave = () => {
    if (chrome?.storage?.sync) {
      chrome.storage.sync.set({
        bufferDays: parseInt(bufferDays),
        enableAI: enableAI
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving preferences:', chrome.runtime.lastError);
        } else {
          console.log('Preferences saved successfully:', { bufferDays: parseInt(bufferDays), enableAI });
          setSaved(true);
          setTimeout(() => {
            setSaved(false);
            onBack(); // Go back and refresh assignments
          }, 1500);
        }
      });
    } else {
      // Fallback for development environment
      console.log('Preferences saved (dev mode):', { bufferDays, enableAI });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onBack(); // Go back and refresh assignments
      }, 1500);
    }
  };

  return (
    <div className="w-96 max-h-[600px] p-0 font-['Open_Sans',sans-serif] bg-white overflow-y-auto">
      <div className="flex items-center px-5 py-4 bg-[#d8dddd] text-[#798e9d] m-0 mb-4">
        <button
          onClick={onBack}
          className="mr-3 p-2 hover:bg-gray-300 rounded-full transition-colors"
          title="Back to assignments"
        >
          <FaArrowLeft />
        </button>
        <h2 className="m-0 text-2xl font-semibold italic font-['Playfair_Display',serif]">Preferences</h2>
      </div>

      <div className="px-5 pb-5">
        {/* Buffer Setting */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Assignment Start Buffer (Days)
          </label>
          <p className="text-sm text-gray-600 mb-3">
            How many days before the due date should you start working on assignments?
          </p>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min="0"
              max="14"
              value={bufferDays}
              onChange={(e) => setBufferDays(parseInt(e.target.value) || 0)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-600">days before due date</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Current setting: Start assignments {bufferDays} {bufferDays === 1 ? 'day' : 'days'} before they're due
          </p>
        </div>

        {/* AI Analyzer Toggle */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <label className="block text-gray-700 font-semibold mb-2">
            AI Analyzer
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Use AI to analyze assignment difficulty and estimate completion time
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEnableAI(!enableAI)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enableAI ? 'bg-[#798e9d]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enableAI ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-gray-700">
              {enableAI ? 'Enabled' : 'Disabled'}
            </span>
            {!enableAI && (
              <span className="text-xs text-gray-500 italic">(Coming soon)</span>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          {saved && (
            <span className="text-[#383b4e] text-sm font-medium py-2">
              Settings saved!
            </span>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-[#798e9d] text-white border-0 px-4 py-2 rounded-lg cursor-pointer hover:bg-[#383B4E] transition-colors"
          >
            <FaSave />
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
