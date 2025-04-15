import type { PropsWithChildren } from "react";
import { User } from "@/types/api";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type ProtectedRouteProps = PropsWithChildren & {
    allowedRoles?: User['role'][];
};

export default function ProtectedRoute({ 
    allowedRoles,
    children
}: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const location = useLocation();
    
    if (loading) {
        // Anstatt zu "Loading" zu navigieren, zeigen wir während des Ladevorgangs nichts an
        // Dies verhindert das Umleiten bei einem Seitenneuladen
        return <div className="flex justify-center items-center min-h-screen">
            <div className="animate-pulse">Wird geladen...</div>
        </div>;
    }

    if (
        user === null ||
        (allowedRoles && !allowedRoles.includes(user!.role))
    ){
        // Die aktuelle Position speichern, um nach dem Login zurückzukehren
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    return children;
}
