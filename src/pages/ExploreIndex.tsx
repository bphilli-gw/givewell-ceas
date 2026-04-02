/**
 * Explore landing page — lists all ITN supplementary calculation modules
 * with descriptions and links.
 */

import { Link } from 'react-router-dom';

interface Module {
  path: string;
  title: string;
  summary: string;
  outputLabel: string;
}

const MODULES: Module[] = [
  {
    path: '/itn/explore/durability',
    title: 'Net Durability',
    summary:
      'How does net protective effectiveness decay over 3 years? Physical deterioration (holes, tears) and chemical decay (insecticide loss) combine to reduce protection. This sheet decomposes total protection into physical, chemical, and joint components.',
    outputLabel: 'Combined protection by year + attribution splits',
  },
  {
    path: '/itn/explore/insecticide-resistance',
    title: 'Insecticide Resistance',
    summary:
      'Pyrethroid resistance reduces the killing power of bed nets. This module projects resistance forward from lab data, then estimates how much each net type (standard, PBO, chlorfenapyr) is affected.',
    outputLabel: 'Weighted resistance adjustment by year',
  },
  {
    path: '/itn/explore/coverage',
    title: 'Effective Coverage',
    summary:
      'What proportion of the target population is effectively protected? Combines net retention rates, durability-adjusted protection, and baseline coverage from routine channels and other sources.',
    outputLabel: 'Total effective coverage by year',
  },
  {
    path: '/itn/explore/malaria-mortality',
    title: 'Malaria Mortality',
    summary:
      'Constructs country-specific malaria mortality rates from GBD data, adjusting for SMC coverage, vaccine rollout, rurality, and subnational variation. Also estimates the mortality ratio for ages 5+ relative to under-5.',
    outputLabel: 'Baseline mortality rate + SMC adjustment + 5+ ratio',
  },
  {
    path: '/itn/explore/leverage-funging',
    title: 'Leverage & Funging',
    summary:
      'Models what would happen without GiveWell funding. Four scenarios — government replaces, Global Fund replaces, upstream stays the same, or goes unfunded — are weighted by probability to estimate how much value is displaced or preserved.',
    outputLabel: 'Leverage adjustment + funging adjustment',
  },
];

export default function ExploreIndex() {
  return (
    <div className="page explore-index">
      <h1>Explore: ITN Calculation Modules</h1>
      <p className="explore-index__intro">
        The ITN cost-effectiveness analysis is built from five supplementary
        calculations, each feeding into the main pipeline. Click any module
        to see a step-by-step flow diagram of how inputs become outputs,
        with every intermediate value visible and color-coded by data source.
      </p>

      <div className="explore-index__grid">
        {MODULES.map((mod) => (
          <Link key={mod.path} to={mod.path} className="explore-card">
            <h2 className="explore-card__title">{mod.title}</h2>
            <p className="explore-card__summary">{mod.summary}</p>
            <div className="explore-card__output">
              <span className="explore-card__output-label">Outputs:</span>{' '}
              {mod.outputLabel}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
