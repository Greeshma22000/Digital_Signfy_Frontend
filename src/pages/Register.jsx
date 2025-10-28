import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Register = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        name,
        email,
        password,
      });

      console.log('✅ REGISTER response:', res.data);
      toast.success('🎉 Account created! Please log in.');
      navigate('/login');

    } catch (err) {
      console.error('❌ REGISTER error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1173')"}}>
      <div className="max-w-md w-full p-6 border rounded shadow bg-white/70 backdrop-blur">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">Create Account</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Name"
          className="w-full mb-3 p-2 border rounded bg-white bg-opacity-90"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-2 border rounded bg-white bg-opacity-90"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-3 p-2 border rounded bg-white bg-opacity-90"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded shadow">
          Register
        </button>
      </form>
      </div>
    </div>
  );
};

export default Register;