export default function handler(req, res) {
  const { password } = req.body;

  if (password === process.env.LOGIN_PASSWORD) {
    return res.status(200).json({
      success: true
    });
  }

  return res.status(401).json({
    success: false
  });
}