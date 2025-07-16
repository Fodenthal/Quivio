# Product Requirements Document: PopReplay - The Infinite Trivia Engine

## 1. Overview

PopReplay is a real-time, multiplayer trivia game platform designed to create engaging quizzes on literally any topic imaginable. Users can generate a game room simply by providing a topic in natural language, from "80s Action Movies" to "The History of the Ottoman Empire." The platform's core innovation lies in its intelligent question-sourcing system, which dynamically balances a vast internal database with on-the-fly question generation to deliver high-quality, relevant quizzes at the lowest possible cost.

## 2. The Problem

Creating a fun, accurate, and engaging trivia quiz is hard. It requires significant time, domain knowledge, and effort to write good questions. Existing trivia platforms have a limited, static set of topics and questions. Users who want to play a quiz on a niche or breaking-news topic are out of luck. There is no service that can instantly generate a high-quality quiz on any subject a user can think of.

## 3. Vision & Goal

**Our vision is to make trivia limitless.** Anyone should be able to create and play a great quiz on any topic they are passionate about, instantly.

The primary goal of this project is to build the back-end system and front-end interface for PopReplay, focusing on the intelligent question-sourcing engine. This engine must be able to:
1.  Understand a user's topic request in natural language.
2.  Fetch relevant, high-quality questions from an internal database.
3.  Generate new, high-quality questions on-the-fly if the database has insufficient content.
4.  Make intelligent, cost-based decisions about when to fetch versus when to generate.
5.  Continuously improve the question database by incorporating the best-generated questions.

## 4. Key Features

### 4.1. Natural Language Topic-based Room Creation
- **Description:** A user can enter any topic into a text field (e.g., "The Office Season 4," "WWII Naval Battles," "Taylor Swift's Folklore Album"). The system will parse this input and create a trivia room based on it.
- **User Story:** "As a user, I want to type in 'Marvel Cinematic Universe Phase 2' and get a playable trivia game on that specific topic."

### 4.2. The Intelligent Question Sourcing System
This is the core of the product. It's a hybrid system that ensures a great quiz every time, optimized for cost and quality.

-   **Tier 1: The Question Database (DB)**
    -   A large, curated PostgreSQL database of questions, answers, and metadata (topic, difficulty, etc.).
    -   This is the fastest, cheapest, and most reliable source of questions.
    -   The system will always query the DB first.

-   **Tier 2: On-the-Fly Generation Engine**
    -   When the database lacks sufficient questions for a given topic, the system will generate them using a Large Language Model (LLM).
    -   **Cost/Quality Tiers:** The generation engine will use multiple models. For example, a cheaper, faster model for simple topics and a more powerful, expensive model for complex, nuanced topics. The system will decide which to use based on topic analysis.
    -   **Generation Process:** The system will send a carefully crafted prompt to the LLM, requesting a specific number of trivia questions in a structured format (e.g., JSON) with questions, multiple-choice options, and the correct answer identified.

-   **Tier 3: The Decision & Caching Logic**
    -   **The Flow:**
        1.  User requests a topic.
        2.  The system normalizes the topic string (e.g., "cats", "felines", "house cats" might all map to a canonical "Cats" topic).
        3.  **Check Cache:** Check a Redis cache for recently generated questions on this topic. If a valid cache entry exists, serve those questions.
        4.  **Check Database:** If no cache hit, query the primary question DB. If enough high-quality questions are found, serve them and populate the cache.
        5.  **Generate on the Fly:** If the DB has too few questions, trigger the on-the-fly generation engine.
        6.  The generated questions are served to the user and stored in the cache for a limited time.
    -   **The Goal:** This logic aims to serve >90% of requests from the cache or DB, minimizing expensive LLM calls.

### 4.3. Question Quality & Feedback Loop
- **Validation:** All generated questions will undergo an automated validation step. This could be a simple check (e.g., another LLM call asking "Is this a fair and clear trivia question?") to filter out nonsensical or poorly formed questions.
- **Feedback Loop:** High-quality generated questions that are rated well by users (implicitly or explicitly) will be flagged. A separate process will review and ingest these questions into the permanent database, continuously improving our core asset.

## 5. Roadmap

### Phase 1: Core Engine & MVP (Current Focus)
-   [x] Basic Colyseus server setup.
-   [x] Basic Next.js front-end setup.
-   [ ] **Develop the Question DB Schema:** Define the structure for questions, answers, topics, etc.
-   [ ] **Implement the Decision Logic v1:**
    -   Build the `[Request -> Cache -> DB -> Generate]` flow.
    -   Integrate with a single LLM for initial on-the-fly generation.
-   [ ] **Build Core Game Loop:**
    -   Lobby where players can join.
    -   Display questions and multiple-choice answers.
    -   Accept answers and keep score.
    -   Declare a winner.
-   [ ] **Launch internal alpha.**

### Phase 2: Scaling & Intelligence
-   [ ] **Implement Multi-Tier LLM Generation:** Introduce logic to select the right model for the job to manage costs.
-   [ ] **Develop Question Validation System:** Build the automated quality check for generated questions.
-   [ ] **Build the Feedback Loop:** Create the system for adding top-tier generated questions back into the main DB.
-   [ ] **Expand Game Features:** Add player avatars, sound effects, and a more polished UI.
-   [ ] **Public Beta Launch.**

### Phase 3: Monetization & Growth
-   [ ] **Introduce Premium Features:** Custom game rules, private rooms, corporate packages.
-   [ ] **User-Submitted Questions:** Allow trusted users to contribute to the database.
-   [ ] **Expand Game Modes:** Introduce different formats like "True or False," "Image-based Questions," etc.
-   [ ] **Leaderboards and Social Features.**
