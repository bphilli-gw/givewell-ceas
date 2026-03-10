/**
 * TypeScript port of main_cea.py — the main CEA calculation pipeline.
 *
 * This enables real-time recalculation when users change parameters in the UI.
 * Supplementary sheet results (durability, coverage, resistance, mortality)
 * are taken as pre-computed inputs; only the main pipeline is recalculated.
 */

import type { ITNInputs, SupplementaryResults, MainCEAResult } from './types';

export function calculateMainCEA(
  inputs: ITNInputs,
  supp: SupplementaryResults,
  globalPhysicalAdjusted: number,
): MainCEAResult {
  const cost = inputs.cost;
  const nd = inputs.net_distribution;
  const pop = inputs.population;
  const eff = inputs.efficacy;
  const inc = inputs.incidence;
  const eco = inputs.economic;
  const vw = inputs.value_weights;
  const adj = inputs.adjustments;
  const ir = supp.insecticide_resistance;
  const mm = supp.malaria_mortality;
  const cov = supp.coverage;

  // ===== Section 1: Costs =====
  const total_spending = cost.grant_size / cost.pct_cost_grantee;
  const grantee_spending = cost.pct_cost_grantee * total_spending;
  const other_spending = cost.pct_cost_other_philanthropic * total_spending;
  const gov_spending = cost.pct_cost_domestic_gov * total_spending;
  const upstream_spending = grantee_spending + other_spending;
  const downstream_spending = gov_spending;
  const cost_per_net = cost.cost_per_net;
  const upstream_cost_per_net = (upstream_spending / total_spending) * cost_per_net;

  // ===== Section 2: Distribution & Usage =====
  const nets_distributed = grantee_spending / upstream_cost_per_net;
  const target_population = nets_distributed * nd.people_per_net;
  const people_sleeping = nets_distributed * nd.proportion_used * nd.people_per_used_net;
  const prop_sleeping = people_sleeping / target_population;
  const under5_sleeping_proportion = prop_sleeping * (1 + nd.under5_use_adjustment);

  const total_pop = pop.total;
  const prop_under5 = pop.under5 / total_pop;
  const prop_5_14 = pop.age5_14 / total_pop;
  const prop_over14 = 1 - prop_under5 - prop_5_14;

  const target_under5 = target_population * prop_under5;
  const target_5_14 = target_population * prop_5_14;
  const target_over14 = target_population * prop_over14;

  // ===== Section 3: Coverage =====
  const baseline_coverage = cov.baseline_coverage;
  const routine_adj = nd.routine_channel_adjustment;
  const speedup_adj = nd.speedup_adjustment;

  const coverage_increase_yr1 =
    (cov.total_coverage_yr1 - baseline_coverage) * (1 + routine_adj) * (1 + speedup_adj);
  const coverage_increase_yr2 =
    (cov.total_coverage_yr2 - baseline_coverage) * (1 + routine_adj) * (1 + speedup_adj);
  const coverage_increase_yr3 =
    (cov.total_coverage_yr3 - baseline_coverage) * (1 + routine_adj) * (1 + speedup_adj);

  // ===== Section 4: Efficacy Chain =====
  const nr = inputs.net_retention;
  const trial_coverage_diff_val =
    (nr.ctn_treatment_coverage - nr.ctn_control_coverage) *
    nr.ctn_remaining_year1 *
    globalPhysicalAdjusted;

  const raw_efficacy = eff.incidence_reduction / trial_coverage_diff_val;
  const adjusted_efficacy =
    raw_efficacy * (1 + eff.internal_validity_adj) * (1 + eff.external_validity_adj);
  const net_efficacy = adjusted_efficacy * eff.mortality_to_incidence_ratio;

  const mortality_reduction_yr1 = net_efficacy * coverage_increase_yr1 * (1 + ir.weighted_adj[0]);
  const mortality_reduction_yr2 = net_efficacy * coverage_increase_yr2 * (1 + ir.weighted_adj[1]);
  const mortality_reduction_yr3 = net_efficacy * coverage_increase_yr3 * (1 + ir.weighted_adj[2]);

  // ===== Section 5: Mortality Under-5 =====
  const baseline_mort = mm.baseline_mortality_rate;
  const indirect_deaths = eff.indirect_deaths_per_direct;
  const baseline_mortality_adjusted = baseline_mort * (1 + indirect_deaths);
  const mortality_net_of_smc = baseline_mortality_adjusted - mm.smc_adjustment;
  const mortality_adjusted = mortality_net_of_smc * (1 + eff.vaccine_mortality_adj);

  const avg_pbo_adj = ir.pbo_adj.reduce((a, b) => a + b, 0) / 3;
  const prevalence_reduction = net_efficacy * (1 + avg_pbo_adj) * eff.baseline_net_coverage;
  const mortality_without_nets = mortality_adjusted / (1 - prevalence_reduction);
  const potential_deaths = target_under5 * mortality_without_nets;
  const avg_mortality_reduction =
    (mortality_reduction_yr1 + mortality_reduction_yr2 + mortality_reduction_yr3) / 3;
  const deaths_averted_under5 = potential_deaths * avg_mortality_reduction * 3;

  // ===== Section 5b: Mortality 5+ =====
  const deaths_averted_over5 =
    deaths_averted_under5 * mm.mortality_ratio_5plus * eff.relative_efficacy_over5;

  // ===== Section 6: Incidence =====
  const prev_reduction_incidence = prevalence_reduction / eff.mortality_to_incidence_ratio;

  const counterfactual_incidence_under5 =
    ((inc.incidence_under5 / 100_000) / (1 - prev_reduction_incidence)) *
    (1 + inc.subnational_incidence_adj);
  const counterfactual_incidence_5_14 =
    ((inc.incidence_5_14 / 100_000) / (1 - prev_reduction_incidence)) *
    (1 + inc.subnational_incidence_adj);

  const potential_cases_under5 = target_under5 * counterfactual_incidence_under5;
  const potential_cases_5_14 = target_5_14 * counterfactual_incidence_5_14;

  const avg_efficacy_incidence = avg_mortality_reduction / eff.mortality_to_incidence_ratio;
  const avg_efficacy_5_14 = avg_efficacy_incidence * eff.relative_efficacy_over5;

  const cases_averted_under5 = potential_cases_under5 * avg_efficacy_incidence * 3;
  const cases_averted_5_14 = potential_cases_5_14 * avg_efficacy_5_14 * 3;

  // ===== Section 6b: Income =====
  const ln_income_increase = Math.log(1 + eco.income_increase_per_case);
  const discounted_income =
    ln_income_increase / Math.pow(1 + eco.discount_rate, eco.years_to_benefits);
  const pv_factor =
    (1 - Math.pow(1 + eco.discount_rate, -eco.benefit_duration_years)) / eco.discount_rate;
  const income_pv = discounted_income * pv_factor * (1 + eco.discount_rate);
  const income_pv_per_case = income_pv * eco.household_sharing_multiplier;

  const income_under5 = cases_averted_under5 * income_pv_per_case;
  const income_5_14 = cases_averted_5_14 * income_pv_per_case;
  const total_income_value = income_under5 + income_5_14;

  // ===== Section 7: Value of Outcomes =====
  const uov_under5_deaths = deaths_averted_under5 * vw.death_under5;
  const uov_over5_deaths = deaths_averted_over5 * vw.death_over5;

  const income_value_per_case_uov = income_pv_per_case * vw.ln_consumption_unit;
  const total_cases_averted = cases_averted_under5 + cases_averted_5_14;
  const uov_income = total_cases_averted * income_value_per_case_uov;

  const total_uov = uov_under5_deaths + uov_over5_deaths + uov_income;
  const uov_per_dollar = total_uov / grantee_spending;
  const ce_multiple_before_adj = uov_per_dollar / vw.benchmark_uov_per_dollar;

  const total_lives_saved = deaths_averted_under5 + deaths_averted_over5;
  const cost_per_life_before_adj = grantee_spending / total_lives_saved;

  // ===== Section 8: Adjustments =====
  const grantee_adj_total =
    adj.double_treatment +
    adj.ineffective_goods +
    adj.goods_in_storage +
    adj.incomplete_monitoring +
    adj.biased_monitoring +
    adj.change_of_priorities +
    adj.non_funding_bottlenecks +
    adj.within_org_fungibility;

  const intervention_adj_total =
    adj.malaria_morbidity +
    adj.short_term_anemia +
    adj.other_disease_prevention +
    adj.stillbirth_prevention +
    adj.income_investment +
    adj.treatment_costs_averted +
    adj.rebound_effects +
    adj.subnational_adjustments +
    adj.marginal_lower_priority +
    adj.resistance_in_trials +
    adj.mosquito_species_diff +
    adj.net_durability_placeholder;

  const lives_saved_adj =
    adj.rebound_effects +
    adj.subnational_adjustments +
    adj.marginal_lower_priority +
    adj.resistance_in_trials +
    adj.mosquito_species_diff +
    adj.net_durability_placeholder;

  // ===== Section 9: Final CE & Counterfactual =====
  const lf = supp.leverage_funging;
  const leverage_adj = lf.leverage_adj;
  const funging_adj = lf.funging_adj;
  const lf_total = leverage_adj + funging_adj;

  const total_value_after_adj =
    total_uov * (1 + grantee_adj_total) * (1 + intervention_adj_total) * (1 + lf_total);
  const final_uov_per_dollar = total_value_after_adj / grantee_spending;
  const final_ce_multiple = final_uov_per_dollar / vw.benchmark_uov_per_dollar;

  const lf_cf = lf.counterfactual_adj;
  const counterfactual_output_adj = (1 + grantee_adj_total) * (1 + lf_cf) - 1;
  const counterfactual_outcome_adj =
    (1 + grantee_adj_total) * (1 + lives_saved_adj) * (1 + lf_cf) - 1;
  const counterfactual_nets = nets_distributed * (1 + counterfactual_output_adj);
  const counterfactual_lives = total_lives_saved * (1 + counterfactual_outcome_adj);
  const cost_per_life_counterfactual = grantee_spending / counterfactual_lives;

  return {
    total_spending,
    grantee_spending,
    other_spending,
    gov_spending,
    upstream_spending,
    downstream_spending,
    cost_per_net,
    upstream_cost_per_net,
    nets_distributed,
    target_population,
    people_sleeping,
    prop_sleeping,
    under5_sleeping_proportion,
    prop_under5,
    prop_5_14,
    prop_over14,
    target_under5,
    target_5_14,
    target_over14,
    baseline_coverage,
    coverage_increase_yr1,
    coverage_increase_yr2,
    coverage_increase_yr3,
    trial_coverage_diff: trial_coverage_diff_val,
    net_efficacy,
    mortality_reduction_yr1,
    mortality_reduction_yr2,
    mortality_reduction_yr3,
    baseline_mortality_adjusted,
    mortality_net_of_smc,
    mortality_adjusted,
    prevalence_reduction,
    mortality_without_nets,
    potential_deaths,
    avg_mortality_reduction,
    deaths_averted_under5,
    deaths_averted_over5,
    counterfactual_incidence_under5,
    counterfactual_incidence_5_14,
    potential_cases_under5,
    potential_cases_5_14,
    avg_efficacy_incidence,
    avg_efficacy_5_14,
    cases_averted_under5,
    cases_averted_5_14,
    income_pv_per_case,
    total_income_value,
    uov_under5_deaths,
    uov_over5_deaths,
    uov_income,
    total_uov,
    uov_per_dollar,
    ce_multiple_before_adj,
    total_lives_saved,
    cost_per_life_before_adj,
    grantee_adj_total,
    intervention_adj_total,
    lives_saved_adj,
    leverage_adj,
    funging_adj,
    lf_total,
    total_value_after_adj,
    final_uov_per_dollar,
    final_ce_multiple,
    counterfactual_output_adj,
    counterfactual_outcome_adj,
    counterfactual_nets,
    counterfactual_lives,
    cost_per_life_counterfactual,
  };
}
