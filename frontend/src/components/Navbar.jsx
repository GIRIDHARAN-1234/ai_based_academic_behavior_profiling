import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout as apiLogout } from "../api";
import { LogOut, LayoutDashboard, BookOpen, ClipboardList, BarChart2, Users, Settings, BrainCircuit, Send, UserPlus } from "lucide-react";

const studentLinks = [
  { to: "/student", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/tests", label: "My Tests", icon: BookOpen },
  { to: "/student/results", label: "Results", icon: ClipboardList },
  { to: "/student/profile", label: "Profile", icon: Settings },
];

const facultyLinks = [
  { to: "/faculty", label: "Dashboard", icon: LayoutDashboard },
  { to: "/faculty/create-students", label: "Create Students", icon: UserPlus },
  { to: "/faculty/students", label: "View Students", icon: Users },
  { to: "/faculty/create-test", label: "Create Test", icon: BookOpen },
  { to: "/faculty/assign-test", label: "Assign Test", icon: Send },
  { to: "/faculty/analytics", label: "Analytics", icon: BarChart2 },
];

const adminLinks = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart2 },
];

const linksMap = { student: studentLinks, faculty: facultyLinks, admin: adminLinks };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try { await apiLogout(); } catch (_) {}
    const role = user.role;
    logout();
    if (role === "admin") {
      navigate("/admin-login");
    } else {
      navigate("/login");
    }
  };

  if (!user) return null;
  const links = linksMap[user.role] || [];
  const roleColors = { student: "#6366f1", faculty: "#0ea5e9", admin: "#f59e0b" };
  const roleColor = roleColors[user.role] || "#6366f1";

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <BrainCircuit size={28} color={roleColor} />
        <span>AcademIQ</span>
      </div>
      <div className="navbar-links">
        {links.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={`nav-link ${location.pathname === to ? "active" : ""}`}>
            <Icon size={16} /> {label}
          </Link>
        ))}
      </div>
      <div className="navbar-right">
        <span className={`role-badge role-${user.role}`}>{user.role}</span>
        <span className="user-name">{user.name}</span>
        <button className="btn-icon" onClick={handleLogout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}
