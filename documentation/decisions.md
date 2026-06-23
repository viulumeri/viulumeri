# Technology decisions

## 21.6.2025

## cross-env

Added `cross-env` to make npm scripts that set environment variables work consistently across operating systems.
The server test scripts need variables like `NODE_ENV=test` and `TS_NODE_PROJECT=tsconfig.test.json`. The previous syntax works in Unix-like shells, but can fail on Windows because npm may run scripts through a different shell.
Using `cross-env` keeps commands like `npm run test` and `npm run check:all` working the same way on Linux, macOS, and Windows.

## 17.6.2026

### Tiptap, Dompurify

A better text editor, for teacher homework creation. Dompurify for user input sanitation.

### Eslint

Added to server side (already existed in client workspace).

### Sharp

Used for image resizing on song images.

## 18.8.2025

### MUI -> Tailwind css

Tailwind seems more suitable for our needs than MUI. Easier to customize.

## 7.8.2025

### Resend

Generous free tier, relatively easy to setup. For email verification and password reset.

## 30.7.2025

### Better Auth

Password reset and rate limiting does sound fun to implement, but it's better to leave it to a well maintained library.

### MongoDB client

Better auth apparently works better with MongoDB client so decided to add that for the auth setup. Rest of the app uses Mongoose.

## 29.7.2025

### Express

Express for the backend.

### React

React for the frontend.

### MongoDB / Mongoose

Mongoose to connect to MongoDB. NoSQL suits our needs well, Postgres would be a bit overkill.

### Material UI

MUI is partially familiar from other projects and it's relatively easy to configure and use.

### Tone.js

Tone.js for the music player. It should integrate well with React and TS.

### TanStack Query

Familiar library from other projects, easy and clean code when things are setup.

### React Context

Goes well with TanStack.

### React Router

It's nice that the URL reflects what's going on in the app.

### Supertest

Standard test library, familiar from other projects.

### node-test

Should be more light-weight than Jest and it's native.

### TypeScript

Forces one to think more than plain JS.
