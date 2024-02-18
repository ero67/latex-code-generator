import React, { useState, useRef, useEffect } from 'react';

const LATEX_COMMANDS = [
  // '\RightArrow',
  // '\LeftArrow',
  '\\to',
  '\\land',
  '\\lor',
  '\\neg',
  '\\vdash',
  '\\models',
  '\\equiv',
  '\\forall',
  '\\exists',
  '\\bot',
  '\\top',
  // Add more commands as needed
];

const LatexInput = ({ value, onChange,mathNotation }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState([]);
  const [focusIndex, setFocusIndex] = useState(-1);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault(); // Prevent scrolling
        setFocusIndex((prevIndex) => Math.min(prevIndex + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault(); // Prevent scrolling
        setFocusIndex((prevIndex) => Math.max(prevIndex - 1, 0));
      } else if (e.key === 'Enter' && focusIndex >= 0) {
        e.preventDefault(); // Prevent form submission
        handleCommandClick(filteredCommands[focusIndex]);
      }
    };

    if (showSuggestions) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSuggestions, filteredCommands, focusIndex]);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (inputValue.endsWith('\\')) {
      setShowSuggestions(true);
      setFilteredCommands(LATEX_COMMANDS); // Show all commands if just '\' is entered
    } else {
      const lastBackslashIndex = inputValue.lastIndexOf('\\');
      if (lastBackslashIndex !== -1) {
        // Show filtered commands based on input after last '\'
        const query = inputValue.slice(lastBackslashIndex).toLowerCase();
        const filtered = LATEX_COMMANDS.filter(command =>
          command.toLowerCase().startsWith(query)
        );
        setFilteredCommands(filtered);
        setShowSuggestions(filtered.length > 0);
      } else {
        setShowSuggestions(false);
      }
    }
  };

  const handleCommandClick = (command) => {
    // Nájdi index posledného znaku '\' v aktuálnej hodnote
    const lastBackslashIndex = value.lastIndexOf('\\');
    
    // Vytvor novú hodnotu s príkazom obaleným znakmi '$'
    // Odstráň jeden znak '\' z príkazu a obaľ ho znakmi '$'
    let newValue = "";
    if(mathNotation === false){
       newValue = lastBackslashIndex !== -1
      ? `${value.substring(0, lastBackslashIndex)}$${command}$`
      : `${value}$${command}$`;
    }else{
       newValue = lastBackslashIndex !== -1
      ? `${value.substring(0, lastBackslashIndex)}${command}`
      : `${value}${command}`;
    }
    onChange(newValue); // Aktualizuj hodnotu vstupného poľa s novým výberom
    setShowSuggestions(false); // Skry návrhy
    setFocusIndex(-1); // Resetuj index fokusu
    inputRef.current.focus(); // Zameraj sa späť na vstup po výbere
  };
  




  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(value.endsWith('\\'))}
        onBlur={() => {
          // Delay hiding suggestions to allow click event to register
          setTimeout(() => setShowSuggestions(false), 100);
        }}
      />
      {showSuggestions && (
        <div>
          {filteredCommands.map((command, index) => (
            <div
              key={command}
              onClick={() => handleCommandClick(command)}
              onMouseEnter={() => setFocusIndex(index)}
              onMouseLeave={() => setFocusIndex(-1)}
              style={{
              cursor: 'pointer',
              backgroundColor: focusIndex === index ? '#FFFFCC' : 'white',
              fontWeight: focusIndex === index ? 'bold' : 'normal', // Make text bold for focused command
              padding: '1px', // Add some padding for better visibility
              margin: '1px 0', // Add slight margin between suggestions
            }}
            >
              {command}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LatexInput;

