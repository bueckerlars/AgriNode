import AppLayout from "@/components/AppLayout";
import { Outlet } from "react-router-dom";
import { SensorDetails } from "./pages/SensorDetails";
import { Dashboard } from "./pages/Dashboard";
import { Settings } from "./pages/Settings";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import NotFound from "./pages/NotFound";

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
                element: <Dashboard />
            },
            {
                path: "settings",
                element: <Settings />
            },
            {
                path: "profile",
                element: <Profile />
            },
            {
                path: "sensor/:sensorId",
                element: <SensorDetails />
            },
            {
                path: "login",
                element: <Login />
            },
            {
                path: "register",
                element: <Register />
            }
        ]
    },
    {
        path: "*",
        element: <NotFound />
    }
]

export default routes;