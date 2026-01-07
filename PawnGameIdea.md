Game Design Document: Pawn Advance Chess
1. Overview
Pawn Advance Chess is a high-speed, tactical chess variant played exclusively with pawns on an 8x8 grid. Unlike traditional chess, which focuses on protecting a single King, this game is a war of attrition and positioning where the primary goal is a "Touchdown" (reaching the opponent's back row) or a points victory through mass capture.
2. Core Gameplay Loop
The game is played in Rounds. A single round consists of three distinct phases:
Phase A: The Battle (Turn-Based)
Move Quota: Each player has exactly 4 moves per turn.
Move Restriction: A specific pawn can only be moved once per turn. You must coordinate 4 different units to maximize your tactical spread.
Movement Rules:
Forward: Pawns move 1 square forward.
Double Step: On a pawn's very first move (initial spawn), it may move 2 squares forward if the path is clear.
Captures: Pawns capture diagonally forward (1 square).
Turn End: A turn ends once 4 moves are made or no more moveable pawns exist.
Phase B: The March (Automatic Advancement)
At the conclusion of both players' turns, the Advancement Phase triggers.
The Law of the March: Every pawn on the board automatically attempts to move 1 square forward toward the enemy's side.
Blocking & Collisions:
Head-to-Head: If a pawn is directly facing an enemy pawn, they block each other and neither advances.
Collision Course: If two pawns (one White, one Black) are separated by a single empty square, they would both "march" into that same square. To prevent a collision, both pawns remain stationary.
Wall Block: If a pawn is behind a friendly pawn that is blocked, the trailing pawn is also blocked.
Phase C: Reinforcements (Spawning)
After the March, new troops are deployed to the back row (Base Row).
Spawning Density: Players can configure 1, 2, 3, or 4 pawns to spawn per round.
Placement:
Random: Pawns appear in random empty slots on the back row.
Choice: Players manually click to place their reinforcements.
3. Win Conditions
Touchdown: The first player to move a pawn into the opponent’s starting back row wins instantly.
Extinction: If a player loses all their pawns, the opponent wins.
Score (Capture) Victory: If the configured round limit (e.g., 10 rounds) is reached, the player with the most captures wins.
4. Visual & UI Identity
Board Aesthetics: A modern "Dark Mode" slate-and-metal aesthetic. White pieces are bright and clean; Black pieces are dark and sleek with subtle borders.
Phase Alerts: The UI clearly announces phases with animations (e.g., a "Marching" alert with a fast-forward icon during advancement).
Tactical Overlays:
Moved State: Once a pawn is used during a turn, it becomes dimmed/grayscale to show it cannot be moved again until the next round.
Targeting: Valid moves and captures are highlighted with high-contrast rings (Green for move, Red for capture).
5. Strategic Depth
The Logistics Problem: Because you spawn up to 4 pawns but only have 4 moves, you must decide whether to move your front-line "veterans" or clear space on your back row for the next wave of "recruits."
The Blocking Meta: Since the March is automatic, players can intentionally "block" an enemy advance by placing a pawn directly in front of them, creating a stalemate while they flank with other units.
Pawn Chains: Moving pawns in a diagonal chain is vital, as it allows units to protect each other’s capture squares.