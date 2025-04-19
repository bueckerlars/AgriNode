import { AppLayout } from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Dashboard } from "@/pages/Dashboard";
import { Login } from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import { Profile } from "@/pages/Profile";
import { Register } from "@/pages/Register";
import SensorDetail from "@/pages/SensorDetail";
import { Settings } from "@/pages/Settings";
import { Analysis } from "@/pages/Analysis";
import { Outlet } from "react-router-dom";

const routes = [
    {
        path: "/",
        element: (
            <AppLayout>
                <Outlet />
            </AppLayout>
        ),
        children: [
            {
                path: "/",
                element: (
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                )
            },
            {
                path: "analysis",
                element: (
                    <ProtectedRoute>
                        <Analysis />
                    </ProtectedRoute>
                )
            },
            {
                path: "settings",
                element: (
                    <ProtectedRoute>
                        <Settings />
                    </ProtectedRoute>
                )
            },
            {
                path: "profile",
                element: (
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                )
            },
            {
                path: "sensors/:sensorId",
                element: (
                    <ProtectedRoute>
                        <SensorDetail />
                    </ProtectedRoute>
                ) 
            },
        ]
    },
    {
        path: "login",
        element: <Login />
    },
    {
        path: "register",
        element: <Register />
    },
    {
        path: "*",
        element: <NotFound />
    }
]

export default routes;