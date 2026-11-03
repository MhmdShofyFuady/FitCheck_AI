// Supabase Edge Function: process-tryon
// Runtime: Deno (Supabase Edge Functions)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessTryOnPayload {
  job_id: string;
  person_image_path?: string;
  garment_image_path?: string;
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

    // TODO: Integrasi Google Vertex AI Virtual Try-On (model: virtual-try-on-001)
    // 1. Unduh gambar dari bucket privat 'tryon-photos' menggunakan body.person_image_path & body.garment_image_path
    // 2. Konversi kedua gambar ke base64
    // 3. Lakukan HTTP POST ke endpoint Google Vertex AI:
    //    https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/virtual-try-on-001:predict
    //    dengan payload:
    //    {
    //      instances: [{
    //        personImage: { image: { bytesBase64Encoded: personBase64 } },
    //        productImages: [{ image: { bytesBase64Encoded: garmentBase64 } }]
    //      }],
    //      parameters: { sampleCount: 1 }
    //    }
    // 4. Simpan hasil gambar base64 dari Vertex AI ke Supabase Storage (`${user.id}/results/${body.job_id}.jpg`)

    const mockResultPath = `${user.id}/results/${body.job_id}-mock.jpg`;

    // 2. Tandai job selesai ('done') dengan path hasil sementara (mock)
    const { data: updatedJob, error: updateError } = await supabase
      .from('tryon_jobs')
      .update({
        status: 'done',
        result_image_path: mockResultPath,
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
        message: 'Try-on job processed (mock)',
        job: updatedJob,
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
