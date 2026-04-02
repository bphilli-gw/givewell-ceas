import { Link } from 'react-router-dom';

const MODULES = [
  {
    path: '/vas/explore/counterfactual-coverage',
    title: 'Counterfactual Coverage',
    summary:
      'What proportion of children would receive VAS even without this program? Estimates counterfactual coverage from routine health services (MCV1-linked VAS delivery) by age group.',
    outputLabel: 'Weighted counterfactual VAS coverage rate',
  },
  {
    path: '/vas/explore/counterfactual-mortality',
    title: 'Counterfactual Mortality',
    summary:
      'Calculates the baseline mortality rate among VAS-eligible children. Filters GBD death counts to the eligible age range and adjusts for GBD-vs-other data sources and subnational variation.',
    outputLabel: 'Adjusted mortality rate during VAS period',
  },
  {
    path: '/vas/explore/external-validity',
    title: 'External Validity',
    summary:
      'How applicable are the VAS trial results to this specific location? Combines vitamin A deficiency (VAD) estimates from surveys and GBD with disease-specific mortality composition to produce an external validity adjustment.',
    outputLabel: 'Combined external validity adjustment',
  },
  {
    path: '/vas/explore/leverage-funging',
    title: 'Leverage & Funging',
    summary:
      'Models three funding scenarios — government replaces, philanthropy replaces, or program shrinks — to estimate how GiveWell funding interacts with other actors.',
    outputLabel: 'Leverage adjustment + funging adjustment',
  },
];

export default function VASExploreIndex() {
  return (
    <div className="page explore-index">
      <h1>Explore: VAS Calculation Modules</h1>
      <p className="explore-index__intro">
        The VAS cost-effectiveness analysis is built from four supplementary
        calculations that feed into the main pipeline. Click a module to see
        a step-by-step flow diagram.
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
