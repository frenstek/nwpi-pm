-- NWPI PM Security Fix Migration
-- Fixes overly-permissive RLS policies and storage bucket access
-- Run this in Supabase SQL Editor
-- Date: 2026-07-22
--
-- WHAT THIS DOES:
-- 1. Drops all existing RLS policies that use USING(true) open to anon/public
-- 2. Re-creates policies scoped to 'authenticated' role only (with auth.uid() check)
-- 3. Keeps service_role policies for portal API functions
-- 4. Fixes storage bucket from public to private
-- 5. Replaces public storage policies with authenticated-only + service_role policies
--
-- NOTE: The client upload portal uses Vercel API routes with SUPABASE_SERVICE_KEY
-- (service_role), so external clients will still work through the API layer.
-- Direct anonymous access to the database is blocked.

BEGIN;

-- ============================================================
-- STEP 1: DROP ALL EXISTING OVERLY-PERMISSIVE TABLE POLICIES
-- ============================================================

-- pm_contacts (from migration.sql)
DROP POLICY IF EXISTS pm_contacts_select ON pm_contacts;
DROP POLICY IF EXISTS pm_contacts_insert ON pm_contacts;
DROP POLICY IF EXISTS pm_contacts_update ON pm_contacts;
DROP POLICY IF EXISTS pm_contacts_delete ON pm_contacts;

-- pm_projects (from migration.sql)
DROP POLICY IF EXISTS pm_projects_select ON pm_projects;
DROP POLICY IF EXISTS pm_projects_insert ON pm_projects;
DROP POLICY IF EXISTS pm_projects_update ON pm_projects;
DROP POLICY IF EXISTS pm_projects_delete ON pm_projects;

-- pm_project_contacts (from migration.sql)
DROP POLICY IF EXISTS pm_project_contacts_select ON pm_project_contacts;
DROP POLICY IF EXISTS pm_project_contacts_insert ON pm_project_contacts;
DROP POLICY IF EXISTS pm_project_contacts_update ON pm_project_contacts;
DROP POLICY IF EXISTS pm_project_contacts_delete ON pm_project_contacts;

-- pm_phases (from migration.sql)
DROP POLICY IF EXISTS pm_phases_select ON pm_phases;
DROP POLICY IF EXISTS pm_phases_insert ON pm_phases;
DROP POLICY IF EXISTS pm_phases_update ON pm_phases;
DROP POLICY IF EXISTS pm_phases_delete ON pm_phases;

-- pm_tasks (from migration.sql)
DROP POLICY IF EXISTS pm_tasks_select ON pm_tasks;
DROP POLICY IF EXISTS pm_tasks_insert ON pm_tasks;
DROP POLICY IF EXISTS pm_tasks_update ON pm_tasks;
DROP POLICY IF EXISTS pm_tasks_delete ON pm_tasks;

-- pm_budget_categories (from migration.sql)
DROP POLICY IF EXISTS pm_budget_categories_select ON pm_budget_categories;
DROP POLICY IF EXISTS pm_budget_categories_insert ON pm_budget_categories;
DROP POLICY IF EXISTS pm_budget_categories_update ON pm_budget_categories;
DROP POLICY IF EXISTS pm_budget_categories_delete ON pm_budget_categories;

-- pm_budget_items (from migration.sql)
DROP POLICY IF EXISTS pm_budget_items_select ON pm_budget_items;
DROP POLICY IF EXISTS pm_budget_items_insert ON pm_budget_items;
DROP POLICY IF EXISTS pm_budget_items_update ON pm_budget_items;
DROP POLICY IF EXISTS pm_budget_items_delete ON pm_budget_items;

-- pm_documents (from migration.sql)
DROP POLICY IF EXISTS pm_documents_select ON pm_documents;
DROP POLICY IF EXISTS pm_documents_insert ON pm_documents;
DROP POLICY IF EXISTS pm_documents_update ON pm_documents;
DROP POLICY IF EXISTS pm_documents_delete ON pm_documents;

