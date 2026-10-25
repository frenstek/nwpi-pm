import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // POST — upload file
    if (req.method === 'POST') {
      const { draftId, fileName, fileData, contentType } = req.body || {};
      if (!draftId || !fileData) return res.status(400).json({ error: 'draftId and fileData required' });

      const buffer = Buffer.from(fileData, 'base64');
      const ext = fileName?.split('.').pop() || 'jpg';
      const path = `${draftId}/${Date.now()}-${fileName || `plan.${ext}`}`;

      const { data, error } = await supabase.storage
        .from('floor-plans')
        .upload(path, buffer, { contentType: contentType || 'image/jpeg', upsert: false });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('floor-plans')
        .getPublicUrl(path);

      return res.json({ path, url: urlData.publicUrl });
    }

    // GET — list files for a draft
    if (req.method === 'GET') {
      const { draftId } = req.query;
      if (!draftId) return res.status(400).json({ error: 'draftId required' });

      const { data, error } = await supabase.storage
        .from('floor-plans')
        .list(draftId, { sortBy: { column: 'created_at', order: 'asc' } });

      if (error) throw error;

      const files = (data || []).map(f => ({
        name: f.name,
        path: `${draftId}/${f.name}`,
        url: supabase.storage.from('floor-plans').getPublicUrl(`${draftId}/${f.name}`).data.publicUrl,
        size: f.metadata?.size,
        created: f.created_at,
      }));

      return res.json(files);
    }

    // DELETE — remove a file
    if (req.method === 'DELETE') {
      const { path } = req.body || {};
      if (!path) return res.status(400).json({ error: 'path required' });

      const { error } = await supabase.storage
        .from('floor-plans')
        .remove([path]);

      if (error) throw error;
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Floor plans API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
