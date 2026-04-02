/**
 * Dependency graph data structure for CEA calculation modules.
 *
 * Each model defines a static graph of nodes and edges. The topology
 * is identical across countries — only leaf input values vary.
 *
 * Used by the Explore pages for interactive highlighting, and
 * potentially for impact attribution and sensitivity routing.
 */

import type { NodeCategory } from '../components/FlowNode';

export interface GraphNode {
  id: string;
  label: string;
  module: string;
  category: NodeCategory;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Get all transitive ancestors (nodes that feed into this one). */
export function getAncestors(graph: DependencyGraph, nodeId: string): Set<string> {
  const result = new Set<string>();
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.pop()!;
    for (const edge of graph.edges) {
      if (edge.to === current && !result.has(edge.from)) {
        result.add(edge.from);
        queue.push(edge.from);
      }
    }
  }
  return result;
}

/** Get all transitive dependents (nodes that this one feeds into). */
export function getDependents(graph: DependencyGraph, nodeId: string): Set<string> {
  const result = new Set<string>();
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.pop()!;
    for (const edge of graph.edges) {
      if (edge.from === current && !result.has(edge.to)) {
        result.add(edge.to);
        queue.push(edge.to);
      }
    }
  }
  return result;
}

// ============================================================================
// ITN Dependency Graphs (one per Explore module)
// ============================================================================

export const ITN_DURABILITY_GRAPH: DependencyGraph = {
  nodes: [
    { id: 'yr1_condition', label: 'Year 1 condition', module: 'durability', category: 'empirical' },
    { id: 'yr2_condition', label: 'Year 2 condition', module: 'durability', category: 'empirical' },
    { id: 'yr3_condition', label: 'Year 3 condition', module: 'durability', category: 'empirical' },
    { id: 'effectiveness', label: 'Effectiveness by condition', module: 'durability', category: 'subjective' },
    { id: 'physical_protection', label: 'Physical protection', module: 'durability', category: 'calculated' },
    { id: 'pyrethroid_remaining', label: 'Pyrethroid remaining', module: 'durability', category: 'empirical' },
    { id: 'poly_coefficients', label: 'Polynomial coefficients', module: 'durability', category: 'subjective' },
    { id: 'chemical_protection', label: 'Chemical protection', module: 'durability', category: 'calculated' },
    { id: 'effect_shares', label: 'Effect shares', module: 'durability', category: 'subjective' },
    { id: 'combined_protection', label: 'Combined protection', module: 'durability', category: 'output' },
    { id: 'attribution', label: 'Year-by-year attribution', module: 'durability', category: 'output' },
  ],
  edges: [
    // Physical protection depends on damage states + effectiveness
    { from: 'yr1_condition', to: 'physical_protection' },
    { from: 'yr2_condition', to: 'physical_protection' },
    { from: 'yr3_condition', to: 'physical_protection' },
    { from: 'effectiveness', to: 'physical_protection' },
    // Chemical protection depends on pyrethroid remaining + polynomial
    { from: 'pyrethroid_remaining', to: 'chemical_protection' },
    { from: 'poly_coefficients', to: 'chemical_protection' },
    // Combined depends on physical + chemical + shares
    { from: 'physical_protection', to: 'combined_protection' },
    { from: 'chemical_protection', to: 'combined_protection' },
    { from: 'effect_shares', to: 'combined_protection' },
    // Attribution depends on physical + chemical + combined
    { from: 'physical_protection', to: 'attribution' },
    { from: 'chemical_protection', to: 'attribution' },
    { from: 'combined_protection', to: 'attribution' },
  ],
};

