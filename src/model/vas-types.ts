/** TypeScript types for the VAS CEA model (matching Python dataclasses). */

// Reuse shared types from ITN
export type { MCStats, HistogramBin, TornadoEntry, MonteCarloData } from './types';
import type { MonteCarloData } from './types';

// ============================================================================
// VAS Input types
// ============================================================================

export interface VASCostData {
  grant_size: number;
  pct_cost_grantee: number;
  pct_cost_ni_capsules: number;
  pct_cost_other_philanthropic: number;
  pct_cost_domestic_gov_financial: number;
  pct_cost_domestic_gov_in_kind: number;
  cost_per_vas: number;
  supplementation_rounds: number;
}

export interface VASMortalityData {
  total_mort_u5: number;
  total_mort_u1: number;
  total_mort_1to5mo: number;
  total_neonatal_mort: number;
  proportion_postneonatal_1to5mo: number;
  all_cause_mort_rate_u5: number;
  proportion_u5_eligible: number;
  adj_gbd_vs_other: number;
  adj_national_vs_subnational: number | null;
}

export interface VASOutcomeData {
  mortality_reduction_meta: number;
  proportion_receiving_vas_trials: number;
  internal_validity_adj: number;
  proportion_u5_receiving_vas_gbd: number;
  income_increase_ratio_vs_smc: number;
  adj_income_vas_vs_smc: number;
}

export interface VASValueWeights {
  value_per_death_averted_u5: number;
  value_per_doubling_consumption: number;
  value_per_unit_ln_consumption: number;
  benchmark_uov_per_dollar: number;
}

export interface VASLeverageFungingData {
  prob_govt_replaces: number;
  prob_philanthropy_replaces: number;
  prob_program_shrinks: number;
  prop_still_occur_s1: number;
  prop_still_occur_s2: number;
  prop_unfunded_s4: number;
  counterfactual_value_govt: number;
  counterfactual_value_ni: number;
  counterfactual_value_other_phil: number;
}

export interface VASInputs {
  country: string;
  column: string;
  cost: VASCostData;
  mortality: VASMortalityData;
  outcomes: VASOutcomeData;
  value_weights: VASValueWeights;
  leverage_funging: VASLeverageFungingData;
  is_cameroon: boolean;
  is_nigeria: boolean;
}

// ============================================================================
// VAS Supplementary results
// ============================================================================

export interface VASCounterfactualCoverageResult {
  routine_vas_6_11mo: number;
  routine_vas_12_23mo: number;
  routine_vas_2_4yr: number;
  adjusted_vas_6_11mo: number;
  adjusted_vas_12_23mo: number;
  adjusted_vas_2_4yr: number;
  counterfactual_coverage: number;
}

export interface VASCounterfactualMortalityResult {
  deaths_vas_eligible: number;
  proportion_u5_deaths_vas_eligible: number;
  implied_u5_population: number;
  vas_eligible_population: number;
  annual_mort_rate_vas_eligible: number;
  adjusted_mort_rate: number;
  proportion_mort_during_vas_period: number;
  mortality_during_vas_period: number;
}

export interface VASExternalValidityResult {
  projected_national_vad: number | null;
  state_level_vad: number | null;
  vad_gbd_2021_weighted: number;
  vad_gbd_2023_weighted: number;
  weighted_gbd_vad: number;
  projected_gbd_vad: number | null;
  final_estimated_vad: number;
  ev_adj_vad: number;
  deaths_measles_eligible: number;
  deaths_diarrheal_eligible: number;
  deaths_infectious_eligible: number;
  prop_measles_diarrheal: number;
  adjusted_prop_measles_diarrheal: number;
  prop_other_infectious: number;
  ev_adj_measles_diarrheal: number;
  ev_adj_other_infectious: number;
  ev_adj_mortality_composition: number;
  adj_mortality_non_independence: number;
  final_external_validity_adj: number;
}

export interface VASLeverageFungingResult {
  prob_s1: number;
  prob_s2: number;
  prob_s3: number;
  prob_s4: number;
  s3_proportion_still_occurring: number;
  uov_per_dollar_post_adj: number;
  lives_saved_post_adj: number;
  s1_weighted_change: number;
  s2_weighted_change: number;
  s3_weighted_change: number;
  s4_weighted_change: number;
  value_before_lf: number;
  leverage_total: number;
  funging_total: number;
  lf_total_change: number;
  value_after_lf: number;
  leverage_adj: number;
  funging_adj: number;
  total_lf_adj: number;
  lf_adj_outputs: number;
  leverage_adj_outcomes: number;
  funging_adj_outcomes: number;
  lf_adj_outcomes: number;
}

export interface VASSupplementaryResults {
  counterfactual_coverage: VASCounterfactualCoverageResult;
  counterfactual_mortality: VASCounterfactualMortalityResult;
  external_validity: VASExternalValidityResult;
  leverage_funging: VASLeverageFungingResult;
}

// ============================================================================
// VAS Main CEA result
// ============================================================================

export interface VASMainCEAResult {
  // Costs (rows 9-36)
  total_spending: number;
  grantee_spending: number;
  ni_spending: number;
  other_phil_spending: number;
  govt_financial_spending: number;
  govt_in_kind_spending: number;
  upstream_spending: number;
  downstream_spending: number;
  cost_per_child_year: number;
  upstream_cost_per_child_year: number;

  // Coverage (rows 41-43)
  children_covered: number;
  counterfactual_coverage: number;
  additional_children: number;

  // Mortality reduction (rows 48-58)
  implied_mort_reduction: number;
  expected_mort_reduction: number;
  mortality_rate_absence_vas: number;
  deaths_averted: number;

  // Income effects (rows 61-66)
  vas_income_ratio: number;
  uov_from_deaths: number;
  uov_from_income: number;

  // Value summary (rows 89-101)
  uov_deaths_pre_adj: number;
  uov_income_pre_adj: number;
  total_uov_pre_adj: number;
  uov_per_dollar_pre_adj: number;
  ce_multiple_pre_adj: number;
  pct_mortality: number;
  pct_income: number;

  // Adjustments (rows 124, 140, 146)
  total_grantee_adj: number;
  total_intervention_adj: number;
  leverage_adj: number;
  funging_adj: number;
  total_lf_adj: number;

  // Final CE (rows 151-154)
  total_value_after_adj: number;
  uov_per_dollar_after_adj: number;
  ce_multiple: number;

  // Counterfactual impact (rows 161-175)
  overall_output_adj: number;
  intervention_adj_lives: number;
  overall_outcome_adj: number;
  counterfactual_people_covered: number;
  cost_per_person_covered: number;
  counterfactual_lives_saved: number;
  cost_per_life_saved: number;
}

// ============================================================================
// Top-level data structures
// ============================================================================

export interface VASCountryData {
  id: string;
  column: string;
  country: string;
  display_name: string;
  implementer?: string;
  inputs: VASInputs;
  supplementary: VASSupplementaryResults;
  results: VASMainCEAResult;
  monte_carlo: MonteCarloData | null;
}

export interface VASCountriesData {
  generated: string;
  model: string;
  source: string;
  countries: VASCountryData[];
  errors: { column: string; name: string; error: string }[];
}
