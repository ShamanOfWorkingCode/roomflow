import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import './Layout.css'

const NAV = [
  { to: '/',           icon: '⊞', label: 'Забронировать' },
  { to: '/mybookings', icon: '☑', label: 'Мои брони'     },
  { to: '/calendar',   icon: '▦', label: 'Календарь'     },
  { to: '/analytics',  icon: '◈', label: 'Аналитика'     },
  { to: '/rooms',      icon: '⬡', label: 'Комнаты'       },
]

function initials(fullName) {
  if (!fullName) return '?'
  return fullName.split(' ').slice(0, 2).map(s => s[0]).join('').toUpperCase()
}

export default function Layout() {
  const { user, logoutUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  function handleLogout() {
    logoutUser()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">
             <img src="/bakai-square.png" alt="BakaiBank" width="40" height="40" />
          </span>
          <div>
            <div className="logo-name">RoomFlow</div>
            <div className="logo-sub">ООО "БакайБанк"</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
            >
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <button className="theme-toggle" onClick={toggleTheme} title="Переключить тему">
          <span className="nav-icon">{theme === 'light' ? '☾' : '☀'}</span>
          {theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
        </button>

        <div className="sidebar-user" onClick={handleLogout} title="Нажмите, чтобы выйти">
          <div className="user-avatar">{initials(user?.full_name)}</div>
          <div>
            <div className="user-name">{user?.full_name || 'Гость'}</div>
            <div className="user-dept">
              {user?.department}{user?.is_manager ? ' · менеджер' : ''} · ID: {user?.id}
            </div>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <Outlet />
      </main>
    </div>
  )
}