export const ITN_IR_GRAPH: DependencyGraph = {
  nodes: [
    { id: 'bioassay_rate', label: 'Bioassay mortality rate', module: 'ir', category: 'empirical' },
    { id: 'bioassay_year', label: 'Bioassay year', module: 'ir', category: 'empirical' },
    { id: 'dist_year', label: 'Distribution year', module: 'ir', category: 'empirical' },
    { id: 'annual_change', label: 'Annual mortality change', module: 'ir', category: 'subjective' },
    { id: 'years_gap', label: 'Years gap', module: 'ir', category: 'calculated' },
    { id: 'projected_mortality', label: 'Projected mortality', module: 'ir', category: 'calculated' },
    { id: 'killing_power_loss', label: 'Killing power loss', module: 'ir', category: 'calculated' },
    { id: 'dur_attribution', label: 'Durability attribution', module: 'ir', category: 'upstream' },
    { id: 'standard_adj', label: 'Standard ITN', module: 'ir', category: 'calculated' },
    { id: 'pbo_adj', label: 'PBO Net', module: 'ir', category: 'calculated' },
    { id: 'chlorfenapyr_adj', label: 'Chlorfenapyr Net', module: 'ir', category: 'subjective' },
    { id: 'dual_ai_adj', label: 'Dual AI Net', module: 'ir', category: 'calculated' },
    { id: 'net_mix', label: 'Net mix', module: 'ir', category: 'empirical' },
    { id: 'weighted_adj', label: 'Weighted resistance adjustment', module: 'ir', category: 'output' },
  ],
  edges: [
    { from: 'bioassay_year', to: 'years_gap' },
    { from: 'dist_year', to: 'years_gap' },
    { from: 'bioassay_rate', to: 'projected_mortality' },
    { from: 'annual_change', to: 'projected_mortality' },
    { from: 'years_gap', to: 'projected_mortality' },
    { from: 'projected_mortality', to: 'killing_power_loss' },
    { from: 'killing_power_loss', to: 'standard_adj' },
    { from: 'dur_attribution', to: 'standard_adj' },
    { from: 'standard_adj', to: 'pbo_adj' },
    { from: 'killing_power_loss', to: 'dual_ai_adj' },
    { from: 'dur_attribution', to: 'dual_ai_adj' },
    { from: 'standard_adj', to: 'weighted_adj' },
    { from: 'pbo_adj', to: 'weighted_adj' },
    { from: 'chlorfenapyr_adj', to: 'weighted_adj' },
    { from: 'dual_ai_adj', to: 'weighted_adj' },
    { from: 'net_mix', to: 'weighted_adj' },
  ],
};

export const ITN_COVERAGE_GRAPH: DependencyGraph = {
  nodes: [
    { id: 'usage_rate', label: 'Usage rate', module: 'coverage', category: 'empirical' },
    { id: 'u5_use_adj', label: 'Under-5 use adjustment', module: 'coverage', category: 'subjective' },
    { id: 'u5_sleeping', label: 'Under-5 sleeping proportion', module: 'coverage', category: 'calculated' },
    { id: 'retention', label: 'Net retention by year', module: 'coverage', category: 'empirical' },
    { id: 'sleeping_by_year', label: 'Sleeping proportion by year', module: 'coverage', category: 'calculated' },
    { id: 'combined_protection', label: 'Combined protection (from Durability)', module: 'coverage', category: 'upstream' },
    { id: 'dist_coverage', label: 'Distribution coverage by year', module: 'coverage', category: 'calculated' },
    { id: 'baseline', label: 'Baseline effective coverage', module: 'coverage', category: 'calculated' },
    { id: 'avg_retention', label: 'Average retention', module: 'coverage', category: 'calculated' },
    { id: 'avg_protection', label: 'Average protection', module: 'coverage', category: 'calculated' },
    { id: 'total_coverage', label: 'Total effective coverage', module: 'coverage', category: 'output' },
    { id: 'coverage_increase', label: 'Coverage increase', module: 'coverage', category: 'output' },
  ],
  edges: [
    { from: 'usage_rate', to: 'u5_sleeping' },
    { from: 'u5_use_adj', to: 'u5_sleeping' },
    { from: 'u5_sleeping', to: 'sleeping_by_year' },
    { from: 'retention', to: 'sleeping_by_year' },
    { from: 'sleeping_by_year', to: 'dist_coverage' },
    { from: 'combined_protection', to: 'dist_coverage' },
    { from: 'retention', to: 'avg_retention' },
    { from: 'combined_protection', to: 'avg_protection' },
    { from: 'avg_retention', to: 'baseline' },
    { from: 'avg_protection', to: 'baseline' },
    { from: 'dist_coverage', to: 'total_coverage' },
    { from: 'sleeping_by_year', to: 'total_coverage' },
    { from: 'baseline', to: 'total_coverage' },
    { from: 'total_coverage', to: 'coverage_increase' },
    { from: 'baseline', to: 'coverage_increase' },
  ],
};

