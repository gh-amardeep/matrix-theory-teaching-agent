# Matrix Mentor — Project Plan

## 1. Project Title

**Matrix Mentor: An AI-Powered Teaching Agent for Matrix Theory**

---

## 2. Project Objective

The objective of this project is to develop an AI-powered Teaching Agent that helps students learn Matrix Theory through an interactive web interface.

The system uses a remotely hosted Large Language Model (LLM) together with a subject-specific context file to generate mathematically rigorous, intuitive, and step-by-step explanations.

---

## 3. Problem Statement

Students learning graduate-level Matrix Theory may find abstract mathematical concepts such as vector spaces, linear independence, rank, nullity, eigenvalues, and orthogonality difficult to understand without continuous guidance.

The proposed system provides an interactive AI teaching assistant that can answer student questions, explain concepts intuitively, solve mathematical problems step by step, and adapt explanations based on the student's doubts.

---

## 4. Proposed Solution

The proposed system, Matrix Mentor, consists of four major components:

1. **Frontend** — provides the interactive interface for students.
2. **Backend** — receives student questions and manages communication with the LLM.
3. **Subject Context** — provides Matrix Theory knowledge and teaching instructions.
4. **LLM** — generates the final teaching response.

The system uses Hugging Face's remote inference service, so the LLM is not executed locally.

---

## 5. Technology Stack

| Component | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | FastAPI |
| Server | Uvicorn |
| LLM Platform | Hugging Face |
| LLM | openai/gpt-oss-120b |
| Python Library | huggingface_hub |
| Database | PostgreSQL |
| ORM / Driver | SQLAlchemy, psycopg |
| Configuration | python-dotenv |
| Mathematical Rendering | MathJax |
| Markdown Rendering | Marked.js |

---

## 6. Development Phases

### Phase 1 — Requirement Analysis

- Understand the Teaching Agent requirements.
- Select Matrix Theory as the subject.
- Define the teaching objectives.
- Select the LLM platform.

**Status: Completed**

---

### Phase 2 — LLM Integration

- Create a Hugging Face account and access token.
- Configure the Hugging Face Inference API.
- Test remote LLM inference.
- Select `openai/gpt-oss-120b`.
- Verify that inference is performed remotely.

**Status: Completed**

---

### Phase 3 — Context Development

- Create `context.md`.
- Define Matrix Theory subject scope.
- Define teaching methodology.
- Define mathematical response guidelines.
- Define problem-solving instructions.
- Integrate the context file with the backend.

**Status: Completed**

---

### Phase 4 — Backend Development

- Develop the FastAPI application.
- Create the `/ask` API endpoint.
- Receive student questions.
- Load the Matrix Theory context.
- Send the context and question to the LLM.
- Return the generated response to the frontend.
- Configure API credentials using `.env`.

**Status: Completed**

---

### Phase 5 — Frontend Development

- Design the Matrix Mentor interface.
- Develop the chat interface.
- Add suggested Matrix Theory topics.
- Implement communication with the FastAPI backend.
- Add Markdown rendering.
- Add LaTeX/MathJax mathematical rendering.
- Add responsive design.

**Status: Completed**

---

### Phase 6 — Integration and Testing

- Connect the frontend and backend.
- Test API communication.
- Test LLM responses.
- Verify context-based teaching behavior.
- Test mathematical formatting.
- Test error handling.
- Verify that API credentials are not hard-coded.

**Status: Completed**

---

### Phase 7 — Documentation

- Prepare README.
- Prepare project plan.
- Prepare system architecture/block diagram.
- Document installation and execution.
- Document project structure.
- Prepare final project presentation/report.

**Status: In Progress**

---

### Phase 8 — PostgreSQL Storage

- Add PostgreSQL as the persistent database layer.
- Connect using SQLAlchemy and psycopg with `DATABASE_URL` from `.env`.
- Create `chats` and `messages` tables automatically at startup.
- Store every student question and AI answer in `POST /ask`.
- Return clear API errors when PostgreSQL is unavailable.

**Status: Completed**

---

### Phase 9 — Conversation History

- Add `GET /history` (most recent conversations first).
- Add `GET /history/{chat_id}` (full conversation, chronological order).
- Load the "Recent Chats" sidebar from PostgreSQL instead of browser `localStorage`.
- Re-open a previous conversation from the database when it is clicked.
- Keep "New Chat" working with a new `chat_id`.
- Show a useful frontend message when the database is unavailable.
- Update README and project plan.

**Status: Completed**

---

## 7. Final System Workflow

The complete workflow is:

**Student → Frontend → FastAPI Backend → Context + LLM → Backend → Frontend → Student**

The frontend collects the student's question.

The FastAPI backend loads the Matrix Theory teaching context and sends both the context and student question to the remotely hosted LLM.

The LLM generates a teaching-oriented response.

The response is returned to the frontend and displayed using Markdown and mathematical LaTeX rendering.

The backend also stores every question and answer in PostgreSQL, and the frontend reads the stored conversations back through `/history` and `/history/{chat_id}`, so history persists independently of the browser and the server process.

---

## 8. Expected Outcome

The completed system will provide students with an interactive Matrix Theory teaching assistant capable of:

- Explaining mathematical concepts.
- Providing intuition.
- Giving formal definitions.
- Solving problems step by step.
- Providing examples.
- Explaining common conceptual differences.
- Rendering mathematical expressions clearly.

---

## 9. Project Deliverables

The final project will contain:

- Interactive frontend.
- FastAPI backend.
- Hugging Face LLM integration.
- Matrix Theory `context.md`.
- Secure `.env` configuration.
- PostgreSQL database with persistent conversation history.
- `README.md`.
- Project plan.
- System architecture/block diagram.
- Source code.
- Requirements file.

---

## 10. Future Scope

Possible future improvements include:

- Topic-wise learning modules.
- Automatic quiz generation.
- Student progress tracking.
- Retrieval from lecture notes.
- Voice-based interaction.
- Automated evaluation of student solutions.
- Mathematical visualization tools.