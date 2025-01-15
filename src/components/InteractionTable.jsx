import React, { useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import axios from "axios";
import MultiPersonSelect from "./MultiplePersonSelect";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";

const InteractionTable = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const auth = useAuthHeader();

  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentInteraction, setCurrentInteraction] = useState({
    name: "",
    method: "",
    date: "",
    type: "",
    duration: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async (page = currentPage, itemsPerPage = perPage) => {
    try {
      const response = await axios.get(
        `${backendUrl}/interaction`,
        {
          headers: {
            Authorization: auth,
          },
        },
        {
          params: {
            page,
            limit: itemsPerPage,
          },
        }
      );

      setData(response.data.data);
      const total = response.data.meta.total;
      setTotalPages(Math.ceil(total / itemsPerPage));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData, currentPage, perPage]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentInteraction((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = (interaction) => {
    setCurrentInteraction({
      ...interaction,
      date: interaction.date.split("T")[0], // Format date for input field
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this interaction?")) {
      try {
        await axios.delete(`${backendUrl}/interaction/${id}`, {
          headers: {
            Authorization: auth,
          },
        });
        await fetchData();
      } catch (error) {
        console.error("Error deleting interaction:", error);
      }
    }
  };
  console.log("currentInteraction", currentInteraction);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Create a copy of currentInteraction without the id field
      const { id, ...interactionData } = currentInteraction;

      if (isEditing) {
        await axios.patch(`${backendUrl}/interaction/${id}`, interactionData, {
          headers: {
            Authorization: auth,
          },
        });
      } else {
        await axios.post(`${backendUrl}/interaction`, currentInteraction, {
          headers: {
            Authorization: auth,
          },
        });
      }
      await fetchData();
      resetModal();
    } catch (error) {
      console.error("Error saving interaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columnHelper = createColumnHelper();

  const columns = [
    columnHelper.accessor("name", {
      header: "Person",
      cell: (info) => <div className="truncate">{info.getValue()}</div>,
    }),
    columnHelper.accessor("method", {
      header: "Method",
      cell: (info) => <div className="truncate">{info.getValue()}</div>,
    }),
    columnHelper.accessor("date", {
      header: "Date",
      cell: (info) => (
        <div className="truncate">
          {new Date(info.getValue()).toLocaleDateString()}
        </div>
      ),
    }),
    columnHelper.accessor("type", {
      header: "Type",
      cell: (info) => <div className="truncate">{info.getValue()}</div>,
    }),
    columnHelper.accessor("duration", {
      header: "Duration",
      cell: (info) => <div className="truncate">{info.getValue()}</div>,
    }),
    columnHelper.accessor("description", {
      header: "Description",
      cell: (info) => <div className="truncate">{info.getValue()}</div>,
    }),
    columnHelper.accessor("actions", {
      header: "Actions",
      cell: (info) => (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => handleEdit(info.row.original)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(info.row.original.id)}
            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
          >
            Delete
          </button>
        </div>
      ),
    }),
  ];

  const resetModal = () => {
    setCurrentInteraction({
      name: "",
      method: "",
      date: "",
      type: "",
      duration: "",
      description: "",
    });
    setIsEditing(false);
    setIsModalOpen(false);
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const PaginationControls = () => (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      <div className="flex items-center">
        <select
          value={perPage}
          onChange={(e) => {
            setPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="mr-4 rounded border-gray-300 text-sm"
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
        <span className="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded bg-gray-100 text-gray-800 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded bg-gray-100 text-gray-800 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div className="px-4 py-8 max-w-9xl mx-auto">
      <div className="flex justify-around items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Interactions</h2>
        <div className="flex gap-10">
          <button
            onClick={() => {
              setIsEditing(false);
              setCurrentInteraction({
                name: "",
                method: "",
                date: "",
                type: "",
                duration: "",
                description: "",
              });
              setIsModalOpen(true);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Add Interaction
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-gray-100 text-gray-700 text-center text-sm"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 font-medium border-b"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, idx) => (
              <tr
                key={row.id}
                className={`${
                  idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                } hover:bg-gray-100`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm text-gray-600">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <PaginationControls />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {isEditing ? "Edit Interaction" : "Add New Interaction"}
              </h3>
              <button
                onClick={resetModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Person(s)
                  </label>
                  <MultiPersonSelect
                    value={currentInteraction.name}
                    onChange={(value) =>
                      handleInputChange({ target: { name: "name", value } })
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="method"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Method
                  </label>
                  <select
                    id="method"
                    name="method"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={currentInteraction.method}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a method</option>
                    <option value="Email">Email</option>
                    <option value="Phone">Phone</option>
                    <option value="In-Person">In-Person</option>
                    <option value="Video">Video</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Date
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={currentInteraction.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={currentInteraction.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a type</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Initial Contact">Initial Contact</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Support">Support</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="duration"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Duration
                  </label>
                  <select
                    id="duration"
                    name="duration"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={currentInteraction.duration}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select duration</option>
                    <option value="30 Minutes">30 Minutes</option>
                    <option value="60 Minutes">60 Minutes</option>
                    <option value="90 Minutes">90 Minutes</option>
                    <option value="120 Minutes">120 Minutes</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={currentInteraction.description}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting
                    ? "Saving..."
                    : isEditing
                    ? "Update Interaction"
                    : "Save Interaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractionTable;
