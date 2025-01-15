import React, { useState, useEffect } from "react";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";

const MultiPersonSelect = ({ value, onChange }) => {
  const auth = useAuthHeader();
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPersons, setSelectedPersons] = useState(
    value ? value.split(", ") : []
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (value) {
      setSelectedPersons(value.split(", "));
    }
  }, [value]);

  const searchPersons = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/person?name=${encodeURIComponent(
          searchTerm
        )}`,
        {
          headers: {
            Authorization: auth,
          },
        }
      );

      const data = await response.json();
      // Filter out already selected persons
      const filteredResults = data.results.filter(
        (person) => !selectedPersons.includes(person.name)
      );
      setSuggestions(filteredResults);
    } catch (error) {
      console.error("Error searching persons:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPersons(inputValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSelectPerson = (person) => {
    const newSelected = [...selectedPersons, person.name];
    setSelectedPersons(newSelected);
    setInputValue("");
    setSuggestions([]);
    onChange(newSelected.join(", "));
  };

  const handleRemovePerson = (personToRemove) => {
    const newSelected = selectedPersons.filter(
      (person) => person !== personToRemove
    );
    setSelectedPersons(newSelected);
    onChange(newSelected.join(", "));
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedPersons.map((person, index) => (
          <div
            key={index}
            className="bg-blue-100 px-2 py-1 rounded-md flex items-center gap-1"
          >
            <span>{person}</span>
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
