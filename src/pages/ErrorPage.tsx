import { useRouteError, Link } from "react-router-dom";

export default function ErrorPage() {
  const error: any = useRouteError();

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Something went wrong 😕</h1>
      <p>{error?.statusText || error?.message}</p>
      <Link to="/dashboard">Go to Dashboard</Link>
    </div>
  );
}
