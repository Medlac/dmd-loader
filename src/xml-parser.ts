import { XMLParser } from "fast-xml-parser";

// Configure parser for dm+d XML structure
const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true,
  // Don't create arrays for single items - makes data cleaner
  isArray: (
    name: string,
    jpath: string,
    isLeafNode: boolean,
    isAttribute: boolean
  ) => {
    // These are always arrays (list containers)
    const alwaysArray = [
      "VTM",
      "VMP",
      "VMPP",
      "AMP",
      "AMPP",
      "INGREDIENT",
      "VPI",
      "ONT",
      "DFORM",
      "DROUTE",
      "CONTROL_INFO",
      "AP_ING",
      "LIC_ROUTE",
      "AP_INFO",
      "PACK_INFO",
      "PRESCRIB_INFO",
      "PRICE_INFO",
      "REIMB_INFO",
      "CCONTENT",
      "INFO", // lookup entries
      "GTINDATA", // GTIN entries (each AMPP can have multiple)
    ];
    return alwaysArray.includes(name);
  },
};

const parser = new XMLParser(parserOptions);

/**
 * Parse XML content to JavaScript object
 */
export function parseXml<T = unknown>(xmlContent: string | Buffer): T {
  const content =
    typeof xmlContent === "string" ? xmlContent : xmlContent.toString("utf-8");
  return parser.parse(content) as T;
}

// ============================================================================
// Type definitions for dm+d XML structures
// ============================================================================

// VTM (Virtual Therapeutic Moiety)
export interface VtmXml {
  VIRTUAL_THERAPEUTIC_MOIETIES: {
    VTM: VtmRecord[];
  };
}

export interface VtmRecord {
  VTMID: number;
  VTMIDPREV?: number;
  VTMIDDT?: string;
  NM: string;
  ABBREVNM?: string;
  INVALID?: number;
}

// Ingredient
export interface IngredientXml {
  INGREDIENT_SUBSTANCES: {
    ING: IngredientRecord[];
  };
}

export interface IngredientRecord {
  ISID: number;
  ISIDPREV?: number;
  ISIDDT?: string;
  NM: string;
  INVALID?: number;
}

// VMP (Virtual Medicinal Product)
export interface VmpXml {
  VIRTUAL_MED_PRODUCTS: {
    VMPS: { VMP: VmpRecord[] };
    VIRTUAL_PRODUCT_INGREDIENT: { VPI: VpiRecord[] };
    ONT_DRUG_FORM: { ONT: OntDrugFormRecord[] };
    DRUG_FORM: { DFORM: DrugFormRecord[] };
    DRUG_ROUTE: { DROUTE: DrugRouteRecord[] };
    CONTROL_DRUG_INFO: { CONTROL_INFO: ControlDrugInfoRecord[] };
  };
}

export interface VmpRecord {
  VPID: number;
  VPIDPREV?: number;
  VPIDDT?: string;
  VTMID?: number;
  NM: string;
  ABBREVNM?: string;
  BASISCD: string;
  NMDT?: string;
  NMPREV?: string;
  BASIS_PREVCD?: string;
  NMCHANGECD?: string;
  COMBPRODCD?: string;
  PRES_STATCD: string;
  SUG_F?: number;
  GLU_F?: number;
  PRES_F?: number;
  CFC_F?: number;
  NON_AVAILCD?: string;
  NON_AVAILDT?: string;
  DF_INDCD?: string;
  UDFS?: number;
  UDFS_UOMCD?: number;
  UNIT_DOSE_UOMCD?: number;
  INVALID?: number;
}

export interface VpiRecord {
  VPID: number;
  ISID: number;
  BASIS_STRNTCD?: string;
  BS_SUBID?: number;
  STRNT_NMRTR_VAL?: number;
  STRNT_NMRTR_UOMCD?: number;
  STRNT_DNMTR_VAL?: number;
  STRNT_DNMTR_UOMCD?: number;
}

export interface OntDrugFormRecord {
  VPID: number;
  FORMCD: number;
}

export interface DrugFormRecord {
  VPID: number;
  FORMCD: number;
}

export interface DrugRouteRecord {
  VPID: number;
  ROUTECD: number;
}

export interface ControlDrugInfoRecord {
  VPID: number;
  CATCD: string;
  CATDT?: string;
  CAT_PREVCD?: string;
}

// VMPP (Virtual Medicinal Product Pack)
export interface VmppXml {
  VIRTUAL_MED_PRODUCT_PACK: {
    VMPPS: { VMPP: VmppRecord[] };
  };
}

export interface VmppRecord {
  VPPID: number;
  VPID: number;
  NM: string;
  QTYVAL?: number;
  QTY_UOMCD?: number;
  COMBPACKCD?: string;
  INVALID?: number;
}

// AMP (Actual Medicinal Product)
export interface AmpXml {
  ACTUAL_MEDICINAL_PRODUCTS: {
    AMPS: { AMP: AmpRecord[] };
    AP_INGREDIENT: { AP_ING: ApIngredientRecord[] };
    LICENSED_ROUTE: { LIC_ROUTE: LicRouteRecord[] };
    AP_INFORMATION: { AP_INFO: ApInfoRecord[] };
  };
}

