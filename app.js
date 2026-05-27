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

const CLEAR_PASSWORD = "chotilulli";
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const messagesRef = ref(db, "messages");

const messagesDiv = document.getElementById("messages");
const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("messageInput");
const nameInput = document.getElementById("name");

/*
  Clear all messages whenever page loads.
  So refresh resets chat.
*/
remove(messagesRef);

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

    const div = document.createElement("div");

    div.className = "message";

    div.innerHTML = `
      <strong>${msg.name}:</strong> ${msg.text}
    `;

    messagesDiv.appendChild(div);
  });

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});