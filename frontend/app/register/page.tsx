"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  },
  card: {
    background: "rgba(30, 41, 59, 0.8)",
    borderRadius: "12px",
    padding: "2rem",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
  },
  title: { fontSize: "1.5rem", marginBottom: "1.5rem", textAlign: "center" as const },
  form: { display: "flex", flexDirection: "column" as const, gap: "1rem" },
  label: { fontSize: "0.9rem", color: "#94a3b8" },
  input: {
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    border: "1px solid #475569",
    background: "#0f172a",
    color: "#e2e8f0",
    width: "100%",
  },
  button: {
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    border: "none",
    background: "#3b82f6",
    color: "white",
    fontWeight: 600,
    marginTop: "0.5rem",
  },
  link: { textAlign: "center" as const, marginTop: "1rem", fontSize: "0.9rem" },
};

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Email and password required");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    try {
      await register(email.trim(), password);
      toast.success("Account created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create account</h1>
        <form style={styles.form} onSubmit={handleSubmit}>
          <div>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label style={styles.label}>Password (min 6 characters)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <button type="submit" style={styles.button} disabled={submitting}>
            {submitting ? "Creating…" : "Register"}
          </button>
        </form>
        <p style={styles.link}>
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </main>
  );
}
