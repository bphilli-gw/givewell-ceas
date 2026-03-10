/** TypeScript types matching the Python dataclasses from cea-to-python. */

export interface CostData {
  grant_size: number;
  pct_cost_grantee: number;
  pct_cost_other_philanthropic: number;
  pct_cost_domestic_gov: number;
  cost_per_net: number;
}

export interface NetDistributionData {
  people_per_net: number;
  proportion_used: number;
  people_per_used_net: number;
  under5_use_adjustment: number;
  routine_channel_adjustment: number;
  speedup_adjustment: number;
}

export interface PopulationData {
  total: number;
  under5: number;
  age5_14: number;
  age_1_5_months: number;
  age_6_11_months: number;
  under5_gbd: number;
  under1: number;
}

export interface EfficacyData {
  incidence_reduction: number;
  internal_validity_adj: number;
  external_validity_adj: number;
  mortality_to_incidence_ratio: number;
  indirect_deaths_per_direct: number;
  vaccine_mortality_adj: number;
  baseline_net_coverage: number;
  relative_efficacy_over5: number;
}

export interface IncidenceData {
  incidence_under5: number;
  incidence_5_14: number;
  subnational_incidence_adj: number;
}

export interface EconomicData {
  income_increase_per_case: number;
  years_to_benefits: number;
  discount_rate: number;
  benefit_duration_years: number;
  household_sharing_multiplier: number;
}

export interface ValueWeights {
  death_under5: number;
  death_over5: number;
  doubling_consumption: number;
  ln_consumption_unit: number;
  benchmark_uov_per_dollar: number;
}

export interface AdjustmentData {
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
  other_disease_prevention: number;
  stillbirth_prevention: number;
  income_investment: number;
  treatment_costs_averted: number;
  rebound_effects: number;
  subnational_adjustments: number;
  marginal_lower_priority: number;
  resistance_in_trials: number;
  mosquito_species_diff: number;
  net_durability_placeholder: number;
}

export interface NetRetentionData {
  ctn_control_coverage: number;
  ctn_treatment_coverage: number;
  ctn_remaining_year1: number;
  itn_remaining_year1: number;
  itn_remaining_year2: number;
  itn_remaining_year3: number;
}

export interface LeverageFungingData {
  prob_domestic_gov_replaces: number;
  prob_global_fund_replaces: number;
  prob_upstream_same: number;
  domestic_gov_effectiveness: number;
  global_fund_effectiveness: number;
  prob_unfunded: number;
  counterfactual_domestic_gov: number;
  counterfactual_global_fund: number;
}

export interface InsecticideResistanceData {
  proportion_effect_without_chemical: number;
  proportion_effect_without_physical: number;
  coeff_x_squared: number;
  coeff_x: number;
  y_intercept: number;
  avg_pyrethroid_mortality_rate: number;
  avg_bioassay_year: number;
  expected_distribution_year: number;
  annual_mortality_change: number;
  avg_pbo_mortality_rate: number;
  avg_pyrethroid_only_mortality: number;
  pbo_washout_year1: number;
  pbo_washout_year2: number;
  pbo_washout_year3: number;
  chlorfenapyr_adj_year1: number;
  chlorfenapyr_adj_year2: number;
  chlorfenapyr_adj_year3: number;
  pct_pbo_nets: number;
  pct_chlorfenapyr_nets: number;
  pct_other_dual_ai_nets: number;
  pct_standard_itns: number;
}

export interface DurabilityPhysicalData {
  year1_severe: number;
  year1_moderate: number;
  year1_good: number;
  year2_severe: number;
  year2_moderate: number;
  year2_good: number;
  year3_severe: number;
  year3_moderate: number;
  year3_good: number;
}

export interface DurabilityChemicalData {
  effect_retained_severe: number;
  effect_retained_moderate: number;
  effect_retained_good: number;
  physical_decay_rate_ctn_vs_itn: number;
  pyrethroid_remaining_ctn_year1: number;
  pyrethroid_remaining_std_year1: number;
  pyrethroid_remaining_std_year2: number;
  pyrethroid_remaining_std_year3: number;
}

export interface ITNInputs {
  country: string;
  cost: CostData;
  net_distribution: NetDistributionData;
  population: PopulationData;
  durability_physical: DurabilityPhysicalData;
  durability_chemical: DurabilityChemicalData;
  insecticide_resistance: InsecticideResistanceData;
  net_retention: NetRetentionData;
  efficacy: EfficacyData;
  incidence: IncidenceData;
  economic: EconomicData;
  value_weights: ValueWeights;
  adjustments: AdjustmentData;
  leverage_funging: LeverageFungingData;
}

