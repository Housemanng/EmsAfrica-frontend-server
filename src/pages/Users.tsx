import { useGetAllUsersQuery } from "../features/user";

const Users = () => {
  const { data, isLoading, error } = useGetAllUsersQuery("");

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading users</p>;

  return (
    <div>
      <h1>All Users</h1>
      {data?.map((user: any) => (
        <div key={user._id}>
          <p>{user.email}</p>
        </div>
      ))}
    </div>
  );
};

export default Users;
