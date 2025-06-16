# 📄 PDF Chat Assistant

A modern, AI-powered PDF chat application that allows users to upload PDF documents and have intelligent conversations about their content. Built with Next.js, TypeScript, and shadcn/ui components.

![PDF Chat Assistant](./public/hero-screenshot.png)

---

## ✨ Features

- **📤 PDF Upload:** Drag-and-drop or click to upload PDF documents
- **💬 Intelligent Chat:** Ask questions about your PDF content and get AI-powered responses
- **📖 Document References:** Get page numbers and source citations with each response
- **🔐 Authentication:** Secure user authentication with Clerk
- **⚡ Real-time Responses:** Fast, streaming responses from the AI

---

## 🚀 Tech Stack

### Frontend

- **Next.js 14** – React framework with App Router
- **TypeScript** – Type-safe development
- **Tailwind CSS** – Utility-first CSS framework
- **shadcn/ui** – Modern UI component library
- **Clerk** – Authentication and user management

### Backend

- **Express.js** – Backend framework
- **LangChain** – AI/ML framework for document processing
- **Mistral AI** – Free LLM for vector embeddings and chat
- **Qdrant Vector Database** – For document embeddings and search

---

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm

---

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Priyam-28/T-RAG.git
   cd T-RAG
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your environment variables:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
   MISTRAL_API_KEY=your_mistral_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

---

### Docker Setup

To run the application using Docker Compose:
```bash
docker compose up -d
```

---

### Backend Setup

1. **Navigate to the server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the backend server**
   ```bash
   npm run dev
   ```

4. **Run the worker process**
   ```bash
   npm run dev-worker
   ```

---

## 🖥️ Usage

1. **Upload a PDF:** Click the upload area or drag and drop a PDF file.
2. **Wait for Processing:** The system will process and index your document.
3. **Start Chatting:** Use the suggested prompts or ask your own questions.
4. **View References:** See page numbers and source citations for each response.

---

Feel free to contribute or open issues