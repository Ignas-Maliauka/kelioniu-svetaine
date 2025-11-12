import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5050";

export default function ActivityForm() {
  const { id: eventId, aid } = useParams(); // aid = activity id when editing
  const isEdit = !!aid;
  const { token } = useContext(AuthContext);
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!isEdit || !token) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/activities/${aid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load activity");
        const data = await res.json();
        if (!mounted) return;
        setForm({
          name: data.name || "",
          description: data.description || "",
          startTime: data.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : "",
          endTime: data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : "",
          location: data.location || "",
        });
      } catch (err) {
        setServerError(err.message || "Load error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [aid, isEdit, token]);

  function validate() {
    const e = {};
    if (!form.name || !form.name.trim()) e.name = "Name is required";
    else if (form.name.trim().length < 2 || form.name.trim().length > 50) e.name = "Name must be 2-50 characters";

    if (form.description && form.description.length > 200) e.description = "Description too long (max 200)";
    if (form.location && form.location.length > 50) e.location = "Location too long (max 50)";

    if (form.startTime && form.endTime && new Date(form.startTime) > new Date(form.endTime)) e.endTime = "End must be after start";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function updateField(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  }

  async function submit(e) {
    e?.preventDefault();
    setServerError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        startTime: form.startTime ? new Date(form.startTime).toISOString() : undefined,
        endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
        location: form.location.trim() || undefined,
      };
      let res;
      if (isEdit) {
        res = await fetch(`${API_BASE}/api/activities/${aid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/api/activities`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...payload, event: eventId }),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Save failed");
      const targetId = isEdit ? aid : data._id || data.id;
      nav(`/events/${eventId}`);
    } catch (err) {
      setServerError(err.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) return <p className="p-4">Please log in.</p>;
  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl mb-4">{isEdit ? "Edit Activity" : "Create Activity"}</h1>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input className="w-full p-2 border" value={form.name} onChange={(e) => updateField("name", e.target.value)} />
          {errors.name && <div className="text-sm text-red-600 mt-1">{errors.name}</div>}
        </div>

        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea className="w-full p-2 border" rows={3} value={form.description} onChange={(e) => updateField("description", e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Start</label>
            <input type="datetime-local" className="w-full p-2 border" value={form.startTime} onChange={(e) => updateField("startTime", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">End</label>
            <input type="datetime-local" className="w-full p-2 border" value={form.endTime} onChange={(e) => updateField("endTime", e.target.value)} />
            {errors.endTime && <div className="text-sm text-red-600 mt-1">{errors.endTime}</div>}
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Location</label>
          <input className="w-full p-2 border" value={form.location} onChange={(e) => updateField("location", e.target.value)} />
        </div>

        {serverError && <div className="text-sm text-red-600">{serverError}</div>}

        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </button>
          <button type="button" className="px-4 py-2 border rounded" onClick={() => nav(`/events/${eventId}`)} disabled={submitting}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}