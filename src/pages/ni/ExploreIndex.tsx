import { Link } from 'react-router-dom';

const MODULES = [
  {
    path: '/ni/explore/vaccine-pipeline',
    title: 'Vaccine Pipeline',
    summary:
      'How vaccine efficacy, coverage, and disease burden combine to determine the treatment effect. Covers the full chain from RCT evidence through survey-based coverage estimates to disease-specific mortality calculations.',
    outputLabel: 'Overall treatment effect, coverage increase, outcome children',
  },
  {
    path: '/ni/explore/mortality',
    title: 'Age-Band Mortality',
    summary:
      'Calculates vaccine-preventable disease mortality across four age bands (under-5, 5-14, 15-49, 50-74), with age-specific adjustments for coverage, efficacy, and discounting.',
    outputLabel: 'DALYs by age band (discounted)',
  },
  {
    path: '/ni/explore/income-transfers',
    title: 'Income & Cash Transfers',
    summary:
      'Estimates the income effects of reduced disease burden and the direct value of cash transfers to families as incentives for vaccination.',
    outputLabel: 'Income value + cash transfer value',
  },
  {
    path: '/ni/explore/leverage-funging',
    title: 'Leverage & Funging',
    summary:
      'Models two funding displacement scenarios specific to NI: GiveWell grantee displacement (government partially replaces) and leveraged spending displacement (government and Gavi co-funding at risk).',
    outputLabel: 'Total displacement adjustment',
  },
];

export default function NIExploreIndex() {
  return (
    <div className="page explore-index">
      <h1>Explore: NI Calculation Modules</h1>
      <p className="explore-index__intro">
        The New Incentives CEA has a deep calculation pipeline with 7
        supplementary modules (vaccine efficacy, coverage, disease burden,
        treatment effect, indirect effects, aggregation, and leverage/funging).
        These are grouped into 4 conceptual stages for clarity. Click a module
        to see the calculation flow.
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
