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
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            BK Forum
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/create-post"
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Post</span>
                </Link>
                
                <Link
                  to={`/profile/${user._id}`}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600"
                >
                  <User className="w-4 h-4" />
                  <span>{user.username}</span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-700 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary"
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

