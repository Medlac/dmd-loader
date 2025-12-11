# NHS dm+d Data Loader

Loads NHS Dictionary of Medicines and Devices (dm+d) data into Supabase.

## Features

- Downloads latest dm+d release from NHSBSA TRUD API
- Parses all XML files (VTM, VMP, VMPP, AMP, AMPP, Ingredients, Lookups)
- Loads data into fully normalized PostgreSQL schema
- Supports incremental updates via upserts
- Tracks import history

## Prerequisites

1. **Supabase Project** - Create at [supabase.com](https://supabase.com)
2. **TRUD Account** - Register at [TRUD](https://isd.digital.nhs.uk/trud/users/guest/filters/0/home) for API key
3. **Node.js 18+**

## Setup

### 1. Install dependencies

```bash
cd dmd-loader
npm install
```

### 2. Configure environment

Copy `env-example.txt` to `.env` and fill in your values:

```bash
cp env-example.txt .env
```

Required variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key (from Project Settings > API)
- `TRUD_API_KEY` - Your TRUD API key

### 3. Create database schema

Run the schema in your Supabase SQL Editor:

1. Go to Supabase Dashboard > SQL Editor
2. Copy contents of `schema.sql`
3. Run the SQL

## Usage

### Full load from TRUD API

Downloads latest release and loads all data:

```bash
npm run dev
# or
npm run build && npm start
```

### Load from local files

If you already have dm+d XML files extracted:

```bash
npm run dev -- --local /path/to/xml/files
```

### Test connection

```bash
npm run dev -- --test
```

### Stream mode (lower memory)

For servers with limited RAM:

```bash
npm run dev -- --stream
```

## Data Structure

### Main Tables

| Table | Description | ~Rows |
|-------|-------------|-------|
| `vtm` | Virtual Therapeutic Moiety (generic drug concepts) | ~3,500 |
| `ingredient` | Active ingredients | ~5,500 |
| `vmp` | Virtual Medicinal Products (generic products with strength) | ~90,000 |
| `vmpp` | Virtual Medicinal Product Packs | ~130,000 |
| `amp` | Actual Medicinal Products (branded products) | ~200,000 |
| `ampp` | Actual Medicinal Product Packs (with prices) | ~260,000 |

### Junction Tables

- `vmp_ingredient` - VMP to Ingredient mapping with strength
- `vmp_drug_form` - VMP to Form mapping
- `vmp_drug_route` - VMP to Route mapping
- `amp_ingredient` - AMP to Ingredient mapping
- `amp_licensed_route` - AMP to Route mapping

### Lookup Tables

20+ lookup tables for codes like:
- `lookup_form` - Dosage forms (tablet, capsule, etc.)
- `lookup_route` - Administration routes
- `lookup_unit_of_measure` - Units (mg, ml, etc.)
- `lookup_supplier` - Pharmaceutical companies

### Useful Views

- `v_product_full` - Joined view of AMPP with all related data
- `v_vmp_with_ingredients` - VMPs with ingredient details

## Automation (Cron)

For weekly updates on a server:

```bash
# Edit crontab
crontab -e

# Add line to run every Monday at 6am
0 6 * * 1 cd /path/to/dmd-loader && /usr/bin/node dist/index.js >> /var/log/dmd-loader.log 2>&1
```

## API Examples

Once loaded, query via Supabase:

```javascript
// Get all products containing "Paracetamol"
const { data } = await supabase
  .from('vmp')
  .select('*')
  .ilike('nm', '%Paracetamol%');

// Get product with price info
const { data } = await supabase
  .from('v_product_full')
  .select('*')
  .eq('appid', 1234567890);

// Search by GTIN/barcode
const { data } = await supabase
  .from('ampp_gtin')
  .select('*, ampp(*)')
  .eq('gtin', '5012345678901');
```

## Troubleshooting

### "Missing environment variables"
Ensure `.env` file exists with all required values.

### "Failed to connect to database"
Check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct.

### "No releases found from TRUD API"
Verify your `TRUD_API_KEY` is valid and not expired.

### Memory issues
Use `--stream` mode or increase Node memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

## License

ISC

