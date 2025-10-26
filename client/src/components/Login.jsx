import React, { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export default function Login() {
    const { login } = useContext(AuthContext);
    const nav = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
    const [submitting, setSubmitting] = useState(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validate() {
        const fe = { email: "", password: "" };
        if (!form.email) fe.email = "Email is required";
        else if (!emailRegex.test(form.email)) fe.email = "Enter a valid email";
        if (!form.password) fe.password = "Password is required";
        else if (form.password.length < 6) fe.password = "Password must be at least 6 characters";
        setFieldErrors(fe);
        return !fe.email && !fe.password;
    }

    async function submit(e) {
        e.preventDefault();
        setError("");
        if (!validate()) return;
        setSubmitting(true);
        try {
            await login(form.email, form.password);
            nav(from, { replace: true });
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setSubmitting(false);
        }
    }

    function updateField(key, value) {
        setForm(prev => ({ ...prev, [key]: value }));
        // live-validate single field
        setFieldErrors(prev => ({ ...prev, [key]: "" }));
    }

    return (
        <div className="max-w-md mx-auto p-4">
            <h2 className="text-xl mb-4">Login</h2>
            <form onSubmit={submit} className="space-y-3" noValidate>
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
                      disabled={submitting || !!fieldErrors.email || !!fieldErrors.password}
                    >
                      {submitting ? "Logging in..." : "Login"}
                    </button>
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded"
                      type="button"
                      onClick={() => nav("/register")}
                    >
                      Register
                    </button>
                </div>
            </form>
        </div>
    );
}