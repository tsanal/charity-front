import React, { useState, useEffect, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import axios from "axios";
import CSVImportModal from "./ImportModal";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import { Icon } from "@iconify/react/dist/iconify.js";

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

const ContactTable = () => {
  const auth = useAuthHeader();
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    relationshipType: [],
    upliftStatus: [],
    gender: [],
    isDeleted: undefined,
  });
  const [isUpliftStatusOpen, setIsUpliftStatusOpen] = useState(false);
  const [isRelationshipTypeOpen, setIsRelationshipTypeOpen] = useState(false);
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isDeletedOpen, setIsDeletedOpen] = useState(false);
  const deletedRef = useRef(null);

  const relationshipRef = useRef(null);
  const upliftStatusRef = useRef(null);
  const genderRef = useRef(null);

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

  const fetchData = async (page = currentPage, itemsPerPage = perPage) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });

      const textFilters = [
        "account",
        "name",
        "race",
        "street",
        "city",
        "state",
        "zip",
        "county",
      ];

      textFilters.forEach((key) => {
        const value = searchFilters[key];
        if (value && typeof value === "string" && value.trim()) {
          params.append(key, value.trim());
        }
      });

      ["relationshipType", "upliftStatus", "gender"].forEach((key) => {
        const values = searchFilters[key];
        if (Array.isArray(values) && values.length) {
          values.forEach((value) => params.append(key, value));
        }
      });

      if (searchFilters.isDeleted !== undefined) {
        params.append("isDeleted", searchFilters.isDeleted.toString());
      }

      const url = `${backendUrl}/person?${params.toString()}`;
      console.log("Request URL:", url);

      const response = await axios.get(url, {
        headers: { Authorization: auth },
      });

      setData(response.data.results);
      const totalItems = response.data.totalCount;
      const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);
      setTotalPages(calculatedTotalPages);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  useEffect(() => {
    fetchData();
  }, [searchFilters, perPage, currentPage]);

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
      header: "Account",
      cell: (info) => (
        <div className="w-[110px] break-words pl-1">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("relationshipType", {
      header: "Relationship",
      cell: (info) => (
        <div className="w-[130px] break-words pl-1">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => (
        <div className="w-[140px] break-words pl-1">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("upliftStatus", {
      header: "Status",
      cell: (info) => (
        <div className="w-[128px] break-words pl-1">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("gender", {
      header: "Gender",
      cell: (info) => (
        <div className="w-[96px] break-words pl-1">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("race", {
      header: "Race",
      cell: (info) => (
        <div className="w-[112px] break-words pl-1">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("street", {
      header: "Street",
      cell: (info) => (
        <div className="w-[160px] break-words pl-1">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("city", {
      header: "City",
      cell: (info) => (
        <div className="w-[128px] break-words pl-1">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("state", {
      header: "State",
      cell: (info) => (
        <div className="w-[96px] break-words pl-1">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("zip", {
      header: "ZIP",
      cell: (info) => (
        <div className="w-[96px] break-words pl-1">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("county", {
      header: "County",
      cell: (info) => (
        <div className="w-[108px] break-words pl-1">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("isDeleted", {
      header: "Is Deleted",
      cell: (info) => (
        <div className="w-[126px] break-words pl-1">
          {info.getValue() ? <p>Yes</p> : <p>No</p>}
        </div>
      ),
    }),
    columnHelper.accessor("actions", {
      header: "Actions",
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
    getCoreRowModel: getCoreRowModel(),
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
    <div className="max-w-9xl mx-auto h-full">
      <div className="flex items-center gap-6 mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Contact Directory
        </h2>
        <div>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Import CSV
          </button>
        </div>
      </div>

      {/* Wrap the table and filters in a container with fixed height */}
      {/* <div className="h-[calc(100vh-12rem)] flex flex-col"> */}
      {/* Filter section */}
      {/* <div className="min-w-[1400px]"> */}

      {/* </div> */}

      {/* Table section with overflow */}
      <div className="flex-1 flex flex-col bg-white shadow-lg rounded-lg">
        {/* Table Wrapper with Horizontal Scroll */}
        <div className="overflow-x-auto flex-grow">
          <div className="flex gap-2.5 mb-4 align-center min-w-full">
            <div className="w-[106px]">
              <input
                type="text"
                placeholder="Account"
                value={searchFilters.account || ""}
                onChange={(e) =>
                  setSearchFilters((prev) => ({
                    ...prev,
                    account: e.target.value,
                  }))
                }
                className="px-2 py-1 border rounded"
                style={{ width: "inherit" }}
              />
            </div>

            <div className="relative w-[126px]" ref={relationshipRef}>
              <div
                onClick={() =>
                  setIsRelationshipTypeOpen(!isRelationshipTypeOpen)
                }
                className={`px-2 py-1 border rounded cursor-pointer text-gray-400 flex items-center gap-1 ${
                  isRelationshipTypeOpen ? "bg-gray-200" : ""
                }`}
              >
                Relationship <Icon icon="ri:arrow-down-s-line" />
              </div>
              {isRelationshipTypeOpen && (
                <div className="absolute z-99 border rounded bg-white mt-1 w-full shadow-lg flex flex-col">
                  {Object.values(RelationshipType).map((type) => (
                    <label
                      key={type}
                      className="py-2 hover:bg-gray-100 cursor-pointer flex px-2"
                    >
                      <input
                        type="checkbox"
                        value={type}
                        checked={searchFilters.relationshipType.includes(type)}
                        className="mr-2"
                        onChange={(e) => {
                          setSearchFilters((prev) => {
                            const currentValues = prev.relationshipType;
                            const updatedValues = e.target.checked
                              ? [...currentValues, type]
                              : currentValues.filter((val) => val !== type);
                            return {
                              ...prev,
                              relationshipType: updatedValues,
                            };
                          });
                        }}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="w-[136px]">
              <input
                type="text"
                placeholder="Name"
                value={searchFilters.name || ""}
                onChange={(e) =>
                  setSearchFilters((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="px-2 py-1 border rounded"
                style={{ width: "inherit" }}
              />
            </div>

            <div className="w-[124px] relative" ref={upliftStatusRef}>
              <div
                onClick={() => setIsUpliftStatusOpen(!isUpliftStatusOpen)}
                className={`px-2 py-1 border text-gray-400 rounded cursor-pointer flex items-center gap-1 ${
                  isUpliftStatusOpen ? "bg-gray-200" : ""
                }`}
                style={{ width: "inherit" }}
              >
                Status <Icon icon="ri:arrow-down-s-line" />
              </div>
              {isUpliftStatusOpen && (
                <div className="absolute z-10 border rounded bg-white mt-1 w-full shadow-lg flex flex-col">
                  {Object.values(UpliftStatus).map((type) => (
                    <label
                      key={type}
                      className="py-2 hover:bg-gray-100 cursor-pointer flex px-2"
                    >
                      <input
                        type="checkbox"
                        value={type}
                        checked={searchFilters.upliftStatus.includes(type)}
                        className="mr-2"
                        onChange={(e) => {
                          setSearchFilters((prev) => {
                            const currentValues = prev.upliftStatus;
                            const updatedValues = e.target.checked
                              ? [...currentValues, type]
                              : currentValues.filter((val) => val !== type);
                            return {
                              ...prev,
                              upliftStatus: updatedValues,
                            };
                          });
                        }}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="w-[92px] relative" ref={genderRef}>
              <div
                onClick={() => setIsGenderOpen(!isGenderOpen)}
                className={`px-2 py-1 border text-gray-400 rounded cursor-pointer flex items-center gap-1 ${
                  isGenderOpen ? "bg-gray-200" : ""
                }`}
              >
                Gender <Icon icon="ri:arrow-down-s-line" />
              </div>
              {isGenderOpen && (
                <div className="absolute z-10 border rounded bg-white mt-1 w-full shadow-lg flex flex-col">
                  {Object.values(Gender).map((type) => (
                    <label
                      key={type}
                      className="py-2 hover:bg-gray-100 cursor-pointer flex px-2"
                    >
                      <input
                        type="checkbox"
                        value={type}
                        checked={searchFilters.gender.includes(type)}
                        className="mr-2"
                        onChange={(e) => {
                          setSearchFilters((prev) => {
                            const currentValues = prev.gender;
                            const updatedValues = e.target.checked
                              ? [...currentValues, type]
                              : currentValues.filter((val) => val !== type);
                            return {
                              ...prev,
                              gender: updatedValues,
                            };
                          });
                        }}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="w-[108px]">
              <input
                type="text"
                placeholder="Race"
                value={searchFilters.race || ""}
                onChange={(e) =>
                  setSearchFilters((prev) => ({
                    ...prev,
                    race: e.target.value,
                  }))
                }
                className="px-2 py-1 border rounded"
                style={{ width: "inherit" }}
              />
            </div>
            <div className="w-[156px]">
              <input
                type="text"
                placeholder="Street"
                value={searchFilters.street || ""}
                onChange={(e) =>
                  setSearchFilters((prev) => ({
                    ...prev,
                    street: e.target.value,
                  }))
                }
                className="px-2 py-1 border rounded"
                style={{ width: "inherit" }}
              />
            </div>
            <div className="w-[124px]">
              <input
                type="text"
                placeholder="City"
                value={searchFilters.city || ""}
                onChange={(e) =>
                  setSearchFilters((prev) => ({
                    ...prev,
                    city: e.target.value,
                  }))
                }
                className="px-2 py-1 border rounded"
                style={{ width: "inherit" }}
              />
            </div>
            <div className="w-[92px]">
              <input
                type="text"
                placeholder="State"
                value={searchFilters.state || ""}
                onChange={(e) =>
                  setSearchFilters((prev) => ({
                    ...prev,
                    state: e.target.value,
                  }))
                }
                className="px-2 py-1 border rounded"
                style={{ width: "inherit" }}
              />
            </div>
            <div className="w-[92px]">
              <input
                type="text"
                placeholder="Zip"
                value={searchFilters.zip || ""}
                onChange={(e) =>
                  setSearchFilters((prev) => ({ ...prev, zip: e.target.value }))
                }
                className="px-2 py-1 border rounded"
                style={{ width: "inherit" }}
              />
            </div>
            <div className="w-[104px]">
              <input
                type="text"
                placeholder="County"
                value={searchFilters.county || ""}
                onChange={(e) =>
                  setSearchFilters((prev) => ({
                    ...prev,
                    county: e.target.value,
                  }))
                }
                className="px-2 py-1 border rounded"
                style={{ width: "inherit" }}
              />
            </div>
            <div className="relative w-[122px]" ref={deletedRef}>
              <div
                onClick={() => setIsDeletedOpen(!isDeletedOpen)}
                className={`px-2 py-1 border text-gray-400 rounded cursor-pointer flex items-center justify-between ${
                  isDeletedOpen ? "bg-gray-200" : ""
                }`}
                style={{ width: "inherit" }}
              >
                <span>
                  {searchFilters.isDeleted === undefined
                    ? "All"
                    : searchFilters.isDeleted
                    ? "Deleted"
                    : "Active"}
                </span>
                <Icon icon="ri:arrow-down-s-line" />
              </div>
              {isDeletedOpen && (
                <div className="absolute z-10 border rounded bg-white mt-1 w-full shadow-lg flex flex-col">
                  <label
                    className="py-2 hover:bg-gray-100 cursor-pointer flex px-2"
                    onClick={() => {
                      setSearchFilters((prev) => {
                        const { isDeleted, ...rest } = prev;
                        return rest;
                      });
                      setIsDeletedOpen(false);
                    }}
                  >
                    All Records
                  </label>
                  <label
                    className="py-2 hover:bg-gray-100 cursor-pointer flex px-2"
                    onClick={() => {
                      setSearchFilters((prev) => ({
                        ...prev,
                        isDeleted: false,
                      }));
                      setIsDeletedOpen(false);
                    }}
                  >
                    Active
                  </label>
                  <label
                    className="py-2 hover:bg-gray-100 cursor-pointer flex px-2"
                    onClick={() => {
                      setSearchFilters((prev) => ({
                        ...prev,
                        isDeleted: true,
                      }));
                      setIsDeletedOpen(false);
                    }}
                  >
                    Deleted
                  </label>
                </div>
              )}
            </div>
          </div>
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
                      className="px-4 py-3 font-medium border-b border-r"
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

        {/* Always Visible Horizontal Scrollbar */}
        <div className="overflow-x-auto">
          <div className="w-full h-2"></div>
        </div>

        {/* Pagination */}
        <PaginationControls />
      </div>

      {/* </div> */}

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