export const ITN_MORTALITY_GRAPH: DependencyGraph = {
  nodes: [
    { id: 'pop_u5', label: 'Under-5 population', module: 'mortality', category: 'empirical' },
    { id: 'pop_u1', label: 'Under-1 population', module: 'mortality', category: 'empirical' },
    { id: 'pop_1_5mo', label: 'Age 1-5 months', module: 'mortality', category: 'empirical' },
    { id: 'pop_6_11mo', label: 'Age 6-11 months', module: 'mortality', category: 'empirical' },
    { id: 'pop_target', label: 'Target: 1-59 months', module: 'mortality', category: 'calculated' },
    { id: 'deaths_1_5mo', label: 'Deaths: 1-5 months', module: 'mortality', category: 'empirical' },
    { id: 'deaths_6_11mo', label: 'Deaths: 6-11 months', module: 'mortality', category: 'empirical' },
    { id: 'deaths_u5', label: 'Deaths: under-5 total', module: 'mortality', category: 'empirical' },
    { id: 'deaths_1_59', label: 'Deaths: 1-59 months', module: 'mortality', category: 'calculated' },
    { id: 'raw_rate', label: 'Raw mortality rate', module: 'mortality', category: 'calculated' },
    { id: 'all_cause_adj', label: 'All-cause mortality adj', module: 'mortality', category: 'subjective' },
    { id: 'malaria_share_adj', label: 'Malaria share adj', module: 'mortality', category: 'subjective' },
    { id: 'rurality_adj', label: 'Rurality adj', module: 'mortality', category: 'subjective' },
    { id: 'subnational_adj', label: 'Subnational adj', module: 'mortality', category: 'subjective' },
    { id: 'baseline_rate', label: 'Baseline mortality rate', module: 'mortality', category: 'output' },
    { id: 'smc_geo', label: 'SMC geographic overlap', module: 'mortality', category: 'empirical' },
    { id: 'smc_averted', label: 'SMC deaths averted', module: 'mortality', category: 'empirical' },
    { id: 'smc_gbd', label: 'SMC in GBD', module: 'mortality', category: 'subjective' },
    { id: 'smc_adj', label: 'Net SMC adjustment', module: 'mortality', category: 'output' },
    { id: 'gbd_all_ages', label: 'GBD deaths: all ages', module: 'mortality', category: 'empirical' },
    { id: 'gbd_u5', label: 'GBD deaths: under 5', module: 'mortality', category: 'empirical' },
    { id: 'local_ratio', label: 'Local 5+/u5 ratio', module: 'mortality', category: 'calculated' },
    { id: 'source_weights', label: 'Source weights', module: 'mortality', category: 'subjective' },
    { id: 'weighted_ratio', label: 'Weighted 5+ ratio', module: 'mortality', category: 'output' },
  ],
  edges: [
    { from: 'pop_u5', to: 'pop_target' },
    { from: 'pop_u1', to: 'pop_target' },
    { from: 'pop_1_5mo', to: 'pop_target' },
    { from: 'pop_6_11mo', to: 'pop_target' },
    { from: 'deaths_1_5mo', to: 'deaths_1_59' },
    { from: 'deaths_6_11mo', to: 'deaths_1_59' },
    { from: 'deaths_u5', to: 'deaths_1_59' },
    { from: 'deaths_1_59', to: 'raw_rate' },
    { from: 'pop_target', to: 'raw_rate' },
    { from: 'raw_rate', to: 'baseline_rate' },
    { from: 'all_cause_adj', to: 'baseline_rate' },
    { from: 'malaria_share_adj', to: 'baseline_rate' },
    { from: 'rurality_adj', to: 'baseline_rate' },
    { from: 'subnational_adj', to: 'baseline_rate' },
    { from: 'smc_geo', to: 'smc_adj' },
    { from: 'smc_averted', to: 'smc_adj' },
    { from: 'smc_gbd', to: 'smc_adj' },
    { from: 'gbd_all_ages', to: 'local_ratio' },
    { from: 'gbd_u5', to: 'local_ratio' },
    { from: 'local_ratio', to: 'weighted_ratio' },
    { from: 'source_weights', to: 'weighted_ratio' },
  ],
};

