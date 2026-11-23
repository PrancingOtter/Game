# Hangout Hangman — Cooperative Multiplayer

A functional, real-time, three-player Hangman game. No database, account, or API keys required. Players join with a six-character room code, and everyone sees the same guesses.

## Run locally

1. Install Node.js 18 or later.
2. Open a terminal in this folder.
3. Run `npm install`.
4. Run `npm start`.
5. Open http://localhost:3000.

## Play from different locations

Deploy this Node.js application to an HTTPS hosting service that supports persistent WebSockets (for example Render's Web Service, Railway, or Fly.io). Set the start command to `npm start` and use the public URL provided by your host. The host may charge fees or sleep when idle depending on its plan. Share the in-game invite link with up to two friends.

Do not use static-only hosting like GitHub Pages for this version; it requires a running Node server.

## Notes

- Rooms and game progress live in server memory, so restarting the server resets them.
- Rooms expire after one hour with nobody connected.
- The game has a fixed starter set of family-friendly puzzles.
- Room codes are invitation secrets, not secure authentication. Avoid sensitive content.
- This is a learning prototype, not production-hardened public multiplayer infrastructure. For a wider launch, add rate limits, moderation, persistent storage, and stronger room access controls.
