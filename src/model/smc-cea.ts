/**
 * TypeScript port of the SMC CEA pipeline:
 *   - counterfactual_malaria.py → calculateCounterfactualMalaria()
 *   - leverage_funging.py → calculateLeverageFunging()
 *   - main_cea.py → calculateSMCMainCEA()
 *
 * Enables real-time recalculation when users edit parameters in the UI.
 * Unlike ITN (which freezes supplementary sheets), the SMC pipeline is
 * simple enough to recalculate end-to-end.
 */

import type {
  SMCInputs,
  SMCCounterfactualMalariaResult,
  SMCLeverageFungingResult,
  SMCMainCEAResult,
} from './smc-types';

// ============================================================================
// Counterfactual Malaria (replicates counterfactual_malaria.py)
// ============================================================================

export function calculateCounterfactualMalaria(
  inputs: SMCInputs,
): SMCCounterfactualMalariaResult {
  const cm = inputs.counterfactual_malaria;

  // Mortality section (rows 8-19)
  const mort_under5 = cm.mort_under5;
  const mort_early_neonatal = cm.mort_early_neonatal;
  const mort_late_neonatal = cm.mort_late_neonatal;
  const mort_postneonatal = cm.mort_postneonatal;

  const postneonatal_months_under1 = cm.postneonatal_months_under1;
  const postneonatal_months_under3mo = cm.postneonatal_months_under3mo;

  // Row 16: proportion of postneonatal period < 3 months
  const prop_postneonatal_under3mo =
    postneonatal_months_under1 !== 0
      ? postneonatal_months_under3mo / postneonatal_months_under1
      : 0;

  // Row 17: postneonatal deaths under 3 months
  const postneonatal_under3mo = mort_postneonatal * prop_postneonatal_under3mo;

  // Row 18: SMC-eligible mortalities
  const smc_eligible_mort =
    mort_under5 - (mort_early_neonatal + mort_late_neonatal + postneonatal_under3mo);

  // Row 19: proportion SMC-eligible
  const prop_smc_eligible = mort_under5 !== 0 ? smc_eligible_mort / mort_under5 : 0;

  // Mortality rate section (rows 22-30)
  const annual_mort_rate_per100k = cm.annual_mort_rate_under5;
  const mort_rate_per100k =
    annual_mort_rate_per100k !== 0
      ? (mort_under5 / annual_mort_rate_per100k) * 100000
      : 0;

  const total_months_under5 = cm.total_months_under5;
  const months_under3mo = cm.months_under3mo;

  // Row 26 (H): proportion of <5 months that are SMC-eligible
  const prop_smc_eligible_months =
    total_months_under5 !== 0
      ? (total_months_under5 - months_under3mo) / total_months_under5
      : 0;

  // Row 27: mortality rate scaled by SMC-eligible months
  const smc_eligible_rate_scaled = mort_rate_per100k * prop_smc_eligible_months;

  // Row 28: SMC-eligible mortality rate
  const smc_eligible_mort_rate =
    smc_eligible_rate_scaled !== 0 ? smc_eligible_mort / smc_eligible_rate_scaled : 0;

  // Row 29-30: ITN adjustment → annual mort rate 3-59mo
  const itn_adjustment = cm.itn_adjustment;
  const annual_mort_rate_3_59mo = smc_eligible_mort_rate * (1 + itn_adjustment);

  // Proportion section (rows 33-35)
  const total_malaria_mort = cm.total_malaria_mort;
  const smc_eligible_diff = total_malaria_mort - mort_under5;
  const older_per_smc_eligible =
    smc_eligible_mort !== 0 ? smc_eligible_diff / smc_eligible_mort : 0;

  // Incidence section (rows 40-44)
  const incidence_under5 = cm.incidence_under5;
  const incidence_5_to_14 = cm.incidence_5_to_14;
  const itn_adjustment_incidence = cm.itn_adjustment_for_incidence;
  const adjusted_incidence_under5 = (incidence_under5 / 100000) * (1 + itn_adjustment_incidence);
  const adjusted_incidence_5_to_14 =
    (incidence_5_to_14 / 100000) * (1 + itn_adjustment_incidence);

  return {
    mort_under5,
    mort_early_neonatal,
    mort_late_neonatal,
    mort_postneonatal,
    postneonatal_months_under1,
    postneonatal_months_under3mo,
    prop_postneonatal_under3mo,
    smc_eligible_mort,
    prop_smc_eligible,
    annual_mort_rate_per100k,
    mort_rate_per100k,
    total_months_under5,
    months_under3mo,
    prop_smc_eligible_months,
    smc_eligible_mort_rate,
    itn_adjustment,
    annual_mort_rate_3_59mo,
    total_malaria_mort,
    smc_eligible_diff,
    older_per_smc_eligible,
    incidence_under5,
    incidence_5_to_14,
    itn_adjustment_incidence,
    adjusted_incidence_under5,
    adjusted_incidence_5_to_14,
  };
}

