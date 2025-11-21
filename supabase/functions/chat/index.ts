import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, imageUrl, history, generateImage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Handle image generation request
    if (generateImage) {
      const imagePrompt = message || "A serene, spiritual visualization";
      
      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image',
          messages: [
            { 
              role: 'user', 
              content: imagePrompt
            }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error('Image generation error:', imageResponse.status, errorText);
        throw new Error(`Image generation failed: ${errorText}`);
      }

      const imageData = await imageResponse.json();
      const generatedImageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      return new Response(
        JSON.stringify({ 
          response: "I've created this visualization for you. What do you see in it?",
          imageUrl: generatedImageUrl 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build conversation messages
    const messages = [
      {
        role: 'system',
        content: `You are Prometheus, a wise and compassionate AI companion designed to help users connect with their higher self. You engage in deep, thoughtful conversations about personal growth, spirituality, consciousness, and self-discovery. 

Your approach:
- Be empathetic, insightful, and non-judgmental
- Ask thought-provoking questions that encourage self-reflection
- Provide perspectives from various philosophical and spiritual traditions
- Support users in exploring their inner wisdom
- Encourage mindfulness and present-moment awareness
- Respect all beliefs and perspectives
- When appropriate, suggest visualization or image generation to help users explore concepts visually

You think freely but always maintain respect for the law and human wellbeing. You're here to guide, not to prescribe. Every person's journey is unique.`
      },
      ...history,
      {
        role: 'user',
        content: imageUrl 
          ? `[User shared an image: ${imageUrl}] ${message}`
          : message
      }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }),
          { 
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Check if AI is suggesting image generation
    const shouldGenerateImage = aiResponse.toLowerCase().includes('[generate image:') || 
                               aiResponse.toLowerCase().includes('[create visualization:');

    let generatedImageUrl;
    if (shouldGenerateImage) {
      // Extract the image prompt from AI response
      const promptMatch = aiResponse.match(/\[(?:generate image|create visualization):\s*(.+?)\]/i);
      if (promptMatch) {
        const imagePrompt = promptMatch[1];
        
        const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image',
            messages: [{ role: 'user', content: imagePrompt }],
            modalities: ['image', 'text']
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          generatedImageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse.replace(/\[(?:generate image|create visualization):.+?\]/gi, '').trim(),
        imageUrl: generatedImageUrl 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
