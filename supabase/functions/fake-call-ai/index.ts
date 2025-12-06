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
    const { persona, userMessage, conversationHistory } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const personaPrompts: Record<string, string> = {
      father: `You are playing the role of a caring Indian father on a phone call. Your name is Papa/Dad. You speak in a warm, protective manner mixing Hindi and English naturally. You're checking in on your daughter/son. Keep responses short (1-2 sentences) as this is a phone conversation. Use phrases like "beta", "kaise ho", show concern for their safety. If they seem distressed, offer to come pick them up or send help. Be natural and conversational.`,
      mother: `You are playing the role of a loving Indian mother on a phone call. Your name is Mummy/Mom. You speak warmly mixing Hindi and English. You're calling to check on your child. Keep responses short (1-2 sentences). Use phrases like "beta", "khana khaya?", show maternal concern. If they sound worried, immediately offer help and comfort. Be natural and caring.`,
      friend: `You are playing the role of a close friend on a phone call. Your name is Priya. You're casual, fun, but also protective. Keep responses short (1-2 sentences). You called to chat about weekend plans. If your friend seems uncomfortable or signals distress, offer to come immediately or stay on the line. Be natural and supportive.`,
      brother: `You are playing the role of an older protective brother on a phone call. Your name is Bhaiya. You mix Hindi and English casually. Keep responses short (1-2 sentences). You're checking in on your sister. If she seems uncomfortable, immediately offer to come get her or send help. Be protective but not overbearing.`,
    };

    const systemPrompt = personaPrompts[persona] || personaPrompts.father;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
    ];

    if (userMessage) {
      messages.push({ role: 'user', content: userMessage });
    } else {
      // First message - initiate the call
      messages.push({ role: 'user', content: 'The call just connected. Say hello and start the conversation naturally.' });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 100,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited. Please try again.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error('AI service error');
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "Hello beta, how are you?";

    return new Response(JSON.stringify({ 
      message: aiMessage,
      persona 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Fake call AI error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: "Hello? Can you hear me?" // Fallback message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
