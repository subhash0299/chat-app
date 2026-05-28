export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false
    });
  }

  const {
    adminPassword,
    roomName,
    roomPassword,
    expiry
  } = req.body;

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: "Wrong admin password"
    });
  }

  const firebaseUrl =
    "https://minimal-chat-d0518-default-rtdb.asia-southeast1.firebasedatabase.app";

  const roomCheck = await fetch(
    `${firebaseUrl}/rooms/${roomName}.json`
  );

  const existingRoom = await roomCheck.json();

  if (existingRoom) {
    return res.json({
      success: false,
      message: "Room already exists"
    });
  }

  const roomsRes = await fetch(
    `${firebaseUrl}/rooms.json`
  );

  const rooms = await roomsRes.json();

  const roomCount = rooms
    ? Object.keys(rooms).length
    : 0;

  if (roomCount >= 5) {
    return res.json({
      success: false,
      message: "Maximum 5 rooms allowed"
    });
  }

  await fetch(
    `${firebaseUrl}/rooms/${roomName}.json`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        password: roomPassword,
        expiry,
        createdAt: Date.now()
      })
    }
  );

  res.json({
    success: true
  });
}
