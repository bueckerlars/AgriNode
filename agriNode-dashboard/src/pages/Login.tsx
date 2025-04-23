import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const Login = () => {
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();

  // Überwache User-Status Änderungen für die Navigation
  useEffect(() => {
    // Wenn wir einen Benutzer haben und nicht mehr im Loading-Zustand sind,
    // dann navigieren wir zur Startseite
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoggingIn) return; // Verhindere doppelte Submissions
    
    setIsLoggingIn(true);
    
    try {
      await login({ email, password });
      // Erfolgreiche Login-Nachricht anzeigen
      toast.success("Login erfolgreich!");
      // Wir navigieren nicht hier, sondern im useEffect oben, wenn der user-State aktualisiert wurde
    } catch (error: any) {
      setIsLoggingIn(false);
      const errorMessage = error.message || "Login fehlgeschlagen. Bitte überprüfe deine Anmeldedaten und versuche es erneut.";
      toast.error(errorMessage);
      console.error("Login fehlgeschlagen", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form className="flex flex-col gap-4 w-full max-w-sm" onSubmit={handleLogin}>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full"
          disabled={isLoggingIn}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          className="w-full"
          disabled={isLoggingIn}
          required
        />
        <Button type="submit" className="w-full" disabled={isLoggingIn}>
          {isLoggingIn ? "Anmeldung..." : "Login"}
        </Button>
      </form>
      <p className="mt-4">
        Don't have an account? <Link to="/register" className="text-primary underline">Register</Link>
      </p>
    </div>
  );
}