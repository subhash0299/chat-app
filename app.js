import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
  get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


// --------------------
// FIREBASE
// --------------------

const firebaseConfig = {
  apiKey: "AIzaSyBU0GF_sKTKTL9FC1_zqKBxUJgf_D1jjSk",
  authDomain: "minimal-chat-d0518.firebaseapp.com",
  databaseURL: "https://minimal-chat-d0518-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "minimal-chat-d0518",
  storageBucket: "minimal-chat-d0518.firebasestorage.app",
  messagingSenderId: "459161356609",
  appId: "1:459161356609:web:4c4c86deac59b5e6d279c0",
  measurementId: "G-1Q53BR3XFE"
};

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

// --------------------
// VARIABLES
// --------------------

let currentRoom =
  localStorage.getItem("currentRoom") || null;

let currentRoomPassword =
  localStorage.getItem("currentRoomPassword") || null;

let messagesRef = null;


// --------------------
// ELEMENTS
// --------------------

const messagesDiv =
  document.getElementById("messages");

const rememberMe = 
  document.getElementById("rememberMe");

const sendBtn =
  document.getElementById("sendBtn");

const messageInput =
  document.getElementById("messageInput");

const nameInput =
  document.getElementById("name");

const loginBtn =
  document.getElementById("loginBtn");

const passwordInput =
  document.getElementById("passwordInput");

const loginScreen =
  document.getElementById("loginScreen");

const chatScreen =
  document.getElementById("chatScreen");

const clearBtn =
  document.getElementById("clearBtn");

const createRoomBtn =
  document.getElementById("createRoomBtn");

const joinRoomBtn =
  document.getElementById("joinRoomBtn");

const deleteRoomBtn =
  document.getElementById("deleteRoomBtn");

const currentRoomText =
  document.getElementById("currentRoom");


// --------------------
// LOGIN
// --------------------

const savedLogin =
  localStorage.getItem("isLoggedIn");

if (savedLogin === "true") {

  loginScreen.style.display = "none";

  chatScreen.style.display = "block";
}

loginBtn.addEventListener("click", async () => {

  try {

    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        password: passwordInput.value
      })
    });

    const data = await response.json();

    if (data.success) {

      if (rememberMe.checked) {

        localStorage.setItem(
          "isLoggedIn",
          "true"
        );
      }

      loginScreen.style.display = "none";

      chatScreen.style.display = "block";

    } else {

      alert("Wrong password");
    }

  } catch (err) {

    console.error(err);

    alert("Login API failed");
  }
});



// --------------------
// SAVE NAME
// --------------------

const savedName =
  localStorage.getItem("chatName");

if (savedName) {

  nameInput.value = savedName;
}

nameInput.addEventListener("input", () => {

  localStorage.setItem(
    "chatName",
    nameInput.value
  );
});


// --------------------
// CREATE ROOM
// --------------------

createRoomBtn.addEventListener("click", async () => {

  const adminPassword =
    prompt("Enter admin password");

  if (!adminPassword) return;

  const roomName =
    prompt("Enter room name");

  if (!roomName) return;

  const roomPassword =
    prompt("Enter room password");

  if (!roomPassword) return;

  const expiryOption = prompt(
    `Choose expiry:
    
    1 = Instant
    2 = 2 Hours
    3 = 10 Hours
    4 = 24 Hours`
      );

  let expiry = 0;

  if (expiryOption === "2") {
    expiry = 7200000;
  }

  if (expiryOption === "3") {
    expiry = 36000000;
  }

  if (expiryOption === "4") {
    expiry = 86400000;
  }

  try {

    const response = await fetch(
      "/api/create-room",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          adminPassword,
          roomName,
          roomPassword,
          expiry
        })
      }
    );

    const data = await response.json();

    alert(data.message || "Room created");

  } catch (err) {

    console.error(err);

    alert("Failed to create room");
  }
});


// --------------------
// JOIN ROOM
// --------------------

