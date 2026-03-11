"""
Pre-compute CEA results for all countries and export as JSON.

Generates two files:
  - public/data/itn_countries.json  (26 ITN locations)
  - public/data/smc_countries.json  (20 SMC locations)

Run from the cea-to-python directory:
    python -m scripts.precompute

Or with explicit path:
    PYTHONPATH=../cea-to-python python scripts/precompute.py
"""

import json
import sys
from dataclasses import asdict
from datetime import date
from pathlib import Path

# Add cea-to-python to path
CEA_REPO = Path(__file__).resolve().parent.parent.parent / "cea-to-python"
sys.path.insert(0, str(CEA_REPO))

# --- ITN imports ---
from src.models.itn.input_loader import InputLoader, COLUMN_COUNTRIES
from src.models.itn.effective_coverage import calculate_durability, DurabilityResult
from src.models.itn.insecticide_resistance import calculate_insecticide_resistance
from src.models.itn.counterfactual_malaria import calculate_malaria_mortality
from src.models.itn.coverage import calculate_coverage, RoutineFallback
from src.models.itn.leverage_funging import calculate_leverage_funging
from src.models.itn.main_cea import calculate_main_cea
from src.models.itn.mc_config import build_mc_config
from src.models.itn.monte_carlo import run_simple_monte_carlo, MCStats
from src.models.itn.sensitivity import run_sensitivity_analysis

# --- SMC imports ---
from src.models.smc.input_loader import (
    SMCInputLoader,
    COLUMN_COUNTRIES as SMC_COLUMN_COUNTRIES,
)
from src.models.smc.counterfactual_malaria import calculate_counterfactual_malaria
from src.models.smc.main_cea import calculate_main_cea as smc_calculate_main_cea
from src.models.smc.leverage_funging import calculate_leverage_funging as smc_calculate_leverage_funging
from src.models.smc.mc_config import build_mc_config as smc_build_mc_config
from src.models.smc.monte_carlo import (
    run_simple_monte_carlo as smc_run_simple_monte_carlo,
    MCStats as SMCMCStats,
)
from src.models.smc.sensitivity import run_sensitivity_analysis as smc_run_sensitivity_analysis

DATA_DIR = CEA_REPO / "data" / "extracted"
SMC_DATA_DIR = CEA_REPO / "data" / "extracted" / "smc"
CI_JSON = DATA_DIR / "Confidence_intervals.json"
SMC_CI_JSON = SMC_DATA_DIR / "Confidence_intervals.json"
MC_SIMULATIONS = 5000
MC_SEED = 42
HISTOGRAM_BINS = 40
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "public" / "data"
TODAY = date.today().isoformat()


# ============================================================================
# ITN functions (unchanged)
# ============================================================================

def get_drc_fallback(loader: InputLoader) -> RoutineFallback:
    drc = loader.load("K")
    return RoutineFallback(
        anc_coverage=drc.routine_channel.anc_coverage,
        epi_coverage=drc.routine_channel.epi_coverage,
        other_sources_baseline=drc.routine_channel.other_sources_baseline,
    )


def get_global_physical_adjusted(loader: InputLoader) -> float:
    chad_inputs = loader.load("I")
    chad_dur = calculate_durability(chad_inputs)
    return chad_dur.physical_protection_adjusted


