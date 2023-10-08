import { useEffect, useState } from "react";
import { Layout } from "~/components/layout/layout";
import { ConnectionI } from "~/types/ConnectionI";
import { NEW_CONNECTION, sampleTags } from "~/sample_data/sampleConnections";
import { FaFilter, FaPlus, FaTrash } from "react-icons/fa";
import { useModal } from "~/components/hooks/modalContext";
import AddConnectionModal, {
  handleAddConnectionProps,
} from "../../components/connections/_addConnectionModal";
import Table from "~/components/connections/_table";
import { useToast } from "~/components/hooks/toastContext";
import DebouncedInput from "~/components/connections/_debouncedInput";
import { RowSelectionState } from "@tanstack/react-table";
import Link from "next/link";
import { BiMailSend } from "react-icons/bi";
import Tag from "~/components/connections/_tag";
import { api } from "~/utils/api";
import Image from "next/image";
import { IoMdRefresh } from "react-icons/io";

export default function Connections() {
  const [data, setData] = useState<ConnectionI[]>([]);
  const [filteredData, setFilteredData] = useState<ConnectionI[]>(data);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const tagColoursMap: Record<string, string> = sampleTags;

  const { openModal, closeModal } = useModal();
  const { addToast } = useToast();

  // TODO fetch data and tagColoursMap from API

  // Get data from API
  const {
    data: connections,
    isLoading,
    error,
    refetch,
  } = api.connection.getAllConnections.useQuery();

  useEffect(() => {
    if (connections) {
      console.log({ connections: connections });
      setData([...connections]);
    }
    if (error) {
      console.error(error);
      addToast({
        type: "error",
        message: `Error fetching connections. ${error}: ${error.message}`,
      });
    }
  }, [connections, error]);

  const customMutation = api.connection.createCustom.useMutation();

  const handleCreateCustom = ({
    newConnection,
    setConnection,
  }: handleAddConnectionProps) => {
    // Validate that connection has name and email
    if (!newConnection.name || !newConnection.email) {
      // Show error toast
      addToast({
        type: "error",
        message: "Name and Email are required.",
      });
      return;
    }

    // Validate that connection has a unique email
    if (data.some((connection) => connection.email === newConnection.email)) {
      // Show error toast
      addToast({
        type: "error",
        message: "You already have a connection with this email.",
      });
      return;
    }

    const newConnectionWithTags = {
      ...newConnection,
      tags: newConnection.tags.map((tag) => tag.toLowerCase()),
      notes: newConnection.notes || "",
      contactNumber: newConnection.phone || "",
      photoUrl: newConnection.photoUrl || "",
    };

    // API call to create new connection
    customMutation.mutate(newConnectionWithTags, {
      onSuccess: (data) => {
        console.log(data);
        // Show success toast
        addToast({
          type: "success",
          message: `Connection with ${newConnection.name} added successfully.`,
        });

        // Refetch data
        refetch();
      },
      onError: (error) => {
        console.error(error);
        // Show error toast
        addToast({
          type: "error",
          message: `Error creating connection. ${error}: ${error.message}`,
        });
      },
    });

    // Reset connection and close modal
    setConnection(NEW_CONNECTION);
    closeModal("add-connection-modal");
  };

  // Open Add Connection Modal
  const addConnection = () => {
    openModal({
      content: (
        <AddConnectionModal
          handleCreateCustom={handleCreateCustom}
          tagColoursMap={tagColoursMap}
        />
      ),
      id: "add-connection-modal",
    });
  };

  // Multiple-row operation: Delete
  const handleDeleteMultipleConnections = () => {
    // TODO send rowSelection to API and get back success or error
    // TODO remove deleted connections from data
    const deletedConnections = Object.keys(rowSelection).map(
      (id) => data[Number(id)]
    );
    setData((prev) =>
      prev.filter((connection) => !deletedConnections.includes(connection))
    );

    // Show success toast
    addToast({
      type: "success",
      message: "Connections deleted successfully.",
    });

    // Reset rowSelection
    setRowSelection({});
  };

  // Multiple-row operation: Email
  const getSelectedEmails = () => {
    return Object.keys(rowSelection)
      .map((id) => data[Number(id)].email)
      .join(",");
  };

  const getAllTags = () => {
    // Gets all unique tags from filtered data
    const tags = new Set<string>();
    filteredData.forEach((connection) => {
      connection.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags);
  };

  // Filter data based on tags
  useEffect(() => {
    if (selectedTags.length > 0) {
      const filteredData = data.filter((connection) =>
        selectedTags.every((tag) => connection.tags.includes(tag))
      );
      setFilteredData([...filteredData]);
    } else {
      setFilteredData(data);
    }
  }, [selectedTags, data]);

  return (
    <Layout>
      <div className="flex w-full flex-col items-start font-semibold">
        <div className="my-5 flex w-full flex-row items-center justify-between">
          <h1 className="mb-0 mt-4">{data.length} Contacts</h1>
          <button
            className="btn btn-primary text-base-100"
            onClick={() => addConnection()}
          >
            <FaPlus /> New Connection
          </button>
        </div>
        {/* Search Bar and Filter Button */}
        <div className="flex w-full flex-row justify-between rounded bg-[#EAECF6] p-3">
          <DebouncedInput
            value={globalFilter ?? ""}
            onChange={(value) => setGlobalFilter(String(value))}
            placeholder="🔎 Search Connection"
            className="input input-sm"
          />
          <div className="dropdown-end dropdown">
            <label
              tabIndex={0}
              className="btn btn-primary btn-sm flex flex-nowrap"
            >
              <FaFilter /> Filter
            </label>
            <ul
              tabIndex={0}
              className="menu dropdown-content rounded-box z-[1] bg-base-100 p-2 shadow"
            >
              {getAllTags().map((tag) => (
                <li key={tag}>
                  <label className="flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag)}
                      className="checkbox checkbox-xs"
                      onChange={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags((prev) =>
                            prev.filter((prevTag) => prevTag !== tag)
                          );
                        } else {
                          setSelectedTags((prev) => [...prev, tag]);
                        }
                      }}
                    />
                    <Tag tag={tag} tagColoursMap={tagColoursMap} />
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Table
          data={filteredData}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          tagColoursMap={tagColoursMap}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
        />
        {isLoading && (
          <div className="flex w-full flex-grow items-center justify-center">
            <div className="loading loading-spinner loading-lg text-primary"></div>
          </div>
        )}
      </div>

      {/* No Connections Illustration */}
      {data.length === 0 && !isLoading && (
        <div className="flex w-full flex-col items-center justify-center text-center">
          <Image
            src="/svg/Empty-pana.svg"
            alt={"Empty Illustration"}
            width={300}
            height={300}
            className="m-0 p-0"
          />
          <p>
            You have no connections. Click on the button above to add a new one!
          </p>
        </div>
      )}

      {/* Multi-Row Selection Toolbar */}
      {Object.keys(rowSelection).length > 0 && (
        <div className="navbar fixed bottom-2 flex w-9/12 justify-between gap-2 rounded bg-primary px-10 shadow-md">
          <div className="text-l text-base-300">
            {Object.keys(rowSelection).length}/{data.length} Rows Selected
          </div>
          <div className="flex gap-2">
            <Link
              className="btn btn-secondary"
              href={`mailto:${getSelectedEmails()}`}
            >
              <BiMailSend />
              Connect Now
            </Link>
            <button
              className="btn btn-error"
              onClick={handleDeleteMultipleConnections}
            >
              <FaTrash /> Delete
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

Connections.auth = true;
