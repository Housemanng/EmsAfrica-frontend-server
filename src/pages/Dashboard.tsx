import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const role = useSelector((state: RootState) => state.auth.role);
  const user = useSelector((state: RootState) => state.auth.user);


  return (
    <div>
      <h1>Dashboard</h1>

      {role === "user" && <p>Welcome, {user?.username || "User"} 👋</p>}

      {role !== "user" && (
        <Link to="/admin">Go to Admin Panel</Link>
      )}
    </div>
  );
}
