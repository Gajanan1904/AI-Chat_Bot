const API_KEY = "AIzaSyD1395hRR164DBnQqxVH43FR_btbK3B4fQ";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

let conversationHistory = [];

const systemInstruction = {
  role: "user",
  parts: [{
    text: `You are a highly intelligent AI tutor that specializes in solving math problems.
You solve problems step-by-step and explain each step clearly.
You support formatting like fractions, exponents, equations, and LaTeX when needed.
If asked anything non-math, politely say you're only for math help.
Always structure the solution in clear steps.`
  }]
};

function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (!message) return;

  addMessage(message, "user");

  conversationHistory.push({
    role: "user",
    parts: [{ text: message }]
  });

  // Only keep last 4 messages + system instruction
  if (conversationHistory.length > 5) {
    conversationHistory = conversationHistory.slice(-3);
  }

  getBotReply();
  input.value = "";
}

function addMessage(text, sender) {
  const chatBox = document.getElementById("chat-box");
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}`;

  const formattedText = text
    .replace(/\n{2,}/g, "<br>")
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>");

  messageDiv.innerHTML = formattedText;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function getBotReply() {
  const chatBox = document.getElementById("chat-box");

  const loadingMessage = document.createElement("div");
  loadingMessage.className = "message bot";
  loadingMessage.textContent = "Typing...";
  chatBox.appendChild(loadingMessage);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // ⏱ Timeout after 8 seconds

    const requestBody = {
      contents: [systemInstruction, ...conversationHistory]
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeout);
    loadingMessage.remove();

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Gemini didn’t return a reply.";
    addMessage(reply, "bot");

    conversationHistory.push({
      role: "model",
      parts: [{ text: reply }]
    });

  } catch (error) {
    console.error("Gemini API Error:", error);
    loadingMessage.remove();
    addMessage("❌ Error or Timeout connecting to Gemini API.", "bot");
  }
}

document.getElementById("user-input").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

document.getElementById("send-btn").addEventListener("click", sendMessage);
