import React, { useState } from "react";
import Papa from "papaparse";

const CSVImportModal = ({ isOpen, onClose, backendUrl, auth }) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [processedRecords, setProcessedRecords] = useState(0);
  const [errors, setErrors] = useState([]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFile(file);
    setErrors([]);
    setProgress(0);
    setProcessedRecords(0);
    setTotalRecords(0);
  };

  const mapCSVToContact = (csvRow) => {
    return {
      title: csvRow["Name"] || "",
      email: csvRow["Primary Email Address"] || "",
      street: csvRow["Primary Street"] || "",
      city: csvRow["Primary City"] || "",
      state: csvRow["Primary State"] || "",
      zip: csvRow["Primary ZIP Code"] || "",
      relationship_type: csvRow["Relationship Type"] || "",
      status: "publish",
    };
  };

  const importCSV = () => {
    if (!file) return;

    setImporting(true);
    setErrors([]);
    setProgress(0);
    setProcessedRecords(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const validData = results.data.filter((row) => row["Name"]); // Filter rows without names
        setTotalRecords(validData.length);

        for (let i = 0; i < validData.length; i++) {
          try {
            const contact = mapCSVToContact(validData[i]);
            await postContact(contact);
            setProcessedRecords((prev) => prev + 1);
            setProgress(((i + 1) / validData.length) * 100);
          } catch (error) {
            setErrors((prev) => [
              ...prev,
              `Error importing ${validData[i]["Name"]}: ${error.message}`,
            ]);
          }
        }
        setImporting(false);
      },
      error: (error) => {
        setErrors((prev) => [...prev, `CSV parsing error: ${error.message}`]);
        setImporting(false);
      },
    });
  };

  const postContact = async (contact) => {
    try {
      const response = await fetch(`${backendUrl}/person`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa(`${auth.username}:${auth.password}`),
        },
        body: JSON.stringify(contact),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Failed to post contact: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Import Contacts from CSV</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          {file && (
            <div className="text-sm text-gray-600">
              Selected file: {file.name}
            </div>
          )}

          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Processing contacts...</span>
                <span>
                  {processedRecords} of {totalRecords}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <h4 className="text-red-800 font-medium mb-2">Errors:</h4>
              <ul className="list-disc list-inside text-sm text-red-700">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={importCSV}
              disabled={!file || importing}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {importing ? "Importing..." : "Import Contacts"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVImportModal;
