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
    const { phoneNumbers, message, location, liveLocationUrl } = await req.json();
    
    const FAST2SMS_API_KEY = Deno.env.get('FAST2SMS_API_KEY');
    if (!FAST2SMS_API_KEY) {
      throw new Error('FAST2SMS_API_KEY is not configured');
    }

    console.log('Sending SMS to:', phoneNumbers);
    console.log('Message:', message);

    // Format phone numbers - remove +91 prefix if present and clean
    const formattedNumbers = phoneNumbers.map((num: string) => {
      return num.replace(/[\s\-\+]/g, '').replace(/^91/, '');
    }).join(',');

    // Build the message with location
    let fullMessage = message;
    if (location) {
      fullMessage += `\n\nCurrent Location: https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    }
    if (liveLocationUrl) {
      fullMessage += `\n\nLive Tracking: ${liveLocationUrl}`;
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
    console.log('Fast2SMS response:', result);

    if (!result.return) {
      throw new Error(result.message || 'Failed to send SMS');
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'SMS sent successfully',
      details: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('SMS sending error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
