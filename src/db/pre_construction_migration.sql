-- Pre-Construction tracking fields for pm_projects
ALTER TABLE pm_projects
  ADD COLUMN IF NOT EXISTS settlement_date text,
  ADD COLUMN IF NOT EXISTS permit_required boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS permit_notes text,
  ADD COLUMN IF NOT EXISTS demolition_status text DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS elec_abolishment text DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS gas_abolishment text DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS engineering_status text DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS working_drawings text DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS fire_status text DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS soil_test text DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS other_approvals text,
  ADD COLUMN IF NOT EXISTS building_permit text DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS mouldus_arriving_date text;