export interface AmpRecord {
  APID: number;
  VPID: number;
  NM: string;
  ABBREVNM?: string;
  DESC: string;
  NMDT?: string;
  NM_PREV?: string;
  SUPPCD: number;
  LIC_AUTHCD: string;
  LIC_AUTH_PREVCD?: string;
  LIC_AUTHCHANGECD?: string;
  LIC_AUTHCHANGEDT?: string;
  COMBPRODCD?: string;
  FLAVOURCD?: number;
  EMA?: number;
  PARALLEL_IMPORT?: number;
  AVAIL_RESTRICTCD: string;
  INVALID?: number;
}

export interface ApIngredientRecord {
  APID: number;
  ISID: number;
  STRNTH?: number;
  UOMCD?: number;
}

export interface LicRouteRecord {
  APID: number;
  ROUTECD: number;
}

export interface ApInfoRecord {
  APID: number;
  SZ_WEIGHT?: string;
  COLOURCD?: number;
  PROD_ORDER_NO?: string;
}

// AMPP (Actual Medicinal Product Pack)
export interface AmppXml {
  ACTUAL_MEDICINAL_PROD_PACKS: {
    AMPPS: { AMPP: AmppRecord[] };
    APPLIANCE_PACK_INFO: { PACK_INFO: PackInfoRecord[] };
    DRUG_PRODUCT_PRESCRIB_INFO: { PRESCRIB_INFO: PrescribInfoRecord[] };
    MEDICINAL_PRODUCT_PRICE: { PRICE_INFO: PriceInfoRecord[] };
    REIMBURSEMENT_INFO: { REIMB_INFO: ReimbInfoRecord[] };
    COMB_CONTENT: { CCONTENT: CombContentRecord[] };
  };
}

export interface AmppRecord {
  APPID: number;
  VPPID: number;
  APID: number;
  NM: string;
  ABBREVNM?: string;
  COMBPACKCD?: string;
  LEGAL_CATCD: string;
  SUBP?: string;
  DISCCD?: string;
  DISCDT?: string;
  INVALID?: number;
}

export interface PackInfoRecord {
  APPID: number;
  REIMB_STATCD: string;
  REIMB_STATDT?: string;
  REIMB_STATPREVCD?: string;
  PACK_ORDER_NO?: string;
}

export interface PrescribInfoRecord {
  APPID: number;
  SCHED_2?: number;
  ACBS?: number;
  PADM?: number;
  FP10_MDA?: number;
  SCHED_1?: number;
  HOSP?: number;
  NURSE_F?: number;
  ENURSE_F?: number;
  DENT_F?: number;
}

export interface PriceInfoRecord {
  APPID: number;
  PRICE?: number;
  PRICEDT?: string;
  PRICE_PREV?: number;
  PRICE_BASISCD: string;
}

export interface ReimbInfoRecord {
  APPID: number;
  PX_CHRGS?: number;
  DISP_FEES?: number;
  BB?: number;
  LTD_STAB?: number;
  CAL_PACK?: number;
  SPEC_CONTCD?: string;
  DND?: number;
  FP34D?: number;
}

export interface CombContentRecord {
  PRNTAPPID: number;
  CHLDAPPID: number;
}

// Lookup tables
export interface LookupXml {
  LOOKUP: {
    [key: string]: { INFO: LookupInfoRecord[] };
  };
}

export interface LookupInfoRecord {
  CD: string | number;
  CDDT?: string;
  CDPREV?: string | number;
  DESC: string;
  INVALID?: number;
}

// GTIN (Global Trade Item Number)
export interface GtinXml {
  GTIN_DETAILS: {
    AMPPS: {
      AMPP: GtinAmppRecord[];
    };
  };
}

// Each AMPP can have multiple GTINDATA entries
export interface GtinAmppRecord {
  AMPPID: number;
  GTINDATA: GtinDataRecord | GtinDataRecord[];
}

export interface GtinDataRecord {
  GTIN: string;
  STARTDT: string;
  ENDDT?: string;
}

// ============================================================================
// Parser helper functions
// ============================================================================

/**
 * Get the XML file type from filename
 */
export function getFileType(filename: string): string | null {
  const lower = filename.toLowerCase();

  if (lower.startsWith("f_vtm")) return "vtm";
  if (lower.startsWith("f_vmp") && !lower.includes("vmpp")) return "vmp";
  if (lower.startsWith("f_vmpp")) return "vmpp";
  if (lower.startsWith("f_amp") && !lower.includes("ampp")) return "amp";
  if (lower.startsWith("f_ampp")) return "ampp";
  if (lower.startsWith("f_ingredient")) return "ingredient";
  if (lower.startsWith("f_lookup")) return "lookup";
  if (lower.startsWith("f_gtin")) return "gtin";

  return null;
}

/**
 * Safely get array from parsed result (handles single item vs array)
 */
export function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}
