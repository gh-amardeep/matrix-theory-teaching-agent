// ============================================================
// MATRIX MENTOR - FRONTEND
// ============================================================


// ============================================================
// ELEMENTS
// ============================================================

const chatArea = document.getElementById("chatArea");
const input = document.getElementById("questionInput");
const sendButton = document.getElementById("sendButton");
const newChatButton = document.getElementById("newChat");
const themeButton = document.getElementById("themeButton");
const mobileMenu = document.getElementById("mobileMenu");
const sidebar = document.querySelector(".sidebar");
const chatHistorySection = document.getElementById("chatHistorySection");

let welcome = document.getElementById("welcome");


// ============================================================
// CHAT HISTORY (stored in PostgreSQL, read through FastAPI)
// ============================================================

const API_URL = "http://127.0.0.1:8000";

// localStorage is now used ONLY to remember which chat was open,
// so a page refresh can re-open it. The history itself lives in PostgreSQL.
const ACTIVE_CHAT_KEY = "matrixMentorActiveChat";

let currentChat = null;      // { id: "..." } - the chat new questions belong to
let historyChats = [];       // chats returned by GET /history
let historyError = null;     // message shown in the sidebar if loading failed


// ============================================================
// CREATE CHAT ID
// ============================================================

function generateChatId() {

    return (
        Date.now().toString() +
        Math.random().toString(36).substring(2, 9)
    );
}


// ============================================================
// READ AN ERROR MESSAGE FROM A FAILED RESPONSE
// ============================================================

async function readErrorDetail(response) {

    try {

        const data = await response.json();

        if (data && typeof data.detail === "string") {
            return data.detail;
        }

    }

    catch (error) {
        // Response had no JSON body
    }

    return "Backend returned an error.";
}


// ============================================================
// FETCH CHAT LIST FROM THE BACKEND
// ============================================================

async function fetchHistory() {

    try {

        const response =
            await fetch(
                API_URL + "/history?limit=50"
            );

        if (!response.ok) {

            throw new Error(
                await readErrorDetail(response)
            );

        }

        historyChats = await response.json();

        historyError = null;

    }

    catch (error) {

        console.error(
            "Could not load chat history:",
            error
        );

        historyChats = [];

        historyError =
            error instanceof TypeError
                ? "Could not load history. Is the FastAPI server running?"
                : error.message;

    }

    renderChatHistory();
}


// ============================================================
// RENDER RECENT CHAT HISTORY
// ============================================================

function renderChatHistory() {

    if (!chatHistorySection) {
        return;
    }

    // Remove old chat buttons and messages
    const oldItems =
        chatHistorySection.querySelectorAll(
            ".chat-item, .history-message"
        );

    oldItems.forEach(
        item => item.remove()
    );


    // Show why history could not be loaded
    if (historyError) {

        const note =
            document.createElement("p");

        note.className = "history-message";

        note.textContent = historyError;

        chatHistorySection.appendChild(note);

        return;

    }


    historyChats.forEach(
        chat => {

            const button =
                document.createElement("button");

            button.className = "chat-item";

            button.dataset.chatId = chat.chat_id;


            const icon =
                document.createElement("span");

            icon.textContent = "◈";


            const title =
                document.createElement("span");

            title.textContent = chat.title;


            button.appendChild(icon);

            button.appendChild(title);


            button.addEventListener(
                "click",
                function() {

                    loadChat(chat.chat_id);

                }
            );


            chatHistorySection.appendChild(
                button
            );

        }
    );
}


// ============================================================
// DISPLAY A STORED CHAT IN THE MAIN AREA
// ============================================================

function showChat(chat) {

    // Remove welcome screen
    if (welcome) {

        welcome.remove();

        welcome = null;

    }

    chatArea.innerHTML = "";

    // The database stores the roles as "student" and "agent"
    chat.messages.forEach(
        message => {

            addMessage(
                message.content,
                message.role === "student"
                    ? "user"
                    : "agent"
            );

        }
    );
}


// ============================================================
// LOAD A PREVIOUS CHAT (GET /history/{chat_id})
// ============================================================

