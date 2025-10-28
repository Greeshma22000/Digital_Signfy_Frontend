import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage'; 
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SignaturePage from './pages/SignaturePage';
import SignFromToken from './pages/SignFromToken';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
    
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sign/:id" element={<SignaturePage />} />
        <Route path="/sign/token/:token" element={<SignFromToken />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;