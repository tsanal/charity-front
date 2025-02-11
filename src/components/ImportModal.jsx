import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const CSVImportModal = ({ isOpen, onClose, backendUrl, auth }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [progress, setProgress] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(backendUrl);
    setSocket(newSocket);

    // Cleanup on unmount
    return () => newSocket.disconnect();
  }, [backendUrl]);

  useEffect(() => {
    if (!socket) return;

    socket.on('uploadProgress', (progressData) => {
      setProgress(progressData);
      if (progressData.status === 'completed') {
        setStatus({ type: "success", message: "File uploaded successfully!" });
        setTimeout(() => onClose(), 1500);
      } else if (progressData.status === 'error') {
        setStatus({ type: "error", message: "Upload failed" });
      }
    });

    return () => {
      socket.off('uploadProgress');
    };
  }, [socket]);

  if (!isOpen) return null;

  const validateFile = (file) => {
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!validTypes.includes(file.type)) {
      throw new Error("Please upload a valid Excel file (.xls or .xlsx)");
    }

    // 10MB file size limit
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error("File size should be less than 10MB");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      validateFile(file);
      setSelectedFile(file);
      setStatus({ type: "success", message: "File selected successfully" });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
      setSelectedFile(null);
      e.target.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setProgress(null);

    try {
      if (!selectedFile) {
        throw new Error("Please select an Excel file");
      }

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("socketId", socket.id);

      await fetch(`${backendUrl}/excel/upload`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: auth,
        },
      });

    } catch (error) {
      console.error("Error uploading Excel file:", error);
      setStatus({
        type: "error",
        message: error.message || "Error uploading file. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  const ProgressBar = () => {
    if (!progress) return null;

    const percentage = Math.round((progress.processed / progress.totalRecords) * 100);
    
    return (
      <div className="mt-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-blue-700">
            Processing records ({progress.processed}/{progress.totalRecords})
          </span>
          <span className="text-sm font-medium text-blue-700">{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          <p>Success: {progress.success}</p>
          <p>Failed: {progress.failed}</p>
          {progress.errors.length > 0 && (
            <p className="text-red-500">Errors: {progress.errors.length}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

      {/* Modal Content */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative max-w-lg w-full bg-white rounded-lg shadow-xl">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">
              Import Excel File
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer block text-center"
                >
                  <div className="space-y-2">
                    {/* Upload Icon */}
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>

                    <div className="text-sm text-gray-600">
                      {selectedFile ? (
                        <span className="text-blue-600">
                          {selectedFile.name}
                        </span>
                      ) : (
                        <>
                          <span className="text-blue-600 hover:underline">
                            Choose a file
                          </span>{" "}
                          or drag and drop
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Excel files only (MAX. 10MB)
                    </div>
                  </div>
                </label>
              </div>

              {/* Progress Bar */}
              <ProgressBar />

              {/* Status Message */}
              {status.message && (
                <div
                  className={`p-4 rounded-lg ${
                    status.type === "error"
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-green-50 text-green-700 border border-green-200"
                  }`}
                >
                  {status.message}
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex gap-4 justify-end mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || isSubmitting}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg
                    flex items-center space-x-2
                    ${
                      !selectedFile || isSubmitting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      <span>Upload</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVImportModal;