-- pm_photos (from migration.sql)
DROP POLICY IF EXISTS pm_photos_select ON pm_photos;
DROP POLICY IF EXISTS pm_photos_insert ON pm_photos;
DROP POLICY IF EXISTS pm_photos_update ON pm_photos;
DROP POLICY IF EXISTS pm_photos_delete ON pm_photos;

-- pm_daily_logs (from migration.sql)
DROP POLICY IF EXISTS pm_daily_logs_select ON pm_daily_logs;
DROP POLICY IF EXISTS pm_daily_logs_insert ON pm_daily_logs;
DROP POLICY IF EXISTS pm_daily_logs_update ON pm_daily_logs;
DROP POLICY IF EXISTS pm_daily_logs_delete ON pm_daily_logs;

-- pm_selections (from migration.sql)
DROP POLICY IF EXISTS pm_selections_select ON pm_selections;
DROP POLICY IF EXISTS pm_selections_insert ON pm_selections;
DROP POLICY IF EXISTS pm_selections_update ON pm_selections;
DROP POLICY IF EXISTS pm_selections_delete ON pm_selections;

-- pm_upload_links (from client_uploads_migration.sql)
DROP POLICY IF EXISTS "auth_all_upload_links" ON pm_upload_links;
DROP POLICY IF EXISTS "service_all_upload_links" ON pm_upload_links;

-- pm_upload_properties (from client_uploads_migration.sql)
DROP POLICY IF EXISTS "auth_all_upload_properties" ON pm_upload_properties;
DROP POLICY IF EXISTS "service_all_upload_properties" ON pm_upload_properties;

-- pm_client_uploads (from client_uploads_migration.sql)
DROP POLICY IF EXISTS "auth_all_client_uploads" ON pm_client_uploads;
DROP POLICY IF EXISTS "service_all_client_uploads" ON pm_client_uploads;

-- pm_purchase_orders (from purchase_orders_migration.sql)
DROP POLICY IF EXISTS "Allow all access to pm_purchase_orders" ON pm_purchase_orders;

-- pm_po_items (from purchase_orders_migration.sql)
DROP POLICY IF EXISTS "Allow all access to pm_po_items" ON pm_po_items;

-- pm_invoices (from invoices_migration.sql)
DROP POLICY IF EXISTS "Allow all access to pm_invoices" ON pm_invoices;

-- pm_invoice_items (from invoices_migration.sql)
DROP POLICY IF EXISTS "Allow all access to pm_invoice_items" ON pm_invoice_items;

-- pm_leads (from crm_migration.sql)
DROP POLICY IF EXISTS pm_leads_s ON pm_leads;
DROP POLICY IF EXISTS pm_leads_i ON pm_leads;
DROP POLICY IF EXISTS pm_leads_u ON pm_leads;
DROP POLICY IF EXISTS pm_leads_d ON pm_leads;

-- pm_warranties (from warranties_migration.sql)
DROP POLICY IF EXISTS pm_war_s ON pm_warranties;
DROP POLICY IF EXISTS pm_war_i ON pm_warranties;
DROP POLICY IF EXISTS pm_war_u ON pm_warranties;
DROP POLICY IF EXISTS pm_war_d ON pm_warranties;

-- pm_messages (from messages_migration.sql)
DROP POLICY IF EXISTS pm_messages_s ON pm_messages;
DROP POLICY IF EXISTS pm_messages_i ON pm_messages;
DROP POLICY IF EXISTS pm_messages_u ON pm_messages;
DROP POLICY IF EXISTS pm_messages_d ON pm_messages;

-- pm_activity_log (from messages_migration.sql)
DROP POLICY IF EXISTS pm_activity_s ON pm_activity_log;
DROP POLICY IF EXISTS pm_activity_i ON pm_activity_log;
DROP POLICY IF EXISTS pm_activity_d ON pm_activity_log;

