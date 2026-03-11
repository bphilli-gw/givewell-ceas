import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="page home-page">
      <h1>GiveWell CEA Explorer</h1>
      <p className="subtitle">
        Interactive cost-effectiveness analyses for GiveWell's top charities.
        Each model is validated against the original spreadsheets with &lt;1e-6 tolerance.
      </p>

      <div className="cea-cards">
        <Link to="/itn" className="cea-card">
          <h2>ITN (Insecticide-Treated Nets)</h2>
          <p>
            26 country/region combinations across 13 AMF countries and 13 Malaria Consortium
            Nigerian states. Includes 4 supplementary calculation sheets (durability,
            insecticide resistance, malaria mortality, coverage).
          </p>
          <div className="cea-card-meta">
            <span>26 locations</span>
            <span>Interactive parameter editing</span>
            <span>Monte Carlo uncertainty</span>
          </div>
        </Link>

        <Link to="/smc" className="cea-card">
          <h2>SMC (Seasonal Malaria Chemoprevention)</h2>
          <p>
            20 country/region combinations including Burkina Faso, Chad, DRC,
            Mozambique, Nigeria, South Sudan, Togo, and Uganda.
            Simpler model with 1 supplementary sheet (counterfactual malaria).
          </p>
          <div className="cea-card-meta">
            <span>20 locations</span>
            <span>Pre-computed results</span>
            <span>Monte Carlo uncertainty</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
