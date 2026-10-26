// Returns the public Google Client ID so login.html can initialize Google Sign-In.
// (The Client ID is public; GOOGLE_CLIENT_ID env var overrides this default.)
const DEFAULT_CLIENT_ID = '848559795512-nrc7d8ctgsbt8l3b58qsffv3clbe7d8u.apps.googleusercontent.com';

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ clientId: process.env.GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID });
};