-- pm_todos (from todos_migration.sql)
DROP POLICY IF EXISTS pm_todos_s ON pm_todos;
DROP POLICY IF EXISTS pm_todos_i ON pm_todos;
DROP POLICY IF EXISTS pm_todos_u ON pm_todos;
DROP POLICY IF EXISTS pm_todos_d ON pm_todos;

-- Storage policies (from client_uploads_migration.sql)
DROP POLICY IF EXISTS "public_upload_client_uploads" ON storage.objects;
DROP POLICY IF EXISTS "public_read_client_uploads" ON storage.objects;


-- ============================================================
-- STEP 2: CREATE PROPER AUTHENTICATED-ONLY RLS POLICIES
-- All policies require auth.uid() IS NOT NULL (verified login)
-- ============================================================

-- pm_contacts
CREATE POLICY pm_contacts_select ON pm_contacts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_contacts_insert ON pm_contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_contacts_update ON pm_contacts FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_contacts_delete ON pm_contacts FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- pm_projects
CREATE POLICY pm_projects_select ON pm_projects FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_projects_insert ON pm_projects FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_projects_update ON pm_projects FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_projects_delete ON pm_projects FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- pm_project_contacts
CREATE POLICY pm_project_contacts_select ON pm_project_contacts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_project_contacts_insert ON pm_project_contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_project_contacts_update ON pm_project_contacts FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_project_contacts_delete ON pm_project_contacts FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- pm_phases
CREATE POLICY pm_phases_select ON pm_phases FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_phases_insert ON pm_phases FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_phases_update ON pm_phases FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_phases_delete ON pm_phases FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- pm_tasks
CREATE POLICY pm_tasks_select ON pm_tasks FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_tasks_insert ON pm_tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_tasks_update ON pm_tasks FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_tasks_delete ON pm_tasks FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- pm_budget_categories
CREATE POLICY pm_budget_categories_select ON pm_budget_categories FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_budget_categories_insert ON pm_budget_categories FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_budget_categories_update ON pm_budget_categories FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_budget_categories_delete ON pm_budget_categories FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- pm_budget_items
CREATE POLICY pm_budget_items_select ON pm_budget_items FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_budget_items_insert ON pm_budget_items FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_budget_items_update ON pm_budget_items FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_budget_items_delete ON pm_budget_items FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- pm_documents
CREATE POLICY pm_documents_select ON pm_documents FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_documents_insert ON pm_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_documents_update ON pm_documents FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_documents_delete ON pm_documents FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- pm_photos
CREATE POLICY pm_photos_select ON pm_photos FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_photos_insert ON pm_photos FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_photos_update ON pm_photos FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_photos_delete ON pm_photos FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- pm_daily_logs
CREATE POLICY pm_daily_logs_select ON pm_daily_logs FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_daily_logs_insert ON pm_daily_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_daily_logs_update ON pm_daily_logs FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_daily_logs_delete ON pm_daily_logs FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- pm_selections
CREATE POLICY pm_selections_select ON pm_selections FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_selections_insert ON pm_selections FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_selections_update ON pm_selections FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_selections_delete ON pm_selections FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- pm_upload_links (authenticated admin access)
CREATE POLICY pm_upload_links_auth_select ON pm_upload_links FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_upload_links_auth_insert ON pm_upload_links FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_upload_links_auth_update ON pm_upload_links FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_upload_links_auth_delete ON pm_upload_links FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
-- service_role access (for portal API routes)
CREATE POLICY pm_upload_links_service ON pm_upload_links FOR ALL TO service_role USING (true) WITH CHECK (true);

-- pm_upload_properties (authenticated admin access)
CREATE POLICY pm_upload_properties_auth_select ON pm_upload_properties FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_upload_properties_auth_insert ON pm_upload_properties FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_upload_properties_auth_update ON pm_upload_properties FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_upload_properties_auth_delete ON pm_upload_properties FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
-- service_role access (for portal API routes)
CREATE POLICY pm_upload_properties_service ON pm_upload_properties FOR ALL TO service_role USING (true) WITH CHECK (true);

