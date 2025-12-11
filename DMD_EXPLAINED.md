# Understanding NHS dm+d Data - A Complete Guide

## The Big Picture

Think of dm+d like a family tree for medicines:

```
                    INGREDIENT (e.g., "Paracetamol" the substance)
                         │
                         ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                              VTM                                           │
│                   "Paracetamol"                                            │
│         (The therapeutic concept - no strength/form)                       │
└────────────────────────────────────────────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│     VMP      │  │     VMP      │  │     VMP      │
│ Paracetamol  │  │ Paracetamol  │  │ Paracetamol  │
│ 500mg tabs   │  │ 250mg/5ml    │  │ 120mg/5ml    │
│              │  │ oral soln    │  │ oral susp    │
└──────┬───────┘  └──────────────┘  └──────────────┘
       │
       │ (One VMP can have many branded versions)
       │
       ├──────────────────┬──────────────────┐
       ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│     AMP      │   │     AMP      │   │     AMP      │
│   Panadol    │   │   Calpol     │   │  Boots own   │
│ 500mg tabs   │   │ 500mg tabs   │   │ Paracetamol  │
│    (GSK)     │   │  (J&J)       │   │  500mg tabs  │
└──────┬───────┘   └──────────────┘   └──────────────┘
       │
       │ (One AMP can come in different pack sizes)
       │
       ├──────────────────┬──────────────────┐
       ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│    AMPP      │   │    AMPP      │   │    AMPP      │
│   Panadol    │   │   Panadol    │   │   Panadol    │
│  500mg tabs  │   │  500mg tabs  │   │  500mg tabs  │
│   x 16       │   │   x 32       │   │   x 100      │
│  £2.49       │   │  £4.29       │   │  £8.99       │
└──────────────┘   └──────────────┘   └──────────────┘
```

---

## The 5 Core Tables (What You Need to Know)

### 1. `ingredient` - The Active Substances

What the drug actually IS at a chemical level.

- Example: "Paracetamol", "Ibuprofen", "Amoxicillin"

### 2. `vtm` - Virtual Therapeutic Moiety

The prescribing concept WITHOUT strength or form.

- Example: "Paracetamol" (could be any strength, any form)
- **Use case:** "I want to prescribe paracetamol" (generic)

### 3. `vmp` - Virtual Medicinal Product

Generic product WITH specific strength and form.

- Example: "Paracetamol 500mg tablets"
- **Use case:** "Prescribe Paracetamol 500mg tablets" (any brand)

### 4. `amp` - Actual Medicinal Product ⭐ **YOUR MAIN FOCUS**

The BRANDED product with strength and form.

