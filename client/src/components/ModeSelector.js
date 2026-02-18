import React from 'react';

const ModeSelector = ({ mode, onModeChange }) => {
  const modes = [
    { value: 'word', label: '📖 Mot' },
    { value: 'sentence', label: '💬 Phrase' }
  ];

  return (
    <div className="mode-selector">
      {modes.map((m) => (
        <button
          key={m.value}
          className={`mode-btn ${mode === m.value ? 'active' : ''}`}
          onClick={() => onModeChange(m.value)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
};

export default ModeSelector;
