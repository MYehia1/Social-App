import React from "react";
import { RouterProvider } from "react-router";
import { routing } from "./routing/AppRouting";
import UserContextProvider from "./context/UserContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from 'react-hot-toast';

const query = new QueryClient();

function App() {
  return (
    <UserContextProvider>
      <QueryClientProvider client={query}>
        <RouterProvider router={routing} />
        <ReactQueryDevtools />
        <Toaster />
      </QueryClientProvider>
    </UserContextProvider>
  );
}

export default App;
