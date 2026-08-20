import { createBrowserRouter } from "react-router";
import Layout from "../components/Layout/Layout";
import Login from "../pages/Authentication/Login/Login";
import Register from "../pages/Authentication/Register/Register";
import Home from "../components/Home/Home";
import Profile from "../components/Profile/Profile";
import NotFound from "./../components/NotFound/NotFound";
import PostDetails from "./../components/PostDetails/PostDetails";
import ProtectedRoute from "./ProtectedRoute/ProtectedRoute";

export const routing = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "postdetails/:id",
        element: (
          <ProtectedRoute>
            <PostDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: "login",
        element: <Login />,
      },
      { path: "register", element: <Register /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
