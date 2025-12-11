-- ============================================================================
-- NHS dm+d (Dictionary of Medicines and Devices) Database Schema
-- For Supabase PostgreSQL
-- ============================================================================
-- Run this in Supabase SQL Editor to create all tables
-- Tables are created in dependency order (lookups first, then main entities)
-- ============================================================================

-- ============================================================================
-- LOOKUP TABLES
-- These store reference data with code + description
-- ============================================================================

-- Basis of Name (how the drug name was derived)
CREATE TABLE IF NOT EXISTS lookup_basis_of_name (
    cd VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL
);

-- Name Change Reason
CREATE TABLE IF NOT EXISTS lookup_namechange_reason (
    cd VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL
);

-- Virtual Product Prescribing Status
CREATE TABLE IF NOT EXISTS lookup_virtual_product_pres_status (
    cd VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL
);

-- Controlled Drug Category
CREATE TABLE IF NOT EXISTS lookup_control_drug_category (
    cd VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL
);

-- Licensing Authority
CREATE TABLE IF NOT EXISTS lookup_licensing_authority (
    cd VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL
);

-- Unit of Measure (SNOMED-based codes)
CREATE TABLE IF NOT EXISTS lookup_unit_of_measure (
    cd BIGINT PRIMARY KEY,
    cddt DATE,
    cdprev BIGINT,
    description TEXT NOT NULL
);

-- Drug Form (tablet, capsule, etc.)
CREATE TABLE IF NOT EXISTS lookup_form (
    cd BIGINT PRIMARY KEY,
    cddt DATE,
    cdprev BIGINT,
    description TEXT NOT NULL
);

-- Route of Administration
CREATE TABLE IF NOT EXISTS lookup_route (
    cd BIGINT PRIMARY KEY,
    cddt DATE,
    cdprev BIGINT,
    description TEXT NOT NULL
);

-- Supplier (pharmaceutical companies)
CREATE TABLE IF NOT EXISTS lookup_supplier (
    cd BIGINT PRIMARY KEY,
    cddt DATE,
    cdprev BIGINT,
    description TEXT NOT NULL,
    invalid INTEGER
);

-- Combination Pack Indicator
CREATE TABLE IF NOT EXISTS lookup_combination_pack_ind (
    cd VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL
);

-- Combination Product Indicator
CREATE TABLE IF NOT EXISTS lookup_combination_prod_ind (
    cd VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL
);

-- Availability Restriction
CREATE TABLE IF NOT EXISTS lookup_availability_restriction (
    cd VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL
);

-- Legal Category (POM, P, GSL, etc.)
CREATE TABLE IF NOT EXISTS lookup_legal_category (
    cd VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL
);

-- Discontinued Indicator
CREATE TABLE IF NOT EXISTS lookup_discontinued_ind (
    cd VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL
);

-- Dose Form Indicator
CREATE TABLE IF NOT EXISTS lookup_df_indicator (
    cd VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL
);

-- Reimbursement Status
CREATE TABLE IF NOT EXISTS lookup_reimbursement_status (
    cd VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL
);

-- Price Basis
CREATE TABLE IF NOT EXISTS lookup_price_basis (
    cd VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL
);

-- Special Container
CREATE TABLE IF NOT EXISTS lookup_special_container (
    cd VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL
);

-- Flavour
CREATE TABLE IF NOT EXISTS lookup_flavour (
    cd BIGINT PRIMARY KEY,
    description TEXT NOT NULL
);

-- Colour
CREATE TABLE IF NOT EXISTS lookup_colour (
    cd BIGINT PRIMARY KEY,
    description TEXT NOT NULL
);

-- Basis of Strength
CREATE TABLE IF NOT EXISTS lookup_basis_of_strength (
    cd VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL
);

-- Non-Availability Reason
CREATE TABLE IF NOT EXISTS lookup_non_avail_reason (
    cd VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL
);

-- Ontology Form & Route (DM+D specific ontology)
CREATE TABLE IF NOT EXISTS lookup_ont_form_route (
    cd BIGINT PRIMARY KEY,
    description TEXT NOT NULL
);

-- ============================================================================
-- CORE ENTITY TABLES
-- ============================================================================

