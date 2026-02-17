import { Link, Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";

export default function Layout() {
  const dispatch = useDispatch();

  return (
    <div>
      <nav>
        <Link to="/dashboard">Dashboard</Link> | 
        <Link to="/admin">Admin</Link>
        <button onClick={() => dispatch(logout())}>Logout</button>
      </nav>
      <Outlet />
    </div>
  );
}
