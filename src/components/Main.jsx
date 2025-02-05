import InteractionTable from "./InteractionTable";
import InfoTable from "./InfoTable";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import { useNavigate } from "react-router-dom";

const Main = () => {
  const navigate = useNavigate();
  const auth = useAuthHeader();

  useEffect(() => {
    if (!auth) {
      navigate("/");
    }
  }, [auth]);

  const [isInteractionOpen, setIsInteractionOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(true);

  const openContact = () => {
    setIsInteractionOpen(false);
    setIsContactOpen(true);
  };

  const openInteraction = () => {
    setIsInteractionOpen(true);
    setIsContactOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Fixed Sidebar */}
      <div className="w-64 bg-white">
        <div className="flex flex-col gap-4 px-6 pt-64">
          <button
            onClick={openContact}
            className={`flex gap-2 items-center ${
              isContactOpen ? "bg-blue-400" : "bg-gray-600 text-white"
            } p-2 rounded-lg`}
          >
            <Icon icon="gravity-ui:persons" />
            Contacts
          </button>
          <button
            onClick={openInteraction}
            className={`flex gap-2 items-center ${
              isInteractionOpen ? "bg-blue-400" : "bg-gray-600 text-white"
            } p-2 rounded-lg`}
          >
            <Icon icon="mingcute:react-fill" /> Interactions
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 pt-40 overflow-y-scroll">
        <div className="p-8 min-h-[calc(100vh-4rem)]">
          {isInteractionOpen && <InteractionTable />}
          {isContactOpen && <InfoTable />}
        </div>
      </div>
    </div>
  );
};

export default Main;