-- INGREDIENT - Active pharmaceutical ingredients
CREATE TABLE IF NOT EXISTS ingredient (
    isid BIGINT PRIMARY KEY,           -- Ingredient Substance ID (SNOMED)
    isidprev BIGINT,                   -- Previous ISID
    isiddt DATE,                       -- Date of ID change
    nm TEXT NOT NULL,                  -- Name
    invalid INTEGER DEFAULT 0,         -- 1 if invalid/retired
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingredient_nm ON ingredient(nm);
CREATE INDEX IF NOT EXISTS idx_ingredient_invalid ON ingredient(invalid);

-- VTM - Virtual Therapeutic Moiety (top-level generic concept)
CREATE TABLE IF NOT EXISTS vtm (
    vtmid BIGINT PRIMARY KEY,          -- VTM ID (SNOMED)
    vtmidprev BIGINT,                  -- Previous VTMID
    vtmiddt DATE,                      -- Date of ID change
    nm TEXT NOT NULL,                  -- Name
    abbrevnm TEXT,                     -- Abbreviated name
    invalid INTEGER DEFAULT 0,         -- 1 if invalid/retired
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vtm_nm ON vtm(nm);
CREATE INDEX IF NOT EXISTS idx_vtm_invalid ON vtm(invalid);

-- VMP - Virtual Medicinal Product (generic product with strength/form)
CREATE TABLE IF NOT EXISTS vmp (
    vpid BIGINT PRIMARY KEY,           -- Virtual Product ID (SNOMED)
    vpidprev BIGINT,                   -- Previous VPID
    vpiddt DATE,                       -- Date of ID change
    vtmid BIGINT REFERENCES vtm(vtmid),-- Link to VTM (optional - some VMPs have no VTM)
    nm TEXT NOT NULL,                  -- Name
    abbrevnm TEXT,                     -- Abbreviated name
    basiscd VARCHAR(10),               -- Basis of name code
    nmdt DATE,                         -- Name change date
    nmprev TEXT,                       -- Previous name
    basis_prevcd VARCHAR(10),          -- Previous basis code
    nmchangecd VARCHAR(10),            -- Name change reason code
    combprodcd VARCHAR(10),            -- Combination product code
    pres_statcd VARCHAR(10) NOT NULL,  -- Prescribing status code
    sug_f INTEGER,                     -- Sugar-free flag (1=yes)
    glu_f INTEGER,                     -- Gluten-free flag (1=yes)
    pres_f INTEGER,                    -- Preservative-free flag (1=yes)
    cfc_f INTEGER,                     -- CFC-free flag (1=yes)
    non_availcd VARCHAR(10),           -- Non-availability code
    non_availdt DATE,                  -- Non-availability date
    df_indcd VARCHAR(10),              -- Dose form indicator code
    udfs DECIMAL(15,4),                -- Unit dose form strength
    udfs_uomcd BIGINT,                 -- UDFS unit of measure code
    unit_dose_uomcd BIGINT,            -- Unit dose unit of measure code
    invalid INTEGER DEFAULT 0,         -- 1 if invalid/retired
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vmp_vtmid ON vmp(vtmid);
CREATE INDEX IF NOT EXISTS idx_vmp_nm ON vmp(nm);
CREATE INDEX IF NOT EXISTS idx_vmp_pres_statcd ON vmp(pres_statcd);
CREATE INDEX IF NOT EXISTS idx_vmp_invalid ON vmp(invalid);

-- VPI - Virtual Product Ingredient (junction: VMP to Ingredient with strength)
CREATE TABLE IF NOT EXISTS vmp_ingredient (
    id SERIAL PRIMARY KEY,
    vpid BIGINT NOT NULL REFERENCES vmp(vpid) ON DELETE CASCADE,
    isid BIGINT NOT NULL REFERENCES ingredient(isid),
    basis_strntcd VARCHAR(10),         -- Basis of strength code
    bs_subid BIGINT,                   -- Basis substance ID (if different from ingredient)
    strnt_nmrtr_val DECIMAL(15,6),     -- Strength numerator value
    strnt_nmrtr_uomcd BIGINT,          -- Strength numerator UOM
    strnt_dnmtr_val DECIMAL(15,6),     -- Strength denominator value
    strnt_dnmtr_uomcd BIGINT,          -- Strength denominator UOM
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vpid, isid)
);

CREATE INDEX IF NOT EXISTS idx_vmp_ingredient_vpid ON vmp_ingredient(vpid);
CREATE INDEX IF NOT EXISTS idx_vmp_ingredient_isid ON vmp_ingredient(isid);

-- VMP Drug Form (junction: VMP to Form)
CREATE TABLE IF NOT EXISTS vmp_drug_form (
    id SERIAL PRIMARY KEY,
    vpid BIGINT NOT NULL REFERENCES vmp(vpid) ON DELETE CASCADE,
    formcd BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vpid, formcd)
);

CREATE INDEX IF NOT EXISTS idx_vmp_drug_form_vpid ON vmp_drug_form(vpid);

-- VMP Ontology Drug Form (DM+D ontology classification)
CREATE TABLE IF NOT EXISTS vmp_ont_drug_form (
    id SERIAL PRIMARY KEY,
    vpid BIGINT NOT NULL REFERENCES vmp(vpid) ON DELETE CASCADE,
    formcd BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vpid, formcd)
);

CREATE INDEX IF NOT EXISTS idx_vmp_ont_drug_form_vpid ON vmp_ont_drug_form(vpid);

-- VMP Drug Route (junction: VMP to Route)
CREATE TABLE IF NOT EXISTS vmp_drug_route (
    id SERIAL PRIMARY KEY,
    vpid BIGINT NOT NULL REFERENCES vmp(vpid) ON DELETE CASCADE,
    routecd BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vpid, routecd)
);

