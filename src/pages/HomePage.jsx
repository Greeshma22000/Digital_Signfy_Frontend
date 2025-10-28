

import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-cyan-800 via-cyan-700 to-cyan-900 text-white relative">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-4 bg-purple-900/60 backdrop-blur-sm shadow-md">
        <div className="text-2xl font-bold tracking-wider text-yellow-400">
          {/* <img
              src="/logo.jpg"
              alt="Seal the Sign Logo"
              className=" w-20 h-20 rounded-full object-contain"
              
            /> */}
           Digital Signfy
        </div>
        <div className="flex gap-6 items-center">
          <Link to="/login" className="hover:text-yellow-300 transition">Login</Link>
          <Link to="/register" className="hover:text-yellow-300 transition">Register</Link>
        </div>
      </nav>

      {/* Main Section */}
      <div className="flex flex-col md:flex-row items-center justify-between px-10 py-20">
        {/* Text block */}
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-pink-300 drop-shadow">
            Digitally Sign PDFs With Ease ✍️
          </h1>
          <p className="text-lg text-purple-100">
            Seal the Sign lets you upload, sign, and securely share PDFs. Customize your signature with fonts, drag placement, and more.
          </p>
        </div>

        {/* Abstract layered blob + Logo in yellow circle */}
        <div className="relative mt-10 md:mt-0 w-[280px] h-[280px] md:w-[360px] md:h-[360px]">
          {/* Back blobs */}
          <div className="absolute inset-0 rounded-full bg-purple-600 rotate-45 scale-110 z-10"></div>
          <div className="absolute inset-6 rounded-full bg-pink-500 rotate-12 scale-95 z-20"></div>
          {/* Yellow circle with logo */}
          <div className="absolute inset-12 rounded-full bg-yellow-400 rotate-30 scale-75 z-30 flex items-center justify-center p-4 shadow-md">
            {/* <img
              src="/logo.jpg"
              alt="Seal the Sign Logo"
              className=" w-24 h-24 rounded-full object-cover"
              
            /> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;