# Dr Elena v2 Tenure Rules Fix - Summary

## Problem Fixed
The original JSON file had ambiguous tenure rules for EC, Private, and Commercial properties that didn't clearly distinguish between 75% LTV and 55% LTV tenure caps.

## Changes Made

### 1. EC (Executive Condominiums) - Lines 662-678
**BEFORE:**
```json
"ec": {
  "msr_applicable": "Yes for EC from developer (initial period); not for resale/privatised ECs",
  "max_tenure": 35,
  "cpf_usage": "Allowed",
  "privatization": "After 10 years"
}
```

**AFTER:**
```json
"ec": {
  "msr_applicable": "Yes for EC from developer (initial period); not for resale/privatised ECs",
  "tenure_rules": {
    "purchase_normal_75_ltv": {
      "max_tenure_years": 30,
      "age_formula": "65 - IWAA, capped at 30 years",
      "note": "Standard 75% LTV tier"
    },
    "purchase_extended_55_ltv": {
      "max_tenure_years": 35,
      "age_formula": "65 - IWAA, capped at 35 years",
      "note": "Reduced 55% LTV tier (extended tenure)"
    }
  },
  "cpf_usage": "Allowed",
  "privatization": "After 10 years"
}
```

### 2. Private Properties - Lines 679-700
**BEFORE:**
```json
"private": {
  "msr_applicable": false,
  "max_tenure": 35,
  "cpf_usage": "Allowed",
  "foreign_ownership": "Allowed for condos/apartments (landed restrictions apply)"
}
```

**AFTER:**
```json
"private": {
  "msr_applicable": false,
  "tenure_rules": {
    "purchase_normal_75_ltv": {
      "max_tenure_years": 30,
      "age_formula": "65 - IWAA, capped at 30 years",
      "note": "Standard 75% LTV tier"
    },
    "purchase_extended_55_ltv": {
      "max_tenure_years": 35,
      "age_formula": "65 - IWAA, capped at 35 years",
      "note": "Reduced 55% LTV tier (extended tenure)"
    },
    "refinancing_normal": {
      "max_tenure_years": 30,
      "formula": "30 years or (original tenure - years elapsed - 1), whichever is lower",
      "note": "Standard refinancing tenure"
    }
  },
  "cpf_usage": "Allowed",
  "foreign_ownership": "Allowed for condos/apartments (landed restrictions apply)"
}
```

### 3. Commercial Properties - Lines 701-718
**BEFORE:**
```json
"commercial": {
  "msr_applicable": false,
  "max_tenure": 35,
  "cpf_usage": "Not allowed",
  "stress_test_rate": 5.0,
  "ltv": "Bank policy (no single MAS %); keep configurable"
}
```

**AFTER:**
```json
"commercial": {
  "msr_applicable": false,
  "tenure_rules": {
    "purchase_normal_75_ltv": {
      "max_tenure_years": 30,
      "age_formula": "65 - IWAA, capped at 30 years",
      "note": "Standard tier (bank policy for LTV%)"
    },
    "purchase_extended_55_ltv": {
      "max_tenure_years": 35,
      "age_formula": "65 - IWAA, capped at 35 years",
      "note": "Extended tier (bank policy for LTV%)"
    }
  },
  "cpf_usage": "Not allowed",
  "stress_test_rate": 5.0,
  "ltv": "Bank policy (no single MAS %); keep configurable"
}
```

### 4. NEW: Landed Properties - Lines 719-735
**ADDED (was missing entirely):**
```json
"landed": {
  "msr_applicable": false,
  "tenure_rules": {
    "purchase_normal_75_ltv": {
      "max_tenure_years": 30,
      "age_formula": "65 - IWAA, capped at 30 years",
      "note": "Standard 75% LTV tier"
    },
    "purchase_extended_55_ltv": {
      "max_tenure_years": 35,
      "age_formula": "65 - IWAA, capped at 35 years",
      "note": "Reduced 55% LTV tier (extended tenure)"
    }
  },
  "cpf_usage": "Allowed",
  "foreign_ownership": "Restricted (approval required for foreign buyers)"
}
```

## Key Improvements

1. **Clarity**: Each property type now explicitly separates 75% LTV (30 years) vs 55% LTV (35 years) tenure caps
2. **Consistency**: All property types now match HDB's structured format
3. **Completeness**: Added missing "landed" property type
4. **Documentation**: Clear notes explain which LTV tier applies to each tenure rule
5. **Alignment**: Structure now matches the `tenure_or_age_triggers` rule at line 138:
   - "Apply reduced LTV tier if (HDB flat tenure > 25y) OR (non-HDB tenure > 30y) OR (loan end age > 65)"

## Validation

- JSON validation: PASSED
- All property types now have clear tenure_rules structure
- No ambiguity about LTV tiers and tenure caps

## Files Modified

- `dr-elena-mortgage-expert-v2.json` - Updated property_specific_rules section
- Backup created: `dr-elena-mortgage-expert-v2.json.backup`
