"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api, Task } from "@/lib/api";
import toast from "react-hot-toast";

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", padding: "1rem", maxWidth: "800px", margin: "0 auto" },
  header: {
    display: "flex",
    flexWrap: "wrap" as const,
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  title: { fontSize: "1.5rem" },
  logout: {
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "1px solid #475569",
    background: "transparent",
    color: "#94a3b8",
    fontSize: "0.9rem",
  },
  filters: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "0.75rem",
    marginBottom: "1rem",
  },
  input: {
    padding: "0.5rem 0.75rem",
    borderRadius: "8px",
    border: "1px solid #475569",
    background: "#0f172a",
    color: "#e2e8f0",
    minWidth: "160px",
  },
  select: {
    padding: "0.5rem 0.75rem",
    borderRadius: "8px",
    border: "1px solid #475569",
    background: "#0f172a",
    color: "#e2e8f0",
  },
  addBtn: {
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "none",
    background: "#22c55e",
    color: "white",
    fontWeight: 600,
  },
  list: { display: "flex", flexDirection: "column" as const, gap: "0.75rem" },
  card: {
    background: "rgba(30, 41, 59, 0.6)",
    borderRadius: "10px",
    padding: "1rem",
    border: "1px solid #334155",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "1rem",
    flexWrap: "wrap" as const,
  },
  cardLeft: { flex: "1 1 200px", minWidth: 0 },
  cardTitle: { fontWeight: 600, marginBottom: "0.25rem", textDecoration: "none" as const },
  cardDesc: { fontSize: "0.9rem", color: "#94a3b8", marginBottom: "0.5rem" },
  cardMeta: { fontSize: "0.8rem", color: "#64748b" },
  cardActions: { display: "flex", gap: "0.5rem", flexWrap: "wrap" as const },
  btnSm: {
    padding: "0.35rem 0.6rem",
    borderRadius: "6px",
    border: "none",
    fontSize: "0.85rem",
    background: "#334155",
    color: "#e2e8f0",
  },
  btnDanger: { background: "#dc2626", color: "white" },
  pagination: { display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem" },
  modalOverlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
    zIndex: 50,
  },
  modal: {
    background: "#1e293b",
    borderRadius: "12px",
    padding: "1.5rem",
    width: "100%",
    maxWidth: "420px",
    border: "1px solid #334155",
  },
  modalTitle: { marginBottom: "1rem" },
  modalForm: { display: "flex", flexDirection: "column" as const, gap: "0.75rem" },
  textarea: {
    padding: "0.5rem 0.75rem",
    borderRadius: "8px",
    border: "1px solid #475569",
    background: "#0f172a",
    color: "#e2e8f0",
    minHeight: "80px",
    resize: "vertical" as const,
  },
  modalActions: { display: "flex", gap: "0.5rem", marginTop: "0.5rem" },
};

