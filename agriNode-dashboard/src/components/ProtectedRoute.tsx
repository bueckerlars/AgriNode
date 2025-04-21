import type { PropsWithChildren } from "react";
import { User } from "@/types/api";
import { Navigate, useLocation, Link } from "react-router-dom";
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

    // Wenn der Benutzer nicht eingeloggt ist, zur Login-Seite weiterleiten
    if (user === null) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Wenn der Benutzer eingeloggt ist, aber nicht die erforderlichen Rollen hat
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
                <p className="text-gray-600">Sie haben keine Berechtigung, auf diese Seite zuzugreifen.</p>
                <p className="text-gray-600 mt-2">Ihre Rolle: {user.role}</p>
                <p className="text-gray-600 mt-2">Erforderliche Rolle(n): {allowedRoles.join(', ')}</p>
                <Link 
                    to="/" 
                    className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Zurück zum Dashboard
                </Link>
            </div>
        );
    }
    
    return children;
}
