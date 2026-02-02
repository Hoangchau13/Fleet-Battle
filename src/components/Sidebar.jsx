import { Link, useLocation } from 'react-router-dom'
import './Sidebar.css'

function Sidebar({ isOpen }) {
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path ? 'active' : ''
  }

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2>⚓ Fleet Battle</h2>
      </div>
      
      <nav className="sidebar-nav">
        <Link to="/" className={`nav-item ${isActive('/')}`}>
          <span className="nav-icon">🏠</span>
          <span>Dashboard</span>
        </Link>
        
        <div className="nav-section">
          <h3>QUẢN LÝ</h3>
          <Link to="/users" className={`nav-item ${isActive('/users')}`}>
            <span className="nav-icon">👥</span>
            <span>Quản lý Users</span>
          </Link>
          <Link to="/levels" className={`nav-item ${isActive('/levels')}`}>
            <span className="nav-icon">🎮</span>
            <span>Quản lý Levels</span>
          </Link>
          <Link to="/ships" className={`nav-item ${isActive('/ships')}`}>
            <span className="nav-icon">⚓</span>
            <span>Quản lý Ship Types</span>
          </Link>
          
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar
