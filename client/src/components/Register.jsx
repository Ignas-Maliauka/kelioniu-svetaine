import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export default function Register() {
    const { register } = useContext(AuthContext);
    const nav = useNavigate();
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({ name: "", email: "", password: "" });
    const [submitting, setSubmitting] = useState(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validate() {
        const fe = { name: "", email: "", password: "" };
        if (!form.name || !form.name.trim()) fe.name = "Name is required";
        if (!form.email) fe.email = "Email is required";
        else if (!emailRegex.test(form.email)) fe.email = "Enter a valid email";
        if (!form.password) fe.password = "Password is required";
        else if (form.password.length < 6) fe.password = "Password must be at least 6 characters";
        setFieldErrors(fe);
        return !fe.name && !fe.email && !fe.password;
    }

    async function submit(e) {
        e.preventDefault();
        setError("");
        if (!validate()) return;
        setSubmitting(true);
        try {
            await register(form.name.trim(), form.email, form.password);
            nav("/");
        } catch (err) {
            setError(err.message || "Registration failed");
        } finally {
            setSubmitting(false);
        }
    }

    function updateField(key, value) {
        setForm(prev => ({ ...prev, [key]: value }));
        setFieldErrors(prev => ({ ...prev, [key]: "" }));
    }

    return (
        <div className="max-w-md mx-auto p-4">
            <h2 className="text-xl mb-4">Register</h2>
            <form onSubmit={submit} className="space-y-3" noValidate>
                <div>
                  <input
                    className="w-full p-2 border"
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    onBlur={validate}
                    aria-invalid={!!fieldErrors.name}
                  />
                  {fieldErrors.name && <div className="text-sm text-red-600 mt-1">{fieldErrors.name}</div>}
                </div>

                <div>
                  <input
                    className="w-full p-2 border"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    onBlur={validate}
                    aria-invalid={!!fieldErrors.email}
                  />
                  {fieldErrors.email && <div className="text-sm text-red-600 mt-1">{fieldErrors.email}</div>}
                </div>

                <div>
                  <input
                    className="w-full p-2 border"
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    onBlur={validate}
                    aria-invalid={!!fieldErrors.password}
                  />
                  {fieldErrors.password && <div className="text-sm text-red-600 mt-1">{fieldErrors.password}</div>}
                </div>

                {error && <div className="text-red-600">{error}</div>}

                <div className="flex gap-4">
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                      type="submit"
                      disabled={submitting || !!fieldErrors.name || !!fieldErrors.email || !!fieldErrors.password}
                    >
                      {submitting ? "Registering..." : "Register"}
                    </button>
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                        type="button"
                        onClick={() => nav("/login")}
                    >
                        Login
                    </button>
                </div>
            </form>
        </div>
    );
}