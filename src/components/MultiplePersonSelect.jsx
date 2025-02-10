import React, { useState, useEffect, useRef } from "react";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";

const MultiPersonSelect = ({ value, onChange }) => {
  const auth = useAuthHeader();
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPersons, setSelectedPersons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);

  // Parse initial value on mount and when value changes
  useEffect(() => {
    if (value) {
      // Handle both string and array inputs for backward compatibility
      if (typeof value === "string") {
        const persons = value.split(", ").map((item) => {
          const [name, id] = item.split("|");
          return { name, id };
        });
        setSelectedPersons(persons);
      } else if (Array.isArray(value)) {
        setSelectedPersons(value);
      }
    } else {
      setSelectedPersons([]);
    }
  }, [value]);

  // Add this useEffect for handling outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const searchPersons = async (searchTerm) => {
    try {
      setIsLoading(true);
      let url = `${process.env.REACT_APP_BACKEND_URL}/person?relationshipType=Participant&upliftStatus=Active&upliftStatus=Prospective&limit=50`;

      if (searchTerm?.trim()) {
        url += `&name=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: auth,
        },
      });

      const data = await response.json();
      setSuggestions(data.results.map(person => ({
        ...person,
        displayName: `${person.name} (${person.account || ''})`
      })));
    } catch (error) {
      console.error("Error searching persons:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only search if input has value or input is focused
      if (inputValue || isFocused) {
        searchPersons(inputValue);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, isFocused]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    // If input is empty, trigger search immediately on focus
    if (!inputValue) {
      searchPersons("");
    }
  };

  const handleInputBlur = () => {
    // Add small delay before closing suggestions to allow for click handling
    setTimeout(() => {
      if (!document.activeElement?.closest('.suggestions-container')) {
        setIsFocused(false);
      }
    }, 200);
  };

  const handleTogglePerson = (person) => {
    const isSelected = selectedPersons.some(p => p.id === person.id);
    let newSelected;
    
    if (isSelected) {
      newSelected = selectedPersons.filter(p => p.id !== person.id);
    } else {
      newSelected = [...selectedPersons, { 
        name: person.name,
        id: person.id,
        account: person.account
      }];
    }
    
    setSelectedPersons(newSelected);
    onChange(newSelected);
  };

  const handleRemovePerson = (personToRemove) => {
    const newSelected = selectedPersons.filter(
      (person) => person.id !== personToRemove.id
    );
    setSelectedPersons(newSelected);
    onChange(newSelected);
  };

  const isPersonSelected = (personId) => {
    return selectedPersons.some(person => person.id === personId);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedPersons.map((person) => (
          <div
            key={person.id}
            className="bg-blue-100 px-2 py-1 rounded-md flex items-center gap-1"
          >
            <span>{person.name}</span>
            <button
              type="button"
              onClick={() => handleRemovePerson(person)}
              className="text-blue-500 hover:text-blue-700"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Type to search persons..."
      />
      {isLoading && (
        <div className="absolute z-10 w-full mt-1 px-3 py-2 bg-white border border-gray-300 rounded-md">
          Searching...
        </div>
      )}
      {(isFocused || suggestions.length > 0) && (
        <div className="suggestions-container absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((person) => (
            <label
              key={person.id}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
            >
              <input
                type="checkbox"
                checked={isPersonSelected(person.id)}
                onChange={() => handleTogglePerson(person)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span>{person.name}</span>
            </label>
          ))}
          {suggestions.length === 0 && inputValue && !isLoading && (
            <div className="px-3 py-2 text-gray-500">
              No matching persons found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiPersonSelect;
