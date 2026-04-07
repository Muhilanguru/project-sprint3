import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onToggleSidebar, pageTitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="hamburger" onClick={onToggleSidebar} id="menu-toggle">
          ☰
        </button>
        <span className="navbar-title">{pageTitle || 'Dashboard'}</span>
      </div>

      <div className="navbar-actions">
        <div className="navbar-user">
          <div className="navbar-user-info">
            <span className="navbar-user-name">{user?.name}</span>
            <span className="navbar-user-role">{user?.role}</span>
          </div>
          <div className="navbar-avatar" id="user-avatar">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleLogout} id="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
