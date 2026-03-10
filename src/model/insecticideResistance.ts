/**
 * Insecticide Resistance calculation — TypeScript port of
 * cea-to-python/src/models/itn/insecticide_resistance.py
 *
 * Computes how pyrethroid resistance reduces ITN effectiveness,
 * accounting for different net types (standard, PBO, chlorfenapyr, dual AI).
 *
 * All intermediates are returned so the Explore page can display them.
 */

import type { InsecticideResistanceData } from './types';

/** Durability attribution for one year: [physical, chemical, joint] shares. */
export type Attribution = [number, number, number];

export interface IRIntermediates {
  // Section 1: Projection
  years_gap: number;
  mortality_change: number;
  projected_mortality: number;
  killing_power_loss: number;

  // Section 2: Durability attribution (from upstream)
  attribution: [Attribution, Attribution, Attribution];

  // Section 3: Per-net-type adjustments (yr1, yr2, yr3)
  standard_adj: [number, number, number];

  // PBO intermediates
  residual_resistance: number;
  pbo_adj: [number, number, number];

  // Chlorfenapyr (fixed)
  chlorfenapyr_adj: [number, number, number];

  // Dual AI (same as standard)
  dual_ai_adj: [number, number, number];

  // Section 4: Weighted result
  weighted_adj: [number, number, number];
}

/**
 * Calculate all insecticide resistance intermediates.
 *
 * @param ir - Insecticide resistance input parameters for a country
 * @param attribution - 3-year durability attribution from the Durability sheet
 *   Each entry is [physical_share, chemical_share, joint_share].
 */
export function calculateIR(
  ir: InsecticideResistanceData,
  attribution: [Attribution, Attribution, Attribution],
): IRIntermediates {
  // --- Projection (rows 8-15) ---
  const years_gap = ir.expected_distribution_year - ir.avg_bioassay_year;
  const mortality_change = ir.annual_mortality_change * years_gap;
  const projected_mortality = Math.max(
    ir.avg_pyrethroid_mortality_rate + mortality_change,
    0,
  );
  const killing_power_loss = projected_mortality - 1.0;

  // --- Standard ITN adjustment (rows 32-34) ---
  function stdAdj([phys, chem, joint]: Attribution): number {
    return phys + chem * (1 + killing_power_loss) + joint * (1 + killing_power_loss) - 1;
  }
  const standard_adj: [number, number, number] = [
    stdAdj(attribution[0]),
    stdAdj(attribution[1]),
    stdAdj(attribution[2]),
  ];

  // --- PBO adjustment (rows 39-49) ---
  const residual_resistance =
    (1 - ir.avg_pbo_mortality_rate) / (1 - ir.avg_pyrethroid_only_mortality);

  const pbo_adj: [number, number, number] = [
    standard_adj[0] * (1 - (1 - residual_resistance) * (1 + ir.pbo_washout_year1)),
    standard_adj[1] * (1 - (1 - residual_resistance) * (1 + ir.pbo_washout_year2)),
    standard_adj[2] * (1 - (1 - residual_resistance) * (1 + ir.pbo_washout_year3)),
  ];

  // --- Chlorfenapyr (rows 54-56) ---
  const chlorfenapyr_adj: [number, number, number] = [
    ir.chlorfenapyr_adj_year1,
    ir.chlorfenapyr_adj_year2,
    ir.chlorfenapyr_adj_year3,
  ];

  // --- Dual AI (rows 59-61) — same as standard ---
  const dual_ai_adj: [number, number, number] = [...standard_adj];

  // --- Weighted average (rows 72-74) ---
  function weighted(std: number, pbo: number, chlr: number, dual: number): number {
    return (
      std * ir.pct_standard_itns +
      pbo * ir.pct_pbo_nets +
      chlr * ir.pct_chlorfenapyr_nets +
      dual * ir.pct_other_dual_ai_nets
    );
  }

  const weighted_adj: [number, number, number] = [
    weighted(standard_adj[0], pbo_adj[0], chlorfenapyr_adj[0], dual_ai_adj[0]),
    weighted(standard_adj[1], pbo_adj[1], chlorfenapyr_adj[1], dual_ai_adj[1]),
    weighted(standard_adj[2], pbo_adj[2], chlorfenapyr_adj[2], dual_ai_adj[2]),
  ];

  return {
    years_gap,
    mortality_change,
    projected_mortality,
    killing_power_loss,
    attribution,
    standard_adj,
    residual_resistance,
    pbo_adj,
    chlorfenapyr_adj,
    dual_ai_adj,
    weighted_adj,
  };
}
