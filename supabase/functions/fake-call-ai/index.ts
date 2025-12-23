import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_PERSONAS = ['father', 'mother', 'friend', 'brother'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user for fake call:', user.id);

    const { persona, userMessage, conversationHistory } = await req.json();
    
    // Validate persona
    const validPersona = ALLOWED_PERSONAS.includes(persona) ? persona : 'father';
    
    // Validate and sanitize user message
    const sanitizedUserMessage = typeof userMessage === 'string' 
      ? userMessage.trim().substring(0, 500) 
      : null;

    // Validate conversation history
    const validHistory = Array.isArray(conversationHistory) 
      ? conversationHistory.slice(-10).filter(
          (msg: any) => 
            msg && 
            typeof msg.role === 'string' && 
            typeof msg.content === 'string' &&
            ['user', 'assistant', 'system'].includes(msg.role)
        ).map((msg: any) => ({
          role: msg.role,
          content: msg.content.substring(0, 500)
        }))
      : [];

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Service unavailable', message: "Hello? Can you hear me?" }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const personaPrompts: Record<string, string> = {
      father: `You are playing the role of a caring Indian father on a phone call. Your name is Papa/Dad. You speak in a warm, protective manner mixing Hindi and English naturally. You're checking in on your daughter/son. Keep responses short (1-2 sentences) as this is a phone conversation. Use phrases like "beta", "kaise ho", show concern for their safety. If they seem distressed, offer to come pick them up or send help. Be natural and conversational.`,
      mother: `You are playing the role of a loving Indian mother on a phone call. Your name is Mummy/Mom. You speak warmly mixing Hindi and English. You're calling to check on your child. Keep responses short (1-2 sentences). Use phrases like "beta", "khana khaya?", show maternal concern. If they sound worried, immediately offer help and comfort. Be natural and caring.`,
      friend: `You are playing the role of a close friend on a phone call. Your name is Priya. You're casual, fun, but also protective. Keep responses short (1-2 sentences). You called to chat about weekend plans. If your friend seems uncomfortable or signals distress, offer to come immediately or stay on the line. Be natural and supportive.`,
      brother: `You are playing the role of an older protective brother on a phone call. Your name is Bhaiya. You mix Hindi and English casually. Keep responses short (1-2 sentences). You're checking in on your sister. If she seems uncomfortable, immediately offer to come get her or send help. Be protective but not overbearing.`,
    };

    const systemPrompt = personaPrompts[validPersona];

    const messages = [
      { role: 'system', content: systemPrompt },
      ...validHistory,
    ];

    if (sanitizedUserMessage) {
      messages.push({ role: 'user', content: sanitizedUserMessage });
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
      console.error('AI API error:', response.status);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ 
        error: 'Service temporarily unavailable',
        message: "Hello beta, how are you?" // Fallback
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "Hello beta, how are you?";

    return new Response(JSON.stringify({ 
      message: aiMessage,
      persona: validPersona 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Fake call AI error:', error);
    return new Response(JSON.stringify({ 
      error: 'Service temporarily unavailable',
      message: "Hello? Can you hear me?" // Fallback message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
