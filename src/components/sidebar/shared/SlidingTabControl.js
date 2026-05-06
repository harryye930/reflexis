import React, { useMemo } from 'react';
import { Category, Tune } from '@mui/icons-material';

const SlidingTabControl = ({ activeTab, onTabChange }) => {
  const tabs = useMemo(() => [
    { 
      id: 'analysis', 
      label: 'Codes',
  icon: (<Category sx={{ fontSize: 16 }} />)
    },
    { 
      id: 'admin', 
      label: 'Settings',
  icon: (<Tune sx={{ fontSize: 16 }} />)
    }
  ], []);

  // Simple percent-based slider: equal widths, slide by index
  const activeIndex = Math.max(0, tabs.findIndex(tab => tab.id === activeTab));
  // Narrow the indicator a bit (total horizontal inset in px across the slot)
  const NARROW_TOTAL_PX = 8; // 4px inset on each side
  const indicatorStyle = useMemo(() => ({
    left: `calc(${activeIndex} * (100% / ${tabs.length}) + ${NARROW_TOTAL_PX / 2}px)`,
    width: `calc(100% / ${tabs.length} - ${NARROW_TOTAL_PX}px)`,
  }), [activeIndex, tabs.length]);

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
        <div className="flex">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
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
