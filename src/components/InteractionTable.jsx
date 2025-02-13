import React, { useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
} from "@tanstack/react-table";
import axios from "axios";
import MultiPersonSelect from "./MultiplePersonSelect";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import { Calendar } from "lucide-react";
import DownloadButtons from "./DoanloadButton";
import { Icon } from "@iconify/react";

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
    method: "",
    date: "",
    type: "",
    duration: "",
    notes: "",
    person: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    id: "",
    name: "",
    type: "",
    method: "",
    notes: "",
    duration: "",
    date: "",
    account: "",
  });

  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isMethodOpen, setIsMethodOpen] = useState(false);
  const [isDurationOpen, setIsDurationOpen] = useState(false);

  const [sorting, setSorting] = useState([]);

  const types = [
    "Any",
    "Follow-up",
    "Initial Contact",
    "Meeting",
    "Support",
    "Other",
  ];
  const methods = ["Any", "Email", "Phone", "In-person", "Video", "Other"];
  const durations = [
    "Any",
    "30 Minutes",
    "60 Minutes",
    "90 Minutes",
    "120 Minutes",
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
    fetchData(1, perPage, newFilters); // Immediately fetch with new filters
  };

  const fetchData = async (
    page = currentPage,
    itemsPerPage = perPage,
    filterParams = filters
  ) => {
    try {
      const queryParams = new URLSearchParams({
        page: page,
        limit: itemsPerPage,
        ...(filterParams.id && { id: filterParams.id }),
        ...(filterParams.account?.trim() && {
          account: filterParams.account.trim(),
        }),
        ...(filterParams.name && { name: filterParams.name }),
        ...(filterParams.type && { type: filterParams.type }),
        ...(filterParams.method && { method: filterParams.method }),
        ...(filterParams.notes && { notes: filterParams.notes }),
        ...(filterParams.duration && { duration: filterParams.duration }),
        ...(filterParams.date && { date: filterParams.date }),
        ...(sorting.length > 0 && {
          sortBy: sorting[0].id,
          sortType: sorting[0].desc ? "desc" : "asc",
        }),
      });

      const response = await axios.get(
        `${backendUrl}/interaction?${queryParams.toString()}`,
        {
          headers: {
            Authorization: auth,
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
  }, [currentPage, perPage, filters, sorting]);

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
      date: interaction.date.split("T")[0],
      persons: [
        {
          id: interaction.personId,
          name: interaction.name,
          account: interaction.account,
        },
      ],
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
      const { id, persons, personId, ...baseInteractionData } =
        currentInteraction;

      if (!persons || persons.length === 0) {
        throw new Error("At least one person must be selected");
      }

      // Create confirmation message
      const personNames = persons.map((person) => person.name).join(", ");
      const confirmMessage = isEditing
        ? `Update interaction for ${
            persons[0].name
          } and create new interactions for ${personNames.substring(
            persons[0].name.length + 2
          )}?`
        : `Create interactions for the following contacts: ${personNames}?`;

      if (!window.confirm(confirmMessage)) {
        setIsSubmitting(false);
        return;
      }

      // Create an array of promises for each person's interaction
      const interactionPromises = persons.map((person, index) => {
        const interactionData = {
          ...baseInteractionData,
          name: person.name,
          account: person.account,
        };

        // Add personId only for new interactions, not for updates
        if (!isEditing || index > 0) {
          interactionData.personId = person.id;
        }

        if (isEditing && id && index === 0) {
          return axios.patch(
            `${backendUrl}/interaction/${id}`,
            interactionData,
            {
              headers: { Authorization: auth },
            }
          );
        } else {
          return axios.post(`${backendUrl}/interaction`, interactionData, {
            headers: { Authorization: auth },
          });
        }
      });

      await Promise.all(interactionPromises);
      await fetchData();
      resetModal();
    } catch (error) {
      console.error("Error saving interactions:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const columnHelper = createColumnHelper();
  console.log("data", data);

  const columns = [
    columnHelper.accessor("id", {
      header: ({ column }) => (
        <div
          className="cursor-pointer select-none flex items-center gap-1"
          onClick={() => column.toggleSorting()}
        >
          ID
          {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
          {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
          {!column.getIsSorted() && <Icon icon="ri:sort-line" className="opacity-30" />}
        </div>
      ),
      cell: (info) => (
        <div className="w-[70px] break-words">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("account", {
      header: ({ column }) => (
        <div
          className="cursor-pointer select-none flex items-center gap-1"
          onClick={() => column.toggleSorting()}
        >
          Account
          {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
          {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
          {!column.getIsSorted() && <Icon icon="ri:sort-line" className="opacity-30" />}
        </div>
      ),
      cell: (info) => <div className="w-[80px]">{info.getValue() || ""}</div>,
    }),
    columnHelper.accessor("name", {
      header: ({ column }) => (
        <div
          className="cursor-pointer select-none flex items-center gap-1"
          onClick={() => column.toggleSorting()}
        >
          Name
          {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
          {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
          {!column.getIsSorted() && <Icon icon="ri:sort-line" className="opacity-30" />}
        </div>
      ),
      cell: (info) => <div className="w-[260px]">{info.getValue()}</div>,
    }),
    columnHelper.accessor("type", {
      header: ({ column }) => (
        <div
          className="cursor-pointer select-none flex items-center gap-1"
          onClick={() => column.toggleSorting()}
        >
          Type
          {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
          {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
          {!column.getIsSorted() && <Icon icon="ri:sort-line" className="opacity-30" />}
        </div>
      ),
      cell: (info) => <div className="w-[110px]">{info.getValue()}</div>,
    }),
    columnHelper.accessor("method", {
      header: ({ column }) => (
        <div
          className="cursor-pointer select-none flex items-center gap-1"
          onClick={() => column.toggleSorting()}
        >
          Method
          {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
          {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
          {!column.getIsSorted() && <Icon icon="ri:sort-line" className="opacity-30" />}
        </div>
      ),
      cell: (info) => (
        <div className="w-[120px] break-words">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("date", {
      header: ({ column }) => (
        <div
          className="cursor-pointer select-none flex items-center gap-1"
          onClick={() => column.toggleSorting()}
        >
          Date
          {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
          {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
          {!column.getIsSorted() && <Icon icon="ri:sort-line" className="opacity-30" />}
        </div>
      ),
      cell: (info) => (
        <div className="w-[140px] break-words">
          {new Date(info.getValue()).toLocaleDateString()}
        </div>
      ),
    }),
    columnHelper.accessor("duration", {
      header: ({ column }) => (
        <div
          className="cursor-pointer select-none flex items-center gap-1"
          onClick={() => column.toggleSorting()}
        >
          Duration
          {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
          {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
          {!column.getIsSorted() && <Icon icon="ri:sort-line" className="opacity-30" />}
        </div>
      ),
      cell: (info) => (
        <div className="w-[120px] break-words">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("notes", {
      header: ({ column }) => (
        <div
          className="cursor-pointer select-none flex items-center gap-1"
          onClick={() => column.toggleSorting()}
        >
          Notes
          {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
          {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
          {!column.getIsSorted() && <Icon icon="ri:sort-line" className="opacity-30" />}
        </div>
      ),
      cell: (info) => (
        <div className="w-[250px] truncate" title={info.getValue()}>
          {info.getValue()?.length > 20
            ? `${info.getValue().substring(0, 20)}…`
            : info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("actions", {
      header: () => <div className="w-[120px] text-center">Actions</div>,
      enableSorting: false,
      cell: (info) => (
        <div className="flex w-[120px] gap-2">
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
      notes: "",
      personId: "",
    });
    setIsEditing(false);
    setIsModalOpen(false);
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
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
    <div className="max-w-9xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      <div className="flex justify-between items-center mb-6 pr-10">
        <div className="flex items-center gap-6">
          <h2 className="text-2xl font-semibold text-gray-800">Interactions</h2>
          <DownloadButtons
            backendUrl={backendUrl}
            auth={auth}
            type="interaction"
          />
        </div>
        <div className="">
          <button
            onClick={() => {
              setIsEditing(false);
              setCurrentInteraction({
                name: "",
                method: "",
                date: "",
                type: "",
                duration: "",
                notes: "",
              });
              setIsModalOpen(true);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Add Participants Interaction
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="w-[100px]">
          <input
            type="number"
            placeholder="ID"
            value={filters.id}
            onChange={(e) => handleFilterChange("id", e.target.value)}
            className="px-3 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-[110px]">
          <input
            type="text"
            placeholder="Account"
            value={filters.account}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "" || /^\d+$/.test(value)) {
                handleFilterChange("account", value);
              }
            }}
            className="px-3 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-[280px]">
          <input
            type="text"
            placeholder="Name"
            value={filters.name}
            onChange={(e) => handleFilterChange("name", e.target.value)}
            className="px-3 w-full py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative w-[140px]">
          <div
            onClick={() => setIsTypeOpen(!isTypeOpen)}
            className={`px-3 py-2 border rounded-md cursor-pointer flex items-center justify-between ${
              isTypeOpen ? "bg-gray-50" : ""
            }`}
          >
            {filters.type || "Type"}
            <span className="ml-2">▼</span>
          </div>
          {isTypeOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
              {types.map((type) => (
                <div
                  key={type}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    handleFilterChange("type", type === "Any" ? "" : type);
                    setIsTypeOpen(false);
                  }}
                >
                  {type}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative w-[140px]">
          <div
            onClick={() => setIsMethodOpen(!isMethodOpen)}
            className={`px-3 py-2 border rounded-md cursor-pointer flex items-center justify-between ${
              isMethodOpen ? "bg-gray-50" : ""
            }`}
          >
            {filters.method || "Method"}
            <span className="ml-2">▼</span>
          </div>
          {isMethodOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
              {methods.map((method) => (
                <div
                  key={method}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    handleFilterChange(
                      "method",
                      method === "Any" ? "" : method
                    );
                    setIsMethodOpen(false);
                  }}
                >
                  {method}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative w-[160px]">
          <div className="flex items-center">
            <input
              type="date"
              value={filters.date}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : "";
                const formattedDate = date
                  ? date.toISOString().split("T")[0]
                  : "";
                handleFilterChange("date", formattedDate);
              }}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
            {filters.date && (
              <button
                onClick={() => handleFilterChange("date", "")}
                className="absolute right-10 text-3xl hover:text-gray-700 text-gray-400"
                type="button"
                aria-label="Clear date"
              >
                ×
              </button>
            )}
            <Calendar
              className="absolute right-3 pointer-events-none text-gray-400"
              size={20}
            />
          </div>
        </div>

        <div className="relative w-[140px]">
          <div
            onClick={() => setIsDurationOpen(!isDurationOpen)}
            className={`px-3 py-2 border rounded-md cursor-pointer flex items-center justify-between ${
              isDurationOpen ? "bg-gray-50" : ""
            }`}
          >
            {filters.duration || "Duration"}
            <span className="ml-2">▼</span>
          </div>
          {isDurationOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
              {durations.map((duration) => (
                <div
                  key={duration}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    handleFilterChange(
                      "duration",
                      duration === "Any" ? "" : duration
                    );
                    setIsDurationOpen(false);
                  }}
                >
                  {duration}
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          type="text"
          placeholder="Notes"
          value={filters.notes}
          onChange={(e) => handleFilterChange("notes", e.target.value)}
          className="px-3 w-[260px] py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex-1 flex flex-col bg-white shadow-lg rounded-lg min-h-0">
        <div className="flex-1 overflow-auto min-h-0">
          <table className="min-w-full table-auto border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="bg-gray-100 text-gray-700 text-center text-sm"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 font-medium border text-left whitespace-nowrap"
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
                    <td
                      key={cell.id}
                      className="px-4 text-sm text-gray-600 border text-start"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t">
          <PaginationControls />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
                    className="flex text-sm font-medium text-gray-700 mb-1"
                  >
                    Person(s)
                  </label>
                  {isEditing ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                      {currentInteraction.name}
                    </div>
                  ) : (
                    <MultiPersonSelect
                      value={currentInteraction.persons}
                      onChange={(selectedPersons) => {
                        setCurrentInteraction((prev) => ({
                          ...prev,
                          persons: selectedPersons,
                        }));
                      }}
                    />
                  )}
                </div>
                <div>
                  <label
                    htmlFor="method"
                    className="flex text-sm font-medium text-gray-700 mb-1"
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
                    className="flex text-sm font-medium text-gray-700 mb-1"
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
                    className="flex text-sm font-medium text-gray-700 mb-1"
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
                    className="flex text-sm font-medium text-gray-700 mb-1"
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
                    htmlFor="notes"
                    className="flex text-sm font-medium text-gray-700 mb-1"
                  >
                    Note
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={currentInteraction.notes}
                    onChange={handleInputChange}
                    required
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