async function loadChat(chatId) {

    try {

        const response =
            await fetch(
                API_URL + "/history/" +
                encodeURIComponent(chatId)
            );

        if (!response.ok) {

            throw new Error(
                await readErrorDetail(response)
            );

        }

        const chat = await response.json();

        currentChat = { id: chat.chat_id };

        localStorage.setItem(
            ACTIVE_CHAT_KEY,
            chat.chat_id
        );

        showChat(chat);

    }

    catch (error) {

        console.error(
            "Could not load chat:",
            error
        );

        addMessage(
            "Sorry, I couldn't load that conversation. " +
            (
                error instanceof TypeError
                    ? "Please make sure the FastAPI server is running."
                    : error.message
            ),
            "agent"
        );

    }
}


// ============================================================
// CREATE NEW CHAT
// ============================================================

function createNewChat() {

    // The chat is stored in PostgreSQL when its first answer arrives.
    currentChat = { id: generateChatId() };

    localStorage.setItem(
        ACTIVE_CHAT_KEY,
        currentChat.id
    );
}


// ============================================================
// RE-OPEN THE LAST ACTIVE CHAT WHEN PAGE OPENS
// ============================================================

async function loadActiveChat() {

    const activeChatId =
        localStorage.getItem(
            ACTIVE_CHAT_KEY
        );

    if (!activeChatId) {
        return;
    }

    try {

        const response =
            await fetch(
                API_URL + "/history/" +
                encodeURIComponent(activeChatId)
            );

        if (response.status === 404) {

            // Chat was never stored (e.g. first question failed)
            localStorage.removeItem(
                ACTIVE_CHAT_KEY
            );

            return;

        }

        if (!response.ok) {
            return;
        }

        const chat = await response.json();

        currentChat = { id: chat.chat_id };

        showChat(chat);

    }

    catch (error) {

        console.error(
            "Could not restore active chat:",
            error
        );

    }
}


// ============================================================
// SEND MESSAGE
// ============================================================

async function sendMessage() {

    const question =
        input.value.trim();


    // Don't send empty messages
    if (question === "") {
        return;
    }


    // Remove welcome screen
    if (welcome) {

        welcome.remove();

        welcome = null;

    }


    // Create a new conversation
    // when no active chat exists
    if (!currentChat) {

        createNewChat();

    }


    // Display user message
    addMessage(
        question,
        "user"
    );


    // Clear input
    input.value = "";


    // Reset textarea height
    input.style.height = "auto";


    // Show thinking indicator
    const thinking =
        addThinkingMessage();


    try {

        // ====================================================
        // SEND QUESTION TO FASTAPI BACKEND
        // ====================================================

        const response =
            await fetch(
                API_URL + "/ask",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        question: question,

                        chat_id: currentChat.id

                    })

                }
            );


        // Check HTTP response
        if (!response.ok) {

            const serverError =
                new Error(
                    await readErrorDetail(response)
                );

            serverError.fromServer = true;

            throw serverError;

        }


        // Convert response to JSON
        const data =
            await response.json();


        // Remove thinking indicator
        thinking.remove();


        // Display AI answer
        addMessage(
            data.answer,
            "agent"
        );


        // The backend has stored the question and answer in
        // PostgreSQL - refresh the RECENT CHATS list
        fetchHistory();

    }


    catch (error) {

        console.error(
            "Connection error:",
            error
        );


        // Remove thinking indicator
        thinking.remove();


        // Display error message
        addMessage(

            error.fromServer
                ? "Sorry, something went wrong: " + error.message
                : "Sorry, I couldn't connect to the Matrix Theory Teaching Agent. Please make sure the FastAPI server is running.",

            "agent"

        );

    }

}


// ============================================================
// ADD MESSAGE TO SCREEN
// ============================================================