// ============================================================================
// Leverage & Funging (replicates leverage_funging.py)
// ============================================================================

interface LFInputs {
  inputs: SMCInputs;
  grantee_spending: number;
  other_spending: number;
  gov_spending: number;
  upstream_spending: number;
  downstream_spending: number;
  uov_per_dollar: number;
  grantee_adj_total: number;
  intervention_adj_total: number;
}

export function calculateLeverageFunging(lfi: LFInputs): SMCLeverageFungingResult {
  const lf = lfi.inputs.leverage_funging;
  const upstream_grantee_only = lfi.inputs.upstream_grantee_only;

  // Scenario probabilities (rows 30-33)
  const prob_domestic = lf.prob_domestic_gov_replaces;
  const prob_global_fund = lf.prob_global_fund_replaces;
  const prob_upstream_same = lf.prob_upstream_same;
  const prob_unfunded = 1 - (prob_domestic + prob_global_fund + prob_upstream_same);

  // Row 38: proportion of upstream from other actors
  const prop_other =
    lfi.upstream_spending !== 0 ? lfi.other_spending / lfi.upstream_spending : 0;

  // Adjusted value rate (row 47)
  const uov_per_dollar_adjusted =
    lfi.uov_per_dollar * (1 + lfi.grantee_adj_total) * (1 + lfi.intervention_adj_total);

  // Counterfactual rates
  const cf_domestic = lf.counterfactual_domestic_gov;
  const cf_global_fund = lf.counterfactual_global_fund;

  // Scenario A: domestic gov replaces (rows 63-69)
  const a_spending = lfi.grantee_spending;
  const a_value_generated = a_spending * uov_per_dollar_adjusted;
  const a_value_lost = a_spending * cf_domestic;
  const a_net = a_value_generated - a_value_lost;
  const a_impact = -a_net;
  const scenario_a_impact = a_impact * prob_domestic;

  // Scenario B: Global Fund replaces (rows 73-79)
  const b_spending = lfi.grantee_spending;
  const b_value_generated = b_spending * uov_per_dollar_adjusted;
  const b_value_lost = b_spending * cf_global_fund;
  const b_net = b_value_generated - b_value_lost;
  const b_impact = -b_net;
  const scenario_b_impact = b_impact * prob_global_fund;

  // Scenario C: upstream crowding out (rows 83-89)
  const c_spending = lfi.gov_spending * (1 - prop_other);
  const c_value_generated = c_spending * cf_domestic;
  const c_impact = -c_value_generated;
  const scenario_c_impact = c_impact * prob_upstream_same;

  // Scenario D: unfunded (rows 93-99)
  // Togo: downstream = other + gov, value = (other*cf_gf) + (gov*cf_dom)
  let d_value_generated: number;
  if (upstream_grantee_only) {
    d_value_generated =
      lfi.other_spending * cf_global_fund + lfi.gov_spending * cf_domestic;
  } else {
    d_value_generated = lfi.gov_spending * cf_domestic;
  }
  const d_impact = -d_value_generated;
  const scenario_d_impact = d_impact * prob_unfunded;

  // Aggregation (rows 104-107)
  const baseline_value = lfi.grantee_spending * uov_per_dollar_adjusted;
  const leverage_change = scenario_c_impact + scenario_d_impact;
  const funging_change = scenario_a_impact + scenario_b_impact;
  const total_change = scenario_a_impact + scenario_b_impact + scenario_c_impact + scenario_d_impact;

  // Adjustment factors (rows 111-113)
  const leverage_adj = baseline_value !== 0 ? leverage_change / baseline_value : 0;
  const funging_adj = baseline_value !== 0 ? funging_change / baseline_value : 0;
  const overall_adj = baseline_value !== 0 ? total_change / baseline_value : 0;

  // Counterfactual adjustment (row 116)
  const cf_adj_numerator =
    Math.min(a_impact, 0) * prob_domestic +
    Math.min(b_impact, 0) * prob_global_fund +
    leverage_change;
  const counterfactual_adj = baseline_value !== 0 ? cf_adj_numerator / baseline_value : 0;

  return {
    prob_domestic,
    prob_global_fund,
    prob_upstream_same,
    prob_unfunded,
    uov_per_dollar_adjusted,
    scenario_a_impact,
    scenario_b_impact,
    scenario_c_impact,
    scenario_d_impact,
    baseline_value,
    leverage_change,
    funging_change,
    total_change,
    leverage_adj,
    funging_adj,
    overall_adj,
    counterfactual_adj,
  };
}

