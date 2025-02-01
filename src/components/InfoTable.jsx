import React, { useState, useEffect } from "react";
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
  Inactive: "Inactive",
  Active: "Active",
  Prospective: "Prospective",
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
  const [perPage, setPerPage] = useState(25);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentContact, setCurrentContact] = useState({
    name: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    relationshipType: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    relationshipType: [],
    upliftStatus: [],
    gender: [],
  });
  const [isUpliftStatusOpen, setIsUpliftStatusOpen] = useState(false);
  const [isRelationshipTypeOpen, setIsRelationshipTypeOpen] = useState(false);
  const [isGenderOpen, setIsGenderOpen] = useState(false);

  const toggleFilter = (filterName, value) => {
    setSearchFilters((prev) => {
      const currentFilters = prev[filterName] || [];
      const isSelected = currentFilters.includes(value);

      return {
        ...prev,
        [filterName]: isSelected
          ? currentFilters.filter((item) => item !== value)
          : [...currentFilters, value],
      };
    });
  };

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

      const url = `${backendUrl}/person?${params.toString()}`;

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
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentContact((prev) => ({
      ...prev,
      [name]: value || "", // Ensure empty strings instead of null
    }));
  };

  const handleEdit = (contact) => {
    const editContact = {
      name: contact.name || "",
      street: contact.street || "",
      city: contact.city || "",
      state: contact.state || "",
      zip: contact.zip || "",
      relationshipType: contact.relationshipType || "",
      upliftStatus: contact.upliftStatus || "",
      gender: contact.gender || "",
      race: contact.race || "",
      county: contact.county || "",
      isDeleted: contact.isDeleted || false,
    };

    setCurrentContact(editContact);
    setEditingId(contact.id);
    setIsEditing(true);
    setIsModalOpen(true);
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
      cell: (info) => <div className="truncate flex ">{info.getValue()}</div>,
    }),

    columnHelper.accessor("relationshipType", {
      header: "Relationship",
      cell: (info) => <div className="truncate flex ">{info.getValue()}</div>,
    }),
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => <div className="truncate flex">{info.getValue()}</div>,
    }),
    columnHelper.accessor("upliftStatus", {
      header: "No Change",
      cell: (info) => <div className="truncate flex">{info.getValue()}</div>,
    }),

    columnHelper.accessor("gender", {
      header: "Gender",
      cell: (info) => <div className="truncate flex">{info.getValue()}</div>,
    }),
    columnHelper.accessor("race", {
      header: "Race",
      cell: (info) => <div className="truncate flex">{info.getValue()}</div>,
    }),
    columnHelper.accessor("street", {
      header: "Street",
      cell: (info) => <div className="truncate flex">{info.getValue()}</div>,
    }),
    columnHelper.accessor("city", {
      header: "City",
      cell: (info) => <div className="truncate flex">{info.getValue()}</div>,
    }),
    columnHelper.accessor("state", {
      header: "State",
      cell: (info) => <div className="truncate flex">{info.getValue()}</div>,
    }),
    columnHelper.accessor("zip", {
      header: "ZIP",
      cell: (info) => <div className="truncate flex">{info.getValue()}</div>,
    }),

    columnHelper.accessor("county", {
      header: "County",
      cell: (info) => <div className="truncate flex">{info.getValue()}</div>,
    }),
    columnHelper.accessor("isDeleted", {
      header: "Is Deleted",
      cell: (info) => (
        <div className="truncate">
          {info.getValue() ? <p>Yes</p> : <p>No</p>}
        </div>
      ),
    }),
    columnHelper.accessor("actions", {
      header: "Actions",
      cell: (info) => (
        <div className="flex gap-2">
          {info.row.original.isDeleted && (
            <button
              onClick={() => handleEdit(info.row.original)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
            >
              Edit
            </button>
          )}
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
    setCurrentContact({
      name: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      relationshipType: "",
      upliftStatus: "",
      race: "",
      gender: "",
      county: "",
    });
    setEditingId(null);
    setIsEditing(false);
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submitData = {
      name: currentContact.name || "",
      street: currentContact.street || "",
      city: currentContact.city || "",
      state: currentContact.state || "",
      zip: currentContact.zip || "",
      relationshipType: currentContact.relationshipType || "",
      upliftStatus: currentContact.upliftStatus || "",
      race: currentContact.race || "",
      gender: currentContact.gender || "",
      county: currentContact.county || "",
    };

    try {
      await axios.patch(`${backendUrl}/person/${editingId}`, submitData, {
        headers: {
          Authorization: auth,
        },
      });
      await fetchData();
      resetModal();
    } catch (error) {
      console.error("Error updating contact:", error);
      alert(error.response?.data?.message || "Error updating contact");
    } finally {
      setIsSubmitting(false);
    }
  };
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
    <div className="px-4 py-8 max-w-9xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Contact Directory
        </h2>
        <div className="flex gap-10">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            )}
          </div>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Import CSV
          </button>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-2 mb-4 align-center">
        <input
          type="text"
          placeholder="Account"
          value={searchFilters.account || ""}
          onChange={(e) =>
            setSearchFilters((prev) => ({ ...prev, account: e.target.value }))
          }
          className="px-2 py-1 border rounded"
        />
        <div className="relative">
          <div
            onClick={() => setIsRelationshipTypeOpen(!isRelationshipTypeOpen)}
            className={`px-2 py-1 border rounded cursor-pointer flex items-center gap-1 ${
              isRelationshipTypeOpen ? "bg-gray-200" : ""
            }`}
          >
            Relationship <Icon icon="ri:arrow-down-s-line" />
          </div>
          {isRelationshipTypeOpen && (
            <div className="absolute z-10 border rounded bg-white mt-1 w-30 shadow-lg flex flex-col">
              {Object.values(RelationshipType).map((type) => (
                <label
                  key={type}
                  className="py-2 hover:bg-gray-100 cursor-pointer flex px-2 "
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

        <input
          type="text"
          placeholder="Name"
          value={searchFilters.name || ""}
          onChange={(e) =>
            setSearchFilters((prev) => ({ ...prev, name: e.target.value }))
          }
          className="px-2 py-1 border rounded"
        />

        <div>
          <div
            onClick={() => setIsUpliftStatusOpen(!isUpliftStatusOpen)}
            className={`px-2 py-1 border rounded cursor-pointer flex items-center gap-1 ${
              isUpliftStatusOpen ? "bg-gray-200" : ""
            }`}
          >
            Uplift Status <Icon icon="ri:arrow-down-s-line" />
          </div>
          {isUpliftStatusOpen && (
            <div className="absolute z-10 border rounded bg-white mt-1 w-30 shadow-lg flex flex-col">
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
        <div>
          <div
            onClick={() => setIsGenderOpen(!isGenderOpen)}
            className={`px-2 py-1 border rounded cursor-pointer flex items-center gap-1 ${
              isGenderOpen ? "bg-gray-200" : ""
            }`}
          >
            Gender <Icon icon="ri:arrow-down-s-line" />
          </div>
          {isGenderOpen && (
            <div className="absolute z-10 border rounded bg-white mt-1 w-30 shadow-lg flex flex-col">
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
        <input
          type="text"
          placeholder="Race"
          value={searchFilters.race || ""}
          onChange={(e) =>
            setSearchFilters((prev) => ({ ...prev, race: e.target.value }))
          }
          className="px-2 py-1 border rounded"
        />
        <input
          type="text"
          placeholder="Street"
          value={searchFilters.street || ""}
          onChange={(e) =>
            setSearchFilters((prev) => ({ ...prev, street: e.target.value }))
          }
          className="px-2 py-1 border rounded"
        />
        <input
          type="text"
          placeholder="City"
          value={searchFilters.city || ""}
          onChange={(e) =>
            setSearchFilters((prev) => ({ ...prev, city: e.target.value }))
          }
          className="px-2 py-1 border rounded"
        />
        <input
          type="text"
          placeholder="State"
          value={searchFilters.state || ""}
          onChange={(e) =>
            setSearchFilters((prev) => ({ ...prev, state: e.target.value }))
          }
          className="px-2 py-1 border rounded"
        />
        <input
          type="text"
          placeholder="Zip Code"
          value={searchFilters.zip || ""}
          onChange={(e) =>
            setSearchFilters((prev) => ({ ...prev, zip: e.target.value }))
          }
          className="px-2 py-1 border rounded"
        />
        <input
          type="text"
          placeholder="County"
          value={searchFilters.county || ""}
          onChange={(e) =>
            setSearchFilters((prev) => ({ ...prev, county: e.target.value }))
          }
          className="px-2 py-1 border rounded"
        />
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
                  <td key={cell.id} className="text-sm text-gray-600 border">
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
              <h3 className="text-lg font-semibold">Edit Contact</h3>
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
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={currentContact.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="street"
                    className="flex text-sm font-medium text-gray-700 mb-1"
                  >
                    Street
                  </label>
                  <input
                    id="street"
                    name="street"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={currentContact.street}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="city"
                      className="flex text-sm font-medium text-gray-700 mb-1"
                    >
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={currentContact.city}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="state"
                      className="flex text-sm font-medium text-gray-700 mb-1"
                    >
                      State
                    </label>
                    <input
                      id="state"
                      name="state"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={currentContact.state}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="zip"
                    className="flex text-sm font-medium text-gray-700 mb-1"
                  >
                    ZIP Code
                  </label>
                  <input
                    id="zip"
                    name="zip"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={currentContact.zip}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="relationshipType"
                    className="flex text-sm font-medium text-gray-700 mb-1"
                  >
                    Relationship Type
                  </label>
                  <select
                    id="relationshipType"
                    name="relationshipType"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={currentContact.relationshipType}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a relationship type</option>
                    <option value="Donor">Donor</option>
                    <option value="Participant">Participant</option>
                    <option value="Outreach">Outreach</option>
                    <option value="Volunteer">Volunteer</option>
                    <option value="Grant">Grant</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="upliftStatus"
                    className="flex text-sm font-medium text-gray-700 mb-1"
                  >
                    Uplift Status
                  </label>
                  <select
                    id="upliftStatus"
                    name="upliftStatus"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={currentContact.upliftStatus}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a Uplift Status</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Active">Active</option>
                    <option value="Prospective">Prospective</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="gender"
                    className="flex text-sm font-medium text-gray-700 mb-1"
                  >
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={currentContact.gender}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="race"
                    className="flex text-sm font-medium text-gray-700 mb-1"
                  >
                    Race
                  </label>
                  <input
                    id="race"
                    name="race"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={currentContact.race}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="county"
                    className="flex text-sm font-medium text-gray-700 mb-1"
                  >
                    County of Residence
                  </label>
                  <input
                    id="county"
                    name="county"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={currentContact.county}
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
                  {isSubmitting ? "Saving..." : "Update Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
