import { Link, useNavigate } from 'react-router-dom'
import { LogOut, User, Plus, Search } from 'lucide-react'
import { useAuth } from '../store/authContext'

const Header = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-[#1A1A1B] sticky top-0 z-50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-white hover:opacity-90 transition">
            <img
              src="/favico.png"
              alt="BK Forum"
              className="w-8 h-8 rounded"
            />
            <span className="font-bold text-xl">
              BK<span className="text-[#FF4500]">Forum</span>
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <Link
                  to="/create-post"
                  className="flex items-center px-4 py-1.5 bg-[#FF4500] text-white rounded-full font-bold text-sm hover:bg-[#FF5722] transition"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  <span>Create</span>
                </Link>

                <Link
                  to={`/profile/${user._id}`}
                  className="flex items-center space-x-2 px-3 py-1.5 text-white hover:bg-gray-800 rounded transition"
                >
                  {user.avatar ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:3000'}${user.avatar}`}
                      alt={user.username}
                      className="w-7 h-7 rounded-full object-cover border border-gray-600"
                    />
                  ) : (
                    <div className="w-7 h-7 bg-[#FF4500] rounded-full flex items-center justify-center text-xs font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium hidden sm:block">{user.username}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-1.5 text-white font-bold text-sm hover:bg-gray-800 rounded-full transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 bg-[#FF4500] text-white rounded-full font-bold text-sm hover:bg-[#FF5722] transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

