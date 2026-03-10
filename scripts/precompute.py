"""
Pre-compute CEA results for all countries and export as JSON.

Run from the cea-to-python directory:
    python -m scripts.precompute

Or with explicit path:
    PYTHONPATH=../cea-to-python python scripts/precompute.py
"""

import json
import sys
from dataclasses import asdict
from pathlib import Path

# Add cea-to-python to path
CEA_REPO = Path(__file__).resolve().parent.parent.parent / "cea-to-python"
sys.path.insert(0, str(CEA_REPO))

from src.models.itn.input_loader import InputLoader, COLUMN_COUNTRIES
from src.models.itn.effective_coverage import calculate_durability, DurabilityResult
from src.models.itn.insecticide_resistance import calculate_insecticide_resistance
from src.models.itn.counterfactual_malaria import calculate_malaria_mortality
from src.models.itn.coverage import calculate_coverage, RoutineFallback
from src.models.itn.leverage_funging import calculate_leverage_funging
from src.models.itn.main_cea import calculate_main_cea

DATA_DIR = CEA_REPO / "data" / "extracted"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "public" / "data"


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


def compute_country(loader, col, drc_fallback, global_phys_adj):
    """Compute full CEA for a single country column."""
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


# Column letter -> display name (more specific than just country)
COLUMN_DISPLAY_NAMES = {
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


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    loader = InputLoader(DATA_DIR / "Inputs.json", DATA_DIR / "GBD_estimates.csv")
    drc_fallback = get_drc_fallback(loader)
    global_phys_adj = get_global_physical_adjusted(loader)

    countries = []
    errors = []

    for col in COLUMN_COUNTRIES:
        display_name = COLUMN_DISPLAY_NAMES.get(col, f"Column {col}")
        print(f"Computing {display_name} (col {col})...", end=" ")
        try:
            data = compute_country(loader, col, drc_fallback, global_phys_adj)
            data["display_name"] = display_name
            data["id"] = col.lower()
            countries.append(data)
            print(f"CE = {data['results']['final_ce_multiple']:.3f}x")
        except Exception as e:
            print(f"ERROR: {e}")
            errors.append({"column": col, "name": display_name, "error": str(e)})

    # Sort by CE multiple descending
    countries.sort(key=lambda c: c["results"]["final_ce_multiple"] or 0, reverse=True)

    output = {
        "generated": "2026-03-10",
        "model": "ITN CEA",
        "source": "cea-to-python",
        "countries": countries,
        "errors": errors,
    }

    output_path = OUTPUT_DIR / "countries.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nWrote {len(countries)} countries to {output_path}")
    if errors:
        print(f"Errors: {len(errors)}")
        for e in errors:
            print(f"  {e['name']}: {e['error']}")


if __name__ == "__main__":
    main()
