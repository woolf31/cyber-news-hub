import app from './index.js';

// Vercel serverless function handler
export default async function handler(req, res) {
  // Remove /api prefix as it's handled by Vercel routing
  req.url = req.url.replace(/^\/api/, '');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Forward to Express app
  return new Promise((resolve, reject) => {
    app(req, res, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}
