// src/routes/api/twilio/send-message.ts
import { Handlers } from '$fresh/server.ts';

export const handler: Handlers = {
  async POST(req) {
    try {
      const { to, body } = await req.json();
      
      const accountSid = Deno.env.get('VITE_TWILIO_ACCOUNT_SID');
      const authToken = Deno.env.get('VITE_TWILIO_AUTH_TOKEN');
      const fromNumber = Deno.env.get('VITE_TWILIO_WHATSAPP_FROM');

      if (!accountSid || !authToken || !fromNumber) {
        return new Response(JSON.stringify({ error: 'Twilio credentials not configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: to,
          Body: body
        })
      });

      const responseText = await response.text();

      if (!response.ok) {
        return new Response(JSON.stringify({ 
          error: `Twilio API error: ${response.status}`,
          details: responseText 
        }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const data = JSON.parse(responseText);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error in Twilio proxy:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};