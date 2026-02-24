import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../app/store";
import {
  getAllUsers,
  selectAllUsers,
  selectAllUsersLoading,
  selectAllUsersError,
} from "../features/user";

const Users = () => {
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector(selectAllUsers);
  const isLoading = useSelector(selectAllUsersLoading);
  const error = useSelector(selectAllUsersError);

  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

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
