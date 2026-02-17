import { useGetAllAdminsQuery } from "../features/admin/adminApi";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";

export default function AdminDashboard() {
  const { data: admins, isLoading } = useGetAllAdminsQuery();
  const role = useSelector((state: RootState) => state.auth.role);

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
