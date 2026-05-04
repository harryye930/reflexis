import React, { useEffect, useMemo, useRef, useState } from 'react';
import { REFLECTIVE_QUOTES, pickReflectiveQuote } from '../../constants/reflectiveQuotes.js';

// Cadence: rotate every 5–10 minutes, picking a fresh delay each cycle
// so the rhythm doesn't feel mechanical. The fade itself is short.
const MIN_INTERVAL_MS = 5 * 60 * 1000;
const MAX_INTERVAL_MS = 10 * 60 * 1000;
const FADE_MS = 500;

const pickRandomDelay = () =>
  MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);

// Header-bar ticker: small italic line that rotates through the reflective
// quotes set. Lives on the top banner, not above the document text, so the
// quote is ambient and doesn't get visually entangled with the data.
const ReflectiveQuoteTicker = ({ seedKey = '', className = '' }) => {
  const initial = useMemo(() => pickReflectiveQuote(seedKey), [seedKey]);
  const initialIndex = useMemo(() => {
    const i = REFLECTIVE_QUOTES.indexOf(initial);
    return i >= 0 ? i : 0;
  }, [initial]);

  const [index, setIndex] = useState(initialIndex);
  const [visible, setVisible] = useState(true);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const quoteRef = useRef(null);

  useEffect(() => {
    if (REFLECTIVE_QUOTES.length < 2) return undefined;

    let nextTimer;
    let fadeTimer;

    const schedule = () => {
      nextTimer = setTimeout(() => {
        setVisible(false);
        fadeTimer = setTimeout(() => {
          setIndex((current) => {
            let next;
            // Avoid showing the same quote twice in a row when we have
            // more than one to choose from.
            do {
              next = Math.floor(Math.random() * REFLECTIVE_QUOTES.length);
            } while (next === current);
            return next;
          });
          setVisible(true);
          schedule();
        }, FADE_MS);
      }, pickRandomDelay());
    };

    schedule();

    return () => {
      clearTimeout(nextTimer);
      clearTimeout(fadeTimer);
    };
  }, []);

  const quote = REFLECTIVE_QUOTES[index];

  useEffect(() => {
    const quoteElement = quoteRef.current;
    if (!quoteElement) return undefined;

    const checkOverflow = () => {
      setIsOverflowing(quoteElement.scrollWidth > quoteElement.clientWidth + 1);
    };

    checkOverflow();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', checkOverflow);
      return () => window.removeEventListener('resize', checkOverflow);
    }

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(quoteElement);
    return () => observer.disconnect();
  }, [index]);

  if (!quote) return null;

  // Soft fade-out on the right edge: if a quote is wider than the
  // available space, it trails off into transparency instead of being
  // hard-cut with an ellipsis. Long quotes are still readable in full via
  // the title attribute (hover) — but most are sized to fit outright.
  const fadeMask = {
    WebkitMaskImage:
      'linear-gradient(to right, black 0, black calc(100% - 32px), transparent 100%)',
    maskImage:
      'linear-gradient(to right, black 0, black calc(100% - 32px), transparent 100%)'
  };

  return (
    <div
      className={`hidden md:flex flex-1 min-w-0 items-center justify-center px-4 ${className}`}
      aria-label="Reflective prompt"
    >
      <div
        className={`flex items-baseline gap-2 max-w-5xl min-w-0 text-xs text-slate-500 transition-opacity ease-out ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transitionDuration: `${FADE_MS}ms` }}
      >
        <span
          ref={quoteRef}
          className="italic whitespace-nowrap overflow-hidden max-w-[52rem] min-w-0"
          title={`"${quote.text}" — ${quote.source}`}
          style={isOverflowing ? fadeMask : undefined}
        >
          &ldquo;{quote.text}&rdquo;
        </span>
        <span className="text-slate-400 flex-shrink-0">— {quote.source}</span>
      </div>
    </div>
  );
};

export default ReflectiveQuoteTicker;