// ============================================================================
// Main CEA (replicates main_cea.py, wires in counterfactual malaria + L&F)
// ============================================================================

export function calculateSMCMainCEA(inputs: SMCInputs): SMCMainCEAResult {
  const cost = inputs.cost;
  const out = inputs.outcomes;
  const vw = inputs.value_weights;
  const adj = inputs.adjustments;
  const upstream_grantee_only = inputs.upstream_grantee_only;

  // Step 1: Calculate counterfactual malaria
  const cm = calculateCounterfactualMalaria(inputs);

  // ===== Section 1: Costs (rows 5-31) =====
  const grant_size = cost.grant_size;
  const pct_grantee = cost.pct_cost_grantee;
  const pct_other_philanthropic = cost.pct_cost_other_philanthropic;
  const pct_domestic_gov = cost.pct_cost_domestic_gov;

  const total_spending = grant_size / pct_grantee;
  const grantee_spending = total_spending * pct_grantee;
  const other_spending = total_spending * pct_other_philanthropic;
  const gov_spending = total_spending * pct_domestic_gov;

  let upstream_spending: number;
  let downstream_spending: number;
  if (upstream_grantee_only) {
    upstream_spending = grantee_spending;
    downstream_spending = other_spending + gov_spending;
  } else {
    upstream_spending = grantee_spending + other_spending;
    downstream_spending = gov_spending;
  }

  const cost_per_cycle = cost.cost_per_cycle;
  const cycles_per_year = cost.cycles_per_year;
  const total_cost_per_child = cost_per_cycle * cycles_per_year;
  const upstream_cost_per_child =
    (upstream_spending / total_spending) * total_cost_per_child;

  // ===== Section 2: Outputs (rows 33-36) =====
  const total_children_covered = grantee_spending / upstream_cost_per_child;

  // ===== Section 3a: Mortality <5 (rows 38-58) =====
  const implied_incidence_reduction =
    out.incidence_reduction_meta / out.proportion_targeted_received;
  const expected_incidence_reduction =
    implied_incidence_reduction *
    (1 + out.internal_validity_adj) *
    (1 + out.external_validity_adj) *
    (1 + out.sahel_effectiveness_adj);
  const mort_inc_ratio = out.mortality_to_incidence_ratio;
  const expected_mortality_reduction = expected_incidence_reduction * mort_inc_ratio;

  const annual_mort_rate_3_59mo = cm.annual_mort_rate_3_59mo;
  const total_mort_rate = annual_mort_rate_3_59mo * (1 + out.indirect_deaths_per_direct);
  const vaccine_adj_mort_rate =
    annual_mort_rate_3_59mo *
    (1 + out.indirect_deaths_per_direct) *
    (1 + out.vaccine_mortality_adj);
  const annual_mortalities_averted_raw = total_children_covered * vaccine_adj_mort_rate;
  const seasonal_mortalities =
    annual_mortalities_averted_raw * out.proportion_mort_during_season;
  const deaths_averted_under5 = expected_mortality_reduction * seasonal_mortalities;

  // ===== Section 3b: Mortality >5 (rows 60-71) =====
  const spillover_prop_implied =
    out.spillover_older_incidence_reduction / out.spillover_incidence_reduction;
  const spillover_proportion =
    spillover_prop_implied * (1 + out.spillover_coverage_intensity_adj);
  const spillover_incidence_reduction = expected_mortality_reduction * spillover_proportion;
  const spillover_mortality_reduction = spillover_incidence_reduction * mort_inc_ratio;
  const older_mort_per_eligible = cm.older_per_smc_eligible;
  const older_mortalities = seasonal_mortalities * older_mort_per_eligible;
  const deaths_averted_over5 = spillover_mortality_reduction * older_mortalities;

  // ===== Section 3c: Incidence (rows 73-83) =====
  const adjusted_incidence_under5 = cm.adjusted_incidence_under5;
  const adjusted_incidence_5_to_14 = cm.adjusted_incidence_5_to_14;
  const incidence_reduction_under5 =
    expected_incidence_reduction * out.proportion_mort_during_season * adjusted_incidence_under5;
  const incidence_reduction_5_to_14 =
    spillover_incidence_reduction * out.proportion_mort_during_season * adjusted_incidence_5_to_14;

  const national_pop_under5 = out.national_pop_under5;
  const national_pop_5_to_14 = out.national_pop_5_to_14;
  const ratio_5_14_to_under5 =
    national_pop_under5 !== 0 ? national_pop_5_to_14 / national_pop_under5 : 0;
  const total_5_14_exposed = total_children_covered * ratio_5_14_to_under5;
  const cases_averted_under5 = total_children_covered * incidence_reduction_under5;
  const cases_averted_5_to_14 = incidence_reduction_5_to_14 * total_5_14_exposed;

  // ===== Section 3d: Income (rows 85-97) =====
  const ln_income_increase = Math.log(1 + out.income_increase_per_case);
  const discounted_ln_income =
    ln_income_increase / Math.pow(1 + out.discount_rate, out.years_to_benefits);
  let pv_annuity: number;
  if (out.discount_rate !== 0) {
    pv_annuity =
      discounted_ln_income *
      ((1 - Math.pow(1 + out.discount_rate, -out.benefit_duration_years)) / out.discount_rate) *
      (1 + out.discount_rate);
  } else {
    pv_annuity = discounted_ln_income * out.benefit_duration_years;
  }
  const pv_lifetime_benefits_per_case = pv_annuity * out.household_sharing_multiplier;
  const pv_income_under5 = cases_averted_under5 * pv_lifetime_benefits_per_case;
  const pv_income_5_to_14 = cases_averted_5_to_14 * pv_lifetime_benefits_per_case;
  const total_pv_income = pv_income_under5 + pv_income_5_to_14;

  // ===== Section 4: Value of outcomes (rows 99-112) =====
  const uov_deaths_under5 = deaths_averted_under5 * vw.death_under5;
  const uov_deaths_over5 = deaths_averted_over5 * vw.death_over5;
  const uov_income = total_pv_income * vw.ln_consumption_unit;
  const uov_income_per_person =
    total_children_covered !== 0 ? uov_income / total_children_covered : 0;

  // ===== Section 5: Summary (rows 114-146) =====
  const total_deaths_under5 = deaths_averted_under5;
  const total_deaths_over5 = deaths_averted_over5;
  const total_cases_averted = cases_averted_under5 + cases_averted_5_to_14;

  const income_value = vw.ln_consumption_unit * pv_lifetime_benefits_per_case;
  const total_uov_under5_deaths = total_deaths_under5 * vw.death_under5;
  const total_uov_over5_deaths = total_deaths_over5 * vw.death_over5;
  const total_uov_income = total_cases_averted * income_value;
  const total_uov = total_uov_under5_deaths + total_uov_over5_deaths + total_uov_income;

  const uov_per_dollar = grantee_spending !== 0 ? total_uov / grantee_spending : 0;
  const ce_before_adj = uov_per_dollar / vw.benchmark_uov_per_dollar;

  const prop_under5_deaths = total_uov !== 0 ? total_uov_under5_deaths / total_uov : 0;
  const prop_over5_deaths = total_uov !== 0 ? total_uov_over5_deaths / total_uov : 0;
  const prop_income = total_uov !== 0 ? total_uov_income / total_uov : 0;

  const total_lives_saved = total_deaths_under5 + total_deaths_over5;
  const cost_per_life_saved =
    total_lives_saved !== 0 ? grantee_spending / total_lives_saved : 0;

  // ===== Section 6: Adjustments (rows 148-187) =====
  const grantee_adj_total =
    adj.double_treatment +
    adj.ineffective_goods +
    adj.goods_in_storage +
    adj.incomplete_monitoring +
    adj.biased_monitoring +
    adj.change_of_priorities +
    adj.non_funding_bottlenecks +
    adj.within_org_fungibility;

  const h_items =
    adj.malaria_morbidity +
    adj.short_term_anemia +
    adj.income_investment +
    adj.treatment_costs_averted +
    adj.adverse_events +
    adj.failure_to_ingest;
  const i_items =
    adj.rebound_effects +
    adj.drug_resistance +
    adj.subnational_adjustments +
    adj.marginal_lower_priority +
    adj.ancillary_costs +
    adj.layered_program_components;
  const intervention_adj_total = h_items + i_items;

  // Step 2: Calculate L&F (uses main CEA intermediates)
  const lfResult = calculateLeverageFunging({
    inputs,
    grantee_spending,
    other_spending,
    gov_spending,
    upstream_spending,
    downstream_spending,
    uov_per_dollar,
    grantee_adj_total,
    intervention_adj_total,
  });

  const leverage_adj = lfResult.leverage_adj;
  const funging_adj = lfResult.funging_adj;
  const lf_overall_adj = lfResult.overall_adj;
  const lf_counterfactual = lfResult.counterfactual_adj;

  // ===== Section 7: Final CE (rows 189-195) =====
  const total_value_after_adj =
    total_uov * (1 + grantee_adj_total) * (1 + intervention_adj_total) * (1 + lf_counterfactual);
  const uov_per_dollar_final =
    grantee_spending !== 0 ? total_value_after_adj / grantee_spending : 0;
  const final_ce = uov_per_dollar_final / vw.benchmark_uov_per_dollar;

  // ===== Section 8: Counterfactual impact (rows 197-216) =====
  const life_saved_adj_total = i_items;
  const output_adj = (1 + grantee_adj_total) * (1 + lf_counterfactual) - 1;
  const outcome_adj =
    (1 + grantee_adj_total) * (1 + life_saved_adj_total) * (1 + lf_counterfactual) - 1;
  const counterfactual_people_covered = total_children_covered * (1 + output_adj);
  const cost_per_counterfactual_person =
    counterfactual_people_covered !== 0
      ? grantee_spending / counterfactual_people_covered
      : 0;
  const counterfactual_lives_saved = total_lives_saved * (1 + outcome_adj);
  const cost_per_counterfactual_life =
    counterfactual_lives_saved !== 0
      ? grantee_spending / counterfactual_lives_saved
      : 0;

  return {
    grant_size,
    pct_grantee,
    pct_other_philanthropic,
    pct_domestic_gov,
    total_spending,
    grantee_spending,
    other_spending,
    gov_spending,
    upstream_spending,
    downstream_spending,
    cost_per_cycle,
    cycles_per_year,
    total_cost_per_child,
    upstream_cost_per_child,
    total_children_covered,
    implied_incidence_reduction,
    expected_incidence_reduction,
    expected_mortality_reduction,
    annual_mort_rate_3_59mo,
    total_mort_rate,
    vaccine_adj_mort_rate,
    annual_mortalities_averted_raw,
    seasonal_mortalities,
    deaths_averted_under5,
    spillover_proportion,
    spillover_incidence_reduction,
    spillover_mortality_reduction,
    older_mort_per_eligible,
    older_mortalities,
    deaths_averted_over5,
    adjusted_incidence_under5,
    adjusted_incidence_5_to_14,
    incidence_reduction_under5,
    incidence_reduction_5_to_14,
    national_pop_under5,
    national_pop_5_to_14,
    ratio_5_14_to_under5,
    total_5_14_exposed,
    cases_averted_under5,
    cases_averted_5_to_14,
    pv_lifetime_benefits_per_case,
    pv_income_under5,
    pv_income_5_to_14,
    total_pv_income,
    uov_deaths_under5,
    uov_deaths_over5,
    uov_income,
    uov_income_per_person,
    total_deaths_under5,
    total_deaths_over5,
    total_cases_averted,
    total_uov_under5_deaths,
    total_uov_over5_deaths,
    total_uov_income,
    total_uov,
    uov_per_dollar,
    ce_before_adj,
    prop_under5_deaths,
    prop_over5_deaths,
    prop_income,
    total_lives_saved,
    cost_per_life_saved,
    grantee_adj_total,
    intervention_adj_total,
    leverage_adj,
    funging_adj,
    lf_overall_adj,
    total_value_after_adj,
    uov_per_dollar_final,
    final_ce,
    output_adj,
    outcome_adj,
    counterfactual_people_covered,
    cost_per_counterfactual_person,
    counterfactual_lives_saved,
    cost_per_counterfactual_life,
  };
}
