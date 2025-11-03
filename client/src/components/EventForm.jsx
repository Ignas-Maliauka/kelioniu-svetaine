import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5050";

export default function EventForm() {
  const { id } = useParams(); // if present -> edit mode
  const isEdit = !!id;
  const { token } = useContext(AuthContext);
  const nav = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!isEdit || !token) return;
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/events/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load event");
        const data = await res.json();
        if (!mounted) return;
        setForm({
          title: data.title || "",
          description: data.description || "",
          startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : "",
          endDate: data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : "",
          location: data.location || "",
        });
      } catch (err) {
        setServerError(err.message || "Load error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [id, isEdit, token]);

  function validate() {
    const e = {};
    if (!form.title || !form.title.trim()) e.title = "Title is required";
    if (form.startDate && form.endDate) {
      const s = new Date(form.startDate);
      const eDate = new Date(form.endDate);
      if (s > eDate) e.endDate = "End must be after start";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function updateField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setServerError("");
  }

  async function submit(e) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        location: form.location.trim() || undefined,
      };
      const url = isEdit ? `${API_BASE}/api/events/${id}` : `${API_BASE}/api/events`;
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
      const targetId = isEdit ? id : data._id || data.id;
      nav(`/events/${targetId}`);
    } catch (err) {
      setServerError(err.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) return <p className="p-4">Please log in to create or edit events.</p>;
  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl mb-4">{isEdit ? "Edit Event" : "Create Event"}</h1>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input
            className="w-full p-2 border"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            onBlur={validate}
          />
          {errors.title && <div className="text-sm text-red-600 mt-1">{errors.title}</div>}
        </div>

        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea
            className="w-full p-2 border"
            rows={4}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Start</label>
            <input
              type="datetime-local"
              className="w-full p-2 border"
              value={form.startDate}
              onChange={(e) => updateField("startDate", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">End</label>
            <input
              type="datetime-local"
              className="w-full p-2 border"
              value={form.endDate}
              onChange={(e) => updateField("endDate", e.target.value)}
              onBlur={validate}
            />
            {errors.endDate && <div className="text-sm text-red-600 mt-1">{errors.endDate}</div>}
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Location</label>
          <input
            className="w-full p-2 border"
            value={form.location}
            onChange={(e) => updateField("location", e.target.value)}
          />
        </div>

        {serverError && <div className="text-sm text-red-600">{serverError}</div>}

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? (isEdit ? "Saving..." : "Creating...") : isEdit ? "Save" : "Create"}
          </button>

          <button
            type="button"
            onClick={() => nav(isEdit ? `/events/${id}` : "/")}
            className="px-4 py-2 border rounded"
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}