/** Pre-computed supplementary sheet results */
export interface SupplementaryResults {
  durability: {
    physical_protection: number[];
    physical_protection_adjusted: number;
    chemical_protection_ctn_yr1: number;
    chemical_protection: number[];
    physical_share: number;
    chemical_share: number;
    joint_share: number;
    combined_protection: number[];
    attribution_yr1: number[];
    attribution_yr2: number[];
    attribution_yr3: number[];
  };
  insecticide_resistance: {
    projected_mortality: number;
    killing_power_loss: number;
    standard_adj: number[];
    pbo_adj: number[];
    chlorfenapyr_adj: number[];
    dual_ai_adj: number[];
    weighted_adj: number[];
  };
  malaria_mortality: {
    baseline_mortality_rate: number;
    smc_adjustment: number;
    mortality_ratio_5plus: number;
  };
  coverage: {
    baseline_coverage: number;
    total_coverage_yr1: number;
    total_coverage_yr2: number;
    total_coverage_yr3: number;
  };
  leverage_funging: {
    leverage_adj: number;
    funging_adj: number;
    counterfactual_adj: number;
  };
}

/** Full Main CEA result */
export interface MainCEAResult {
  // Section 1: Costs
  total_spending: number;
  grantee_spending: number;
  other_spending: number;
  gov_spending: number;
  upstream_spending: number;
  downstream_spending: number;
  cost_per_net: number;
  upstream_cost_per_net: number;

  // Section 2: Distribution
  nets_distributed: number;
  target_population: number;
  people_sleeping: number;
  prop_sleeping: number;
  under5_sleeping_proportion: number;
  prop_under5: number;
  prop_5_14: number;
  prop_over14: number;
  target_under5: number;
  target_5_14: number;
  target_over14: number;

  // Section 3: Coverage
  baseline_coverage: number;
  coverage_increase_yr1: number;
  coverage_increase_yr2: number;
  coverage_increase_yr3: number;

  // Section 4: Efficacy
  trial_coverage_diff: number;
  net_efficacy: number;
  mortality_reduction_yr1: number;
  mortality_reduction_yr2: number;
  mortality_reduction_yr3: number;

  // Section 5: Mortality
  baseline_mortality_adjusted: number;
  mortality_net_of_smc: number;
  mortality_adjusted: number;
  prevalence_reduction: number;
  mortality_without_nets: number;
  potential_deaths: number;
  avg_mortality_reduction: number;
  deaths_averted_under5: number;
  deaths_averted_over5: number;

  // Section 6: Incidence & Income
  counterfactual_incidence_under5: number;
  counterfactual_incidence_5_14: number;
  potential_cases_under5: number;
  potential_cases_5_14: number;
  avg_efficacy_incidence: number;
  avg_efficacy_5_14: number;
  cases_averted_under5: number;
  cases_averted_5_14: number;
  income_pv_per_case: number;
  total_income_value: number;

  // Section 7: Value
  uov_under5_deaths: number;
  uov_over5_deaths: number;
  uov_income: number;
  total_uov: number;
  uov_per_dollar: number;
  ce_multiple_before_adj: number;
  total_lives_saved: number;
  cost_per_life_before_adj: number;

  // Section 8: Adjustments
  grantee_adj_total: number;
  intervention_adj_total: number;
  lives_saved_adj: number;

  // Section 9: Final CE
  leverage_adj: number | null;
  funging_adj: number | null;
  lf_total: number | null;
  total_value_after_adj: number | null;
  final_uov_per_dollar: number | null;
  final_ce_multiple: number | null;

  // Counterfactual
  counterfactual_output_adj: number | null;
  counterfactual_outcome_adj: number | null;
  counterfactual_nets: number | null;
  counterfactual_lives: number | null;
  cost_per_life_counterfactual: number | null;
}

/** Monte Carlo summary statistics */
export interface MCStats {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  p5: number;
  p25: number;
  p75: number;
  p95: number;
}

/** A single histogram bin */
export interface HistogramBin {
  x0: number;
  x1: number;
  count: number;
}

/** Tornado chart entry for one parameter */
export interface TornadoEntry {
  parameter: string;
  p25_pct_delta: number;
  p75_pct_delta: number;
  p25_mean: number;
  p75_mean: number;
}

/** Pre-computed Monte Carlo results for a country */
export interface MonteCarloData {
  n_simulations: number;
  seed: number;
  summary: MCStats;
  histogram: HistogramBin[];
  tornado: TornadoEntry[];
}

/** A single country's full data as stored in countries.json */
export interface CountryData {
  id: string;
  column: string;
  country: string;
  display_name: string;
  inputs: ITNInputs;
  supplementary: SupplementaryResults;
  results: MainCEAResult;
  monte_carlo: MonteCarloData | null;
}

/** Top-level countries.json structure */
export interface CountriesData {
  generated: string;
  model: string;
  source: string;
  global_physical_adjusted: number;
  countries: CountryData[];
  errors: { column: string; name: string; error: string }[];
}
