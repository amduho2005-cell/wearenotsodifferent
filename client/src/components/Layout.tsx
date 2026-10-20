import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Heart, Sparkle } from './Doodles';

const NAV = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/entradas', label: 'Entradas', end: false },
  { to: '/diario', label: 'Diario', end: false },
  { to: '/mi-entrada', label: 'Mi entrada', end: false },
  { to: '/sobre-el-proyecto', label: 'Sobre el proyecto', end: false },
];

export function Layout() {
  const { pathname } = useLocation();

  // Al cambiar de página, volver arriba y llevar el foco al contenido (para lectores de pantalla).
  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById('contenido')?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="app">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <header className="site-header">
        <div className="site-header__inner">
          <Link to="/" className="logo" aria-label="we are not so different, ir al inicio">
            <span className="logo__mark" aria-hidden="true">
              ✎
            </span>
            <span className="logo__text">we are not so different</span>
          </Link>
          <nav aria-label="Principal">
            <ul className="nav">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className="nav__link">
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="contenido" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <p className="hand">
            <Heart size={22} className="ink-lavender" /> Nadie está solo en lo que le gusta.
          </p>
          <p className="site-footer__small">
            Un diario colectivo sin likes, sin seguidores y sin rankings.
          </p>
          <Sparkle size={18} className="ink-sage" />
        </div>
      </footer>
    </div>
  );
}