def compute_itn_country(loader, col, drc_fallback, global_phys_adj):
    """Compute full ITN CEA for a single country column."""
    inputs = loader.load(col)
    dur = calculate_durability(inputs)
    ir = calculate_insecticide_resistance(inputs, dur)
    mm = calculate_malaria_mortality(inputs)

    # Compute under5_sleeping_proportion (Main CEA row 44)
    nd = inputs.net_distribution
    cost = inputs.cost
    total_spending = cost.grant_size / cost.pct_cost_grantee
    grantee_spending = cost.pct_cost_grantee * total_spending
    upstream_spending = grantee_spending + cost.pct_cost_other_philanthropic * total_spending
    upstream_cost_per_net = (upstream_spending / total_spending) * cost.cost_per_net
    nets_distributed = grantee_spending / upstream_cost_per_net
    target_pop = nets_distributed * nd.people_per_net
    people_sleeping = nets_distributed * nd.proportion_used * nd.people_per_used_net
    prop_sleeping = people_sleeping / target_pop
    under5_sleeping = prop_sleeping * (1 + nd.under5_use_adjustment)

    cov = calculate_coverage(inputs, dur, under5_sleeping, drc_fallback)

    kwargs = {}
    if col != "I":
        kwargs["global_physical_adjusted"] = global_phys_adj

    # First pass: pre-L&F
    pre_lf = calculate_main_cea(inputs, dur, ir, mm, cov, **kwargs)

    # Compute L&F
    lf_result = calculate_leverage_funging(
        inputs,
        pre_lf.grantee_spending,
        pre_lf.other_spending,
        pre_lf.gov_spending,
        pre_lf.upstream_spending,
        pre_lf.uov_per_dollar,
        pre_lf.grantee_adj_total,
        pre_lf.intervention_adj_total,
    )

    # Final pass: with L&F
    kwargs["leverage_adj"] = lf_result.leverage_adj
    kwargs["funging_adj"] = lf_result.funging_adj
    kwargs["lf_counterfactual"] = lf_result.counterfactual_adj
    result = calculate_main_cea(inputs, dur, ir, mm, cov, **kwargs)

    # Serialize inputs for the UI
    inputs_dict = {
        "country": inputs.country,
        "cost": asdict(inputs.cost),
        "net_distribution": asdict(inputs.net_distribution),
        "population": asdict(inputs.population),
        "durability_physical": asdict(inputs.durability_physical),
        "durability_chemical": asdict(inputs.durability_chemical),
        "insecticide_resistance": asdict(inputs.insecticide_resistance),
        "net_retention": asdict(inputs.net_retention),
        "routine_channel": asdict(inputs.routine_channel),
        "mortality": asdict(inputs.mortality),
        "efficacy": asdict(inputs.efficacy),
        "incidence": asdict(inputs.incidence),
        "economic": asdict(inputs.economic),
        "value_weights": asdict(inputs.value_weights),
        "adjustments": asdict(inputs.adjustments),
        "leverage_funging": asdict(inputs.leverage_funging),
    }

    # Serialize supplementary results
    def tuple_to_list(obj):
        if isinstance(obj, tuple):
            return list(obj)
        return obj

    dur_dict = asdict(dur)
    for k, v in dur_dict.items():
        dur_dict[k] = tuple_to_list(v)

    ir_dict = asdict(ir)
    for k, v in ir_dict.items():
        ir_dict[k] = tuple_to_list(v)

    return {
        "column": col,
        "country": inputs.country,
        "inputs": inputs_dict,
        "supplementary": {
            "durability": dur_dict,
            "insecticide_resistance": ir_dict,
            "malaria_mortality": asdict(mm),
            "coverage": asdict(cov),
            "leverage_funging": asdict(lf_result),
        },
        "results": asdict(result),
    }


