import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

function parseJsonSafely(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new HttpError('ELEVENLABS_API_KEY is not set', 500);
    }

    // Verify the user is authenticated and is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new HttpError('No authorization header', 401);
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new HttpError('Unauthorized', 401);
    }

    // Check if user is admin OR has active subscription
    const { data: isAdmin } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    // Also check subscription status
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single();

    const isSubscribed = profile?.subscription_status === 'active';

    if (!isAdmin && !isSubscribed) {
      throw new HttpError('Voice features are only available for VIP users', 403);
    }

    const rawBody = await req.json();

    // Input validation
    const text = typeof rawBody.text === 'string' ? rawBody.text.slice(0, 5000) : '';
    const voiceId = typeof rawBody.voiceId === 'string' && /^[a-zA-Z0-9]{10,30}$/.test(rawBody.voiceId)
      ? rawBody.voiceId
      : 'EXAVITQu4vr4xnSDxMaL';

    if (!text) {
      throw new HttpError('Text is required', 400);
    }

    console.log(`Generating TTS for text: "${text.substring(0, 50)}..." with voice: ${voiceId}`);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const parsedError = parseJsonSafely(errorText);
      const providerStatus = parsedError?.detail?.status;

      console.error('ElevenLabs TTS error:', errorText);

      if (response.status === 401 && providerStatus === 'payment_issue') {
        throw new HttpError('Voice provider billing issue. Complete the latest ElevenLabs invoice to re-enable TTS.', 503);
      }

      if (response.status === 401) {
        throw new HttpError('ElevenLabs credentials are invalid or expired.', 502);
      }

      throw new HttpError(`TTS generation failed: ${response.status}`, 502);
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = error instanceof HttpError
      ? error.status
      : message.includes('VIP')
        ? 403
        : 500;

    console.error('TTS Error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
