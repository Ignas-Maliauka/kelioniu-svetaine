import { NavLink } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="bg-gray-200">
      <nav className="flex justify-between items-center bg-white opacity-50">
        <div>
          <span className="ml-2">Hello, {user ? user.name : "Guest"}</span>
          <NavLink className="px-3 hover:bg-slate-100" to="/">Dashboard</NavLink>
        </div>
        <div className="flex items-center gap-3">
          <NavLink className="px-3 hover:bg-slate-100" to="/account">Account</NavLink>
          <button onClick={logout} className="px-3 h-9 rounded-md border bg-background hover:bg-slate-100">
            Logout
          </button>
        </div>
      </nav>
    </div>
  );
}