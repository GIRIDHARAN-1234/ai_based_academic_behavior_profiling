import { useEffect, useState } from "react";
import { getAdminUsers, updateUserStatus, deleteUser } from "../../api";
import toast from "react-hot-toast";
import { UserCheck, UserX, Trash2, Search } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    setLoading(true);
    getAdminUsers(roleFilter === "all" ? undefined : roleFilter)
      .then(r => setUsers(r.data))
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const handleStatus = async (id, status) => {
    try {
      await updateUserStatus(id, status);
      toast.success(`User ${status}`);
      fetchUsers();
    } catch { toast.error("Update failed"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await deleteUser(id);
      toast.success("User deleted");
      fetchUsers();
    } catch { toast.error("Delete failed"); }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-content">
      <div className="page-header"><h2>User Management</h2><p>Manage student and faculty accounts</p></div>
      <div className="card">
        <div className="table-toolbar">
          <input className="search-input" placeholder="Search by name or email..." value={search} onChange={e=>setSearch(e.target.value)} />
          <div className="filter-tabs">
            {["all","student","faculty"].map(r=><button key={r} className={`filter-tab ${roleFilter===r?"active":""}`} onClick={()=>setRoleFilter(r)}>{r.charAt(0).toUpperCase()+r.slice(1)}</button>)}
          </div>
        </div>
        {loading ? <div className="loading"><div className="spinner"/></div> : (
          <table className="data-table">
            <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((u,i)=>(
                <tr key={u._id}>
                  <td>{i+1}</td>
                  <td><strong>{u.name}</strong></td>
                  <td className="muted">{u.email}</td>
                  <td><span className={`role-chip role-${u.role}`}>{u.role}</span></td>
                  <td>{u.department||"—"}</td>
                  <td><span className={`status-badge status-${u.status}`}>{u.status}</span></td>
                  <td>
                    <div className="action-buttons">
                      {u.status !== "active" && <button className="btn-success-sm" onClick={()=>handleStatus(u._id,"active")} title="Activate"><UserCheck size={14}/></button>}
                      {u.status !== "inactive" && <button className="btn-warning-sm" onClick={()=>handleStatus(u._id,"inactive")} title="Deactivate"><UserX size={14}/></button>}
                      <button className="btn-danger-sm" onClick={()=>handleDelete(u._id)} title="Delete"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={{textAlign:"center",padding:24,color:"#9ca3af"}}>No users found</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
