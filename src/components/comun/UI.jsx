import React, { useMemo } from 'react';

export function PixelButton({ children, onClick, disabled=false, className="" }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className={`pixel-button ${disabled ? "pixel-disabled" : ""} ${className}`}>
      {children}
    </button>
  );
}

export function SkyBackground({ children }) {
  const bits = useMemo(() => [
    ["< >", "12%", "17%"], ["0 1", "30%", "10%"], ["1 0", "76%", "18%"],
    ["< >", "86%", "34%"], ["0 1", "54%", "27%"], ["1 1", "19%", "38%"],
    ["< >", "68%", "8%"], ["0 0", "91%", "13%"], ["1 0", "41%", "42%"],
  ], []);
  return (
    <div className="sky-world">
      <div className="sky-gradient" />
      <div className="cloud cloud-a" /><div className="cloud cloud-b" /><div className="cloud cloud-c" />
      {bits.map(([t, left, top], i) => (
        <span key={i} className="code-firefly" style={{left, top}}>{t}</span>
      ))}
      <div className="hill hill-back" /><div className="hill hill-front" />
      <div className="grass-ground">
        {Array.from({length: 70}, (_, i) => <span key={i} className="grass-tuft" style={{left: `${(i*37)%100}%`, bottom: `${6+(i%4)*4}px`}} />)}
      </div>
      <div className="relative z-10 min-h-full">{children}</div>
    </div>
  );
}

export function Title({ children }) {
  return <h1 className="pixel-title">{children}<span className="terminal-cursor">_</span></h1>;
}
