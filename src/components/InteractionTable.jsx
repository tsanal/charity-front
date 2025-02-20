import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import axios from "axios";
import MultiPersonSelect from "./MultiplePersonSelect";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import { Calendar } from "lucide-react";
import DownloadButtons from "./DoanloadButton";
import { Icon } from "@iconify/react";
import { debounce } from "lodash";

const TextFilter = React.memo(({ column, type }) => {
  const [value, setValue] = useState(column.getFilterValue() ?? '');

  const onChangeDebounced = useCallback(
    debounce((value) => {
      column.setFilterValue(value);
    }, 500),
    [column]
  );

  const onChange = useCallback((e) => {
    let newValue = e.target.value;
    // If type is 'number', only allow numeric input
    if (type === 'number') {
      newValue = newValue.replace(/[^0-9]/g, '');
    }
    setValue(newValue);
    onChangeDebounced(newValue);
  }, [onChangeDebounced, type]);

  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder="Filter..."
      className="w-full px-2 py-1 border rounded text-sm"
    />
  );
});

const SelectFilter = React.memo(({ column, options }) => {
  return (
    <select
      value={column.getFilterValue() ?? ''}
      onChange={e => column.setFilterValue(e.target.value)}
      className="w-full px-2 py-1 border rounded text-sm"
    >
      <option value="">All</option>
      {options.map(option => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
});

const DateFilter = React.memo(({ column }) => {
  const [value, setValue] = useState(column.getFilterValue() ?? '');

  const onChange = useCallback((e) => {
    const date = e.target.value;
    setValue(date);
    
    if (date) {
      // Convert to UTC for consistency
      const localDate = new Date(date);
      const utcDate = new Date(Date.UTC(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate(),
        12,
        0,
        0,
        0
      ));
      column.setFilterValue(utcDate.toISOString());
    } else {
      column.setFilterValue('');
    }
  }, [column]);

  const handleClear = useCallback(() => {
    setValue('');
    column.setFilterValue('');
  }, [column]);

  return (
    <div className="relative">
      <input
        type="date"
        value={value}
        onChange={onChange}
        className="w-full px-2 py-1 border rounded text-sm"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-0 top-[-11] -translate-y-1/2 text-gray-400 hover:text-gray-600 text-2xl"
          type="button"
        >
          ×
        </button>
      )}
    </div>
  );
});

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
  const methodRef = useRef(null);
  const typeRef = useRef(null);
  const durationRef = useRef(null);

  const [columnFilters, setColumnFilters] = useState([]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (methodRef.current && !methodRef.current.contains(event.target)) {
        setIsMethodOpen(false);
      }

      if (typeRef.current && !typeRef.current.contains(event.target)) {
        setIsTypeOpen(false);
      }

      if (durationRef.current && !durationRef.current.contains(event.target)) {
        setIsDurationOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const types = [
    "Any",
    "Follow-up",
    "Initial Contact",
    "Meeting",
    "Support",

    "Uplift",
    "Mini Grant",
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
    if (key === 'date' && value) {
      // Convert filter date to UTC
      const localDate = new Date(value);
      const utcDate = new Date(Date.UTC(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate(),
        12,
        0,
        0,
        0
      ));
      value = utcDate.toISOString();
    }
    
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    fetchData(1, perPage, newFilters);
  };

  const fetchData = useCallback(
    debounce(() => {
      const fetchDataAsync = async () => {
        try {
          const params = new URLSearchParams();
          
          if (sorting.length > 0) {
            params.append("sortBy", sorting[0].id);
            params.append("sortType", sorting[0].desc ? "desc" : "asc");
          }

          columnFilters.forEach(filter => {
            params.append(filter.id, filter.value);
          });

          params.append("page", currentPage.toString());
          params.append("limit", perPage.toString());

          const response = await axios.get(
            `${backendUrl}/interaction?${params.toString()}`,
            {
              headers: { Authorization: auth },
            }
          );

          setData(response.data.data);
          setTotalPages(Math.ceil(response.data.meta.total / perPage));
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
      fetchDataAsync();
    }, 300),
    [sorting, columnFilters, currentPage, perPage, auth, backendUrl]
  );

  useEffect(() => {
    fetchData();
  }, [sorting, columnFilters, currentPage, perPage]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for date input
    if (name === 'date') {
      // Create date object in local timezone
      const localDate = new Date(value);
      // Convert to UTC keeping the same calendar date
      const utcDate = new Date(Date.UTC(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate(),
        12, // Set to noon UTC to avoid timezone issues
        0,
        0,
        0
      ));
      
      setCurrentInteraction(prev => ({
        ...prev,
        [name]: utcDate.toISOString().split('T')[0]
      }));
    } else {
      setCurrentInteraction(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEdit = (interaction) => {
    setCurrentInteraction({
      ...interaction,
      date: interaction.date,
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
        <div>
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            ID
            {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
            {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
            {!column.getIsSorted() && (
              <Icon icon="ri:sort-line" className="opacity-30" />
            )}
          </div>
          <div className="mt-2">
            <TextFilter column={column} type="number" />
          </div>
        </div>
      ),
      filterFn: 'includesString'
    }),
    columnHelper.accessor("account", {
      header: ({ column }) => (
        <div>
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            Account
            {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
            {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
            {!column.getIsSorted() && (
              <Icon icon="ri:sort-line" className="opacity-30" />
            )}
          </div>
          <div className="mt-2">
            <TextFilter column={column} type="number" />
          </div>
        </div>
      ),
      filterFn: 'includesString'
    }),
    columnHelper.accessor("name", {
      header: ({ column }) => (
        <div>
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            Name
            {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
            {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
            {!column.getIsSorted() && (
              <Icon icon="ri:sort-line" className="opacity-30" />
            )}
          </div>
          <div className="mt-2">
            <TextFilter column={column} type="number" />
          </div>
        </div>
      ),
      filterFn: 'includesString'
    }),
    columnHelper.accessor("type", {
      header: ({ column }) => (
        <div>
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            Type
            {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
            {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
            {!column.getIsSorted() && (
              <Icon icon="ri:sort-line" className="opacity-30" />
            )}
          </div>
          <div className="mt-2">
            <SelectFilter 
              column={column} 
              options={types.filter(t => t !== 'Any')} 
            />
          </div>
        </div>
      ),
      filterFn: 'equals'
    }),
    columnHelper.accessor("method", {
      header: ({ column }) => (
        <div>
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            Method
            {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
            {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
            {!column.getIsSorted() && (
              <Icon icon="ri:sort-line" className="opacity-30" />
            )}
          </div>
          <div className="mt-2">
            <SelectFilter 
              column={column} 
              options={methods.filter(m => m !== 'Any')} 
            />
          </div>
        </div>
      ),
      filterFn: 'equals'
    }),
    columnHelper.accessor("date", {
      header: ({ column }) => (
        <div>
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            Date
            {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
            {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
            {!column.getIsSorted() && (
              <Icon icon="ri:sort-line" className="opacity-30" />
            )}
          </div>
          <div className="mt-2">
            <DateFilter column={column} />
          </div>
        </div>
      ),
      cell: (info) => (
        <div className="w-[140px] break-words">
          {formatDisplayDate(info.getValue())}
        </div>
      ),
      filterFn: 'equals'
    }),
    columnHelper.accessor("duration", {
      header: ({ column }) => (
        <div>
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            Duration
            {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
            {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
            {!column.getIsSorted() && (
              <Icon icon="ri:sort-line" className="opacity-30" />
            )}
          </div>
          <div className="mt-2">
            <SelectFilter 
              column={column} 
              options={durations.filter(d => d !== 'Any')} 
            />
          </div>
        </div>
      ),
      cell: (info) => (
        <div className="w-[120px] break-words">{info.getValue()}</div>
      ),
      filterFn: 'equals'
    }),
    columnHelper.accessor("notes", {
      header: ({ column }) => (
        <div>
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            Notes
            {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
            {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
            {!column.getIsSorted() && (
              <Icon icon="ri:sort-line" className="opacity-30" />
            )}
          </div>
          <div className="mt-2">
            <TextFilter column={column} type="number" />
          </div>
        </div>
      ),
      cell: (info) => (
        <div className="w-[250px] truncate" title={info.getValue()}>
          {info.getValue()?.length > 35
            ? `${info.getValue().substring(0, 35)}…`
            : info.getValue()}
        </div>
      ),
      filterFn: 'includesString'
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
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualSorting: true,
    manualFiltering: true,
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

  const getCurrentDate = () => {
    const today = new Date();
    // Convert to UTC date string
    const utcDate = new Date(Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      12,
      0,
      0,
      0
    ));
    return utcDate.toISOString().split('T')[0];
  };

  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    // Format date in local timezone
    return date.toLocaleDateString();
  };

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
                    max={getCurrentDate()}
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
