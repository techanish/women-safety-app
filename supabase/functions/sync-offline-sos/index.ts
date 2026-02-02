import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

declare const Deno: any;

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const fastToSmsApiKey = Deno.env.get('FAST2SMS_API_KEY') || ''

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

interface SOSEvent {
  id: string
  type: 'sos' | 'location_update'
  timestamp: number
  location: { latitude: number; longitude: number } | null
  contacts: Array<{ phone: string; name: string }>
  synced: boolean
  clerkUserId?: string
}

serve(async (req: any) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { events } = await req.json()

    if (!Array.isArray(events) || events.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No events provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const syncedEvents = []
    const failedEvents = []

    for (const event of events) {
      try {
        // Send SMS for each event
        const mapsUrl = event.location
          ? `https://maps.google.com/?q=${event.location.latitude},${event.location.longitude}`
          : null

        const message = event.type === 'sos'
          ? `🆘 EMERGENCY ALERT!\n\nI need help immediately. This is an automated SOS alert from SafeHer app.\n\n${mapsUrl ? `📍 Location: ${mapsUrl}` : ''}`
          : `📍 Location Update from SafeHer:\n\nI'm sharing my current location with you for safety.\n\n${mapsUrl ? `View location: ${mapsUrl}` : ''}`

        // Send SMS via Fast2SMS API
        if (event.contacts && event.contacts.length > 0 && fastToSmsApiKey) {
          for (const contact of event.contacts) {
            try {
              const smsResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
                method: 'POST',
                headers: {
                  'authorization': fastToSmsApiKey,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  variables_values: message,
                  route: 'otp',
                  numbers: contact.phone,
                }).toString(),
              })

              if (!smsResponse.ok) {
                console.error(`Failed to send SMS to ${contact.phone}`)
              }
            } catch (error) {
              console.error(`SMS send error for ${contact.phone}:`, error)
            }
          }
        }

        // Log the synced event
        const { error: logError } = await supabase
          .from('sos_logs')
          .insert({
            id: event.id,
            clerk_user_id: event.clerkUserId,
            event_type: event.type,
            location: event.location ? {
              latitude: event.location.latitude,
              longitude: event.location.longitude,
            } : null,
            contact_count: event.contacts?.length || 0,
            timestamp: new Date(event.timestamp).toISOString(),
            synced_at: new Date().toISOString(),
          })

        if (logError) {
          console.error(`Failed to log event ${event.id}:`, logError)
          failedEvents.push(event.id)
        } else {
          syncedEvents.push(event.id)
        }
      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error)
        failedEvents.push(event.id)
      }
    }

    return new Response(
      JSON.stringify({
        success: failedEvents.length === 0,
        syncedCount: syncedEvents.length,
        failedCount: failedEvents.length,
        syncedEvents,
        failedEvents,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
