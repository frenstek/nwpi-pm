-- Client Upload Portal
-- Admin generates a link for an external client. Client can add properties and upload documents.

-- Upload links table (one per client)
CREATE TABLE IF NOT EXISTS pm_upload_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  client_name TEXT NOT NULL,
  client_email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Properties added by the client
CREATE TABLE IF NOT EXISTS pm_upload_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES pm_upload_links(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Client uploaded files (per property, per category)
CREATE TABLE IF NOT EXISTS pm_client_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES pm_upload_properties(id) ON DELETE CASCADE,
  link_id UUID NOT NULL REFERENCES pm_upload_links(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('floor_plan', 'engineering', 'architecture', 'soil_test', 'other')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  notes TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_upload_links_token ON pm_upload_links(token);
CREATE INDEX IF NOT EXISTS idx_upload_properties_link ON pm_upload_properties(link_id);
CREATE INDEX IF NOT EXISTS idx_client_uploads_property ON pm_client_uploads(property_id);
CREATE INDEX IF NOT EXISTS idx_client_uploads_link ON pm_client_uploads(link_id);

-- RLS
ALTER TABLE pm_upload_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_upload_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_client_uploads ENABLE ROW LEVEL SECURITY;

-- Authenticated users (admin) full access
CREATE POLICY "auth_all_upload_links" ON pm_upload_links FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_upload_properties" ON pm_upload_properties FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_client_uploads" ON pm_client_uploads FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Service role (API) full access
CREATE POLICY "service_all_upload_links" ON pm_upload_links FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_upload_properties" ON pm_upload_properties FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_client_uploads" ON pm_client_uploads FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Storage bucket for client uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('client-uploads', 'client-uploads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public_upload_client_uploads" ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'client-uploads');

CREATE POLICY "public_read_client_uploads" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'client-uploads');
