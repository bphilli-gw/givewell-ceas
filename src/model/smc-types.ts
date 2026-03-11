/** TypeScript types for the SMC CEA model (matching Python dataclasses). */

// Reuse shared types from ITN
export type { MCStats, HistogramBin, TornadoEntry, MonteCarloData } from './types';
import type { MonteCarloData } from './types';

// ============================================================================
// SMC Input types
// ============================================================================

export interface SMCCostData {
  grant_size: number;
  pct_cost_grantee: number;
  pct_cost_other_philanthropic: number;
  pct_cost_domestic_gov: number;
  cost_per_cycle: number;
  cycles_per_year: number;
}

export interface SMCCounterfactualMalariaInputs {
  mort_under5: number;
  mort_early_neonatal: number;
  mort_late_neonatal: number;
  mort_postneonatal: number;
  postneonatal_months_under1: number;
  postneonatal_months_under3mo: number;
  annual_mort_rate_under5: number;
  total_months_under5: number;
  months_under3mo: number;
  itn_adjustment: number;
  total_malaria_mort: number;
  incidence_under5: number;
  incidence_5_to_14: number;
  itn_adjustment_for_incidence: number;
}

export interface SMCOutcomeData {
  incidence_reduction_meta: number;
  proportion_targeted_received: number;
  internal_validity_adj: number;
  external_validity_adj: number;
  sahel_effectiveness_adj: number;
  mortality_to_incidence_ratio: number;
  vaccine_mortality_adj: number;
  indirect_deaths_per_direct: number;
  proportion_mort_during_season: number;
  spillover_incidence_reduction: number;
  spillover_older_incidence_reduction: number;
  spillover_coverage_intensity_adj: number;
  national_pop_under5: number;
  national_pop_5_to_14: number;
  income_increase_per_case: number;
  years_to_benefits: number;
  discount_rate: number;
  benefit_duration_years: number;
  household_sharing_multiplier: number;
}

export interface SMCValueWeights {
  death_under5: number;
  death_over5: number;
  doubling_consumption: number;
  ln_consumption_unit: number;
  benchmark_uov_per_dollar: number;
}

export interface SMCAdjustmentData {
  double_treatment: number;
  ineffective_goods: number;
  goods_in_storage: number;
  incomplete_monitoring: number;
  biased_monitoring: number;
  change_of_priorities: number;
  non_funding_bottlenecks: number;
  within_org_fungibility: number;
  malaria_morbidity: number;
  short_term_anemia: number;
  income_investment: number;
  treatment_costs_averted: number;
  adverse_events: number;
  failure_to_ingest: number;
  rebound_effects: number;
  drug_resistance: number;
  subnational_adjustments: number;
  marginal_lower_priority: number;
  ancillary_costs: number;
  layered_program_components: number;
}

export interface SMCLeverageFungingData {
  prob_domestic_gov_replaces: number;
  prob_global_fund_replaces: number;
  prob_upstream_same: number;
  prop_still_occur_domestic: number;
  prop_still_occur_global_fund: number;
  prop_still_occur_unfunded: number;
  counterfactual_domestic_gov: number;
  counterfactual_global_fund: number;
}

export interface SMCInputs {
  country: string;
  cost: SMCCostData;
  counterfactual_malaria: SMCCounterfactualMalariaInputs;
  outcomes: SMCOutcomeData;
  value_weights: SMCValueWeights;
  adjustments: SMCAdjustmentData;
  leverage_funging: SMCLeverageFungingData;
  upstream_grantee_only: boolean;
}

// ============================================================================
// SMC Supplementary results
// ============================================================================

export interface SMCCounterfactualMalariaResult {
  mort_under5: number;
  mort_early_neonatal: number;
  mort_late_neonatal: number;
  mort_postneonatal: number;
  postneonatal_months_under1: number;
  postneonatal_months_under3mo: number;
  prop_postneonatal_under3mo: number;
  smc_eligible_mort: number;
  prop_smc_eligible: number;
  annual_mort_rate_per100k: number;
  mort_rate_per100k: number;
  total_months_under5: number;
  months_under3mo: number;
  prop_smc_eligible_months: number;
  smc_eligible_mort_rate: number;
  itn_adjustment: number;
  annual_mort_rate_3_59mo: number;
  total_malaria_mort: number;
  smc_eligible_diff: number;
  older_per_smc_eligible: number;
  incidence_under5: number;
  incidence_5_to_14: number;
  itn_adjustment_incidence: number;
  adjusted_incidence_under5: number;
  adjusted_incidence_5_to_14: number;
}