def compute_itn_monte_carlo(col: str, country_name: str, ce_multiple: float) -> dict | None:
    """Run ITN Monte Carlo simulation and OAT sensitivity for a country."""
    import numpy as np
    from src.models.itn.monte_carlo import _compute_simple_ce

    try:
        config = build_mc_config(
            CI_JSON, col, country_name,
            n_simulations=MC_SIMULATIONS,
            seed=MC_SEED,
        )
    except (ValueError, KeyError):
        return None

    if not config.parameters:
        return None

    mc_result = run_simple_monte_carlo(config)

    bg_values = {spec.name: spec.best_guess for spec in config.parameters}
    bg_outcomes = _compute_simple_ce(bg_values)
    bg_raw = bg_outcomes.get("final_cost_effectiveness", 0)

    if abs(bg_raw) < 1e-15 or not ce_multiple:
        return None

    scale = ce_multiple / bg_raw

    draws = mc_result.outcome_draws["final_cost_effectiveness"]
    scaled_draws = draws * scale
    finite = scaled_draws[np.isfinite(scaled_draws)]
    if len(finite) == 0:
        return None

    s = MCStats.from_array(finite)

    counts, edges = np.histogram(finite, bins=HISTOGRAM_BINS)
    histogram = [
        {"x0": round(float(edges[i]), 4), "x1": round(float(edges[i + 1]), 4), "count": int(counts[i])}
        for i in range(len(counts))
    ]

    sens_result = run_sensitivity_analysis(config, mc_result)
    tornado = []
    for entry in sens_result.tornado_data():
        tornado.append({
            "parameter": entry["parameter"],
            "p25_pct_delta": round(entry.get("p25_pct_delta", 0), 6),
            "p75_pct_delta": round(entry.get("p75_pct_delta", 0), 6),
            "p25_mean": round(entry.get("p25_mean", 0) * scale, 4),
            "p75_mean": round(entry.get("p75_mean", 0) * scale, 4),
        })

    return _format_mc_result(mc_result, s, histogram, tornado)


# ============================================================================
# SMC functions
# ============================================================================

def compute_smc_country(loader: SMCInputLoader, col: str):
    """Compute full SMC CEA for a single country column."""
    inputs = loader.load(col)
    cm = calculate_counterfactual_malaria(inputs)

    # First pass: pre-L&F
    pre_lf = smc_calculate_main_cea(
        inputs, cm,
        upstream_grantee_only=inputs.upstream_grantee_only,
    )

    # Compute L&F
    lf_result = smc_calculate_leverage_funging(
        inputs,
        grantee_spending=pre_lf.grantee_spending,
        other_spending=pre_lf.other_spending,
        gov_spending=pre_lf.gov_spending,
        upstream_spending=pre_lf.upstream_spending,
        uov_per_dollar=pre_lf.uov_per_dollar,
        grantee_adj_total=pre_lf.grantee_adj_total,
        intervention_adj_total=pre_lf.intervention_adj_total,
        downstream_spending=pre_lf.downstream_spending if inputs.upstream_grantee_only else None,
    )

    # Final pass: with L&F
    result = smc_calculate_main_cea(
        inputs, cm,
        leverage_adj=lf_result.leverage_adj,
        funging_adj=lf_result.funging_adj,
        lf_counterfactual=lf_result.overall_adj,
        upstream_grantee_only=inputs.upstream_grantee_only,
    )

    # Serialize inputs
    inputs_dict = {
        "country": inputs.country,
        "cost": asdict(inputs.cost),
        "counterfactual_malaria": asdict(inputs.counterfactual_malaria),
        "outcomes": asdict(inputs.outcomes),
        "value_weights": asdict(inputs.value_weights),
        "adjustments": asdict(inputs.adjustments),
        "leverage_funging": asdict(inputs.leverage_funging),
        "upstream_grantee_only": inputs.upstream_grantee_only,
    }

    return {
        "column": col,
        "country": inputs.country,
        "inputs": inputs_dict,
        "supplementary": {
            "counterfactual_malaria": asdict(cm),
            "leverage_funging": asdict(lf_result),
        },
        "results": asdict(result),
    }