joinRoomBtn.addEventListener("click", async () => {

  const roomName =
    prompt("Enter room name");

  if (!roomName) return;

  const roomPassword =
    prompt("Enter room password");

  if (!roomPassword) return;

  try {

    const roomRef =
      ref(db, `rooms/${roomName}`);

    const snapshot =
      await get(roomRef);

    const room = snapshot.val();

    if (!room) {

      alert("Room not found");

      return;
    }

    if (room.password !== roomPassword) {

      alert("Wrong room password");

      return;
    }

    currentRoom = roomName;

    currentRoomPassword = roomPassword;

    localStorage.setItem(
      "currentRoom",
      roomName
    );

    localStorage.setItem(
      "currentRoomPassword",
      roomPassword
    );

    currentRoomText.innerText =
      `Room: ${roomName}`;

    loadMessages();

    alert("Joined room");

  } catch (err) {

    console.error(err);

    alert("Failed to join room");
  }
});


// --------------------
// LOAD MESSAGES
// --------------------

function loadMessages() {

  if (!currentRoom) return;

  messagesRef =
    ref(db, `rooms/${currentRoom}/messages`);

  const roomRef =
    ref(db, `rooms/${currentRoom}`);

  onValue(messagesRef, async (snapshot) => {

    messagesDiv.innerHTML = "";

    const roomSnapshot =
      await get(roomRef);

    const roomData =
      roomSnapshot.val();

    const expiry =
      roomData?.expiry || 7200000;

    const now = Date.now();

    snapshot.forEach((child) => {

      const msg = child.val();

      if (
        expiry !== 0 &&
        now - msg.timestamp > expiry
      ) {
       // remove(child.ref);
        return;
      }

      const div =
        document.createElement("div");

      div.className = "message";

      const time =
        new Date(msg.timestamp)
          .toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          })
          .toLowerCase();

      div.innerHTML = `
        <div class="message-top">
          <strong>${msg.name}</strong>

          <span class="time">
            ${time}
          </span>
        </div>

        <div class="message-text">
          ${msg.text}
        </div>
      `;

      messagesDiv.appendChild(div);
    });

    messagesDiv.scrollTop =
      messagesDiv.scrollHeight;

  });
}


// --------------------
// SEND MESSAGE
// --------------------

sendBtn.addEventListener("click", () => {

  if (!currentRoom) {

    alert("Join a room first");

    return;
  }

  const name =
    nameInput.value.trim();

  const text =
    messageInput.value.trim();

  if (!name || !text) return;

  push(messagesRef, {
    name,
    text,
    timestamp: Date.now()
  });

  messageInput.value = "";
});


// --------------------
// CLEAR CHAT
// --------------------

if (clearBtn) {

  clearBtn.addEventListener("click", async () => {

    if (!currentRoom) {

      alert("Join a room first");

      return;
    }

    const password =
      prompt("Enter admin password");

    if (!password) return;

    try {

      const response =
        await fetch("/api/clear-chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            password
          })
        });

      const data =
        await response.json();

      if (data.success) {

        remove(messagesRef);

        alert("Chat cleared");

      } else {

        alert("Wrong password");
      }

    } catch (err) {

      console.error(err);

      alert("Clear API failed");
    }
  });
}


// --------------------
// DELETE ROOM
// --------------------

deleteRoomBtn.addEventListener("click", async () => {

  const adminPassword =
    prompt("Enter admin password");

  if (!adminPassword) return;

  const roomName =
    prompt("Enter room name to delete");

  if (!roomName) return;

  try {

    const response =
      await fetch("/api/delete-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          adminPassword,
          roomName
        })
      });

    const data =
      await response.json();

    if (data.success) {

      if (roomName === currentRoom) {

        currentRoom = null;

        currentRoomPassword = null;

        localStorage.removeItem(
          "currentRoom"
        );

        localStorage.removeItem(
          "currentRoomPassword"
        );

        currentRoomText.innerText =
          "No room joined";

        messagesDiv.innerHTML = "";
      }

      alert("Room deleted");

    } else {

      alert(data.message || "Failed");
    }

  } catch (err) {

    console.error(err);

    alert("Delete room failed");
  }
});


// --------------------
// AUTO JOIN ROOM
// --------------------

if (currentRoom) {

  currentRoomText.innerText =
    `Room: ${currentRoom}`;

  loadMessages();
}

