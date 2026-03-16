/** TypeScript types for the NI (New Incentives) CEA model (matching Python dataclasses). */

// Reuse shared types from ITN
export type { MCStats, HistogramBin, TornadoEntry, MonteCarloData } from './types';
import type { MonteCarloData } from './types';

// ============================================================================
// NI Input types (subset serialized from Python)
// ============================================================================

export interface NICostData {
  grant_size: number;
  cost_per_infant: number;
  adj_repeat_enrollment: number;
}

export interface NIOutcomeParameters {
  internal_validity_adj: number;
  indirect_mort_ratio: number;
  mort_reduction_ratio: number;
  indirect_under5_ratio: number | null;
  discount_rate: number;
  avg_years_5to14: number;
  avg_years_15to49: number;
  avg_years_50to74: number;
  income_ratio: number;
  income_adj_vs_smc: number;
}

export interface NIValueWeights {
  value_death_u5: number;
  value_death_5to14: number;
  value_death_15to49: number;
  value_death_50to74: number;
  value_ln_consumption: number;
  benchmark: number;
}

export interface NIGranteeAdjustments {
  double_treatment: number;
  ineffective_goods: number;
  goods_expire: number;
  incomplete_monitoring: number;
  biased_monitoring: number;
  change_of_priorities: number;
  non_funding_bottlenecks: number;
  within_org_fungibility: number;
}

export interface NIInterventionAdjustments {
  morbidity_direct: number;
  morbidity_indirect: number;
  inflation: number;
  treatment_costs_averted: number;
  investment_income: number;
  increased_clinic: number;
  herd_protection: number;
  mortality_indirect: number;
  polio_outbreaks: number;
  serotype_replacement: number;
  increased_timeliness: number;
  post_program_effects: number;
}

export interface NIInputs {
  cost: NICostData;
  outcomes: NIOutcomeParameters;
  value_weights: NIValueWeights;
  grantee_adjustments: NIGranteeAdjustments;
  intervention_adjustments: NIInterventionAdjustments;
}

// ============================================================================
// NI Main CEA result
// ============================================================================

export interface NIMainCEAResult {
  // Grantee costs
  spending: number;
  cost_per_child: number;

  // Outputs
  children_enrolled: number;
  counterfactual_vaccination: number;
  unvaccinated_proportion: number;
  overall_effect: number;
  validity_adj: number;
  external_validity_adj: number;
  adjusted_effect: number;
  coverage_increase: number;
  with_program_vaccination: number;
  bcg_coverage_midpoint: number;
  bcg_increase: number;
  bcg_with_program: number;
  children_over_bcg: number;
  outcome_children: number;

  // Under-5 mortality
  vpd_total_adj_u5: number;
  gbd_adj_u5: number;
  incidence_averted_u5: number;
  unvacc_total_u5: number;
  indirect_mort_u5: number;
  daly_u5: number;
  indirect_under5_ratio: number;
  daly_u5_indirect: number;

  // 5-14 mortality
  unvacc_total_5to14: number;
  gbd_adj_5to14: number;
  incidence_averted_5to14: number;
  unvacc_prob_5to14: number;
  indirect_mort_5to14: number;
  daly_5to14: number;
  daly_5to14_discounted: number;

  // 15-49 mortality
  unvacc_total_15to49: number;
  gbd_adj_15to49: number;
  incidence_averted_15to49: number;
  unvacc_prob_15to49: number;
  indirect_mort_15to49: number;
  daly_15to49: number;
  daly_15to49_discounted: number;

  // 50-74 mortality
  unvacc_total_50to74: number;
  gbd_adj_50to74: number;
  incidence_averted_50to74: number;
  unvacc_prob_50to74: number;
  indirect_mort_50to74: number;
  daly_50to74: number;
  daly_50to74_discounted: number;

  // Income effects
  income_ratio: number;
  income_adj: number;
  value_u5: number;
  value_5to14: number;
  income_value: number;

  // Cash transfer
  cash_transfer_value: number;

  // Summary DALYs
  daly_u5_total: number;
  daly_u5_indirect_total: number;
  daly_5to14_disc: number;
  daly_15to49_disc: number;
  daly_50to74_disc: number;

  // Pre-leverage CE
  cost: number;
  total_value: number;
  pre_leverage_ce: number;
  benchmark: number;
  pre_leverage_multiple: number;

  // Adjustments
  grantee_adj_sum: number;
  intervention_adj_sum: number;
  leverage_funging_adj: number;

  // Final CE
  adjusted_total_value: number;
  final_ce: number;
  final_ce_multiple: number;

  // Supplementary
  overall_adj_grantee_lf: number;
  overall_adj_all: number;
  adjusted_outcome_children: number;
  cost_per_outcome_child: number;
  adjusted_dalys: number;
  cost_per_daly: number;
}

// ============================================================================
// Top-level data structures
// ============================================================================

export interface NICountryData {
  id: string;
  column: string;
  country: string;
  state: string;
  group: 'current' | 'prospective';
  display_name: string;
  implementer: string;
  inputs: NIInputs;
  supplementary: {
    leverage_funging: Record<string, number>;
  };
  results: NIMainCEAResult;
  monte_carlo: MonteCarloData | null;
}

export interface NICountriesData {
  generated: string;
  model: string;
  source: string;
  countries: NICountryData[];
  errors: { column: string; name: string; error: string }[];
}
