import { Link } from 'react-router-dom';

const MODULES = [
  {
    path: '/smc/explore/counterfactual-malaria',
    title: 'Counterfactual Malaria',
    summary:
      'Calculates baseline malaria mortality and incidence rates among SMC-eligible children (3-59 months). Adjusts for ITN coverage effects, computes the older-population mortality ratio, and converts GBD incidence from per-100k to proportions.',
    outputLabel: 'Mortality rate (3-59mo), older mortality ratio, adjusted incidence rates',
  },
  {
    path: '/smc/explore/leverage-funging',
    title: 'Leverage & Funging',
    summary:
      'Models four funding displacement scenarios — government replacement, Global Fund replacement, upstream unchanged, and unfunded — weighted by probability to estimate how GiveWell spending interacts with other funders.',
    outputLabel: 'Leverage adjustment + funging adjustment',
  },
];

export default function SMCExploreIndex() {
  return (
    <div className="page explore-index">
      <h1>Explore: SMC Calculation Modules</h1>
      <p className="explore-index__intro">
        The SMC cost-effectiveness analysis is built from two supplementary
        calculations that feed into the main pipeline. Click a module to see
        a step-by-step flow diagram of how inputs become outputs.
      </p>
      <div className="explore-index__grid">
        {MODULES.map((mod) => (
          <Link key={mod.path} to={mod.path} className="explore-card">
            <h2 className="explore-card__title">{mod.title}</h2>
            <p className="explore-card__summary">{mod.summary}</p>
            <div className="explore-card__output">
              <span className="explore-card__output-label">Outputs:</span> {mod.outputLabel}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
