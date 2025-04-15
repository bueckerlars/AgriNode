import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      console.log("Login successful");
      navigate("/");
    } catch (error) {
      toast.error("Login failed. Please check your credentials and try again.");
      console.error("Login failed", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form className="flex flex-col gap-4 w-full max-w-sm" onSubmit={handleLogin}>
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full" />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full" />
        <Button type="submit" className="w-full">Login</Button>
      </form>
      <p className="mt-4">
        Don't have an account? <Link to="/register" className="text-primary underline">Register</Link>
      </p>
    </div>
  );
}