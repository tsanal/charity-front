import React, { useState, useEffect } from "react";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";

const MultiPersonSelect = ({ value, onChange }) => {
  const auth = useAuthHeader();
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPersons, setSelectedPersons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

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

  const searchPersons = async (searchTerm) => {
    try {
      setIsLoading(true);
      let url = `${process.env.REACT_APP_BACKEND_URL}/person?relationshipType=Participant&upliftStatus=Active&upliftStatus=Prospective&limit=50`;

      // Only add name parameter if searchTerm exists
      if (searchTerm?.trim()) {
        url += `&name=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: auth,
        },
      });

      const data = await response.json();
      // Filter out already selected persons
      const filteredResults = data.results.filter(
        (person) =>
          !selectedPersons.some((selected) => selected.id === person.id)
      );
      setSuggestions(filteredResults);
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
      setIsFocused(false);
    }, 200);
  };

  const handleSelectPerson = (person) => {
    const newSelected = [
      ...selectedPersons,
      { name: person.name, id: person.id },
    ];
    setSelectedPersons(newSelected);
    setInputValue("");
    setSuggestions([]);
    onChange(newSelected);
  };

  const handleRemovePerson = (personToRemove) => {
    const newSelected = selectedPersons.filter(
      (person) => person.id !== personToRemove.id
    );
    setSelectedPersons(newSelected);
    onChange(newSelected);
  };

  return (
    <div className="relative">
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
      {!isLoading && suggestions.length > 0 && (
        <div className="absolute z-10 w-[50%] mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((person) => (
            <div
              key={person.id}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex"
              onClick={() => handleSelectPerson(person)}
            >
              {person.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiPersonSelect;
