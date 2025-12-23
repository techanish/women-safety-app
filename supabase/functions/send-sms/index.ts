import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate Indian phone number format (10 digits starting with 6-9)
const isValidIndianPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s\-\+]/g, '').replace(/^91/, '');
  return /^[6-9]\d{9}$/.test(cleaned);
};

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
        JSON.stringify({ success: false, error: 'Authentication required' }),
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
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const { phoneNumbers, message, location, liveLocationUrl } = await req.json();

    // Validate phone numbers array
    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone numbers required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate phone number format (Indian numbers)
    const invalidNumbers = phoneNumbers.filter((num: string) => !isValidIndianPhone(num));
    if (invalidNumbers.length > 0) {
      console.error('Invalid phone numbers detected');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid phone number format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: max 10 SMS per hour per user
    // In production, you'd want to store this in a database or Redis
    // For now, we'll log the request count
    console.log('SMS request from user:', user.id, 'to', phoneNumbers.length, 'recipients');
    
    const FAST2SMS_API_KEY = Deno.env.get('FAST2SMS_API_KEY');
    if (!FAST2SMS_API_KEY) {
      console.error('FAST2SMS_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'SMS service unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit message length
    const sanitizedMessage = message.trim().substring(0, 500);

    // Format phone numbers - remove +91 prefix if present and clean
    const formattedNumbers = phoneNumbers.map((num: string) => {
      return num.replace(/[\s\-\+]/g, '').replace(/^91/, '');
    }).join(',');

    // Build the message with location
    let fullMessage = sanitizedMessage;
    if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
      fullMessage += `\n\nCurrent Location: https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    }
    if (liveLocationUrl && typeof liveLocationUrl === 'string') {
      // Validate URL format
      try {
        new URL(liveLocationUrl);
        fullMessage += `\n\nLive Tracking: ${liveLocationUrl}`;
      } catch {
        // Invalid URL, skip it
        console.warn('Invalid live location URL provided');
      }
    }

    // Send SMS using Fast2SMS Quick SMS route
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'q', // Quick SMS route
        message: fullMessage,
        language: 'english',
        flash: 0,
        numbers: formattedNumbers,
      }),
    });

    const result = await response.json();
    console.log('Fast2SMS response status:', result.return ? 'success' : 'failed');

    if (!result.return) {
      console.error('Fast2SMS API error');
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send SMS' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'SMS sent successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('SMS sending error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Failed to send SMS'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
