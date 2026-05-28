export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false
    });
  }

  const {
    adminPassword,
    roomName
  } = req.body;

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false
    });
  }

  const firebaseUrl =
    "https://minimal-chat-d0518-default-rtdb.asia-southeast1.firebasedatabase.app";

  await fetch(
    `${firebaseUrl}/rooms/${roomName}.json`,
    {
      method: "DELETE"
    }
  );

  res.json({
    success: true
  });
}
