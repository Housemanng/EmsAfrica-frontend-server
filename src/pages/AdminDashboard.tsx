import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllAdmins } from "../features/admin/adminApi";
import type { AppDispatch, RootState } from "../app/store";

export default function AdminDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { admins, isLoading } = useSelector((state: RootState) => state.admin);
  const role = useSelector((state: RootState) => state.auth.role);

  useEffect(() => {
    dispatch(getAllAdmins());
  }, [dispatch]);

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <h1>Admin Dashboard</h1>

      {role === "superadmin" && <button>Create Admin</button>}

      <ul>
        {admins?.map((admin) => (
          <li key={admin._id}>
            {admin.username} - {admin.adminRole}
          </li>
        ))}
      </ul>
    </div>
  );
}
