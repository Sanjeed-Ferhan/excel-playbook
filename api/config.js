// Returns the public Google Client ID so login.html can initialize Google Sign-In.
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ clientId: process.env.GOOGLE_CLIENT_ID || '' });
};
