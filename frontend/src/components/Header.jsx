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
    <header className="bg-white sticky shadow-md top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-3xl font-extrabold text-indigo-700 tracking-tight transition duration-300 hover:text-indigo-600">
            BK Forum
          </Link>

          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link
                  to="/create-post"
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition duration-300 shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span>Create Post</span>
                </Link>
                
                <Link
                  to={`/profile/${user._id}`}
                  className="flex items-center space-x-2 text-gray-800 font-medium hover:text-indigo-600 transition duration-300"
                >
                  <User className="w-5 h-5" />
                  <span>{user.username}</span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-red-500 font-medium hover:text-red-700 transition duration-300"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 font-medium hover:text-indigo-600 transition duration-300"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition duration-300 shadow-md"
                >
                  Register
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

