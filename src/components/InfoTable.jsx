import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  getFilterModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
} from "@tanstack/react-table";
import axios from "axios";
import CSVImportModal from "./ImportModal";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import { Icon } from "@iconify/react/dist/iconify.js";
import DownloadButton from "./DoanloadButton";
import { debounce } from "lodash";

const RelationshipType = {
  Donor: "Donor",
  Participant: "Participant",
  Outreach: "Outreach",
  Volunteer: "Volunteer",
  Grant: "Grant",
  Vendor: "Vendor",
  Media: "Media",
};

const UpliftStatus = {
  Prospective: "Prospective",

  Inactive: "Inactive",
  Active: "Active",
};

const Gender = {
  Male: "Male",
  Female: "Female",
};

const DebouncedInput = React.memo(({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value]);

  const handleChange = React.useCallback((e) => {
    setValue(e.target.value);
  }, []);

  return (
    <input
      {...props}
      value={value}
      onChange={handleChange}
    />
  );
});

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

const ContactTable = () => {
  const auth = useAuthHeader();
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isUpliftStatusOpen, setIsUpliftStatusOpen] = useState(false);
  const [isRelationshipTypeOpen, setIsRelationshipTypeOpen] = useState(false);
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isDeletedOpen, setIsDeletedOpen] = useState(false);
  const deletedRef = useRef(null);

  const relationshipRef = useRef(null);
  const upliftStatusRef = useRef(null);
  const genderRef = useRef(null);

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({});

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        relationshipRef.current &&
        !relationshipRef.current.contains(event.target)
      ) {
        setIsRelationshipTypeOpen(false);
      }

      if (
        upliftStatusRef.current &&
        !upliftStatusRef.current.contains(event.target)
      ) {
        setIsUpliftStatusOpen(false);
      }

      if (deletedRef.current && !deletedRef.current.contains(event.target)) {
        setIsDeletedOpen(false);
      }

      if (genderRef.current && !genderRef.current.contains(event.target)) {
        setIsGenderOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
            `${backendUrl}/person?${params.toString()}`,
            {
              headers: { Authorization: auth },
            }
          );

          setData(response.data.results);
          setTotalPages(Math.ceil(response.data.totalCount / perPage));
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

  const handleRestore = async (id) => {
    if (window.confirm("Are you sure you want to restore this contact?")) {
      try {
        await axios.put(
          `${backendUrl}/person/${id}/restore`,
          {},
          {
            headers: {
              Authorization: auth,
            },
          }
        );
        await fetchData();
      } catch (error) {
        console.error("Error restoring contact:", error);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      try {
        await axios.put(
          `${backendUrl}/person/${id}`,
          {},
          {
            headers: {
              Authorization: auth,
            },
          }
        );
        await fetchData();
      } catch (error) {
        console.error("Error deleting contact:", error);
      }
    }
  };

  const columnHelper = createColumnHelper();

  const columns = [
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
            <TextFilter 
              column={column} 
              type="number"
            />
          </div>
        </div>
      ),
      cell: (info) => (
        <div className="w-[110px] text-start pl-1">{info.getValue()}</div>
      ),
      filterFn: 'includesString'
    }),
    columnHelper.accessor("relationshipType", {
      header: ({ column }) => (
        <div>
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            Relationship
            {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
            {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
            {!column.getIsSorted() && (
              <Icon icon="ri:sort-line" className="opacity-30" />
            )}
          </div>
          <div className="mt-2">
            <SelectFilter 
              column={column} 
              options={Object.values(RelationshipType)} 
            />
          </div>
        </div>
      ),
      cell: (info) => (
        <div className="w-[130px] text-start break-words pl-1">
          {info.getValue()}
        </div>
      ),
      filterFn: 'equals'
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
            <TextFilter column={column} />
          </div>
        </div>
      ),
      cell: (info) => (
        <div
          className="w-[140px] text-start break-words pl-1"
          title={info.getValue()}
        >
          {info.getValue()?.length > 15
            ? `${info.getValue().substring(0, 15)}…`
            : info.getValue()}
        </div>
      ),
      filterFn: 'includesString'
    }),
    columnHelper.accessor("upliftStatus", {
      header: ({ column }) => (
        <div>
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            Status
            {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
            {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
            {!column.getIsSorted() && (
              <Icon icon="ri:sort-line" className="opacity-30" />
            )}
          </div>
          <div className="mt-2">
            <SelectFilter 
              column={column} 
              options={Object.values(UpliftStatus)} 
            />
          </div>
        </div>
      ),
      cell: (info) => (
        <div className="w-[128px] text-start break-words pl-1">
          {info.getValue()}
        </div>
      ),
      filterFn: 'equals'
    }),
    columnHelper.accessor("gender", {
      header: ({ column }) => (
        <div>
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            Gender
            {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
            {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
            {!column.getIsSorted() && (
              <Icon icon="ri:sort-line" className="opacity-30" />
            )}
          </div>
          <div className="mt-2">
            <SelectFilter 
              column={column} 
              options={Object.values(Gender)} 
            />
          </div>
        </div>
      ),
      cell: (info) => (
        <div className="w-[96px] text-start break-words pl-1">
          {info.getValue()}
        </div>
      ),
      filterFn: 'equals'
    }),
    columnHelper.accessor("race", {
      header: ({ column }) => (
        <div>
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            Race
            {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
            {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
            {!column.getIsSorted() && (
              <Icon icon="ri:sort-line" className="opacity-30" />
            )}
          </div>
          <div className="mt-2">
            <TextFilter column={column} />
          </div>
        </div>
      ),
      cell: (info) => (
        <div
          className="w-[112px] text-start break-words pl-1"
          title={info.getValue()}
        >
          {info.getValue()?.length > 15
            ? `${info.getValue().substring(0, 15)}…`
            : info.getValue()}
        </div>
      ),
      filterFn: 'includesString'
    }),
    columnHelper.accessor("street", {
      header: ({ column }) => (
        <div>
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            Street
            {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
            {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
            {!column.getIsSorted() && (
              <Icon icon="ri:sort-line" className="opacity-30" />
            )}
          </div>
          <div className="mt-2">
            <TextFilter column={column} />
          </div>
        </div>
      ),
      cell: (info) => (
        <div
          className="w-[160px] text-start break-words pl-1"
          title={info.getValue()}
        >
          {info.getValue()?.length > 20
            ? `${info.getValue().substring(0, 20)}…`
            : info.getValue()}
        </div>
      ),
      filterFn: 'includesString'
    }),
    columnHelper.accessor("city", {
      header: ({ column }) => (
        <div>
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            City
            {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
            {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
            {!column.getIsSorted() && (
              <Icon icon="ri:sort-line" className="opacity-30" />
            )}
          </div>
          <div className="mt-2">
            <TextFilter column={column} />
          </div>
        </div>
      ),
      cell: (info) => (
        <div className="w-[128px] text-start break-words pl-1">
          {info.getValue()}
        </div>
      ),
      filterFn: 'includesString'
    }),
    columnHelper.accessor("state", {
      header: ({ column }) => (
        <div>
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            State
            {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
            {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
            {!column.getIsSorted() && (
              <Icon icon="ri:sort-line" className="opacity-30" />
            )}
          </div>
          <div className="mt-2">
            <TextFilter column={column} />
          </div>
        </div>
      ),
      cell: (info) => (
        <div className="w-[96px] text-start break-words pl-1">
          {info.getValue()}
        </div>
      ),
      filterFn: 'includesString'
    }),
    columnHelper.accessor("zip", {
      header: ({ column }) => (
        <div>
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            ZIP
            {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
            {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
            {!column.getIsSorted() && (
              <Icon icon="ri:sort-line" className="opacity-30" />
            )}
          </div>
          <div className="mt-2">
            <TextFilter column={column} />
          </div>
        </div>
      ),
      cell: (info) => (
        <div className="w-[96px] text-start break-words pl-1">
          {info.getValue()}
        </div>
      ),
      filterFn: 'includesString'
    }),
    columnHelper.accessor("county", {
      header: ({ column }) => (
        <div>
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            County
            {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
            {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
            {!column.getIsSorted() && (
              <Icon icon="ri:sort-line" className="opacity-30" />
            )}
          </div>
          <div className="mt-2">
            <TextFilter column={column} />
          </div>
        </div>
      ),
      cell: (info) => (
        <div className="w-[108px] break-words pl-1">{info.getValue()}</div>
      ),
      filterFn: 'includesString'
    }),
    columnHelper.accessor("isDeleted", {
      header: ({ column }) => (
        <div>
          <div
            className="cursor-pointer select-none flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            Is Deleted
            {column.getIsSorted() === "asc" && <Icon icon="ri:sort-asc" />}
            {column.getIsSorted() === "desc" && <Icon icon="ri:sort-desc" />}
            {!column.getIsSorted() && (
              <Icon icon="ri:sort-line" className="opacity-30" />
            )}
          </div>
          <div className="mt-2">
            <SelectFilter 
              column={column} 
              options={['true', 'false']} 
            />
          </div>
        </div>
      ),
      cell: (info) => (
        <div className="w-[126px] text-start break-words pl-1">
          {info.getValue() ? <p>Yes</p> : <p>No</p>}
        </div>
      ),
      filterFn: 'equals'
    }),
    columnHelper.accessor("actions", {
      header: "Actions",
      enableSorting: false,
      cell: (info) => (
        <div className="w-20 pl-1">
          {!info.row.original.isDeleted ? (
            <button
              onClick={() => handleDelete(info.row.original.id)}
              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
            >
              Delete
            </button>
          ) : (
            <button
              onClick={() => handleRestore(info.row.original.id)}
              className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
            >
              Restore
            </button>
          )}
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualSorting: true,
    manualFiltering: true,
    enableColumnFilters: true,
  });

  const PaginationControls = () => {
    const generatePageNumbers = () => {
      const pageNumbers = [];
      const maxPagesToShow = 5;

      pageNumbers.push(1);

      let startPage = Math.max(2, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      if (endPage === totalPages) {
        startPage = Math.max(2, totalPages - maxPagesToShow + 1);
      }

      if (startPage > 2) {
        pageNumbers.push("...");
      }

      for (let i = startPage; i <= endPage; i++) {
        if (i !== 1 && i !== totalPages) {
          pageNumbers.push(i);
        }
      }

      if (endPage < totalPages) {
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }

      return pageNumbers;
    };

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex items-center">
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setCurrentPage(1); // Reset to first page when changing items per page
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

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-gray-100 text-gray-800 disabled:opacity-50"
          >
            Previous
          </button>

          {generatePageNumbers().map((pageNum, index) => (
            <button
              key={index}
              onClick={() =>
                typeof pageNum === "number" && setCurrentPage(pageNum)
              }
              className={`
                px-3 py-1 rounded 
                ${
                  pageNum === currentPage
                    ? "bg-blue-500 text-white"
                    : pageNum === "..."
                    ? "cursor-default text-gray-400"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }
                ${typeof pageNum === "number" ? "mx-1" : "mx-0"}
              `}
              disabled={pageNum === "..."}
            >
              {pageNum}
            </button>
          ))}

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
  };

  return (
    <div className="max-w-9xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      <div className="flex justify-between items-center gap-6 mb-6 pr-10">
        <div className="flex gap-4 items-center">
          <h2 className="text-2xl font-semibold text-gray-800">
            Contact Directory
          </h2>
          <DownloadButton auth={auth} type="person" backendUrl={backendUrl} />
        </div>

        <div>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Import Excel
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white shadow-lg rounded-lg min-h-0">
        <div className="flex-1 overflow-auto min-h-0">
          <table className="min-w-full table-auto border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
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
                      className="text-sm text-gray-600 border text-start"
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

      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          fetchData();
        }}
        backendUrl={backendUrl}
        auth={auth}
      />
    </div>
  );
};

export default ContactTable;
