import { NavLink } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div>
      <nav className="flex justify-between items-center mb-6">
        <NavLink to="/">
          <img alt="Page logo" className="h-20" src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1173"></img>
        </NavLink>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm mr-2">Hello, {user.name}</span>
              <button onClick={logout} className="px-3 h-9 rounded-md border bg-background hover:bg-slate-100">
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink className="px-3 h-9 rounded-md border bg-background hover:bg-slate-100" to="/login">Login</NavLink>
              <NavLink className="px-3 h-9 rounded-md border bg-background hover:bg-slate-100" to="/register">Register</NavLink>
            </>
          )}

          <NavLink className="inline-flex items-center justify-center whitespace-nowrap text-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-slate-100 h-9 rounded-md px-3" to="/create">
            Create Employee
          </NavLink>
        </div>
      </nav>
    </div>
  );
}