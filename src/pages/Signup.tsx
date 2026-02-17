import { useState } from "react";
import { signupUser } from "../features/auth/authApi";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signupUser(form);
    navigate("/login");
  };

  return (
    <div>
      <h2>Signup</h2>
      <form onSubmit={handleSubmit}>
      <input name="username" placeholder="Username" onChange={handleChange} />
      <input name="email" placeholder="Email" onChange={handleChange} />
      <input name="phoneNumber" placeholder="Phone Number" onChange={handleChange} />
      
      <select name="sex" onChange={handleChange}>
        <option value="">Select Sex</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>

      <input type="date" name="dateOfBirth" onChange={handleChange} />
      <input type="password" name="password" placeholder="Password" onChange={handleChange} />

      <button type="submit">Sign Up</button>
    </form>
    </div>
  );
}
