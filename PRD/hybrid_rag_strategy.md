# Two-Service Hybrid RAG Strategy (LlamaIndex)

This document outlines the architecture and atomic steps for implementing a sophisticated, two-service hybrid RAG system. This approach leverages a new Python microservice for data retrieval using the full-featured LlamaIndex library, while the existing TypeScript server orchestrates the question generation process.

## 1. Problem Definition

The current AI question generation system uses a single, static prompt template. This approach is effective for general knowledge topics but produces low-quality, generic, or incorrect questions for topics that are specific, nuanced, or require timely information. 

**Examples of problematic topics:**
- **Specific Media:** "Succession season 2 episode 4"
- **Timely Events:** "UFC 317" or "News on July 20th, 2025"
- **Niche History:** "The End of theh Irish Civil War"

The goal is to engineer a system that can source high-quality, relevant context for any given topic and use it to generate specific, accurate, and engaging trivia questions.

## 2. Current Repository State 

As of the start of this task, the repository is in a clean state. The `GeminiService.ts` class contains a direct, framework-less implementation that calls the Google AI API. There are no RAG-specific frameworks or dependencies installed in either the TypeScript server or the wider project.

All previous experimental changes involving a TypeScript-only RAG implementation have been reverted to ensure a clean start for this new two-service architecture. The current state is a stable foundation upon which we will build the new system.

## 3. Architecture Overview

This solution involves two distinct services communicating over a local network API.

**1. `apps/server` (TypeScript - The Orchestrator)**

*   **Responsibilities:**
    *   Continues to manage all game logic, rooms, and player state.
    *   The `GeminiService.ts` will determine the topic's category (`News`, `History`, etc.).
    *   It will make an HTTP request to the Python RAG service, sending the topic and category.
    *   It will receive a context string back from the RAG service.
    *   It will construct the final prompt using this context and call the Google AI API to get the structured JSON question.
    *   It will parse and validate the final response.

**2. `apps/rag-service` (NEW - Python - The Data Expert)**

*   **Responsibilities:**
    *   Expose a single, simple API endpoint (e.g., `/get-context`).
    *   Accept a `topic` and `category` in the request body.
    *   Use the full Python `llama-index` library to select the best data source:
        *   **Wikipedia:** For `History`, `Media`, and `General` topics.
        *   **Web Search:** For `News` and `Sports` topics requiring timeliness.
    *   Fetch and process the data from the chosen source.
    *   Return a clean, context-rich string in a JSON response.

## 4. Phased Implementation Plan

**Phase 1: Python RAG Service Setup**

*   **Atomic Step 1: Scaffold the Python Service**
    *   **What:** Create a new directory `apps/rag-service`. Inside, create initial files: `main.py` for the API logic and `requirements.txt` for dependencies.
    *   **Why:** To establish the basic structure for our new microservice.

*   **Atomic Step 2: Install Python Dependencies**
    *   **What:** Add `fastapi`, `uvicorn`, `llama-index`, and any necessary data loader packages to `requirements.txt` and install them.
    *   **Why:** To provide the necessary libraries for building the web server and using LlamaIndex.

*   **Atomic Step 3: Implement the Basic API Endpoint**
    *   **What:** In `main.py`, set up a basic FastAPI application with a `/get-context` endpoint that accepts a POST request with a `topic` and `category`.
    *   **Why:** To create the network interface for the TypeScript server to call.

**Phase 2: Implement RAG Logic in Python**

*   **Atomic Step 4: Implement LlamaIndex Data Loaders**
    *   **What:** In the Python service, write the code to initialize and use the `WikipediaReader` and a web search reader from LlamaIndex.
    *   **Why:** To build the core data retrieval functionality.

*   **Atomic Step 5: Implement the Hybrid Selection Logic**
    *   **What:** In the `/get-context` endpoint, add the logic to check the `category` from the request and call the appropriate LlamaIndex data loader.
    *   **Why:** To complete the core responsibility of the RAG service.

**Phase 3: Refactor `GeminiService.ts` to Use the RAG Service**

*   **Atomic Step 6: Add an HTTP Client to the Node Server**
    *   **What:** Add a lightweight HTTP client library like `axios` to the `apps/server` project's dependencies.
    *   **Why:** To enable the `GeminiService` to make network requests to the Python service.

*   **Atomic Step 7: Refactor `generateQuestion`**
    *   **What:** Modify the `generateQuestion` method in `GeminiService.ts`. Remove all existing prompt-building logic. Replace it with the topic categorization logic and a network call to the Python `/get-context` endpoint.
    *   **Why:** To delegate all data-fetching responsibility to the new RAG service, simplifying the `GeminiService`.

*   **Atomic Step 8: Update Final Prompt Construction**
    *   **What:** Create a new `buildPrompt` method in `GeminiService.ts` that takes the context string returned from the Python service and injects it into a master prompt that instructs the LLM to generate a question based on the provided context.
    *   **Why:** To ensure the LLM effectively uses the high-quality context for question generation.

**Phase 4: Testing and Validation**

*   **Atomic Step 9: Document the Development Workflow**
    *   **What:** Add instructions to the project's main `README.md` or a new development guide on how to run both the TypeScript and Python services concurrently for local development.
    *   **Why:** To ensure a smooth developer experience for anyone working on the project.

*   **Atomic Step 10: End-to-End Testing**
    *   **What:** Manually run a series of tests with various topic types to ensure the entire two-service system works as expected.
    *   **Why:** To validate the success of the refactoring and the quality of the generated questions.
    