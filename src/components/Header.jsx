import { Icon } from "@iconify/react";
import useSignOut from "react-auth-kit/hooks/useSignOut";
import { useLocation } from "react-router-dom";

const Header = () => {
  const signOut = useSignOut();
  const location = useLocation(); // Get the current location

  const logOut = () => {
    signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex justify-between items-center px-2">
      <div>
        <h1 className="text-2xl">LONON</h1>
        <p className="text-xs">THE LONON FOUNDATION</p>
      </div>
      <h2 className="text-4xl font-bold">Team Portal</h2>
      <div className="flex flex-col justify-center items-center">
        <Icon icon="iconamoon:profile-fill" className="text-4xl" />
        {location.pathname !== "/" && <button onClick={logOut}>Log out</button>}
      </div>
    </div>
  );
};

export default Header;