export default function DashboardPage() {
  const { user, loading: authLoading, getAccessToken, logout } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState("pending");
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = useCallback(
    async (page = 1) => {
      const token = await getAccessToken();
      if (!token) return;
      setLoading(true);
      try {
        const res = await api.tasks.list(token, {
          page,
          limit: 10,
          status: statusFilter || undefined,
          search: search.trim() || undefined,
        });
        setTasks(res.tasks);
        setPagination(res.pagination);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load tasks");
        if ((e as Error).message?.includes("Unauthorized")) logout();
      } finally {
        setLoading(false);
      }
    },
    [getAccessToken, statusFilter, search, logout]
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }
    if (user) fetchTasks(pagination.page);
  }, [user, authLoading, router, pagination.page, fetchTasks]);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => fetchTasks(1), 300);
    return () => clearTimeout(t);
  }, [user, statusFilter, search, fetchTasks]);

  const openAdd = () => {
    setFormTitle("");
    setFormDescription("");
    setFormStatus("pending");
    setEditingTask(null);
    setModal("add");
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || "");
    setFormStatus(task.status);
    setModal("edit");
  };

  const closeModal = () => {
    setModal(null);
    setEditingTask(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    const token = await getAccessToken();
    if (!token) return;
    setSubmitting(true);
    try {
      await api.tasks.create(token, {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        status: formStatus,
      });
      toast.success("Task created");
      closeModal();
      fetchTasks(pagination.page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !formTitle.trim()) return;
    const token = await getAccessToken();
    if (!token) return;
    setSubmitting(true);
    try {
      await api.tasks.update(token, editingTask.id, {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        status: formStatus,
      });
      toast.success("Task updated");
      closeModal();
      fetchTasks(pagination.page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    const token = await getAccessToken();
    if (!token) return;
    try {
      await api.tasks.delete(token, id);
      toast.success("Task deleted");
      fetchTasks(pagination.page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleToggle = async (id: string) => {
    const token = await getAccessToken();
    if (!token) return;
    try {
      await api.tasks.toggle(token, id);
      toast.success("Task updated");
      fetchTasks(pagination.page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle");
    }
  };

  if (authLoading) {
    return (
      <main style={styles.page}>
        <p>Loading…</p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Tasks · {user.email}</h1>
        <button type="button" style={styles.logout} onClick={() => logout()}>
          Log out
        </button>
      </header>

      <div style={styles.filters}>
        <input
          type="search"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.input}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.select}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
        <button type="button" style={styles.addBtn} onClick={openAdd}>
          + Add task
        </button>
      </div>

      {loading ? (
        <p>Loading tasks…</p>
      ) : (
        <>
          <div style={styles.list}>
            {tasks.map((task) => (
              <div key={task.id} style={styles.card}>
                <div style={styles.cardLeft}>
                  <div
                    style={{
                      ...styles.cardTitle,
                      textDecoration: task.completed ? "line-through" : "none",
                      opacity: task.completed ? 0.8 : 1,
                    }}
                  >
                    {task.title}
                  </div>
                  {task.description && (
                    <div style={styles.cardDesc}>{task.description}</div>
                  )}
                  <div style={styles.cardMeta}>
                    {task.status} · {task.completed ? "Done" : "Active"}
                  </div>
                </div>
                <div style={styles.cardActions}>
                  <button
                    type="button"
                    style={styles.btnSm}
                    onClick={() => handleToggle(task.id)}
                  >
                    {task.completed ? "Undo" : "Done"}
                  </button>
                  <button
                    type="button"
                    style={styles.btnSm}
                    onClick={() => openEdit(task)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    style={{ ...styles.btnSm, ...styles.btnDanger }}
                    onClick={() => handleDelete(task.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          {pagination.totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                type="button"
                style={styles.btnSm}
                disabled={pagination.page <= 1}
                onClick={() => fetchTasks(pagination.page - 1)}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} tasks)
              </span>
              <button
                type="button"
                style={styles.btnSm}
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchTasks(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {modal === "add" && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>New task</h2>
            <form style={styles.modalForm} onSubmit={handleCreate}>
              <input
                placeholder="Title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                style={styles.input}
                autoFocus
              />
              <textarea
                placeholder="Description (optional)"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                style={styles.textarea}
              />
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                style={styles.select}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
              <div style={styles.modalActions}>
                <button type="submit" style={styles.addBtn} disabled={submitting}>
                  {submitting ? "Creating…" : "Create"}
                </button>
                <button type="button" style={styles.logout} onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "edit" && editingTask && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Edit task</h2>
            <form style={styles.modalForm} onSubmit={handleUpdate}>
              <input
                placeholder="Title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                style={styles.input}
                autoFocus
              />
              <textarea
                placeholder="Description (optional)"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                style={styles.textarea}
              />
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                style={styles.select}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
              <div style={styles.modalActions}>
                <button type="submit" style={styles.addBtn} disabled={submitting}>
                  {submitting ? "Saving…" : "Save"}
                </button>
                <button type="button" style={styles.logout} onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
