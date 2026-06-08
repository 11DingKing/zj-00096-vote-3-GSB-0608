import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Role } from '../types';
import NotificationBell from './NotificationBell';

export default function Layout() {
  const { user, isAuthenticated, logout, hasRole } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-xl font-bold text-blue-600">
                投票系统
              </Link>
              {isAuthenticated && (
                <>
                  <Link to="/" className="text-gray-700 hover:text-blue-600">
                    投票列表
                  </Link>
                  {hasRole(Role.ADMIN, Role.CREATOR) && (
                    <Link to="/create" className="text-gray-700 hover:text-blue-600">
                      创建投票
                    </Link>
                  )}
                  {hasRole(Role.ADMIN, Role.CREATOR) && (
                    <Link to="/templates" className="text-gray-700 hover:text-blue-600">
                      投票模板
                    </Link>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <NotificationBell />
                  <span className="text-gray-600">欢迎，{user?.name}</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {user?.role === Role.ADMIN ? '管理员' : user?.role === Role.CREATOR ? '创建者' : '投票者'}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    退出
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  登录
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
