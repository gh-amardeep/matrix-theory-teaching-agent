# Matrix Mentor — AI-Powered Matrix Theory Teaching Agent

## 1. Project Overview

Matrix Mentor is an AI-powered Teaching Agent designed to help students learn Matrix Theory through interactive, step-by-step explanations.

The system provides a web-based interface where students can ask questions related to Matrix Theory. The question is sent to a FastAPI backend, which combines the student's query with a subject-specific teaching context and sends it to a Large Language Model (LLM) through the Hugging Face Inference API.

The generated response is then returned to the frontend and displayed using Markdown and LaTeX formatting.

---

## 2. Objectives

The main objectives of this project are:

- To develop an interactive AI-based teaching assistant for Matrix Theory.
- To provide clear and step-by-step mathematical explanations.
- To use a subject-specific `.md` context file to guide the teaching behavior of the LLM.
- To integrate a remotely hosted LLM using Hugging Face.
- To separate the frontend, backend, context, and LLM components.
- To provide a simple interface suitable for students learning graduate-level Matrix Theory.

---

## 3. Key Features

- Interactive chat-based teaching interface.
- Matrix Theory-focused AI responses.
- Step-by-step mathematical explanations.
- Intuitive explanations followed by formal definitions.
- Mathematical notation using LaTeX.
- Markdown-formatted responses.
- Subject-specific teaching context.
- Remote LLM inference using Hugging Face.
- Secure API-key configuration using `.env`.
- FastAPI backend for communication between frontend and LLM.
- Persistent conversation history stored in PostgreSQL.
- `GET /history` endpoints to retrieve stored conversations.
- "Recent Chats" sidebar loaded from PostgreSQL; previous conversations can be re-opened after a browser refresh or a server restart.
- Responsive web interface.

---

## 4. System Architecture

The system follows the architecture:

Student → Frontend → FastAPI Backend → Context + LLM → Backend → Frontend → Student

With conversation history, the backend also reads from and writes to PostgreSQL:

```text
Student
   ↓
Frontend
   ↓
FastAPI Backend
   ├──→ PostgreSQL         (stores and returns history)
   └──→ Hugging Face LLM   (generates the answer)
   ↓
History + AI Answer
   ↓
Frontend
```

### Components

1. **Frontend**
   - HTML
   - CSS
   - JavaScript
   - Provides the interactive student interface.

2. **Backend**
   - FastAPI
   - Receives student questions.
   - Loads the Matrix Theory context.
   - Communicates with the LLM.

3. **Context**
   - `context.md`
   - Contains Matrix Theory topics, teaching instructions, mathematical guidelines, and response behavior.

4. **LLM**
   - `openai/gpt-oss-120b`
   - Accessed remotely through Hugging Face Inference API.
   - No LLM model is executed locally on the student's machine.

5. **Database**
   - PostgreSQL, accessed through SQLAlchemy and `psycopg`.
   - Stores every student question and agent answer.

6. **Configuration**
   - `.env`
   - Stores the Hugging Face API token and the database URL securely.

---

## 5. Technologies Used

| Component | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | FastAPI |
| Server | Uvicorn |
| LLM Platform | Hugging Face |
| LLM | openai/gpt-oss-120b |
| LLM Client | huggingface_hub |
| Database | PostgreSQL |
| ORM / Driver | SQLAlchemy, psycopg |
| Configuration | python-dotenv |
| Mathematical Rendering | MathJax |
| Markdown Rendering | Marked.js |
| Programming Language | Python |

---

## 6. Project Structure

```text
MatrixthheoryAGent/
│
├── .env
├── .gitignore
├── README.md
├── requirements.txt
├── context.md
├── app.py
├── .env.example
│
├── backend/
│   ├── main.py        # FastAPI app: /ask, /history, /
│   ├── database.py    # engine, sessions, table creation
│   ├── models.py      # chats and messages tables
│   └── crud.py        # database read/write helpers
│
└── frontend/
    ├── index.html
    ├── script.js
    └── style.css
```

