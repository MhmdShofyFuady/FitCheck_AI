// @ts-nocheck — Deno runtime (URL imports + `Deno` global); VS Code's Node TS server can't resolve them.
// Supabase Edge Function: process-tryon
// Runtime: Deno (Supabase Edge Functions)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Client } from 'https://esm.sh/@gradio/client';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessTryOnPayload {
  job_id?: string;
  person_image_path?: string;
  garment_image_path?: string;
  prompt?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as ProcessTryOnPayload;
    const hfToken = Deno.env.get('HF_TOKEN');

    if (!body.job_id) {
      return new Response(JSON.stringify({ error: 'job_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Update status job menjadi 'processing'
    await supabase
      .from('tryon_jobs')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', body.job_id)
      .eq('user_id', user.id);

    let resultPath = `${user.id}/results/${body.job_id}-mock.jpg`;
    let signedResultUrl: string | undefined;

    // 2. Integrasi Gratis Hugging Face Spaces ZeroGPU (yisol/IDM-VTON)
    if (body.person_image_path && body.garment_image_path) {
      const [personDownload, garmentDownload] = await Promise.all([
        supabase.storage.from('tryon-photos').download(body.person_image_path),
        supabase.storage.from('tryon-photos').download(body.garment_image_path),
      ]);

      if (personDownload.data && garmentDownload.data) {
        const app = await Client.connect(
          'yisol/IDM-VTON',
          hfToken ? { hf_token: hfToken } : undefined
        );
        const prediction = await app.predict('/tryon', [
          { background: personDownload.data, layers: [], composite: null },
          garmentDownload.data,
          body.prompt || 'Short sleeve top',
          true,
          false,
          30,
          42,
        ]);

        const outputUrl = prediction?.data?.[0]?.url;
        if (outputUrl) {
          const aiRes = await fetch(outputUrl);
          if (aiRes.ok) {
            const outputBlob = await aiRes.blob();
            resultPath = `${user.id}/results/${body.job_id}.jpg`;
            await supabase.storage
              .from('tryon-photos')
              .upload(resultPath, outputBlob, { contentType: 'image/jpeg', upsert: true });

            const { data: signed } = await supabase.storage
              .from('tryon-photos')
              .createSignedUrl(resultPath, 3600);
            signedResultUrl = signed?.signedUrl;
          }
        }
      }
    }

    // 3. Tandai job selesai ('done')
    const { data: updatedJob, error: updateError } = await supabase
      .from('tryon_jobs')
      .update({
        status: 'done',
        result_image_path: resultPath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.job_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        message: signedResultUrl ? 'Try-on processed via IDM-VTON' : 'Try-on processed (mock)',
        job: updatedJob,
        result_url: signedResultUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