function addMessage(
    text,
    sender
) {

    // Main message container
    const message =
        document.createElement("div");


    message.className =
        "message";


    // ========================================================
    // AVATAR
    // ========================================================

    const avatar =
        document.createElement("div");


    avatar.className =
        sender === "user"
            ? "avatar user-avatar"
            : "avatar agent-avatar";


    avatar.textContent =
        sender === "user"
            ? "U"
            : "∑";


    // ========================================================
    // CONTENT CONTAINER
    // ========================================================

    const content =
        document.createElement("div");


    content.className =
        "message-content";


    // ========================================================
    // MESSAGE NAME
    // ========================================================

    const name =
        document.createElement("div");


    name.className =
        "message-name";


    name.textContent =
        sender === "user"
            ? "You"
            : "Matrix Mentor";


    // ========================================================
    // TEXT ELEMENT
    // ========================================================

    const textElement =
        document.createElement("div");


    // ========================================================
    // PROTECT LATEX FROM MARKDOWN
    // ========================================================

    const mathBlocks = [];

    let protectedText = text;


    // --------------------------------------------------------
    // Protect display LaTeX
    // --------------------------------------------------------

    protectedText =
        protectedText.replace(
            /\\\[([\s\S]*?)\\\]/g,
            function(match) {

                const index =
                    mathBlocks.length;

                mathBlocks.push(match);

                return `MATHBLOCKPLACEHOLDER${index}END`;

            }
        );


    // --------------------------------------------------------
    // Protect inline LaTeX
    // --------------------------------------------------------

    protectedText =
        protectedText.replace(
            /\\\(([\s\S]*?)\\\)/g,
            function(match) {

                const index =
                    mathBlocks.length;

                mathBlocks.push(match);

                return `MATHBLOCKPLACEHOLDER${index}END`;

            }
        );


    // ========================================================
    // MARKDOWN → HTML
    // ========================================================

    let html =
        marked.parse(
            protectedText
        );


    // ========================================================
    // RESTORE LATEX
    // ========================================================

    mathBlocks.forEach(
        function(math, index) {

            html =
                html.replace(
                    `MATHBLOCKPLACEHOLDER${index}END`,
                    math
                );

        }
    );


    // Put formatted HTML into message
    textElement.innerHTML =
        html;


    // ========================================================
    // BUILD MESSAGE
    // ========================================================

    content.appendChild(name);

    content.appendChild(textElement);


    message.appendChild(avatar);

    message.appendChild(content);


    chatArea.appendChild(message);


    // ========================================================
    // LATEX → MATHEMATICS USING MATHJAX
    // ========================================================

    if (window.MathJax) {

        MathJax.typesetPromise(
            [textElement]
        )

        .catch(
            function(error) {

                console.error(
                    "MathJax error:",
                    error
                );

            }
        );

    }


    // ========================================================
    // SCROLL TO NEWEST MESSAGE
    // ========================================================

    chatArea.scrollTop =
        chatArea.scrollHeight;

}


// ============================================================
// THINKING INDICATOR
// ============================================================

function addThinkingMessage() {

    const message =
        document.createElement("div");


    message.className =
        "message";


    message.innerHTML = `

        <div class="avatar agent-avatar">
            ∑
        </div>

        <div class="message-content">

            <div class="message-name">
                Matrix Mentor
            </div>

            <div class="thinking">
                Thinking
                <span>.</span>
                <span>.</span>
                <span>.</span>
            </div>

        </div>

    `;


    chatArea.appendChild(
        message
    );


    chatArea.scrollTop =
        chatArea.scrollHeight;


    return message;

}


// ============================================================
// ENTER KEY
// ============================================================

input.addEventListener(
    "keydown",
    function(event) {

        // Enter = send
        // Shift + Enter = new line

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


// ============================================================
// SEND BUTTON
// ============================================================

sendButton.addEventListener(
    "click",
    sendMessage
);


// ============================================================
// AUTO RESIZE TEXTAREA
// ============================================================

input.addEventListener(
    "input",
    function() {

        this.style.height =
            "auto";


        this.style.height =
            Math.min(
                this.scrollHeight,
                150
            ) + "px";

    }
);


// ============================================================
// SUGGESTION BUTTONS
// ============================================================

document.addEventListener(
    "click",
    function(event) {

        const suggestion =
            event.target.closest(
                ".suggestion"
            );


        if (!suggestion) {
            return;
        }


        const question =
            suggestion.dataset.question;


        input.value =
            question;


        input.focus();


        // Resize textarea
        input.style.height =
            "auto";


        input.style.height =
            Math.min(
                input.scrollHeight,
                150
            ) + "px";

    }
);


// ============================================================
// NEW CHAT
// ============================================================

newChatButton.addEventListener(
    "click",
    function() {

        // Forget which chat is currently active
        localStorage.removeItem(
            ACTIVE_CHAT_KEY
        );


        // Reset current chat
        currentChat = null;


        // Reload interface
        location.reload();

    }
);


// ============================================================
// THEME BUTTON
// ============================================================

themeButton.addEventListener(
    "click",
    function() {

        document.body.classList.toggle(
            "light-mode"
        );

    }
);


// ============================================================
// MOBILE MENU
// ============================================================

mobileMenu.addEventListener(
    "click",
    function() {

        sidebar.classList.toggle(
            "open"
        );

    }
);


// ============================================================
// INITIALIZE CHAT HISTORY
// ============================================================

fetchHistory();

loadActiveChat();