-- pm_client_uploads (authenticated admin access)
CREATE POLICY pm_client_uploads_auth_select ON pm_client_uploads FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_client_uploads_auth_insert ON pm_client_uploads FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_client_uploads_auth_update ON pm_client_uploads FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_client_uploads_auth_delete ON pm_client_uploads FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
-- service_role access (for portal API routes)
CREATE POLICY pm_client_uploads_service ON pm_client_uploads FOR ALL TO service_role USING (true) WITH CHECK (true);

-- pm_purchase_orders
CREATE POLICY pm_purchase_orders_select ON pm_purchase_orders FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_purchase_orders_insert ON pm_purchase_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_purchase_orders_update ON pm_purchase_orders FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_purchase_orders_delete ON pm_purchase_orders FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- pm_po_items
CREATE POLICY pm_po_items_select ON pm_po_items FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_po_items_insert ON pm_po_items FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_po_items_update ON pm_po_items FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_po_items_delete ON pm_po_items FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- pm_invoices
CREATE POLICY pm_invoices_select ON pm_invoices FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_invoices_insert ON pm_invoices FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_invoices_update ON pm_invoices FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_invoices_delete ON pm_invoices FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- pm_invoice_items
CREATE POLICY pm_invoice_items_select ON pm_invoice_items FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_invoice_items_insert ON pm_invoice_items FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_invoice_items_update ON pm_invoice_items FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_invoice_items_delete ON pm_invoice_items FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- pm_leads
CREATE POLICY pm_leads_select ON pm_leads FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_leads_insert ON pm_leads FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_leads_update ON pm_leads FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_leads_delete ON pm_leads FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- pm_warranties
CREATE POLICY pm_warranties_select ON pm_warranties FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_warranties_insert ON pm_warranties FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_warranties_update ON pm_warranties FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_warranties_delete ON pm_warranties FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- pm_messages
CREATE POLICY pm_messages_select ON pm_messages FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_messages_insert ON pm_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_messages_update ON pm_messages FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_messages_delete ON pm_messages FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- pm_activity_log
CREATE POLICY pm_activity_log_select ON pm_activity_log FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_activity_log_insert ON pm_activity_log FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_activity_log_delete ON pm_activity_log FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- pm_todos
CREATE POLICY pm_todos_select ON pm_todos FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY pm_todos_insert ON pm_todos FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_todos_update ON pm_todos FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY pm_todos_delete ON pm_todos FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);


-- ============================================================
-- STEP 3: FIX STORAGE BUCKET — make private
-- ============================================================

-- Make the bucket private (no anonymous direct access)
UPDATE storage.buckets
SET public = false
WHERE id = 'client-uploads';

-- ============================================================
-- STEP 4: CREATE PROPER STORAGE POLICIES
-- Authenticated users can read/upload/delete
-- Service role (portal API) gets full access automatically (bypasses RLS)
-- ============================================================

-- Authenticated users can upload to client-uploads bucket
CREATE POLICY "authenticated_upload_client_uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'client-uploads'
    AND auth.uid() IS NOT NULL
  );

-- Authenticated users can read from client-uploads bucket
CREATE POLICY "authenticated_read_client_uploads" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'client-uploads'
    AND auth.uid() IS NOT NULL
  );

-- Authenticated users can update files in client-uploads bucket
CREATE POLICY "authenticated_update_client_uploads" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'client-uploads'
    AND auth.uid() IS NOT NULL
  )
  WITH CHECK (
    bucket_id = 'client-uploads'
    AND auth.uid() IS NOT NULL
  );

-- Authenticated users can delete files from client-uploads bucket
CREATE POLICY "authenticated_delete_client_uploads" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'client-uploads'
    AND auth.uid() IS NOT NULL
  );

COMMIT;