CREATE INDEX IF NOT EXISTS idx_vmp_drug_route_vpid ON vmp_drug_route(vpid);

-- VMP Controlled Drug Info
CREATE TABLE IF NOT EXISTS vmp_control_drug_info (
    id SERIAL PRIMARY KEY,
    vpid BIGINT NOT NULL REFERENCES vmp(vpid) ON DELETE CASCADE,
    catcd VARCHAR(10) NOT NULL,        -- Control drug category code
    catdt DATE,                        -- Category date
    cat_prevcd VARCHAR(10),            -- Previous category code
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vpid)
);

CREATE INDEX IF NOT EXISTS idx_vmp_control_drug_info_vpid ON vmp_control_drug_info(vpid);

-- VMPP - Virtual Medicinal Product Pack (generic pack)
CREATE TABLE IF NOT EXISTS vmpp (
    vppid BIGINT PRIMARY KEY,          -- Virtual Product Pack ID (SNOMED)
    vpid BIGINT NOT NULL REFERENCES vmp(vpid),
    nm TEXT NOT NULL,                  -- Name
    qtyval DECIMAL(15,4),              -- Quantity value
    qty_uomcd BIGINT,                  -- Quantity unit of measure
    combpackcd VARCHAR(10),            -- Combination pack code
    invalid INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vmpp_vpid ON vmpp(vpid);
CREATE INDEX IF NOT EXISTS idx_vmpp_nm ON vmpp(nm);

-- AMP - Actual Medicinal Product (branded product)
CREATE TABLE IF NOT EXISTS amp (
    apid BIGINT PRIMARY KEY,           -- Actual Product ID (SNOMED)
    vpid BIGINT NOT NULL REFERENCES vmp(vpid),
    nm TEXT NOT NULL,                  -- Name
    abbrevnm TEXT,                     -- Abbreviated name
    "desc" TEXT,                       -- Description (quoted as reserved word)
    nmdt DATE,                         -- Name change date
    nm_prev TEXT,                      -- Previous name
    suppcd BIGINT,                     -- Supplier code
    lic_authcd VARCHAR(10),            -- Licensing authority code
    lic_auth_prevcd VARCHAR(10),       -- Previous licensing authority
    lic_authchangecd VARCHAR(10),      -- License change code
    lic_authchangedt DATE,             -- License change date
    combprodcd VARCHAR(10),            -- Combination product code
    flavourcd BIGINT,                  -- Flavour code
    ema INTEGER,                       -- EMA flag
    parallel_import INTEGER,           -- Parallel import flag
    avail_restrictcd VARCHAR(10),      -- Availability restriction code
    invalid INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_amp_vpid ON amp(vpid);
CREATE INDEX IF NOT EXISTS idx_amp_nm ON amp(nm);
CREATE INDEX IF NOT EXISTS idx_amp_suppcd ON amp(suppcd);
CREATE INDEX IF NOT EXISTS idx_amp_invalid ON amp(invalid);

-- AMP Ingredient (junction: AMP to Ingredient with strength)
CREATE TABLE IF NOT EXISTS amp_ingredient (
    id SERIAL PRIMARY KEY,
    apid BIGINT NOT NULL REFERENCES amp(apid) ON DELETE CASCADE,
    isid BIGINT NOT NULL REFERENCES ingredient(isid),
    strnth DECIMAL(15,6),              -- Strength
    uomcd BIGINT,                      -- Unit of measure code
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(apid, isid)
);

CREATE INDEX IF NOT EXISTS idx_amp_ingredient_apid ON amp_ingredient(apid);
CREATE INDEX IF NOT EXISTS idx_amp_ingredient_isid ON amp_ingredient(isid);

-- AMP Licensed Route
CREATE TABLE IF NOT EXISTS amp_licensed_route (
    id SERIAL PRIMARY KEY,
    apid BIGINT NOT NULL REFERENCES amp(apid) ON DELETE CASCADE,
    routecd BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(apid, routecd)
);

CREATE INDEX IF NOT EXISTS idx_amp_licensed_route_apid ON amp_licensed_route(apid);

-- AMP Product Information (appliance-specific)
CREATE TABLE IF NOT EXISTS amp_info (
    apid BIGINT PRIMARY KEY REFERENCES amp(apid) ON DELETE CASCADE,
    sz_weight TEXT,                    -- Size/weight
    colourcd BIGINT,                   -- Colour code
    prod_order_no TEXT,                -- Product order number
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AMPP - Actual Medicinal Product Pack (branded pack)
CREATE TABLE IF NOT EXISTS ampp (
    appid BIGINT PRIMARY KEY,          -- Actual Product Pack ID (SNOMED)
    vppid BIGINT NOT NULL REFERENCES vmpp(vppid),
    apid BIGINT NOT NULL REFERENCES amp(apid),
    nm TEXT NOT NULL,                  -- Name
    abbrevnm TEXT,                     -- Abbreviated name
    combpackcd VARCHAR(10),            -- Combination pack code
    legal_catcd VARCHAR(10),           -- Legal category code
    subp TEXT,                         -- Sub-pack info
    disccd VARCHAR(10),                -- Discontinued code
    discdt DATE,                       -- Discontinued date
    invalid INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ampp_vppid ON ampp(vppid);
CREATE INDEX IF NOT EXISTS idx_ampp_apid ON ampp(apid);
CREATE INDEX IF NOT EXISTS idx_ampp_nm ON ampp(nm);
CREATE INDEX IF NOT EXISTS idx_ampp_disccd ON ampp(disccd);

-- AMPP Pack Info (appliance pack info)
CREATE TABLE IF NOT EXISTS ampp_pack_info (
    appid BIGINT PRIMARY KEY REFERENCES ampp(appid) ON DELETE CASCADE,
    reimb_statcd VARCHAR(10),          -- Reimbursement status code
    reimb_statdt DATE,                 -- Reimbursement status date
    reimb_statprevcd VARCHAR(10),      -- Previous reimbursement status
    pack_order_no TEXT,                -- Pack order number
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AMPP Prescribing Info
CREATE TABLE IF NOT EXISTS ampp_prescrib_info (
    appid BIGINT PRIMARY KEY REFERENCES ampp(appid) ON DELETE CASCADE,
    sched_2 INTEGER,                   -- Schedule 2 flag
    acbs INTEGER,                      -- ACBS flag
    padm INTEGER,                      -- PADM flag
    fp10_mda INTEGER,                  -- FP10 MDA flag
    sched_1 INTEGER,                   -- Schedule 1 flag
    hosp INTEGER,                      -- Hospital flag
    nurse_f INTEGER,                   -- Nurse prescribing flag
    enurse_f INTEGER,                  -- Extended nurse prescribing flag
    dent_f INTEGER,                    -- Dentist prescribing flag
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AMPP Price Info
CREATE TABLE IF NOT EXISTS ampp_price_info (
    appid BIGINT PRIMARY KEY REFERENCES ampp(appid) ON DELETE CASCADE,
    price INTEGER,                     -- Price in pence
    pricedt DATE,                      -- Price date
    price_prev INTEGER,                -- Previous price
    price_basiscd VARCHAR(10),         -- Price basis code
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AMPP Reimbursement Info
CREATE TABLE IF NOT EXISTS ampp_reimb_info (
    appid BIGINT PRIMARY KEY REFERENCES ampp(appid) ON DELETE CASCADE,
    px_chrgs INTEGER,                  -- Prescription charges
    disp_fees INTEGER,                 -- Dispensing fees
    bb INTEGER,                        -- Broken bulk flag
    ltd_stab INTEGER,                  -- Limited stability flag
    cal_pack INTEGER,                  -- Calendar pack flag
    spec_contcd VARCHAR(10),           -- Special container code
    dnd INTEGER,                       -- DND (Do Not Dispense) flag
    fp34d INTEGER,                     -- FP34D flag
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AMPP Combination Content (parent-child pack relationships)
CREATE TABLE IF NOT EXISTS ampp_comb_content (
    id SERIAL PRIMARY KEY,
    prntappid BIGINT NOT NULL REFERENCES ampp(appid) ON DELETE CASCADE,
    chldappid BIGINT NOT NULL REFERENCES ampp(appid),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(prntappid, chldappid)
);

CREATE INDEX IF NOT EXISTS idx_ampp_comb_content_prntappid ON ampp_comb_content(prntappid);

-- ============================================================================
-- GTIN DATA (from separate GTIN zip file if needed)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ampp_gtin (
    id SERIAL PRIMARY KEY,
    appid BIGINT NOT NULL REFERENCES ampp(appid) ON DELETE CASCADE,
    gtin VARCHAR(14) NOT NULL,         -- Global Trade Item Number
    startdt DATE,                      -- Start date
    enddt DATE,                        -- End date
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ampp_gtin_appid ON ampp_gtin(appid);
CREATE INDEX IF NOT EXISTS idx_ampp_gtin_gtin ON ampp_gtin(gtin);

-- ============================================================================
-- METADATA TABLE - Track import runs
-- ============================================================================

CREATE TABLE IF NOT EXISTS dmd_import_log (
    id SERIAL PRIMARY KEY,
    release_version TEXT,              -- dm+d release version
    release_date DATE,                 -- Release date
    import_started_at TIMESTAMPTZ NOT NULL,
    import_completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'running', -- running, completed, failed
    error_message TEXT,
    rows_imported JSONB,               -- Count per table
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- USEFUL VIEWS
-- ============================================================================

-- Full product view joining VMP -> AMP -> AMPP with prices
CREATE OR REPLACE VIEW v_product_full AS
SELECT 
    ampp.appid,
    ampp.nm AS ampp_name,
    amp.apid,
    amp.nm AS amp_name,
    amp."desc" AS amp_description,
    vmp.vpid,
    vmp.nm AS vmp_name,
    vtm.vtmid,
    vtm.nm AS vtm_name,
    vmpp.vppid,
    vmpp.nm AS vmpp_name,
    vmpp.qtyval AS pack_quantity,
    api.price,
    api.price_basiscd,
    apr.acbs,
    apr.sched_1,
    apr.sched_2,
    ampp.legal_catcd,
    ampp.disccd,
    ampp.discdt,
    ls.description AS supplier_name
FROM ampp
JOIN amp ON ampp.apid = amp.apid
JOIN vmp ON amp.vpid = vmp.vpid
LEFT JOIN vtm ON vmp.vtmid = vtm.vtmid
JOIN vmpp ON ampp.vppid = vmpp.vppid
LEFT JOIN ampp_price_info api ON ampp.appid = api.appid
LEFT JOIN ampp_prescrib_info apr ON ampp.appid = apr.appid
LEFT JOIN lookup_supplier ls ON amp.suppcd = ls.cd
WHERE ampp.invalid = 0 AND amp.invalid = 0 AND vmp.invalid = 0;

-- Active VMPs with ingredient info
CREATE OR REPLACE VIEW v_vmp_with_ingredients AS
SELECT 
    vmp.vpid,
    vmp.nm AS vmp_name,
    vtm.nm AS vtm_name,
    i.isid,
    i.nm AS ingredient_name,
    vi.strnt_nmrtr_val,
    uom_n.description AS numerator_uom,
    vi.strnt_dnmtr_val,
    uom_d.description AS denominator_uom,
    lf.description AS form,
    vmp.pres_statcd
FROM vmp
LEFT JOIN vtm ON vmp.vtmid = vtm.vtmid
LEFT JOIN vmp_ingredient vi ON vmp.vpid = vi.vpid
LEFT JOIN ingredient i ON vi.isid = i.isid
LEFT JOIN vmp_drug_form vdf ON vmp.vpid = vdf.vpid
LEFT JOIN lookup_form lf ON vdf.formcd = lf.cd
LEFT JOIN lookup_unit_of_measure uom_n ON vi.strnt_nmrtr_uomcd = uom_n.cd
LEFT JOIN lookup_unit_of_measure uom_d ON vi.strnt_dnmtr_uomcd = uom_d.cd
WHERE vmp.invalid = 0;

-- ============================================================================
-- COMPREHENSIVE PRESCRIBING VIEW (AMP-focused)
-- Use this for prescribing applications - includes everything you need
-- ============================================================================
CREATE OR REPLACE VIEW v_prescribing AS
SELECT 
    -- AMP (Branded Product) - Primary level for prescribing
    amp.apid,
    amp.nm AS product_name,
    amp.abbrevnm AS product_abbrev,
    amp."desc" AS product_description,
    
    -- VMP (Generic Equivalent)
    vmp.vpid,
    vmp.nm AS generic_name,
    
    -- VTM (Therapeutic Moiety)
    vtm.vtmid,
    vtm.nm AS therapeutic_moiety,
    
    -- Ingredient Info (from VMP level)
    i.isid AS ingredient_id,
    i.nm AS ingredient_name,
    vi.strnt_nmrtr_val AS strength_value,
    uom_n.description AS strength_unit,
    vi.strnt_dnmtr_val AS strength_denominator,
    uom_d.description AS strength_denom_unit,
    
    -- Drug Form & Route
    lf.description AS form,
    lr.description AS route,
    
    -- Supplier/Manufacturer
    ls.description AS supplier,
    
    -- Controlled Drug Status
    lcd.description AS controlled_drug_category,
    vcdi.catcd AS controlled_drug_code,
    
    -- Prescribing Status
    lps.description AS prescribing_status,
    vmp.pres_statcd AS prescribing_status_code,
    
    -- Product Flags
    vmp.sug_f AS sugar_free,
    vmp.glu_f AS gluten_free,
    vmp.pres_f AS preservative_free,
    vmp.cfc_f AS cfc_free,
    
    -- Availability
    amp.avail_restrictcd AS availability_restriction_code,
    lar.description AS availability_restriction,
    vmp.non_availcd AS non_availability_code,
    lna.description AS non_availability_reason,
    
    -- Licensing
    amp.lic_authcd AS licensing_authority_code,
    lla.description AS licensing_authority,
    amp.ema AS ema_authorised,
    amp.parallel_import,
    
    -- Combination Product Flag
    amp.combprodcd AS combination_product_code,
    
    -- Validity
    amp.invalid AS amp_invalid,
    vmp.invalid AS vmp_invalid
    
FROM amp
JOIN vmp ON amp.vpid = vmp.vpid
LEFT JOIN vtm ON vmp.vtmid = vtm.vtmid

-- Ingredients (may return multiple rows per product if multi-ingredient)
LEFT JOIN vmp_ingredient vi ON vmp.vpid = vi.vpid
LEFT JOIN ingredient i ON vi.isid = i.isid
LEFT JOIN lookup_unit_of_measure uom_n ON vi.strnt_nmrtr_uomcd = uom_n.cd
LEFT JOIN lookup_unit_of_measure uom_d ON vi.strnt_dnmtr_uomcd = uom_d.cd

-- Form (tablet, capsule, etc.)
LEFT JOIN vmp_drug_form vdf ON vmp.vpid = vdf.vpid
LEFT JOIN lookup_form lf ON vdf.formcd = lf.cd

-- Route (oral, IV, etc.)
LEFT JOIN vmp_drug_route vdr ON vmp.vpid = vdr.vpid
LEFT JOIN lookup_route lr ON vdr.routecd = lr.cd

-- Supplier
LEFT JOIN lookup_supplier ls ON amp.suppcd = ls.cd

-- Controlled Drug Info
LEFT JOIN vmp_control_drug_info vcdi ON vmp.vpid = vcdi.vpid
LEFT JOIN lookup_control_drug_category lcd ON vcdi.catcd = lcd.cd

-- Prescribing Status
LEFT JOIN lookup_virtual_product_pres_status lps ON vmp.pres_statcd = lps.cd

-- Availability
LEFT JOIN lookup_availability_restriction lar ON amp.avail_restrictcd = lar.cd
LEFT JOIN lookup_non_avail_reason lna ON vmp.non_availcd = lna.cd

-- Licensing
LEFT JOIN lookup_licensing_authority lla ON amp.lic_authcd = lla.cd

WHERE amp.invalid = 0 AND vmp.invalid = 0;

-- ============================================================================
-- VMPP VIEW (Generic Packs) - Shows pack sizes for generic products
-- ============================================================================
CREATE OR REPLACE VIEW v_vmpp_packs AS
SELECT
    vmpp.vppid,
    vmpp.nm AS pack_name,
    vmpp.qtyval AS quantity,
    uom.description AS quantity_unit,
    vmp.vpid,
    vmp.nm AS generic_name,
    vtm.vtmid,
    vtm.nm AS therapeutic_moiety,
    lcp.description AS combination_pack,
    vmpp.invalid
FROM vmpp
JOIN vmp ON vmpp.vpid = vmp.vpid
LEFT JOIN vtm ON vmp.vtmid = vtm.vtmid
LEFT JOIN lookup_unit_of_measure uom ON vmpp.qty_uomcd = uom.cd
LEFT JOIN lookup_combination_pack_ind lcp ON vmpp.combpackcd = lcp.cd
WHERE vmpp.invalid = 0 AND vmp.invalid = 0;

-- ============================================================================
-- DISPENSING VIEW (AMPP-focused with full pricing and pack info)
-- Use this for dispensing/pharmacy applications
-- ============================================================================
CREATE OR REPLACE VIEW v_dispensing AS
SELECT 
    -- AMPP (What you actually dispense)
    ampp.appid,
    ampp.nm AS pack_name,
    
    -- AMP (Branded product)
    amp.apid,
    amp.nm AS product_name,
    
    -- VMP/VTM (Generic info)
    vmp.vpid,
    vmp.nm AS generic_name,
    vtm.vtmid,
    vtm.nm AS therapeutic_moiety,
    
    -- VMPP (Generic pack)
    vmpp.vppid,
    vmpp.nm AS generic_pack_name,
    vmpp.qtyval AS pack_quantity,
    uom.description AS quantity_unit,
    
    -- Pricing
    api.price AS price_pence,
    (api.price / 100.0) AS price_pounds,
    api.pricedt AS price_date,
    lpb.description AS price_basis,
    
    -- Legal Category
    llc.description AS legal_category,
    ampp.legal_catcd,
    
    -- Discontinued Status
    ldi.description AS discontinued_status,
    ampp.discdt AS discontinued_date,
    
    -- Prescribing Flags
    apr.sched_1,
    apr.sched_2,
    apr.acbs,
    apr.padm,
    apr.fp10_mda,
    apr.hosp AS hospital_only,
    apr.nurse_f AS nurse_prescribable,
    apr.enurse_f AS extended_nurse_prescribable,
    apr.dent_f AS dentist_prescribable,
    
    -- Reimbursement Info
    ari.px_chrgs AS prescription_charges,
    ari.disp_fees AS dispensing_fees,
    ari.bb AS broken_bulk,
    ari.ltd_stab AS limited_stability,
    ari.cal_pack AS calendar_pack,
    lsc.description AS special_container,
    ari.dnd AS do_not_dispense,
    
    -- Pack Info
    apack.reimb_statcd,
    lrs.description AS reimbursement_status,
    apack.pack_order_no,
    
    -- Supplier
    ls.description AS supplier,
    
    -- Validity
    ampp.invalid
    
FROM ampp
JOIN amp ON ampp.apid = amp.apid
JOIN vmp ON amp.vpid = vmp.vpid
LEFT JOIN vtm ON vmp.vtmid = vtm.vtmid
JOIN vmpp ON ampp.vppid = vmpp.vppid
LEFT JOIN lookup_unit_of_measure uom ON vmpp.qty_uomcd = uom.cd

-- Pricing
LEFT JOIN ampp_price_info api ON ampp.appid = api.appid
LEFT JOIN lookup_price_basis lpb ON api.price_basiscd = lpb.cd

-- Legal Category
LEFT JOIN lookup_legal_category llc ON ampp.legal_catcd = llc.cd

-- Discontinued
LEFT JOIN lookup_discontinued_ind ldi ON ampp.disccd = ldi.cd

-- Prescribing Info
LEFT JOIN ampp_prescrib_info apr ON ampp.appid = apr.appid

-- Reimbursement Info
LEFT JOIN ampp_reimb_info ari ON ampp.appid = ari.appid
LEFT JOIN lookup_special_container lsc ON ari.spec_contcd = lsc.cd

-- Pack Info
LEFT JOIN ampp_pack_info apack ON ampp.appid = apack.appid
LEFT JOIN lookup_reimbursement_status lrs ON apack.reimb_statcd = lrs.cd

-- Supplier
LEFT JOIN lookup_supplier ls ON amp.suppcd = ls.cd

WHERE ampp.invalid = 0 AND amp.invalid = 0 AND vmp.invalid = 0;

-- ============================================================================
-- THE ULTIMATE COMPREHENSIVE VIEW - EVERYTHING IN ONE PLACE
-- This is the most complete view possible, joining ALL levels with ALL lookups
-- ============================================================================
CREATE OR REPLACE VIEW v_everything AS
SELECT 
    -- ========== IDENTIFIERS (All Levels) ==========
    ampp.appid,                              -- AMPP ID (branded pack)
    amp.apid,                                -- AMP ID (branded product)
    vmpp.vppid,                              -- VMPP ID (generic pack)
    vmp.vpid,                                -- VMP ID (generic product)
    vtm.vtmid,                               -- VTM ID (therapeutic moiety)
    i.isid AS ingredient_id,                 -- Ingredient ID
    
    -- ========== NAMES (All Levels) ==========
    ampp.nm AS ampp_name,                    -- "Panadol 500mg tablets x 16"
    amp.nm AS amp_name,                      -- "Panadol 500mg tablets"
    vmpp.nm AS vmpp_name,                    -- "Paracetamol 500mg tablets x 16"
    vmp.nm AS vmp_name,                      -- "Paracetamol 500mg tablets"
    vtm.nm AS vtm_name,                      -- "Paracetamol"
    i.nm AS ingredient_name,                 -- "Paracetamol"
    
    -- ========== STRENGTH ==========
    vi.strnt_nmrtr_val AS strength_value,    -- 500
    uom_n.description AS strength_unit,      -- "mg"
    vi.strnt_dnmtr_val AS strength_denom,    -- 5 (for "per 5ml")
    uom_d.description AS strength_denom_unit,-- "ml"
    
    -- ========== FORM & ROUTE ==========
    lf.description AS form,                  -- "Tablet"
    lr.description AS route,                 -- "Oral"
    
    -- ========== PACK INFO ==========
    vmpp.qtyval AS pack_quantity,            -- 16
    uom_qty.description AS pack_unit,        -- "tablet"
    lcp.description AS combination_pack,     -- If it's a combo pack
    
    -- ========== PRICING ==========
    api.price AS price_pence,                -- 249
    (api.price / 100.0) AS price_pounds,     -- 2.49
    api.pricedt AS price_date,
    lpb.description AS price_basis,
    
    -- ========== SUPPLIER ==========
    ls.description AS supplier,              -- "GlaxoSmithKline"
    
    -- ========== LEGAL & CONTROLLED ==========
    llc.description AS legal_category,       -- "POM", "P", "GSL"
    lcd.description AS controlled_drug,      -- "Schedule 2", etc.
    
    -- ========== PRESCRIBING STATUS ==========
    lps.description AS prescribing_status,   -- "Valid for prescribing"
    
    -- ========== PRESCRIBING FLAGS ==========
    apr.sched_1 AS schedule_1,
    apr.sched_2 AS schedule_2,
    apr.acbs,                                -- ACBS approved
    apr.nurse_f AS nurse_prescribable,
    apr.dent_f AS dentist_prescribable,
    apr.hosp AS hospital_only,
    
    -- ========== PRODUCT FLAGS ==========
    vmp.sug_f AS sugar_free,
    vmp.glu_f AS gluten_free,
    vmp.pres_f AS preservative_free,
    vmp.cfc_f AS cfc_free,
    
    -- ========== DISCONTINUED ==========
    ldi.description AS discontinued_status,
    ampp.discdt AS discontinued_date,
    
    -- ========== AVAILABILITY ==========
    lar.description AS availability_restriction,
    lna.description AS non_availability_reason,
    
    -- ========== LICENSING ==========
    lla.description AS licensing_authority,
    amp.ema AS ema_authorised,
    amp.parallel_import,
    
    -- ========== REIMBURSEMENT ==========
    lrs.description AS reimbursement_status,
    ari.disp_fees AS dispensing_fees,
    ari.bb AS broken_bulk,
    lsc.description AS special_container,
    ari.dnd AS do_not_dispense

FROM ampp
-- Core hierarchy joins
JOIN amp ON ampp.apid = amp.apid
JOIN vmp ON amp.vpid = vmp.vpid
JOIN vmpp ON ampp.vppid = vmpp.vppid
LEFT JOIN vtm ON vmp.vtmid = vtm.vtmid

-- Ingredients (NOTE: may produce multiple rows for multi-ingredient products)
LEFT JOIN vmp_ingredient vi ON vmp.vpid = vi.vpid
LEFT JOIN ingredient i ON vi.isid = i.isid
LEFT JOIN lookup_unit_of_measure uom_n ON vi.strnt_nmrtr_uomcd = uom_n.cd
LEFT JOIN lookup_unit_of_measure uom_d ON vi.strnt_dnmtr_uomcd = uom_d.cd

-- Form & Route
LEFT JOIN vmp_drug_form vdf ON vmp.vpid = vdf.vpid
LEFT JOIN lookup_form lf ON vdf.formcd = lf.cd
LEFT JOIN vmp_drug_route vdr ON vmp.vpid = vdr.vpid
LEFT JOIN lookup_route lr ON vdr.routecd = lr.cd

-- Pack quantity unit
LEFT JOIN lookup_unit_of_measure uom_qty ON vmpp.qty_uomcd = uom_qty.cd
LEFT JOIN lookup_combination_pack_ind lcp ON vmpp.combpackcd = lcp.cd

-- Pricing
LEFT JOIN ampp_price_info api ON ampp.appid = api.appid
LEFT JOIN lookup_price_basis lpb ON api.price_basiscd = lpb.cd

-- Supplier
LEFT JOIN lookup_supplier ls ON amp.suppcd = ls.cd

-- Legal category
LEFT JOIN lookup_legal_category llc ON ampp.legal_catcd = llc.cd

-- Controlled drug
LEFT JOIN vmp_control_drug_info vcdi ON vmp.vpid = vcdi.vpid
LEFT JOIN lookup_control_drug_category lcd ON vcdi.catcd = lcd.cd

-- Prescribing status
LEFT JOIN lookup_virtual_product_pres_status lps ON vmp.pres_statcd = lps.cd

-- Prescribing info
LEFT JOIN ampp_prescrib_info apr ON ampp.appid = apr.appid

-- Discontinued
LEFT JOIN lookup_discontinued_ind ldi ON ampp.disccd = ldi.cd

-- Availability
LEFT JOIN lookup_availability_restriction lar ON amp.avail_restrictcd = lar.cd
LEFT JOIN lookup_non_avail_reason lna ON vmp.non_availcd = lna.cd

-- Licensing
LEFT JOIN lookup_licensing_authority lla ON amp.lic_authcd = lla.cd

-- Reimbursement
LEFT JOIN ampp_pack_info apack ON ampp.appid = apack.appid
LEFT JOIN lookup_reimbursement_status lrs ON apack.reimb_statcd = lrs.cd
LEFT JOIN ampp_reimb_info ari ON ampp.appid = ari.appid
LEFT JOIN lookup_special_container lsc ON ari.spec_contcd = lsc.cd

WHERE ampp.invalid = 0 AND amp.invalid = 0 AND vmp.invalid = 0;

-- ============================================================================
-- SIMPLE DRUG SEARCH VIEW - For prescribing search box
-- Search by brand name OR generic name, get back useful prescribing info
-- ============================================================================
CREATE OR REPLACE VIEW v_drug_search AS
SELECT 
    -- What you'd show in search results
    amp.apid AS id,
    amp.nm AS brand_name,                    -- "Propecia 1mg tablets"
    vmp.nm AS generic_name,                  -- "Finasteride 1mg tablets"
    vtm.nm AS drug_name,                     -- "Finasteride"
    
    -- Key info for prescribing
    i.nm AS active_ingredient,
    vi.strnt_nmrtr_val || ' ' || COALESCE(uom.description, '') AS strength,
    lf.description AS form,                  -- "Tablet"
    lr.description AS route,                 -- "Oral"
    ls.description AS manufacturer,
    
    -- Is it prescribable?
    lps.description AS prescribing_status,
    lcd.description AS controlled_drug,      -- NULL if not controlled
    
    -- Flags
    vmp.sug_f AS sugar_free,
    vmp.glu_f AS gluten_free
    
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
LEFT JOIN lookup_virtual_product_pres_status lps ON vmp.pres_statcd = lps.cd
LEFT JOIN vmp_control_drug_info vcdi ON vmp.vpid = vcdi.vpid
LEFT JOIN lookup_control_drug_category lcd ON vcdi.catcd = lcd.cd
WHERE amp.invalid = 0 AND vmp.invalid = 0;

-- ============================================================================
-- ROW LEVEL SECURITY (optional - enable if needed)
-- ============================================================================

-- Enable RLS on all tables if you want to restrict access
-- ALTER TABLE vtm ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access" ON vtm FOR SELECT USING (true);
-- Repeat for other tables as needed

-- ============================================================================
-- GRANTS (for Supabase, the service role has full access by default)
-- ============================================================================

-- Grant read access to anon role for public API access
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