export interface SMCLeverageFungingResult {
  prob_domestic: number;
  prob_global_fund: number;
  prob_upstream_same: number;
  prob_unfunded: number;
  uov_per_dollar_adjusted: number;
  scenario_a_impact: number;
  scenario_b_impact: number;
  scenario_c_impact: number;
  scenario_d_impact: number;
  baseline_value: number;
  leverage_change: number;
  funging_change: number;
  total_change: number;
  leverage_adj: number;
  funging_adj: number;
  overall_adj: number;
  counterfactual_adj: number;
}

export interface SMCSupplementaryResults {
  counterfactual_malaria: SMCCounterfactualMalariaResult;
  leverage_funging: SMCLeverageFungingResult;
}

// ============================================================================
// SMC Main CEA result
// ============================================================================

export interface SMCMainCEAResult {
  // Costs (rows 5-31)
  grant_size: number;
  pct_grantee: number;
  pct_other_philanthropic: number;
  pct_domestic_gov: number;
  total_spending: number;
  grantee_spending: number;
  other_spending: number;
  gov_spending: number;
  upstream_spending: number;
  downstream_spending: number;
  cost_per_cycle: number;
  cycles_per_year: number;
  total_cost_per_child: number;
  upstream_cost_per_child: number;

  // Outputs (rows 33-36)
  total_children_covered: number;

  // Outcomes: Mortality <5 (rows 40-58)
  implied_incidence_reduction: number;
  expected_incidence_reduction: number;
  expected_mortality_reduction: number;
  annual_mort_rate_3_59mo: number;
  total_mort_rate: number;
  vaccine_adj_mort_rate: number;
  annual_mortalities_averted_raw: number;
  seasonal_mortalities: number;
  deaths_averted_under5: number;

  // Outcomes: Mortality >5 (rows 60-71)
  spillover_proportion: number;
  spillover_incidence_reduction: number;
  spillover_mortality_reduction: number;
  older_mort_per_eligible: number;
  older_mortalities: number;
  deaths_averted_over5: number;

  // Outcomes: Incidence (rows 73-83)
  adjusted_incidence_under5: number;
  adjusted_incidence_5_to_14: number;
  incidence_reduction_under5: number;
  incidence_reduction_5_to_14: number;
  national_pop_under5: number;
  national_pop_5_to_14: number;
  ratio_5_14_to_under5: number;
  total_5_14_exposed: number;
  cases_averted_under5: number;
  cases_averted_5_to_14: number;

  // Outcomes: Income (rows 85-97)
  pv_lifetime_benefits_per_case: number;
  pv_income_under5: number;
  pv_income_5_to_14: number;
  total_pv_income: number;

  // Value of outcomes (rows 99-112)
  uov_deaths_under5: number;
  uov_deaths_over5: number;
  uov_income: number;
  uov_income_per_person: number;

  // Summary (rows 114-146)
  total_deaths_under5: number;
  total_deaths_over5: number;
  total_cases_averted: number;
  total_uov_under5_deaths: number;
  total_uov_over5_deaths: number;
  total_uov_income: number;
  total_uov: number;
  uov_per_dollar: number;
  ce_before_adj: number;
  prop_under5_deaths: number;
  prop_over5_deaths: number;
  prop_income: number;
  total_lives_saved: number;
  cost_per_life_saved: number;

  // Adjustments (rows 148-187)
  grantee_adj_total: number;
  intervention_adj_total: number;
  leverage_adj: number;
  funging_adj: number;
  lf_overall_adj: number;

  // Final CE (rows 189-195)
  total_value_after_adj: number;
  uov_per_dollar_final: number;
  final_ce: number;

  // Counterfactual impact (rows 197-216)
  output_adj: number;
  outcome_adj: number;
  counterfactual_people_covered: number;
  cost_per_counterfactual_person: number;
  counterfactual_lives_saved: number;
  cost_per_counterfactual_life: number;
}

// ============================================================================
// Top-level data structures
// ============================================================================

export interface SMCCountryData {
  id: string;
  column: string;
  country: string;
  display_name: string;
  inputs: SMCInputs;
  supplementary: SMCSupplementaryResults;
  results: SMCMainCEAResult;
  monte_carlo: MonteCarloData | null;
}

export interface SMCCountriesData {
  generated: string;
  model: string;
  source: string;
  countries: SMCCountryData[];
  errors: { column: string; name: string; error: string }[];
}
