import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5050";

export default function PlanningStepForm() {
  const { id: eventId, sid } = useParams(); // sid = step id when editing
  const isEdit = !!sid;
  const { token } = useContext(AuthContext);
  const nav = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    isCompleted: false,
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
        const res = await fetch(`${API_BASE}/api/planning-steps/${sid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load step");
        const data = await res.json();
        if (!mounted) return;
        setForm({
          title: data.title || "",
          description: data.description || "",
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString().slice(0, 16) : "",
          isCompleted: !!data.isCompleted,
        });
      } catch (err) {
        setServerError(err.message || "Load error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [sid, isEdit, token]);

  function validate() {
    const e = {};
    if (!form.title || !form.title.trim()) e.title = "Title is required";
    else if (form.title.trim().length < 2 || form.title.trim().length > 50) e.title = "Title must be 2-50 characters";

    if (form.description && form.description.length > 200) e.description = "Description too long (max 200)";
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
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        isCompleted: !!form.isCompleted,
      };
      let res;
      if (isEdit) {
        res = await fetch(`${API_BASE}/api/planning-steps/${sid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/api/planning-steps`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...payload, event: eventId }),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Save failed");
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
      <h1 className="text-2xl mb-4">{isEdit ? "Edit Planning Step" : "Create Planning Step"}</h1>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input className="w-full p-2 border" value={form.title} onChange={(e) => updateField("title", e.target.value)} />
          {errors.title && <div className="text-sm text-red-600 mt-1">{errors.title}</div>}
        </div>

        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea className="w-full p-2 border" rows={3} value={form.description} onChange={(e) => updateField("description", e.target.value)} />
        </div>

        <div>
          <label className="block text-sm mb-1">Due</label>
          <input type="datetime-local" className="w-full p-2 border" value={form.dueDate} onChange={(e) => updateField("dueDate", e.target.value)} />
        </div>

        <div className="flex items-center gap-2">
          <input id="completed" type="checkbox" checked={form.isCompleted} onChange={(e) => updateField("isCompleted", e.target.checked)} />
          <label htmlFor="completed" className="text-sm">Completed</label>
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