def compute_smc_monte_carlo(col: str, country_name: str, ce_value: float) -> dict | None:
    """Run SMC Monte Carlo simulation and OAT sensitivity for a country."""
    import numpy as np
    from src.models.smc.monte_carlo import _compute_simple_ce as smc_compute_simple_ce

    try:
        config = smc_build_mc_config(
            SMC_CI_JSON, col, country_name,
            n_simulations=MC_SIMULATIONS,
            seed=MC_SEED,
        )
    except (ValueError, KeyError):
        return None

    if not config.parameters:
        return None

    mc_result = smc_run_simple_monte_carlo(config)

    # Scale raw draws to CE-multiple space
    bg_values = {spec.name: spec.best_guess for spec in config.parameters}
    bg_outcomes = smc_compute_simple_ce(bg_values)
    bg_raw = bg_outcomes.get("final_cost_effectiveness", 0)

    if abs(bg_raw) < 1e-15 or not ce_value:
        return None

    scale = ce_value / bg_raw

    draws = mc_result.outcome_draws["final_cost_effectiveness"]
    scaled_draws = draws * scale
    finite = scaled_draws[np.isfinite(scaled_draws)]
    if len(finite) == 0:
        return None

    s = SMCMCStats.from_array(finite)

    counts, edges = np.histogram(finite, bins=HISTOGRAM_BINS)
    histogram = [
        {"x0": round(float(edges[i]), 4), "x1": round(float(edges[i + 1]), 4), "count": int(counts[i])}
        for i in range(len(counts))
    ]

    sens_result = smc_run_sensitivity_analysis(config, mc_result)
    tornado = []
    for entry in sens_result.tornado_data():
        tornado.append({
            "parameter": entry["parameter"],
            "p25_pct_delta": round(entry.get("p25_pct_delta", 0), 6),
            "p75_pct_delta": round(entry.get("p75_pct_delta", 0), 6),
            "p25_mean": round(entry.get("p25_mean", 0) * scale, 4),
            "p75_mean": round(entry.get("p75_mean", 0) * scale, 4),
        })

    return _format_mc_result(mc_result, s, histogram, tornado)


# ============================================================================
# Shared helpers
# ============================================================================

def _format_mc_result(mc_result, summary, histogram, tornado) -> dict:
    """Format MC results into the standard JSON structure."""
    return {
        "n_simulations": mc_result.n_simulations,
        "seed": mc_result.seed,
        "summary": {
            "mean": round(summary.mean, 4),
            "median": round(summary.median, 4),
            "std": round(summary.std, 4),
            "min": round(summary.min, 4),
            "max": round(summary.max, 4),
            "p5": round(summary.p5, 4),
            "p25": round(summary.p25, 4),
            "p75": round(summary.p75, 4),
            "p95": round(summary.p95, 4),
        },
        "histogram": histogram,
        "tornado": tornado,
    }


# ============================================================================
# Display name mappings
# ============================================================================

ITN_COLUMN_DISPLAY_NAMES = {
    "I": "Chad",
    "J": "Côte d'Ivoire",
    "K": "DRC (overall)",
    "L": "DRC - Ituri",
    "M": "DRC - Kasai Oriental",
    "N": "Ghana",
    "O": "Guinea",
    "P": "Nigeria (GF states)",
    "Q": "Nigeria (PMI states)",
    "R": "South Sudan",
    "S": "Togo",
    "T": "Uganda",
    "U": "Zambia",
    "V": "MC - Abia/Ebonyi",
    "W": "MC - Adamawa",
    "X": "MC - Bauchi",
    "Y": "MC - Gombe",
    "Z": "MC - Jigawa",
    "AA": "MC - Kaduna",
    "AB": "MC - Katsina",
    "AC": "MC - Kebbi",
    "AD": "MC - Lagos",
    "AE": "MC - Ondo",
    "AF": "MC - Rivers",
    "AG": "MC - Sokoto",
    "AH": "MC - Zamfara",
}

SMC_COLUMN_DISPLAY_NAMES = {
    "I": "Burkina Faso",
    "J": "Chad",
    "K": "Côte d'Ivoire",
    "L": "DRC - Haut-Katanga",
    "M": "DRC - Haut-Lomami",
    "N": "DRC - Lualaba",
    "O": "DRC - Tanganyika",
    "P": "Mozambique - Nampula",
    "Q": "Nigeria - Bauchi",
    "R": "Nigeria - Borno",
    "S": "Nigeria - FCT (Abuja)",
    "T": "Nigeria - Jigawa",
    "U": "Nigeria - Kano",
    "V": "Nigeria - Katsina",
    "W": "Nigeria - Sokoto",
    "X": "Nigeria - Yobe",
    "Y": "Nigeria - Zamfara",
    "Z": "South Sudan",
    "AA": "Togo",
    "AB": "Uganda",
}


