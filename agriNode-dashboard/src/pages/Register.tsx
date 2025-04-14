import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../provider/AuthProvider";
import { toast } from "sonner";

export const Register = () => {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ username, email, password });
      console.log("Registration successful");
      navigate("/");
    } catch (error) {
      toast.error("Registration failed. Please try again.");
      console.error("Registration failed", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      <form className="flex flex-col gap-4 w-full max-w-sm" onSubmit={handleRegister}>
        <Input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full" />
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full" />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full" />
        <Button type="submit" className="w-full">Register</Button>
      </form>
      <p className="mt-4">
        Already have an account? <Link to="/login" className="text-primary underline">Login</Link>
      </p>
    </div>
  );
}