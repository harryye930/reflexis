import React, { useState } from 'react';

const CodeButton = ({ 
  code, 
  bgColor, 
  textColor, 
  onDirectApply, 
  onReflexiveApply 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group code-button-wrapper"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`code-button-container flex flex-col items-center transition-all duration-400 ease-out ${
          isHovered 
            ? 'transform scale-105' 
            : 'transform scale-100'
        }`}
        style={{ 
          minHeight: isHovered ? '80px' : '40px',
          width: 'fit-content'
        }}
      >
        {/* Main code button - shrinks when hovered */}
        <button
          className={`code-palette-unified rounded-full font-medium border border-gray-100 relative overflow-hidden transition-all duration-400 ease-out transform ${bgColor} ${textColor} ${
            isHovered 
              ? 'px-3 py-1 text-xs scale-90 shadow-sm' 
              : 'px-4 py-2 text-sm shadow-md hover:shadow-lg'
          }`}
          title={code.description}
          style={{
            background: isHovered 
              ? `linear-gradient(135deg, ${bgColor.replace('bg-', '')}, ${bgColor.replace('bg-', '')}dd)` 
              : undefined
          }}
        >
          <span className="relative z-10 whitespace-nowrap">{code.label}</span>
        </button>

        {/* Action buttons - smoothly appear below */}
        <div 
          className={`action-buttons flex gap-1 mt-2 transition-all duration-400 ease-out ${
            isHovered 
              ? 'opacity-100 transform translate-y-0 visible' 
              : 'opacity-0 transform translate-y-(-10px) invisible'
          }`}
          style={{
            minWidth: '140px',
            maxHeight: isHovered ? '32px' : '0px',
            overflow: 'hidden'
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDirectApply();
            }}
            className="flex-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-all duration-200 font-medium border border-gray-200 hover:border-gray-300 hover:shadow-sm"
          >
            Apply
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReflexiveApply();
            }}
            className="flex-1 px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-all duration-200 font-medium border border-blue-200 hover:border-blue-300 hover:shadow-sm"
          >
            Reflect
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeButton;