# ============================================================================
# Main
# ============================================================================

def run_itn():
    """Pre-compute all ITN CEA results."""
    print("=" * 60)
    print("ITN CEA")
    print("=" * 60)

    loader = InputLoader(DATA_DIR / "Inputs.json", DATA_DIR / "GBD_estimates.csv")
    drc_fallback = get_drc_fallback(loader)
    global_phys_adj = get_global_physical_adjusted(loader)

    countries = []
    errors = []

    for col in COLUMN_COUNTRIES:
        display_name = ITN_COLUMN_DISPLAY_NAMES.get(col, f"Column {col}")
        print(f"  {display_name} (col {col})...", end=" ")
        try:
            data = compute_itn_country(loader, col, drc_fallback, global_phys_adj)
            data["display_name"] = display_name
            data["id"] = col.lower()

            ce = data['results']['final_ce_multiple']
            mc_data = compute_itn_monte_carlo(col, display_name, ce)
            data["monte_carlo"] = mc_data

            countries.append(data)
            mc_info = ""
            if mc_data:
                mc_info = f" (MC: P5={mc_data['summary']['p5']:.2f}, P95={mc_data['summary']['p95']:.2f})"
            print(f"CE = {ce:.3f}x{mc_info}")
        except Exception as e:
            print(f"ERROR: {e}")
            errors.append({"column": col, "name": display_name, "error": str(e)})

    countries.sort(key=lambda c: c["results"]["final_ce_multiple"] or 0, reverse=True)

    output = {
        "generated": TODAY,
        "model": "ITN CEA",
        "source": "cea-to-python",
        "global_physical_adjusted": global_phys_adj,
        "countries": countries,
        "errors": errors,
    }

    output_path = OUTPUT_DIR / "itn_countries.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nWrote {len(countries)} ITN countries to {output_path}")
    if errors:
        print(f"Errors: {len(errors)}")
        for e in errors:
            print(f"  {e['name']}: {e['error']}")

    return output


def run_smc():
    """Pre-compute all SMC CEA results."""
    print("\n" + "=" * 60)
    print("SMC CEA")
    print("=" * 60)

    loader = SMCInputLoader(SMC_DATA_DIR / "Inputs.json")

    countries = []
    errors = []

    for col in SMC_COLUMN_COUNTRIES:
        display_name = SMC_COLUMN_DISPLAY_NAMES.get(col, f"Column {col}")
        print(f"  {display_name} (col {col})...", end=" ")
        try:
            data = compute_smc_country(loader, col)
            data["display_name"] = display_name
            data["id"] = col.lower()

            ce = data['results']['final_ce']
            mc_data = compute_smc_monte_carlo(col, display_name, ce)
            data["monte_carlo"] = mc_data

            countries.append(data)
            mc_info = ""
            if mc_data:
                mc_info = f" (MC: P5={mc_data['summary']['p5']:.2f}, P95={mc_data['summary']['p95']:.2f})"
            print(f"CE = {ce:.3f}{mc_info}")
        except Exception as e:
            print(f"ERROR: {e}")
            import traceback
            traceback.print_exc()
            errors.append({"column": col, "name": display_name, "error": str(e)})

    countries.sort(key=lambda c: c["results"]["final_ce"] or 0, reverse=True)

    output = {
        "generated": TODAY,
        "model": "SMC CEA",
        "source": "cea-to-python",
        "countries": countries,
        "errors": errors,
    }

    output_path = OUTPUT_DIR / "smc_countries.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nWrote {len(countries)} SMC countries to {output_path}")
    if errors:
        print(f"Errors: {len(errors)}")
        for e in errors:
            print(f"  {e['name']}: {e['error']}")

    return output


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    run_itn()
    run_smc()
    print("\nDone!")


if __name__ == "__main__":
    main()