---

## 7. Context-Based Teaching

The teaching behavior of Matrix Mentor is defined in:

`context.md`

The FastAPI backend loads this file when the application starts.

The contents of the context file are passed to the LLM as system-level teaching instructions.

This allows the LLM to generate responses according to the defined Matrix Theory teaching methodology.

The context contains:

- Matrix Theory topics
- Teaching philosophy
- Mathematical rigor requirements
- Problem-solving guidelines
- Explanation style
- Handling of student doubts
- Mathematical formatting rules
- Academic integrity guidelines

---

## 8. Installation

### Step 1: Clone or copy the project

Place the project in a suitable directory.

### Step 2: Install PostgreSQL

PostgreSQL 13 or newer is required (see Section 10).

### Step 3: Install Python dependencies

Open a terminal inside the project and run:

```bash
pip install -r requirements.txt
```

On Ubuntu/Linux, Python 3 can also be used:

```bash
pip3 install -r requirements.txt
```

---

## 9. Hugging Face Configuration

Create a `.env` file in the project root:

```text
HF_TOKEN=your_huggingface_token
```

The API token must not be written directly inside the Python source code.

The `.env` file should not be committed to Git.

The project includes `.gitignore` to prevent accidental exposure of the token.

---

## 10. PostgreSQL Database Setup

PostgreSQL is **required**. Every student question and agent answer is stored in it.

### 10.1 Install and start PostgreSQL (Ubuntu/Linux)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl status postgresql
```

(Alternative using Docker:
`docker run --name matrix-pg -e POSTGRES_PASSWORD=your_password -p 5432:5432 -d postgres:16`)

### 10.2 Create the database and user (one time only)

```bash
sudo -u postgres psql
```

```sql
CREATE USER matrix_user WITH PASSWORD 'your_password';
CREATE DATABASE matrix_mentor OWNER matrix_user;
\q
```

### 10.3 Configure `DATABASE_URL`

Add this line to the `.env` file in the project root (next to `HF_TOKEN`):

```text
DATABASE_URL=postgresql+psycopg://matrix_user:your_password@localhost:5432/matrix_mentor
```

- Do not put the password in any Python file.
- If the password contains special characters such as `@` or `/`, URL-encode them (`@` becomes `%40`).
- `.env` must stay listed in `.gitignore`. `.env.example` shows the expected format.

### 10.4 Tables

The tables are created **automatically** when FastAPI starts. No manual SQL is needed after Step 10.2.

| Table | Columns |
|---|---|
| `chats` | `chat_id` (PK), `title`, `created_at`, `updated_at` |
| `messages` | `message_id` (PK), `chat_id` (FK to `chats`), `role` (`student` or `agent`), `content`, `timestamp` |

If PostgreSQL is not running, the application still starts; `/ask` and `/history` return a clear `503` error, and the details are logged in the FastAPI terminal.

---

## 11. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/ask` | Send `{"question": "...", "chat_id": "..."}`; returns `{"answer": "...", "chat_id": "..."}`. `chat_id` is optional. Both the question and the answer are stored in PostgreSQL. |
| GET | `/history` | Stored chats, newest first, with their messages. Optional query parameters: `limit` (default 20, max 100) and `offset`. |
| GET | `/history/{chat_id}` | The complete conversation for one chat (`404` if it does not exist). |

Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### Example `GET /history` response

```json
[
  {
    "chat_id": "1727690000000k3j9x2a",
    "title": "Explain the Rank-Nullity Theorem with a simp...",
    "created_at": "2026-09-30T06:15:02.114233Z",
    "updated_at": "2026-09-30T06:15:09.871002Z",
    "messages": [
      {
        "message_id": 1,
        "role": "student",
        "content": "Explain the Rank-Nullity Theorem with a simple example.",
        "timestamp": "2026-09-30T06:15:02.114233Z"
      },
      {
        "message_id": 2,
        "role": "agent",
        "content": "## Rank-Nullity Theorem\n\nFor a matrix \\(A\\) with \\(n\\) columns ...",
        "timestamp": "2026-09-30T06:15:09.871002Z"
      }
    ]
  }
]
```

