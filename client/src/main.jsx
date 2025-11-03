import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import Register from "./components/Register";
import Login from "./components/Login";
import MainPage from "./components/MainPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Account from "./components/Account";
import EventPage from "./components/EventPage";
import EventForm from "./components/EventForm";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // protect the index/main page
      { index: true, element: <ProtectedRoute><MainPage /></ProtectedRoute> },
    ],
  },
  {
    path: "/account",
    element: <App />,
    children: [
      { index: true, element: <ProtectedRoute><Account /></ProtectedRoute> },
    ],
  },
  {
    path: "/events",
    element: <App />,
    children: [
      // create
      { path: "new", element: <ProtectedRoute><EventForm /></ProtectedRoute> },
      // view
      { path: ":id", element: <ProtectedRoute><EventPage /></ProtectedRoute> },
      // edit
      { path: ":id/edit", element: <ProtectedRoute><EventForm /></ProtectedRoute> },
    ],
  },
  // auth routes (not nested under App)
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);