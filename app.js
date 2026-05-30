import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getDatabase,
  ref,
  push,
  onValue,
  onChildAdded,
  onChildChanged,
  remove,
  get,
  set
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
let typingTimeout = null;
let replyTo = null;
let listenersAttached = false;

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

const exitRoomBtn =
  document.getElementById("exitRoomBtn");

const currentRoomText =
  document.getElementById("currentRoom");

const typingIndicator =
  document.getElementById("typingIndicator");

const replyPreview =
  document.getElementById("replyPreview");

const replyText =
  document.getElementById("replyText");

const cancelReply =
  document.getElementById("cancelReply");

const homeArea =
  document.getElementById("homeArea");

const roomArea =
  document.getElementById("roomArea");

cancelReply.addEventListener("click", () => {

  replyTo = null;

  replyPreview.style.display = "none";
});

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
// ROOM VISIBLITY
// --------------------

function updateRoomButtons() {

  if (currentRoom) {

    homeArea.style.display = "none";
    roomArea.style.display = "block";

  } else {

    homeArea.style.display = "block";
    roomArea.style.display = "none";
  }
}
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
    updateRoomButtons();
    listenersAttached = false;
    loadMessages();

    alert("Joined room");

  } catch (err) {

    console.error(err);

    alert("Failed to join room");
  }
});
// --------------------
// EXIT ROOM
// --------------------

exitRoomBtn.addEventListener("click", () => {
  listenersAttached = false;
  currentRoom = null;
  currentRoomPassword = null;

  localStorage.removeItem("currentRoom");
  localStorage.removeItem("currentRoomPassword");
  updateRoomButtons();
  messagesDiv.innerHTML = "";

  currentRoomText.innerText =
    "No room joined";

  updateRoomButtons();

  alert("Exited room");
});


// --------------------
// MARK READ MESSAGES
// --------------------

function markMessagesAsRead(snapshot) {

  const myName =
    nameInput.value.trim();

  snapshot.forEach((child) => {

    const msg =
      child.val();

    if (
      msg.name === myName
    ) return;

    const alreadyRead =
      msg.readBy?.includes(myName);

    if (!alreadyRead) {

      set(
        ref(
          db,
          `rooms/${currentRoom}/messages/${child.key}/readBy/${msg.readBy?.length || 0}`
        ),
        myName
      );
    }

  });

}

// --------------------
// LOAD MESSAGES
// --------------------

function loadMessages() {
  console.log("loadMessages called");

  if (!currentRoom) return;
  if (listenersAttached) return;
  listenersAttached = true;

  messagesRef =
    ref(db, `rooms/${currentRoom}/messages`);

  const roomRef =
    ref(db, `rooms/${currentRoom}`);
  const typingRef =
    ref(db, `rooms/${currentRoom}/typing`);
  console.log("Listening to", `rooms/${currentRoom}/typing`);
    
    onValue(typingRef, (snapshot) => {
      console.log("typing listener fired");
      console.log(snapshot.val());
    
      const typingData =
        snapshot.val() || {};
    
      const myName =
        nameInput.value.trim();
    
      let typingUser = null;
    
      Object.keys(typingData).forEach((user) => {
    
        if (
          user !== myName &&
          typingData[user] === true
        ) {
    
          typingUser = user;
        }
      });
    
      if (typingUser) {
    
        typingIndicator.innerText =
          `${typingUser} is typing...`;
    
      } else {
    
        typingIndicator.innerText = "";
      }
    });

  onValue(messagesRef, async (snapshot) => {

    messagesDiv.innerHTML = "";

    const roomSnapshot =
      await get(roomRef);

    const roomData =
      roomSnapshot.val();

    const expiry =
      roomData?.expiry || 7200000;

    const now = Date.now();
markMessagesAsRead(snapshot);
snapshot.forEach((child) => {

  const msg = child.val();

  if (
    expiry !== 0 &&
    now - msg.timestamp > expiry
  ) {
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

  const myName =
    nameInput.value.trim();

  if (msg.name === myName) {
    div.classList.add("my-message");
  } else {
    div.classList.add("other-message");
  }

  div.innerHTML = `
    <div class="message-top">
      <strong>${msg.name}</strong>

      <span class="time">
        ${time}
      </span>
    </div>

    ${
      msg.replyTo
        ? `
        <div class="reply-box">
          <strong>${msg.replyTo.name}</strong>

          <div>
            ${msg.replyTo.text}
          </div>
        </div>
        `
        : ""
    }

    <div class="message-text">
      ${msg.text}
    </div>
    ${
      msg.name === myName
        ? `
          <div class="read-status">
            ${
              msg.readBy?.length > 1
                ? "✓✓"
                : "✓"
            }
          </div>
        `
        : ""
    }
    <button class="reply-btn">
      ↩ Reply
    </button>
  `;

  messagesDiv.appendChild(div);

  const replyBtn =
    div.querySelector(".reply-btn");

  replyBtn.addEventListener("click", () => {

    replyTo = {
      name: msg.name,
      text: msg.text
    };

    replyText.innerHTML =
      `<strong>${msg.name}</strong>: ${msg.text}`;

    replyPreview.style.display = "flex";
  });

  // Mobile long press

  let pressTimer;

  div.addEventListener("touchstart", () => {

    pressTimer = setTimeout(() => {

      console.log("LONG PRESS");

      replyTo = {
        name: msg.name,
        text: msg.text
      };

      replyText.innerHTML =
        `<strong>${msg.name}</strong>: ${msg.text}`;

      replyPreview.style.display = "flex";

      navigator.vibrate?.(50);

    }, 600);

  });
  
  div.addEventListener("touchend", () => {

    clearTimeout(pressTimer);

  });

  div.addEventListener("touchmove", () => {

    clearTimeout(pressTimer);

  });
  let startX = 0;

div.addEventListener("touchstart", (e) => {

  startX =
    e.touches[0].clientX;

});

div.addEventListener("touchmove", (e) => {

  const diff =
    e.touches[0].clientX - startX;

  if (diff > 0 && diff < 80) {

    div.style.transform =
      `translateX(${diff}px)`;
  }

});

div.addEventListener("touchend", (e) => {

  const diff =
    e.changedTouches[0].clientX - startX;

  div.style.transform = "";

  if (diff > 80) {

    replyTo = {
      name: msg.name,
      text: msg.text
    };

    replyText.innerHTML =
      `<strong>${msg.name}</strong>: ${msg.text}`;

    replyPreview.style.display = "flex";

    navigator.vibrate?.(30);
  }

});

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

  const typingRef =
    ref(
      db,
      `rooms/${currentRoom}/typing/${name}`
    );
  
  set(typingRef, false);
  
  push(messagesRef, {
    name,
    text,
    timestamp: Date.now(),
    replyTo,
    readBy: [name]
  });

  messageInput.value = "";
  replyTo = null;
  replyPreview.style.display = "none";
});

messageInput.addEventListener("input", () => {

  if (!currentRoom) return;

  const myName =
    nameInput.value.trim();

  if (!myName) return;

  const typingRef =
    ref(
      db,
      `rooms/${currentRoom}/typing/${myName}`
    );

  set(typingRef, true);

  clearTimeout(typingTimeout);

  typingTimeout = setTimeout(() => {

    set(typingRef, false);

  }, 2000);

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
        updateRoomButtons();

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
// ROOM SHOWING
// --------------------

updateRoomButtons();

if (currentRoom) {

  currentRoomText.innerText =
    `Room: ${currentRoom}`;

  loadMessages();
}