---

## 11.1 PostgreSQL-Backed Conversation History

Conversation history is stored in PostgreSQL, so it persists independently of the browser and of the FastAPI process.

**Saving.** When a student asks a question, the frontend sends `question` and its current `chat_id` to `POST /ask`. After the LLM answers, the backend stores the question (role `student`) and the answer (role `agent`) in the `messages` table, linked to a row in `chats`.

**Recent Chats.** When the page loads (and after every answer), the frontend calls `GET /history`, which returns the most recently updated chats first, and lists them under "RECENT CHATS". Nothing in the sidebar is hard-coded, and it is not built from `localStorage`.

**Re-opening a chat.** Clicking a chat calls `GET /history/{chat_id}`, which returns its messages oldest first. The frontend redraws them (Markdown and LaTeX included) in the main chat area.

**New Chat.** The "New Chat" button clears the view. The next question gets a new `chat_id`, so it is stored as a separate conversation. Old conversations are never deleted.

**Browser storage.** The browser keeps only one small value, the id of the chat that was open, so a page refresh can re-open it. The history itself is read from PostgreSQL.

**If PostgreSQL is unavailable.** The API returns a `503` error with a clear message, which the frontend shows (in the sidebar for history, in the chat for questions). An empty history is returned as `[]`.

---

## 12. Running the Backend

Make sure PostgreSQL is running (Section 10.1), then open a terminal and navigate to the backend directory:

```bash
cd backend
```

Start the FastAPI server:

```bash
python3 -m uvicorn main:app --reload
```

The backend will run at:

`http://127.0.0.1:8000`

---

## 13. Running the Frontend

Open:

`frontend/index.html`

in a web browser.

The frontend communicates with the FastAPI backend through the `/ask`, `/history` and `/history/{chat_id}` API endpoints.

When a student submits a question:

```text
Student Question
       ↓
JavaScript Frontend
       ↓
FastAPI /ask endpoint
       ↓
context.md
       ↓
Hugging Face LLM
       ↓
Generated Answer
       ↓
FastAPI
       ↓
Frontend
```

---

## 14. Example

### Student Question

```text
Explain the Rank-Nullity Theorem with an example.
```

### Teaching Agent

The agent explains:

- What rank means.
- What nullity means.
- The formal Rank-Nullity Theorem.
- A simple matrix example.
- The calculation of rank and nullity.
- Why the theorem works.
- The final result.

Mathematical expressions are rendered using LaTeX.

---

## 15. Security

The Hugging Face API token is stored in the `.env` file rather than being hard-coded in the source code.

The `.env` file is excluded from version control using:

```text
.env
```

in `.gitignore`.

The PostgreSQL connection string (`DATABASE_URL`) is also kept only in `.env`; it is never hard-coded and never sent to the frontend.

The LLM is accessed remotely through the Hugging Face service. The model itself is not downloaded or executed on the local machine.

---

## 16. Future Scope

Possible future improvements include:

- Topic-wise learning modules.
- Quiz and practice-question generation.
- Student progress tracking.
- Retrieval from Matrix Theory lecture notes.
- Voice-based interaction.
- Automated evaluation of student solutions.
- Additional mathematical visualization tools.

---

## 17. Conclusion

Matrix Mentor demonstrates how a frontend, backend, subject-specific context, and remotely hosted Large Language Model can be integrated to create an AI-powered Teaching Agent.

The project focuses on Matrix Theory and uses a dedicated context file to guide the LLM toward mathematically rigorous, intuitive, and student-friendly explanations.    