export const ITN_LF_GRAPH: DependencyGraph = {
  nodes: [
    { id: 'prob_gov', label: 'Government replaces', module: 'lf', category: 'subjective' },
    { id: 'prob_gf', label: 'Global Fund replaces', module: 'lf', category: 'subjective' },
    { id: 'prob_upstream', label: 'Upstream unchanged', module: 'lf', category: 'subjective' },
    { id: 'prob_unfunded', label: 'Goes unfunded', module: 'lf', category: 'calculated' },
    { id: 'grantee_spending', label: 'GiveWell spending', module: 'lf', category: 'empirical' },
    { id: 'adj_rate', label: 'Adjusted UoV/$ rate', module: 'lf', category: 'upstream' },
    { id: 'cf_rates', label: 'Counterfactual UoV/$', module: 'lf', category: 'subjective' },
    { id: 'scenario_a', label: 'A: Govt replaces', module: 'lf', category: 'calculated' },
    { id: 'scenario_b', label: 'B: GF replaces', module: 'lf', category: 'calculated' },
    { id: 'scenario_c', label: 'C: Upstream same', module: 'lf', category: 'calculated' },
    { id: 'scenario_d', label: 'D: Unfunded', module: 'lf', category: 'calculated' },
    { id: 'baseline_value', label: 'Baseline value', module: 'lf', category: 'calculated' },
    { id: 'leverage_adj', label: 'Leverage adjustment', module: 'lf', category: 'output' },
    { id: 'funging_adj', label: 'Funging adjustment', module: 'lf', category: 'output' },
    { id: 'combined_lf', label: 'Combined L&F', module: 'lf', category: 'output' },
  ],
  edges: [
    { from: 'prob_gov', to: 'prob_unfunded' },
    { from: 'prob_gf', to: 'prob_unfunded' },
    { from: 'prob_upstream', to: 'prob_unfunded' },
    { from: 'grantee_spending', to: 'baseline_value' },
    { from: 'adj_rate', to: 'baseline_value' },
    { from: 'grantee_spending', to: 'scenario_a' },
    { from: 'adj_rate', to: 'scenario_a' },
    { from: 'cf_rates', to: 'scenario_a' },
    { from: 'prob_gov', to: 'scenario_a' },
    { from: 'grantee_spending', to: 'scenario_b' },
    { from: 'adj_rate', to: 'scenario_b' },
    { from: 'cf_rates', to: 'scenario_b' },
    { from: 'prob_gf', to: 'scenario_b' },
    { from: 'cf_rates', to: 'scenario_c' },
    { from: 'prob_upstream', to: 'scenario_c' },
    { from: 'cf_rates', to: 'scenario_d' },
    { from: 'prob_unfunded', to: 'scenario_d' },
    { from: 'scenario_c', to: 'leverage_adj' },
    { from: 'scenario_d', to: 'leverage_adj' },
    { from: 'baseline_value', to: 'leverage_adj' },
    { from: 'scenario_a', to: 'funging_adj' },
    { from: 'scenario_b', to: 'funging_adj' },
    { from: 'baseline_value', to: 'funging_adj' },
    { from: 'leverage_adj', to: 'combined_lf' },
    { from: 'funging_adj', to: 'combined_lf' },
  ],
};
