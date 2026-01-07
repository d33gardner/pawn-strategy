This project is built using a modern, high-performance web stack designed for rapid development and high interactivity. As a senior engineer, I’ve structured the application to maintain a clean separation between User Interface, Game State, and Business Logic.
Here is a breakdown of the technical architecture and tools used to build Pawn Advance Chess:
1. Core Framework & Language
React 19: The foundation of the UI. It handles the "reactive" nature of the board—automatically updating the view whenever the game state changes. We use Functional Components with Hooks (useState, useEffect, useCallback) to manage complex phase transitions and animations.
TypeScript: Crucial for a strategy game. We use strong typing for Player, Pawn, Move, and GameState to ensure that logic errors (like moving a pawn to an undefined square) are caught during development rather than at runtime.
2. Styling & UI Design
Tailwind CSS: Used for the utility-first styling approach. This allowed for the creation of the "Slate & Emerald" dark-mode aesthetic without writing bulky CSS files. It handles the responsive layout, ensuring the game board scales perfectly from mobile screens to desktop monitors.
Lucide React: A lightweight icon library used to provide intuitive visual cues (e.g., the Shield for configuration, Swords for starting, and History for the move log).
CSS Transitions: Native CSS transitions are used for pawn movement and selection highlights to give the game a "tactile" feel.
3. Game Engine Architecture
The "brain" of the game is decoupled from the UI, following a Service-Oriented Architecture:
gameLogic.ts: This is a standalone "Chess Engine" module. It contains pure functions that don't know anything about React. They simply take a Board and a Move and return a New Board. This makes the logic easy to test and highly performant.
The Marching Algorithm: A custom-built advancement function that handles multi-unit collisions. It uses a 3-step validation process (Check Adjacency → Check Collision Courses → Execute) to ensure pawns behave correctly during the automatic advancement phase.
4. Artificial Intelligence (AI)
Heuristic Search (ai.ts): The opponent uses a Minimax-lite heuristic approach. Instead of just picking random moves, the AI evaluates thousands of potential outcomes based on:
Proximity: How close a pawn is to the "Touchdown" line.
Material: The value of capturing an enemy unit.
Safety: Avoiding squares where it might be captured in the next turn.
5. State Management
Single Source of Truth: The entire game is governed by a single GameState object. This includes the board array, the spawnQueue, and the moveHistory. This architectural choice makes "Undo" features or "Save Game" features trivial to implement in the future.
Phase Machine: The game utilizes a Finite State Machine (FSM) pattern. The game transitions through PLAYING → ADVANCEMENT → SPAWNING phases, with logic guarded to ensure players cannot move pieces out of turn or during a calculation phase.
6. Development Utilities
ES Modules (ESM): The project uses modern browser-native modules, allowing for clean imports without the overhead of legacy bundlers.
UUID: Used to generate unique identifiers for every pawn spawned, ensuring that React’s reconciliation engine can track individual pieces as they move across the board for smooth animations.
