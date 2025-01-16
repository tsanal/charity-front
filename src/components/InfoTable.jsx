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

const ContactTable = () => {
  const auth = useAuthHeader();

  console.log(auth);
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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

  const fetchData = async (page = currentPage, itemsPerPage = perPage) => {
    try {
      const response = await axios.get(
        `${backendUrl}/person`,
        {
          headers: {
            Authorization: auth,
          },
        },
        {
          params: {
            page: page,
            limit: itemsPerPage,
          },
        }
      );

      const transformedData = response.data.results.map((item) => ({
        name: item.name || "",
        phone: item.phone || "",
        email: item.email || "",
        street: item.street || "",
        city: item.city || "",
        state: item.state || "",
        zip: item.zip || "",
        relationshipType: item.relationshipType || "",
        id: item.id,
      }));

      setData(transformedData);
      const totalItems = response.data.totalCount;
      const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);
      setTotalPages(calculatedTotalPages);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, perPage]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentContact((prev) => ({
      ...prev,
      [name]: value || "", // Ensure empty strings instead of null
    }));
  };

  const handleEdit = (contact) => {
    // Ensure all fields are strings
    const editContact = {
      name: contact.name || "",
      phone: contact.phone || "",
      email: contact.email || "",
      street: contact.street || "",
      city: contact.city || "",
      state: contact.state || "",
      zip: contact.zip || "",
      relationshipType: contact.relationshipType || "",
    };

    setCurrentContact(editContact);
    setEditingId(contact.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      try {
        await axios.delete(`${backendUrl}/person/${id}`, {
          headers: {
            Authorization: auth,
          },
        });
        await fetchData();
      } catch (error) {
        console.error("Error deleting contact:", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Prepare the data for submission
    const submitData = {
      name: currentContact.name || "",
      phone: currentContact.phone || "",
      email: currentContact.email || "",
      street: currentContact.street || "",
      city: currentContact.city || "",
      state: currentContact.state || "",
      zip: currentContact.zip || "",
      relationshipType: currentContact.relationshipType || "",
    };

    try {
      if (isEditing) {
        await axios.patch(
          `${backendUrl}/person/${editingId}`,

          submitData,
          {
            headers: {
              Authorization: auth,
            },
          }
        );
      } else {
        await axios.post(`${backendUrl}/person`, submitData, {
          headers: {
            Authorization: auth,
          },
        });
      }
      await fetchData();
      resetModal();
    } catch (error) {
      console.error("Error saving contact:", error);
      alert(error.response?.data?.message || "Error saving contact");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columnHelper = createColumnHelper();

  const columns = [
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => <div className="truncate">{info.getValue()}</div>,
    }),
    columnHelper.accessor("phone", {
      header: "Phone",
      cell: (info) => <div className="truncate">{info.getValue()}</div>,
    }),
    columnHelper.accessor("email", {
      header: "Email",
      cell: (info) => <div className="truncate">{info.getValue()}</div>,
    }),
    columnHelper.accessor("street", {
      header: "Street",
      cell: (info) => <div className="truncate">{info.getValue()}</div>,
    }),
    columnHelper.accessor("city", {
      header: "City",
      cell: (info) => <div className="truncate">{info.getValue()}</div>,
    }),
    columnHelper.accessor("state", {
      header: "State",
      cell: (info) => <div className="truncate">{info.getValue()}</div>,
    }),
    columnHelper.accessor("zip", {
      header: "ZIP",
      cell: (info) => <div className="truncate">{info.getValue()}</div>,
    }),
    columnHelper.accessor("relationshipType", {
      header: "Relationship",
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

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const resetModal = () => {
    setCurrentContact({
      name: "",
      phone: "",
      email: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      relationshipType: "",
    });
    setEditingId(null);
    setIsEditing(false);
    setIsModalOpen(false);
  };

  const PaginationControls = () => (
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
        <h2 className="text-2xl font-semibold text-gray-800">
          Contact Directory
        </h2>
        <div className="flex gap-10">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Import CSV
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setCurrentContact({
                name: "",
                phone: "",
                email: "",
                street: "",
                city: "",
                state: "",
                zip: "",
                relationshipType: "",
              });
              setIsModalOpen(true);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Add Contact
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
                {isEditing ? "Edit Contact" : "Add New Contact"}
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
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Phone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={currentContact.phone}
                    onChange={handleInputChange}
                  />
                </div>
                {!isEditing && (
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={currentContact.email}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
                <div>
                  <label
                    htmlFor="street"
                    className="block text-sm font-medium text-gray-700 mb-1"
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
                      className="block text-sm font-medium text-gray-700 mb-1"
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
                      className="block text-sm font-medium text-gray-700 mb-1"
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
                    className="block text-sm font-medium text-gray-700 mb-1"
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
                    className="block text-sm font-medium text-gray-700 mb-1"
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
                    ? "Update Contact"
                    : "Save Contact"}
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
