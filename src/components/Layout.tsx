import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <NavLink to="/" className="logo">
            GiveWell CEA Explorer
          </NavLink>
          <nav className="nav">
            <NavLink to="/" end>
              Overview
            </NavLink>
            <NavLink to="/sensitivity">Sensitivity</NavLink>
            <NavLink to="/compare">Compare</NavLink>
            <NavLink to="/explore/insecticide-resistance">Explore</NavLink>
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <p>
          Data from GiveWell's ITN cost-effectiveness analysis.{' '}
          Model validated against spreadsheet with &lt;1e-6 tolerance.
        </p>
      </footer>
    </div>
  );
}
