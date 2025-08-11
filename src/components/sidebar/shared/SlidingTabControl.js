import React, { useState, useRef, useEffect, useMemo } from 'react';

const SlidingTabControl = ({ activeTab, onTabChange }) => {
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabsRef = useRef([]);

  const tabs = useMemo(() => [
    { 
      id: 'analysis', 
      label: 'Codes',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.997.997 0 01-1.414 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z" />
        </svg>
      )
    },
    { 
      id: 'admin', 
      label: 'Admin',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      )
    }
  ], []);

  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    const activeTabElement = tabsRef.current[activeIndex];
    
    if (activeTabElement) {
      setIndicatorStyle({
        left: activeTabElement.offsetLeft,
        width: activeTabElement.offsetWidth,
      });
    }
  }, [activeTab, tabs]);

  return (
    <div className="relative">
      {/* Tab Container */}
      <div className="relative bg-gray-100 rounded-xl p-1">
        {/* Sliding Indicator */}
        <div
          className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-300 ease-out"
          style={indicatorStyle}
        />
        
        {/* Tab Buttons */}
        <div className="relative flex">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => (tabsRef.current[index] = el)}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center space-x-2">
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SlidingTabControl;
