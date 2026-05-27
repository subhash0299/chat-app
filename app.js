import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getDatabase,
  ref,
  push,
  onValue,
  remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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

const messagesRef = ref(db, "messages");

const messagesDiv = document.getElementById("messages");
const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("messageInput");
const nameInput = document.getElementById("name");

const loginBtn = document.getElementById("loginBtn");
const passwordInput = document.getElementById("passwordInput");

const loginScreen = document.getElementById("loginScreen");
const chatScreen = document.getElementById("chatScreen");

const clearBtn = document.getElementById("clearBtn");


// --------------------
// LOGIN
// --------------------

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

const savedName = localStorage.getItem("chatName");

if (savedName) {
  nameInput.value = savedName;
}

nameInput.addEventListener("input", () => {
  localStorage.setItem("chatName", nameInput.value);
});


// --------------------
// SEND MESSAGE
// --------------------

sendBtn.addEventListener("click", () => {

  const name = nameInput.value.trim();
  const text = messageInput.value.trim();

  if (!name || !text) return;

  push(messagesRef, {
    name,
    text,
    timestamp: Date.now()
  });

  messageInput.value = "";
});


// --------------------
// SHOW MESSAGES
// --------------------

onValue(messagesRef, (snapshot) => {

  messagesDiv.innerHTML = "";

  const now = Date.now();
  const TWO_HOURS = 2 * 60 * 60 * 1000;

  snapshot.forEach((child) => {

    const msg = child.val();

    // Skip old messages
    if (now - msg.timestamp > TWO_HOURS) {
      return;
    }

    const div = document.createElement("div");

    div.className = "message";

    div.innerHTML = `
      <strong>${msg.name}:</strong> ${msg.text}
    `;

    messagesDiv.appendChild(div);
  });

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});


// --------------------
// CLEAR CHAT
// --------------------

if (clearBtn) {

  clearBtn.addEventListener("click", async () => {

    const password = prompt("Enter admin password");

    if (!password) return;

    try {

      const response = await fetch("/api/clear-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          password
        })
      });

      const data = await response.json();

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
