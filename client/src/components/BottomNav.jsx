import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', icon: '🏠', label: 'Today', end: true },
  { to: '/workstreams', icon: '🗂️', label: 'Workstreams' },
  { to: '/tasks', icon: '✅', label: 'Tasks' },
  { to: '/log', icon: '📓', label: 'Daily Log' },
  { to: '/more', icon: '⋯', label: 'More' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
