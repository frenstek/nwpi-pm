import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // GET — fetch latest config (exclude inclusions rows)
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('estimator_configs')
        .select('*')
        .neq('updated_by', '__inclusions__')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code === 'PGRST116') {
        return res.json({ config: null });
      }
      if (error) throw error;
      return res.json(data);
    }

    // POST — save config
    if (req.method === 'POST') {
      const { config, updated_by } = req.body || {};
      if (!config) return res.status(400).json({ error: 'config required' });

      const { data: existing } = await supabase
        .from('estimator_configs')
        .select('id')
        .neq('updated_by', '__inclusions__')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from('estimator_configs')
          .update({
            config,
            updated_by: updated_by || 'unknown',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return res.json(data);
      } else {
        const { data, error } = await supabase
          .from('estimator_configs')
          .insert({
            config,
            updated_by: updated_by || 'unknown',
          })
          .select()
          .single();
        if (error) throw error;
        return res.status(201).json(data);
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Config API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
