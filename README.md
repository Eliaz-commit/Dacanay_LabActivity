# Fieldnotes — Async CRUD Lab

A small, responsive notes interface for the lab activity. It demonstrates API-backed create, read, update, and delete requests with `async`/`await`, plus visible loading, success, and error states.

## Run it

Open `index.html` in a modern browser with an internet connection. The page sends a GET request to JSONPlaceholder at `https://jsonplaceholder.typicode.com/posts` and uses the returned record IDs with short, local English and Filipino sample notes.

## CRUD mapping

| Action | HTTP method | Endpoint |
| --- | --- | --- |
| Read notes | `GET` | `/posts?_limit=9` |
| Create note | `POST` | `/posts` |
| Update note | `PUT` | `/posts/{id}` |
| Delete note | `DELETE` | `/posts/{id}` |

JSONPlaceholder is a demonstration API: it accepts write requests and returns sample responses, but it does not persist created, updated, or deleted records on its server. The app updates its on-screen collection after a successful response; a page refresh loads the same nine sample notes again.

## Files

- `index.html` — accessible page structure and dialogs
- `styles.css` — visual design and responsive layouts
- `app.js` — async API requests and CRUD interface behavior
