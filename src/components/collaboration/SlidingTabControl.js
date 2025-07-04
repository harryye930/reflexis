import React, { useState, useRef, useEffect, useMemo } from 'react';

const SlidingTabControl = ({ activeTab, onTabChange, unreadCount = 0 }) => {
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabsRef = useRef([]);

  const tabs = useMemo(() => [
    { 
      id: 'analysis', 
      label: 'Analysis Tools',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      id: 'notifications', 
      label: 'Notifications',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zm-8-4a6 6 0 1112 0c0 7-3 9-3 9H9s-3-2-3-9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0" />
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
              
              {/* Notification Badge */}
              {tab.id === 'notifications' && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SlidingTabControl;
