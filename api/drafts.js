import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const action = req.query.action || '';

    // GET — list all drafts
    if (req.method === 'GET' && action === 'list') {
      const { data, error } = await supabase
        .from('estimator_drafts')
        .select('id, client_name, site_address, status, current_step, last_category, completed_steps, created_at, updated_at')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    }

    // GET — load single draft
    if (req.method === 'GET' && action === 'get') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data, error } = await supabase
        .from('estimator_drafts')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return res.json(data);
    }

    // POST — create new draft
    if (req.method === 'POST' && action === 'create') {
      const { client_name, site_address, form_data, completed_steps, current_step, last_category } = req.body || {};
      const { data, error } = await supabase
        .from('estimator_drafts')
        .insert({
          client_name: client_name || 'Untitled Quote',
          site_address: site_address || '',
          form_data: form_data || {},
          completed_steps: completed_steps || [],
          current_step: current_step || 0,
          last_category: last_category || '',
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    // PATCH — update draft
    if (req.method === 'PATCH') {
      const body = req.body || {};
      const id = body.id;
      if (!id) return res.status(400).json({ error: 'id required' });
      const allowed = ['form_data', 'current_step', 'completed_steps', 'status', 'client_name', 'site_address', 'last_category'];
      const updates = { updated_at: new Date().toISOString() };
      for (const key of allowed) {
        if (body[key] !== undefined) updates[key] = body[key];
      }
      const { data, error } = await supabase
        .from('estimator_drafts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }

    // DELETE — delete draft
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase
        .from('estimator_drafts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error('Drafts API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
