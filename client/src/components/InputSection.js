import React from 'react';

const InputSection = ({ 
  inputText, 
  onInputChange, 
  onTranslate, 
  onKeyPress, 
  loading,
  mode 
}) => {
  const placeholder = mode === 'word' 
    ? 'Entrez un mot...' 
    : 'Entrez une phrase...';

  return (
    <div className="input-section">
      <textarea
        className="input-textarea"
        value={inputText}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={onKeyPress}
        placeholder={placeholder}
        rows="3"
        disabled={loading}
      />
      <button
        className="btn-primary"
        onClick={onTranslate}
        disabled={loading}
      >
        <span className={`btn-text ${loading ? 'hidden' : ''}`}>
          Traduire
        </span>
        <span className={`spinner ${loading ? '' : 'hidden'}`}>
          ⏳
        </span>
      </button>
    </div>
  );
};

export default InputSection;