- Example: "Panadol 500mg tablets" (GSK's brand)
- **Use case:** "Prescribe this specific branded product"

### 5. `ampp` - Actual Medicinal Product Pack

The specific pack you dispense/buy.

- Example: "Panadol 500mg tablets x 16" with price £2.49
- **Use case:** "Dispense this exact pack, bill this price"

---

## How Lookup Tables Work

Lookup tables are **dictionaries** that translate codes to human-readable text.

### Example: Legal Category

In the `ampp` table, you see:

```
legal_catcd = "0001"
```

That code means nothing to humans. So you JOIN to the lookup:

```sql
SELECT ampp.nm, lc.description as legal_category
FROM ampp
JOIN lookup_legal_category lc ON ampp.legal_catcd = lc.cd
```

Result:

```
nm                          | legal_category
Panadol 500mg tablets x 16  | POM (Prescription Only Medicine)
```

### Common Lookups You'll Use:

| Code Column   | Lookup Table                         | What It Tells You         |
| ------------- | ------------------------------------ | ------------------------- |
| `legal_catcd` | `lookup_legal_category`              | POM, P, GSL               |
| `suppcd`      | `lookup_supplier`                    | Manufacturer name         |
| `formcd`      | `lookup_form`                        | Tablet, Capsule, Solution |
| `routecd`     | `lookup_route`                       | Oral, IV, Topical         |
| `catcd`       | `lookup_control_drug_category`       | CD Schedule 2, 3, etc.    |
| `pres_statcd` | `lookup_virtual_product_pres_status` | Valid for prescribing?    |

---

## The Complete Join Path

Here's how EVERYTHING connects:

```
LOOKUP TABLES (dictionaries)
     │
     │ (translate codes → descriptions)
     │
     ▼
┌─────────────┐      ┌─────────────┐
│ ingredient  │◄─────┤vmp_ingredient│ (VMP contains these ingredients)
└─────────────┘      └──────┬──────┘
                            │
┌─────────────┐      ┌──────┴──────┐      ┌─────────────┐
│    vtm      │◄─────┤     vmp     ├─────►│vmp_drug_form│──► lookup_form
└─────────────┘      └──────┬──────┘      └─────────────┘
                            │
                     ┌──────┴──────┐      ┌─────────────┐
                     │vmp_drug_route├────►│lookup_route │
                     └─────────────┘      └─────────────┘
                            │
                            │
                     ┌──────┴──────┐
                     │    vmpp     │ (generic packs)
                     └──────┬──────┘
                            │
┌─────────────┐      ┌──────┴──────┐      ┌─────────────┐
│lookup_supplier◄────┤     amp     ├─────►│amp_ingredient│──► ingredient
└─────────────┘      └──────┬──────┘      └─────────────┘
                            │
                     ┌──────┴──────┐
                     │    ampp     │ (branded packs)
                     └──────┬──────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
   │ampp_price   │   │ampp_prescrib│   │ampp_reimb   │
   │   _info     │   │    _info    │   │   _info     │
   │  (£2.49)    │   │(nurse ok?)  │   │(NHS tariff) │
   └─────────────┘   └─────────────┘   └─────────────┘
```

---

## For Prescribing: What Level Do You Need?

| If you want to...                                 | Use this level |
| ------------------------------------------------- | -------------- |
| "Prescribe paracetamol (any form/strength)"       | VTM            |
| "Prescribe Paracetamol 500mg tablets (any brand)" | VMP            |
| "Prescribe Panadol specifically"                  | AMP ⭐         |
| "Know the exact pack size and price"              | AMPP           |

**For most prescribing systems, you work at the AMP level** because:

- You need to know the specific product
- You need ingredient info for interactions/allergies
- You don't always care about pack size (pharmacy handles that)

---

## Example Query: Everything About an AMP

```sql
-- Get full prescribing info for "Panadol 500mg tablets"
SELECT
    amp.apid,
    amp.nm AS product_name,
    vmp.nm AS generic_name,
    vtm.nm AS therapeutic_moiety,
    i.nm AS ingredient,
    vi.strnt_nmrtr_val || ' ' || uom.description AS strength,
    lf.description AS form,
    lr.description AS route,
    ls.description AS supplier,
    lcd.description AS controlled_drug_category,
    lps.description AS prescribing_status
FROM amp
JOIN vmp ON amp.vpid = vmp.vpid
LEFT JOIN vtm ON vmp.vtmid = vtm.vtmid
LEFT JOIN vmp_ingredient vi ON vmp.vpid = vi.vpid
LEFT JOIN ingredient i ON vi.isid = i.isid
LEFT JOIN lookup_unit_of_measure uom ON vi.strnt_nmrtr_uomcd = uom.cd
LEFT JOIN vmp_drug_form vdf ON vmp.vpid = vdf.vpid
LEFT JOIN lookup_form lf ON vdf.formcd = lf.cd
LEFT JOIN vmp_drug_route vdr ON vmp.vpid = vdr.vpid
LEFT JOIN lookup_route lr ON vdr.routecd = lr.cd
LEFT JOIN lookup_supplier ls ON amp.suppcd = ls.cd
LEFT JOIN vmp_control_drug_info vcdi ON vmp.vpid = vcdi.vpid
LEFT JOIN lookup_control_drug_category lcd ON vcdi.catcd = lcd.cd
LEFT JOIN lookup_virtual_product_pres_status lps ON vmp.pres_statcd = lps.cd
WHERE amp.nm ILIKE '%panadol%'
AND amp.invalid = 0;
```

---

## Summary Table: What's Where

| Info You Need         | Table(s)                     | How to Get It                     |
| --------------------- | ---------------------------- | --------------------------------- |
| Product name          | amp.nm                       | Direct                            |
| Generic equivalent    | vmp.nm                       | JOIN vmp ON amp.vpid = vmp.vpid   |
| Therapeutic class     | vtm.nm                       | JOIN vtm ON vmp.vtmid = vtm.vtmid |
| Ingredients           | ingredient.nm                | via vmp_ingredient                |
| Strength              | vmp*ingredient.strnt*\*      | JOIN with lookup_unit_of_measure  |
| Form (tablet/capsule) | lookup_form.description      | via vmp_drug_form                 |
| Route (oral/IV)       | lookup_route.description     | via vmp_drug_route                |
| Supplier/manufacturer | lookup_supplier.description  | JOIN ON amp.suppcd                |
| Controlled drug info  | lookup_control_drug_category | via vmp_control_drug_info         |
| Legal category        | lookup_legal_category        | via ampp.legal_catcd              |
| Price                 | ampp_price_info.price        | JOIN via ampp                     |
| Pack size             | vmpp.qtyval                  | JOIN via ampp → vmpp              |
| Can nurse prescribe?  | ampp_prescrib_info.nurse_f   | JOIN via ampp                     |
| Sugar-free?           | vmp.sug_f                    | Direct on VMP                     |
| Gluten-free?          | vmp.glu_f                    | Direct on VMP                     |
