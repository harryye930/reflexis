import React from 'react';

/**
 * CodeChip - A unified component for displaying code labels with consistent styling
 * 
 * @param {Object} code - Code object with label, color, textColor, description
 * @param {string} size - Size variant: 'xs', 'sm', 'md', 'lg'
 * @param {string} variant - Style variant: 'unified', 'simple', 'minimal', 'event', 'button'
 * @param {string} className - Additional CSS classes
 * @param {function} onClick - Click handler
 * @param {boolean} disabled - Whether the chip is disabled
 * @param {boolean} showTooltip - Whether to show description tooltip
 * @param {string} children - Alternative label text
 * @param {boolean} isTransitioning - Whether to show transition animation
 * @param {number} opacity - Custom opacity (0-1)
 */
const CodeChip = ({
  code,
  size = 'sm', // 'xs', 'sm', 'md', 'lg'
  variant = 'unified', // 'unified', 'simple', 'minimal', 'event', 'button'
  className = '',
  onClick,
  disabled = false,
  showTooltip = false,
  children,
  isTransitioning = false,
  opacity = 1,
  ...props
}) => {
  // Internal fallback colors - only used within CodeChip
  const bgColor = code?.color || 'bg-amber-300';
  const textColor = code?.textColor || 'text-amber-900';
  const label = code?.label || children || 'Unknown Code';
  
  // Enhanced tooltip for missing code data
  const isUsingFallback = !code?.color || !code?.textColor;
  const fallbackDescription = isUsingFallback 
    ? 'Missing or invalid code data - please check code configuration' 
    : code?.description;

  // Size variants
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-sm'
  };

  // Style variants
  const variantClasses = {
    unified: 'code-palette-unified border border-gray-100 transition-all duration-200',
    simple: 'border border-gray-100 transition-colors',
    minimal: '',
    event: 'inline-flex items-center',
    button: 'hover:scale-105 transition-transform'
  };

  // Build the complete className
  const chipClassName = [
    'inline-flex items-center justify-center rounded-full font-medium',
    sizeClasses[size],
    variantClasses[variant],
    bgColor,
    textColor,
    onClick && !disabled ? 'cursor-pointer hover:scale-105' : '',
    disabled ? 'opacity-60 cursor-not-allowed' : '',
    isTransitioning ? 'code-connection-pulse' : '',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (onClick && !disabled) {
      e.stopPropagation();
      onClick(e);
    }
  };

  // Apply custom opacity if provided
  const style = opacity !== 1 ? { opacity } : undefined;

  return (
    <span
      className={chipClassName}
      onClick={handleClick}
      title={showTooltip ? (fallbackDescription || label) : undefined}
      style={{
        ...style,
        wordBreak: 'break-word',
        hyphens: 'auto',
        textAlign: 'center',
        lineHeight: '1.2'
      }}
      {...props}
    >
      {label}
    </span>
  );
};

export default CodeChip;
