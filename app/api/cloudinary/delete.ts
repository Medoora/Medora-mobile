/* Not Working */

export async function DELETE(request: Request) {
  try {
    const { publicId } = await request.json();
    
    if (!publicId) {
      return new Response(JSON.stringify({ error: 'publicId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return new Response(JSON.stringify({ error: 'Cloudinary credentials missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const crypto = require('crypto-js');
    const signature = crypto.SHA256(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).toString();

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST', // Cloudinary's destroy endpoint uses POST
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_id: publicId,
        api_key: apiKey,
        timestamp: timestamp,
        signature: signature,
      }),
    });

    const data = await response.json();

    if (data.result === 'ok') {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Cloudinary deletion failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}