import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";

export default function Account() {
  const { user, updateProfile } = useContext(AuthContext);
  const [name, setName] = useState(user?.name || "");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [fieldError, setFieldError] = useState("");

  useEffect(() => {
    // update local input when user updates (e.g. after fetch)
    setName(user?.name || "");
  }, [user]);

  function validate() {
    if (!name || !name.trim()) {
      setFieldError("Name cannot be empty");
      return false;
    }
    if (name.trim().length < 2) {
      setFieldError("Name must be at least 2 characters");
      return false;
    }
    setFieldError("");
    return true;
  }

  async function save(e) {
    e.preventDefault();
    setMsg("");
    if (!validate()) return;
    setLoading(true);
    try {
      await updateProfile({ name: name.trim() });
      setMsg("Profile updated");
    } catch (err) {
      setMsg(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  if (!user) return <p className="p-4">Loading account...</p>;

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl mb-4">Account</h2>
      <div className="mb-4">
        <label className="block text-sm">Email</label>
        <div className="p-2 border bg-gray-50">{user.email}</div>
      </div>

      <form onSubmit={save} className="space-y-3" noValidate>
        <div>
          <label className="block text-sm">Name</label>
          <input
            className="w-full p-2 border"
            value={name}
            onChange={(e) => { setName(e.target.value); setFieldError(""); }}
            onBlur={validate}
            aria-invalid={!!fieldError}
          />
          {fieldError && <div className="text-sm text-red-600 mt-1">{fieldError}</div>}
        </div>

        {msg && <div className="text-sm text-red-600">{msg}</div>}

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}