import { useState } from "react";
import Button from "../common/Button";
import Input from "../common/Input";

interface RegisterFormProps {
  onSubmit: (payload: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  loading?: boolean;
}

const RegisterForm = ({ onSubmit, loading }: RegisterFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({ name, email, password });
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Create your account</h2>
      <label>
        Name
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </label>
      <label>
        Email
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label>
        Password
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create account"}
      </Button>
    </form>
  );
};

export default RegisterForm;
