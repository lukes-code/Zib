import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { NavLink } from "react-router-dom";
import {
  ExitIcon,
  HomeIcon,
  PlusIcon,
  HamburgerMenuIcon,
  FileTextIcon,
} from "@radix-ui/react-icons";
import ConfirmationModal from "./modal";
import { StoreIcon } from "lucide-react";
import logo from "@/assets/images/logo.png";

export const Nav = () => {
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div
        className={` ${
          open ? "z-20" : "z-[999]"
        } p-4 text-white absolute items-start right-5 top-10 md:hidden`}
      >
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="text-white"
          aria-label="Toggle menu"
        >
          <HamburgerMenuIcon color="white" width={24} height={24} />
        </button>
      </div>

      {/* Sidebar */}
      <nav
        className={`bg-black w-24 h-screen flex flex-col p-6 fixed top-0 left-0 transform transition-transform duration-300 z-50
          ${
            open ? "translate-x-0 w-32" : "-translate-x-full"
          } sm:translate-x-0`}
      >
        <div className="mb-8">
          <NavLink
            to="/"
            className="font-bold text-xl mb-6 w-full flex flex-col justify-center items-center text-white"
          >
            <img src={logo} alt="Illustration" className="w-full h-full" />
          </NavLink>

          <div className="w-full flex flex-col justify-center items-center gap-y-4 mt-12">
            <NavLink
              to="/dashboard"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `p-2 rounded-[999px] transition-colors ${
                  isActive
                    ? "text-black bg-white"
                    : "text-white hover:bg-white hover:text-black"
                }`
              }
            >
              <HomeIcon width={24} height={24} />
            </NavLink>
            <NavLink
              to="/storefront"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `p-2 rounded-[999px] transition-colors ${
                  isActive
                    ? "text-black bg-white"
                    : "text-white hover:bg-white hover:text-black"
                }`
              }
            >
              <StoreIcon width={24} height={24} />
            </NavLink>

            {isAdmin && (
              <>
                <NavLink
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `p-2 rounded-[999px] transition-colors ${
                      isActive
                        ? "text-black bg-white"
                        : "text-white hover:bg-white hover:text-black"
                    }`
                  }
                >
                  <PlusIcon width={24} height={24} />
                </NavLink>
                <NavLink
                  to="/logs"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `p-2 rounded-[999px] transition-colors ${
                      isActive
                        ? "text-black bg-white"
                        : "text-white hover:bg-white hover:text-black"
                    }`
                  }
                >
                  <FileTextIcon width={24} height={24} />
                </NavLink>
              </>
            )}
          </div>
        </div>

        <div className="mt-auto w-full flex flex-col justify-center items-center">
          {user ? (
            <button
              onClick={() => setShowSignOutModal(true)}
              className="p-2 text-white hover:bg-red-500 rounded-[999px] transition-colors"
            >
              <ExitIcon width={18} height={18} />
            </button>
          ) : (
            <>
              <NavLink
                to="/login"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  isActive
                    ? "text-red-500 text-sm font-medium"
                    : "text-sm font-medium text-blue-600 hover:underline"
                }
              >
                Sign In
              </NavLink>
              <NavLink
                to="/register"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  isActive
                    ? "text-red-500 text-sm font-medium"
                    : "text-sm font-medium text-blue-600 hover:underline"
                }
              >
                Sign Up
              </NavLink>
            </>
          )}
        </div>
      </nav>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 sm:hidden z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sign Out Confirmation Modal */}
      <ConfirmationModal
        open={showSignOutModal}
        title="Confirm sign out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        onConfirm={signOut}
        onCancel={() => setShowSignOutModal(false)}
      />
    </>
  );
};
