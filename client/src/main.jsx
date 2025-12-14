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
import ActivityForm from "./components/ActivityForm";
import PlanningStepForm from "./components/PlanningStepForm";
import Friends from "./components/Friends";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
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
    path: "/friends",
    element: <App />,
    children: [
      { index: true, element: <ProtectedRoute><Friends /></ProtectedRoute> },
    ],
  },
  {
    path: "/events",
    element: <App />,
    children: [
      // create / edit event
      { path: "new", element: <ProtectedRoute><EventForm /></ProtectedRoute> },
      { path: ":id", element: <ProtectedRoute><EventPage /></ProtectedRoute> },
      { path: ":id/edit", element: <ProtectedRoute><EventForm /></ProtectedRoute> },

      // activities nested under events
      { path: ":id/activities/new", element: <ProtectedRoute><ActivityForm /></ProtectedRoute> },
      { path: ":id/activities/:aid/edit", element: <ProtectedRoute><ActivityForm /></ProtectedRoute> },

      // planning steps nested under events
      { path: ":id/planning-steps/new", element: <ProtectedRoute><PlanningStepForm /></ProtectedRoute> },
      { path: ":id/planning-steps/:sid/edit", element: <ProtectedRoute><PlanningStepForm /></ProtectedRoute> },
    ],
  },
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