import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App";
import { store } from "./app/store";
import { restoreFromStorage } from "./features/auth/authSlice";
import "./index.css";

// Restore auth from localStorage BEFORE first render so ProtectedRoute has token
store.dispatch(restoreFromStorage());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <App />
  </Provider>
);
