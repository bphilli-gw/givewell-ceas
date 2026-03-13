import { NavLink, Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
  const { pathname } = useLocation();
  const isSMC = pathname.startsWith('/smc');
  const isITN = pathname.startsWith('/itn');
  const isVAS = pathname.startsWith('/vas');
  const prefix = isSMC ? '/smc' : isITN ? '/itn' : isVAS ? '/vas' : null;

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <NavLink to="/" className="logo">
            GiveWell CEA Explorer
          </NavLink>

          {/* CEA type tabs */}
          <div className="cea-tabs">
            <NavLink to="/itn" className={({ isActive }) => `cea-tab ${isActive || isITN ? 'active' : ''}`}>
              ITN
            </NavLink>
            <NavLink to="/smc" className={({ isActive }) => `cea-tab ${isActive || isSMC ? 'active' : ''}`}>
              SMC
            </NavLink>
            <NavLink to="/vas" className={({ isActive }) => `cea-tab ${isActive || isVAS ? 'active' : ''}`}>
              VAS
            </NavLink>
          </div>

          {/* Sub-navigation (only when in a CEA type) */}
          {prefix && (
            <nav className="nav">
              <NavLink to={prefix} end>
                Overview
              </NavLink>
              <NavLink to={`${prefix}/sensitivity`}>Sensitivity</NavLink>
              <NavLink to={`${prefix}/compare`}>Compare</NavLink>
              {isITN && (
                <NavLink to="/itn/explore/insecticide-resistance">Explore</NavLink>
              )}
            </nav>
          )}
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <p>
          Data from GiveWell's cost-effectiveness analyses.{' '}
          Models validated against spreadsheets with &lt;1e-6 tolerance.
        </p>
      </footer>
    </div>
  );
}
