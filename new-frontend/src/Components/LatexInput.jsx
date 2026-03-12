import React, { useEffect, useRef, useState } from "react";

const LATEX_COMMANDS = [
  "\\to",
  "\\land",
  "\\lor",
  "\\neg",
  "\\vdash",
  "\\models",
  "\\equiv",
  "\\forall",
  "\\exists",
  "\\bot",
  "\\top",
  "\\psi",
  "\\phi",
  "\\theta",
];

// ✨ FIX: The 'mathNotation' prop has been removed.
const LatexInput = ({ value, onChange, autoFocus = false }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    const lastBackslashIndex = inputValue.lastIndexOf("\\");
    if (lastBackslashIndex !== -1 && inputValue.length > lastBackslashIndex) {
      const query = inputValue.substring(lastBackslashIndex);
      const filtered = LATEX_COMMANDS.filter((command) =>
        command.startsWith(query)
      );

      if (filtered.length > 0) {
        setFilteredCommands(filtered);
        setShowSuggestions(true);
        setActiveIndex(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const selectCommand = (command) => {
    const lastBackslashIndex = value.lastIndexOf("\\");
    const prefix = value.substring(0, lastBackslashIndex);

    // ✨ FIX: Always insert the raw command without any '$' delimiters.
    const commandToInsert = command;

    onChange(`${prefix}${commandToInsert} `); // Add a space for better UX

    setShowSuggestions(false);
    inputRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(
        (prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length
      );
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (filteredCommands.length > 0) {
        e.preventDefault();
        selectCommand(filteredCommands[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setShowSuggestions(false)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        role="combobox"
        aria-expanded={showSuggestions}
        aria-controls="latex-suggestions"
        aria-activedescendant={
          showSuggestions ? `latex-option-${activeIndex}` : undefined
        }
      />
      {showSuggestions && (
        <div
          id="latex-suggestions"
          role="listbox"
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg"
        >
          {filteredCommands.map((command, index) => (
            <div
              key={command}
              id={`latex-option-${index}`}
              role="option"
              aria-selected={activeIndex === index}
              onMouseDown={() => selectCommand(command)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`px-3 py-1 cursor-pointer ${
                activeIndex === index
                  ? "bg-blue-500 text-white"
                  : "text-gray-900"
              }`}
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
