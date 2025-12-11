# NHS dm+d Database Schema Documentation

This document describes the database schema for the NHS Dictionary of Medicines and Devices (dm+d) data.

## Overview: The dm+d Data Model

The dm+d follows a hierarchical model from abstract therapeutic concepts down to specific branded packs:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           VTM                                           │
│              Virtual Therapeutic Moiety                                 │
│         (e.g., "Paracetamol", "Ibuprofen")                              │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │ 1:many
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           VMP                                           │
│              Virtual Medicinal Product                                  │
│         (e.g., "Paracetamol 500mg tablets")                             │
└───────────┬─────────────────────────────────────────────┬───────────────┘
            │ 1:many                                      │ 1:many
            ▼                                             ▼
┌───────────────────────────────┐         ┌───────────────────────────────┐
│           AMP                 │         │           VMPP                │
│   Actual Medicinal Product    │         │  Virtual Medicinal Product    │
│  (e.g., "Panadol 500mg tabs") │         │          Pack                 │
└───────────┬───────────────────┘         │  (e.g., "Paracetamol 500mg    │
            │ 1:many                      │   tablets x 16")              │
            ▼                             └───────────────┬───────────────┘
┌───────────────────────────────┐                         │
│           AMPP                │◄────────────────────────┘
│  Actual Medicinal Product     │         1:many
│          Pack                 │
│ (e.g., "Panadol 500mg tabs    │
│  x 16 tablet")                │
└───────────────────────────────┘
```

---

## Lookup Tables

Lookup tables store reference data with codes and descriptions. They are used to decode coded values in the main entity tables.

| Table                                | Description                                        | Primary Key Type |
| ------------------------------------ | -------------------------------------------------- | ---------------- |
| `lookup_basis_of_name`               | How a drug name was derived                        | VARCHAR(10)      |
| `lookup_namechange_reason`           | Reasons for name changes                           | VARCHAR(10)      |
| `lookup_virtual_product_pres_status` | Prescribing status for virtual products            | VARCHAR(10)      |
| `lookup_control_drug_category`       | Controlled drug categories (CD, Schedule 2, etc.)  | VARCHAR(10)      |
| `lookup_licensing_authority`         | Drug licensing authorities                         | VARCHAR(10)      |
| `lookup_unit_of_measure`             | Units of measure (SNOMED-based)                    | BIGINT           |
| `lookup_form`                        | Drug forms (tablet, capsule, solution, etc.)       | BIGINT           |
| `lookup_route`                       | Routes of administration (oral, IV, topical, etc.) | BIGINT           |
| `lookup_supplier`                    | Pharmaceutical companies/suppliers                 | BIGINT           |
| `lookup_combination_pack_ind`        | Combination pack indicators                        | VARCHAR(10)      |
| `lookup_combination_prod_ind`        | Combination product indicators                     | VARCHAR(10)      |
| `lookup_availability_restriction`    | Availability restrictions                          | VARCHAR(10)      |
| `lookup_legal_category`              | Legal categories (POM, P, GSL)                     | VARCHAR(10)      |
| `lookup_discontinued_ind`            | Discontinued status indicators                     | VARCHAR(10)      |
| `lookup_df_indicator`                | Dose form indicators                               | VARCHAR(10)      |
| `lookup_reimbursement_status`        | NHS reimbursement status                           | VARCHAR(10)      |
| `lookup_price_basis`                 | How the price was determined                       | VARCHAR(10)      |
| `lookup_special_container`           | Special container requirements                     | VARCHAR(10)      |
| `lookup_flavour`                     | Product flavours                                   | BIGINT           |
| `lookup_colour`                      | Product colours                                    | BIGINT           |
| `lookup_basis_of_strength`           | How strength is expressed                          | VARCHAR(10)      |
| `lookup_non_avail_reason`            | Reasons for non-availability                       | VARCHAR(10)      |
| `lookup_ont_form_route`              | DM+D ontology form/route classification            | BIGINT           |

---

## Core Entity Tables

### `ingredient`

**Active pharmaceutical ingredients (APIs)**

| Column     | Type    | Description                                             |
| ---------- | ------- | ------------------------------------------------------- |
| `isid`     | BIGINT  | **Primary Key** - Ingredient Substance ID (SNOMED code) |
| `isidprev` | BIGINT  | Previous ISID (if code changed)                         |
| `isiddt`   | DATE    | Date the ID changed                                     |
| `nm`       | TEXT    | Ingredient name                                         |
| `invalid`  | INTEGER | 1 if retired/invalid, 0 if active                       |

**Example:** Paracetamol (ISID: 387517004)

---

### `vtm` (Virtual Therapeutic Moiety)

**The highest level - represents the therapeutic substance regardless of strength or form**

| Column      | Type    | Description                            |
| ----------- | ------- | -------------------------------------- |
| `vtmid`     | BIGINT  | **Primary Key** - VTM ID (SNOMED code) |
| `vtmidprev` | BIGINT  | Previous VTMID                         |
| `vtmiddt`   | DATE    | Date the ID changed                    |
| `nm`        | TEXT    | VTM name                               |
| `abbrevnm`  | TEXT    | Abbreviated name                       |
| `invalid`   | INTEGER | 1 if retired/invalid                   |

**Example:** "Paracetamol" (no strength or form specified)

---

### `vmp` (Virtual Medicinal Product)

**Generic product with specific strength and form**

| Column            | Type        | Description                                   |
| ----------------- | ----------- | --------------------------------------------- |
| `vpid`            | BIGINT      | **Primary Key** - Virtual Product ID (SNOMED) |
| `vtmid`           | BIGINT      | **Foreign Key** → `vtm.vtmid` (optional)      |
| `nm`              | TEXT        | Product name                                  |
| `abbrevnm`        | TEXT        | Abbreviated name                              |
| `basiscd`         | VARCHAR(10) | → `lookup_basis_of_name`                      |
| `nmdt`            | DATE        | Name change date                              |
| `nmprev`          | TEXT        | Previous name                                 |
| `basis_prevcd`    | VARCHAR(10) | Previous basis code                           |
| `nmchangecd`      | VARCHAR(10) | → `lookup_namechange_reason`                  |
| `combprodcd`      | VARCHAR(10) | → `lookup_combination_prod_ind`               |
| `pres_statcd`     | VARCHAR(10) | → `lookup_virtual_product_pres_status`        |
| `sug_f`           | INTEGER     | Sugar-free flag (1=yes)                       |
| `glu_f`           | INTEGER     | Gluten-free flag (1=yes)                      |
| `pres_f`          | INTEGER     | Preservative-free flag (1=yes)                |
| `cfc_f`           | INTEGER     | CFC-free flag (1=yes)                         |
| `non_availcd`     | VARCHAR(10) | → `lookup_non_avail_reason`                   |
| `non_availdt`     | DATE        | Non-availability date                         |
| `df_indcd`        | VARCHAR(10) | → `lookup_df_indicator`                       |
| `udfs`            | DECIMAL     | Unit dose form strength                       |
| `udfs_uomcd`      | BIGINT      | → `lookup_unit_of_measure`                    |
| `unit_dose_uomcd` | BIGINT      | → `lookup_unit_of_measure`                    |
| `invalid`         | INTEGER     | 1 if retired/invalid                          |

**Example:** "Paracetamol 500mg tablets"

---

### `vmpp` (Virtual Medicinal Product Pack)

**Generic pack size**

| Column       | Type        | Description                               |
| ------------ | ----------- | ----------------------------------------- |
| `vppid`      | BIGINT      | **Primary Key** - Virtual Product Pack ID |
| `vpid`       | BIGINT      | **Foreign Key** → `vmp.vpid`              |
| `nm`         | TEXT        | Pack name                                 |
| `qtyval`     | DECIMAL     | Quantity value                            |
| `qty_uomcd`  | BIGINT      | → `lookup_unit_of_measure`                |
| `combpackcd` | VARCHAR(10) | → `lookup_combination_pack_ind`           |
| `invalid`    | INTEGER     | 1 if retired/invalid                      |

**Example:** "Paracetamol 500mg tablets x 16 tablet"

---

### `amp` (Actual Medicinal Product)

**Branded/trade name product**

| Column             | Type        | Description                                  |
| ------------------ | ----------- | -------------------------------------------- |
| `apid`             | BIGINT      | **Primary Key** - Actual Product ID (SNOMED) |
| `vpid`             | BIGINT      | **Foreign Key** → `vmp.vpid`                 |
| `nm`               | TEXT        | Brand name                                   |
| `abbrevnm`         | TEXT        | Abbreviated name                             |
| `desc`             | TEXT        | Description                                  |
| `suppcd`           | BIGINT      | → `lookup_supplier`                          |
| `lic_authcd`       | VARCHAR(10) | → `lookup_licensing_authority`               |
| `combprodcd`       | VARCHAR(10) | → `lookup_combination_prod_ind`              |
| `flavourcd`        | BIGINT      | → `lookup_flavour`                           |
| `ema`              | INTEGER     | EMA authorised flag                          |
| `parallel_import`  | INTEGER     | Parallel import flag                         |
| `avail_restrictcd` | VARCHAR(10) | → `lookup_availability_restriction`          |
| `invalid`          | INTEGER     | 1 if retired/invalid                         |

**Example:** "Panadol 500mg tablets" (GSK brand of Paracetamol 500mg tablets)

---

### `ampp` (Actual Medicinal Product Pack)

**Branded pack - the most specific level, what you actually buy**

| Column        | Type        | Description                              |
| ------------- | ----------- | ---------------------------------------- |
| `appid`       | BIGINT      | **Primary Key** - Actual Product Pack ID |
| `vppid`       | BIGINT      | **Foreign Key** → `vmpp.vppid`           |
| `apid`        | BIGINT      | **Foreign Key** → `amp.apid`             |
| `nm`          | TEXT        | Full pack name                           |
| `abbrevnm`    | TEXT        | Abbreviated name                         |
| `combpackcd`  | VARCHAR(10) | → `lookup_combination_pack_ind`          |
| `legal_catcd` | VARCHAR(10) | → `lookup_legal_category`                |
| `subp`        | TEXT        | Sub-pack info                            |
| `disccd`      | VARCHAR(10) | → `lookup_discontinued_ind`              |
| `discdt`      | DATE        | Discontinued date                        |
| `invalid`     | INTEGER     | 1 if retired/invalid                     |

**Example:** "Panadol 500mg tablets x 16 tablet"

---

## Junction / Association Tables

These tables handle many-to-many relationships and additional attributes.

### `vmp_ingredient`

**Links VMPs to their ingredients with strength information**

| Column              | Type        | Description                         |
| ------------------- | ----------- | ----------------------------------- |
| `vpid`              | BIGINT      | **Foreign Key** → `vmp.vpid`        |
| `isid`              | BIGINT      | **Foreign Key** → `ingredient.isid` |
| `basis_strntcd`     | VARCHAR(10) | → `lookup_basis_of_strength`        |
| `bs_subid`          | BIGINT      | Basis substance ID (if different)   |
| `strnt_nmrtr_val`   | DECIMAL     | Strength numerator (e.g., 500)      |
| `strnt_nmrtr_uomcd` | BIGINT      | Numerator unit (e.g., mg)           |
| `strnt_dnmtr_val`   | DECIMAL     | Strength denominator (e.g., 5)      |
| `strnt_dnmtr_uomcd` | BIGINT      | Denominator unit (e.g., ml)         |

### `vmp_drug_form`

**Links VMPs to drug forms** (VMP → `lookup_form`)

### `vmp_ont_drug_form`

**Links VMPs to DM+D ontology forms** (VMP → `lookup_ont_form_route`)

### `vmp_drug_route`

**Links VMPs to administration routes** (VMP → `lookup_route`)

### `vmp_control_drug_info`

**Controlled drug information for VMPs**

| Column       | Type        | Description                      |
| ------------ | ----------- | -------------------------------- |
| `vpid`       | BIGINT      | **Foreign Key** → `vmp.vpid`     |
| `catcd`      | VARCHAR(10) | → `lookup_control_drug_category` |
| `catdt`      | DATE        | Category effective date          |
| `cat_prevcd` | VARCHAR(10) | Previous category                |

### `amp_ingredient`

**Links AMPs to ingredients with actual strength**

### `amp_licensed_route`

**Links AMPs to licensed administration routes**

### `amp_info`

**Additional AMP information (for appliances)**

---

## AMPP Detail Tables

These provide additional information about packs (AMPP level):

### `ampp_pack_info`

**Pack-level reimbursement and ordering info**

| Column          | Description          |
| --------------- | -------------------- |
| `reimb_statcd`  | Reimbursement status |
| `pack_order_no` | Pack order number    |

### `ampp_prescrib_info`

**Prescribing flags**

| Column    | Description                                        |
| --------- | -------------------------------------------------- |
| `sched_1` | Schedule 1 controlled drug                         |
| `sched_2` | Schedule 2 controlled drug                         |
| `acbs`    | ACBS (Advisory Committee on Borderline Substances) |
| `nurse_f` | Can be prescribed by nurses                        |
| `dent_f`  | Can be prescribed by dentists                      |

### `ampp_price_info`

**NHS pricing**

| Column          | Description              |
| --------------- | ------------------------ |
| `price`         | Price in pence           |
| `pricedt`       | Price effective date     |
| `price_basiscd` | How price was determined |

### `ampp_reimb_info`

**Reimbursement details**

| Column        | Description            |
| ------------- | ---------------------- |
| `px_chrgs`    | Prescription charges   |
| `disp_fees`   | Dispensing fees        |
| `bb`          | Broken bulk allowed    |
| `spec_contcd` | Special container code |

### `ampp_comb_content`

**Parent-child relationships for combination packs**

| Column      | Description    |
| ----------- | -------------- |
| `prntappid` | Parent AMPP ID |
| `chldappid` | Child AMPP ID  |

### `ampp_gtin`

**Global Trade Item Numbers (barcodes)**

| Column              | Description           |
| ------------------- | --------------------- |
| `appid`             | AMPP ID               |
| `gtin`              | 14-digit GTIN barcode |
| `startdt` / `enddt` | Validity period       |

---

## Entity Relationship Diagram

```
                                    ┌──────────────┐
                                    │  INGREDIENT  │
                                    │    (isid)    │
                                    └──────┬───────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
              ▼                            ▼                            ▼
    ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
    │ vmp_ingredient  │          │ amp_ingredient  │          │                 │
    │ (vpid, isid)    │          │ (apid, isid)    │          │                 │
    └────────┬────────┘          └────────┬────────┘          │                 │
             │                            │                    │                 │
             │                            │                    │                 │
             ▼                            ▼                    │                 │
    ┌─────────────────┐          ┌─────────────────┐          │                 │
    │      VTM        │◄─────────│      VMP        │          │    LOOKUPS      │
    │    (vtmid)      │  vtmid   │     (vpid)      │          │                 │
    └─────────────────┘          └────────┬────────┘          │  - form         │
                                          │                    │  - route        │
                    ┌─────────────────────┼──────────────────┐│  - supplier     │
                    │                     │                  ││  - legal_cat    │
                    ▼                     ▼                  ││  - etc...       │
           ┌─────────────────┐   ┌─────────────────┐         │└─────────────────┘
           │      VMPP       │   │      AMP        │         │
           │    (vppid)      │   │     (apid)      │◄────────┘
           └────────┬────────┘   └────────┬────────┘
                    │                     │
                    │     ┌───────────────┘
                    │     │
                    ▼     ▼
           ┌─────────────────┐
           │      AMPP       │──────┬──────┬──────┬──────┐
           │    (appid)      │      │      │      │      │
           └─────────────────┘      ▼      ▼      ▼      ▼
                              ┌─────────────────────────────┐
                              │    AMPP Detail Tables:      │
                              │  - ampp_pack_info           │
                              │  - ampp_prescrib_info       │
                              │  - ampp_price_info          │
                              │  - ampp_reimb_info          │
                              │  - ampp_gtin                │
                              │  - ampp_comb_content        │
                              └─────────────────────────────┘
```

---

## Useful Views

### `v_product_full`

Joins AMPP → AMP → VMP → VTM → VMPP with pricing and supplier information. Returns all active products with their full hierarchy.

### `v_vmp_with_ingredients`

Shows VMPs with their ingredients, strengths, and forms. Useful for searching by active ingredient.

---

## Metadata

### `dmd_import_log`

Tracks data import runs:

| Column                | Description                           |
| --------------------- | ------------------------------------- |
| `release_version`     | dm+d release version (e.g., "12.1.0") |
| `release_date`        | When NHS released this version        |
| `import_started_at`   | Import start timestamp                |
| `import_completed_at` | Import completion timestamp           |
| `status`              | running / completed / failed          |
| `rows_imported`       | JSON object with counts per table     |

---

## Common Queries

### Find all products containing Paracetamol:

```sql
SELECT vmp.nm, amp.nm, ampp.nm, api.price/100.0 as price_gbp
FROM vmp
JOIN vmp_ingredient vi ON vmp.vpid = vi.vpid
JOIN ingredient i ON vi.isid = i.isid
JOIN amp ON amp.vpid = vmp.vpid
JOIN ampp ON ampp.apid = amp.apid
LEFT JOIN ampp_price_info api ON ampp.appid = api.appid
WHERE i.nm ILIKE '%paracetamol%'
AND vmp.invalid = 0 AND amp.invalid = 0 AND ampp.invalid = 0;
```

### Find cheapest generic for a VTM:

```sql
SELECT vtm.nm, vmp.nm, ampp.nm, api.price/100.0 as price_gbp
FROM vtm
JOIN vmp ON vmp.vtmid = vtm.vtmid
JOIN vmpp ON vmpp.vpid = vmp.vpid
JOIN ampp ON ampp.vppid = vmpp.vppid
JOIN ampp_price_info api ON ampp.appid = api.appid
WHERE vtm.nm = 'Paracetamol'
AND vmp.invalid = 0 AND ampp.invalid = 0
ORDER BY api.price ASC
LIMIT 10;
```

### List all controlled drugs:

```sql
SELECT vmp.nm, lcd.description as category
FROM vmp
JOIN vmp_control_drug_info cdi ON vmp.vpid = cdi.vpid
JOIN lookup_control_drug_category lcd ON cdi.catcd = lcd.cd
WHERE vmp.invalid = 0
ORDER BY lcd.description, vmp.nm;
```
