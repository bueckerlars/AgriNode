
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, createBrowserRouter, RouterProvider } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { SensorsProvider } from "@/contexts/SensorsContext";
import { SensorDataProvider } from "@/contexts/SensorDataContext";

// Importiere den API-Client, damit die Axios-Interceptoren initialisiert werden
import '@/api/apiClient';
import routes from "./routes";

const router = createBrowserRouter(routes);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SensorsProvider>
          <SensorDataProvider>
            <SidebarProvider>
              <Toaster />
              <Sonner />
              <RouterProvider router={router} />
            </SidebarProvider>
          </SensorDataProvider>
        </SensorsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
