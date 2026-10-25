import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

export const config = { api: { bodyParser: { sizeLimit: '20mb' } } }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { action, token } = req.query

  try {
    // ── Validate token and get link ──
    if (action === 'validate' && req.method === 'GET') {
      if (!token) return res.status(400).json({ error: 'Token required' })
      const { data, error } = await supabase
        .from('pm_upload_links')
        .select('*')
        .eq('token', token)
        .eq('is_active', true)
        .single()
      if (error || !data) return res.status(404).json({ error: 'Invalid or expired link' })
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return res.status(410).json({ error: 'This upload link has expired' })
      }
      return res.json(data)
    }

    // ── List properties for a link ──
    if (action === 'properties' && req.method === 'GET') {
      if (!token) return res.status(400).json({ error: 'Token required' })
      const { data: link } = await supabase.from('pm_upload_links').select('id').eq('token', token).eq('is_active', true).single()
      if (!link) return res.status(404).json({ error: 'Invalid link' })
      const { data, error } = await supabase
        .from('pm_upload_properties')
        .select('*')
        .eq('link_id', link.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      return res.json(data || [])
    }

    // ── Add property ──
    if (action === 'add-property' && req.method === 'POST') {
      if (!token) return res.status(400).json({ error: 'Token required' })
      const { address } = req.body
      if (!address || !address.trim()) return res.status(400).json({ error: 'Address required' })
      const { data: link } = await supabase.from('pm_upload_links').select('id').eq('token', token).eq('is_active', true).single()
      if (!link) return res.status(404).json({ error: 'Invalid link' })
      const { data, error } = await supabase
        .from('pm_upload_properties')
        .insert({ link_id: link.id, address: address.trim() })
        .select()
        .single()
      if (error) throw error
      return res.status(201).json(data)
    }

    // ── Upload file ──
    if (action === 'upload' && req.method === 'POST') {
      if (!token) return res.status(400).json({ error: 'Token required' })
      const { property_id, category, file_name, file_data, content_type, notes } = req.body
      if (!property_id || !category || !file_name || !file_data) {
        return res.status(400).json({ error: 'property_id, category, file_name, file_data required' })
      }
      const validCategories = ['floor_plan', 'engineering', 'architecture', 'soil_test', 'other']
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: 'Invalid category' })
      }
      // Verify link
      const { data: link } = await supabase.from('pm_upload_links').select('id').eq('token', token).eq('is_active', true).single()
      if (!link) return res.status(404).json({ error: 'Invalid link' })
      // Verify property belongs to link
      const { data: prop } = await supabase.from('pm_upload_properties').select('id').eq('id', property_id).eq('link_id', link.id).single()
      if (!prop) return res.status(404).json({ error: 'Property not found' })

      // Upload to Supabase storage
      const buffer = Buffer.from(file_data, 'base64')
      const filePath = `${link.id}/${property_id}/${Date.now()}-${file_name}`
      const { error: uploadErr } = await supabase.storage
        .from('client-uploads')
        .upload(filePath, buffer, { contentType: content_type || 'application/octet-stream', upsert: false })
      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage.from('client-uploads').getPublicUrl(filePath)

      // Save metadata
      const { data, error } = await supabase
        .from('pm_client_uploads')
        .insert({
          property_id,
          link_id: link.id,
          category,
          file_name,
          file_url: urlData.publicUrl,
          file_size: buffer.length,
          file_type: content_type,
          notes,
        })
        .select()
        .single()
      if (error) throw error
      return res.status(201).json(data)
    }

    // ── List uploads for a property ──
    if (action === 'files' && req.method === 'GET') {
      const { property_id } = req.query
      if (!token || !property_id) return res.status(400).json({ error: 'Token and property_id required' })
      const { data: link } = await supabase.from('pm_upload_links').select('id').eq('token', token).eq('is_active', true).single()
      if (!link) return res.status(404).json({ error: 'Invalid link' })
      const { data, error } = await supabase
        .from('pm_client_uploads')
        .select('*')
        .eq('property_id', property_id)
        .eq('link_id', link.id)
        .order('uploaded_at', { ascending: false })
      if (error) throw error
      return res.json(data || [])
    }

    // ── Save notes for a property ──
    if (action === 'save-notes' && req.method === 'POST') {
      if (!token) return res.status(400).json({ error: 'Token required' })
      const { property_id, notes } = req.body
      if (!property_id) return res.status(400).json({ error: 'property_id required' })
      const { data: link } = await supabase.from('pm_upload_links').select('id').eq('token', token).eq('is_active', true).single()
      if (!link) return res.status(404).json({ error: 'Invalid link' })
      const { data, error } = await supabase
        .from('pm_upload_properties')
        .update({ notes: notes || {} })
        .eq('id', property_id)
        .eq('link_id', link.id)
        .select()
        .single()
      if (error) throw error
      return res.json(data)
    }

    // ── Get notes for a property ──
    if (action === 'get-notes' && req.method === 'GET') {
      const { property_id } = req.query
      if (!token || !property_id) return res.status(400).json({ error: 'Token and property_id required' })
      const { data: link } = await supabase.from('pm_upload_links').select('id').eq('token', token).eq('is_active', true).single()
      if (!link) return res.status(404).json({ error: 'Invalid link' })
      const { data, error } = await supabase
        .from('pm_upload_properties')
        .select('notes')
        .eq('id', property_id)
        .eq('link_id', link.id)
        .single()
      if (error) throw error
      return res.json(data?.notes || {})
    }

    // ── Delete file ──
    if (action === 'delete-file' && req.method === 'DELETE') {
      const { file_id } = req.query
      if (!token || !file_id) return res.status(400).json({ error: 'Token and file_id required' })
      const { data: link } = await supabase.from('pm_upload_links').select('id').eq('token', token).eq('is_active', true).single()
      if (!link) return res.status(404).json({ error: 'Invalid link' })
      // Get file to delete from storage
      const { data: file } = await supabase.from('pm_client_uploads').select('*').eq('id', file_id).eq('link_id', link.id).single()
      if (!file) return res.status(404).json({ error: 'File not found' })
      // Delete from storage
      const path = file.file_url.split('/client-uploads/')[1]
      if (path) await supabase.storage.from('client-uploads').remove([decodeURIComponent(path)])
      // Delete metadata
      const { error } = await supabase.from('pm_client_uploads').delete().eq('id', file_id)
      if (error) throw error
      return res.json({ success: true })
    }

    // ── Admin: list all links ──
    if (action === 'admin-links' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('pm_upload_links')
        .select('*, pm_upload_properties(count), pm_client_uploads(count)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return res.json(data || [])
    }

    // ── Admin: create link ──
    if (action === 'admin-create-link' && req.method === 'POST') {
      const { client_name, client_email } = req.body
      if (!client_name) return res.status(400).json({ error: 'Client name required' })
      const { data, error } = await supabase
        .from('pm_upload_links')
        .insert({ client_name, client_email })
        .select()
        .single()
      if (error) throw error
      return res.status(201).json(data)
    }

    // ── Admin: toggle link active ──
    if (action === 'admin-toggle-link' && req.method === 'POST') {
      const { link_id, is_active } = req.body
      if (!link_id) return res.status(400).json({ error: 'link_id required' })
      const { data, error } = await supabase
        .from('pm_upload_links')
        .update({ is_active })
        .eq('id', link_id)
        .select()
        .single()
      if (error) throw error
      return res.json(data)
    }

    // ── Admin: get all uploads for a link ──
    if (action === 'admin-uploads' && req.method === 'GET') {
      const { link_id } = req.query
      if (!link_id) return res.status(400).json({ error: 'link_id required' })
      const { data: properties, error: pErr } = await supabase
        .from('pm_upload_properties')
        .select('*')
        .eq('link_id', link_id)
        .order('created_at')
      if (pErr) throw pErr
      const { data: files, error: fErr } = await supabase
        .from('pm_client_uploads')
        .select('*')
        .eq('link_id', link_id)
        .order('uploaded_at', { ascending: false })
      if (fErr) throw fErr
      return res.json({ properties: properties || [], files: files || [] })
    }

    return res.status(400).json({ error: 'Invalid action' })
  } catch (err) {
    console.error('Client uploads error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
