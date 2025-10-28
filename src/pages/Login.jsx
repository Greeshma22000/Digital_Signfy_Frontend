import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      console.log('✅ LOGIN response:', JSON.stringify(res.data, null, 2));

      // Save token
      localStorage.setItem('token', res.data.token);

      // Show success toast
      toast.success('🎉 Login successful!');

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('❌ LOGIN error:', err.response?.data || err.message);

      // Show error toast only on failure
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1471879832106-c7ab9e0cee23?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1073')`, 
      }}
    >
    <div className="max-w-md w-full p-6 border rounded shadow bg-white/70 backdrop-blur">
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-800">Login</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border rounded focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border rounded focus:outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
          Login
        </button>
      </form>
    </div>
    </div>
  );
};

export default Login;