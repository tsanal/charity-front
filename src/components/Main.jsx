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
  const [isContactOpen, setIsContactOpen] = useState(false);
  const openContact = () => {
    setIsInteractionOpen(false);
    setIsContactOpen(true);
  };
  const openInteraction = () => {
    setIsInteractionOpen(true);
    setIsContactOpen(false);
  };
  return (
    <div className="flex">
      <div className="w-[20%]">
        <div className="flex flex-col gap-4 px-16 pt-56 fixed ">
          <button
            onClick={openContact}
            className={`flex gap-2 items-center ${
              isContactOpen ? "bg-gray-300" : "bg-blue-400"
            } p-2 rounded-lg`}
          >
            <Icon icon="gravity-ui:persons" />
            Contacts
          </button>
          <button
            onClick={openInteraction}
            className={`flex gap-2 items-center ${
              isInteractionOpen ? "bg-gray-300" : "bg-blue-400"
            } p-2 rounded-lg`}
          >
            <Icon icon="mingcute:react-fill" /> Interactions
          </button>
        </div>
      </div>
      <div className="w-[80%] pt-40">
        {isInteractionOpen && <InteractionTable />}
        {isContactOpen && <InfoTable />}
      </div>
    </div>
  );
};

export default Main;
