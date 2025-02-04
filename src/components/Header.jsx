import { Icon } from "@iconify/react";
import useSignOut from "react-auth-kit/hooks/useSignOut";
import { useLocation } from "react-router-dom";
import useAuthUser from "react-auth-kit/hooks/useAuthUser";

const Header = () => {
  const signOut = useSignOut();
  const location = useLocation();
  const userName = useAuthUser();

  const logOut = () => {
    signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex justify-between items-center px-8 py-4 fixed top-0 left-0 right-0 bg-white">
      <div>
        <img src="/logo.png" alt="logo" className="w-48" />
      </div>
      <h2 className="text-5xl font-bold">Team Portal</h2>
      <div className="flex items-center gap-10">
        {/* <div className="flex gap-4">
          <a
            href="/contact"
            className="text-xl font-mono text-white bg-gray-400 p-1 rounded-xl shadow-lg shadow-gray-400"
          >
            Contacts
          </a>
          <a
            href="/interaction"
            className="text-xl font-mono text-white bg-gray-400 p-1 rounded-xl shadow-lg shadow-gray-400"
          >
            Interactions
          </a>
        </div> */}
        <div className="flex flex-col items-center">
          <Icon
            icon="iconamoon:profile-fill"
            className={`${location.pathname !== "/" ? "text-4xl" : "text-5xl"}`}
          />

          {location.pathname !== "/" && (
            <div>
              <div>
                {" "}
                <p>Logged in as : {userName}</p>{" "}
                <button className="hover:text-red-500" onClick={logOut}>
                  Log out
                </button>{" "}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
