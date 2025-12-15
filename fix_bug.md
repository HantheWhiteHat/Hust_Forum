## Fix Log

- backend/src/models/User.js: Short-circuited the password pre-save hook when the password is unchanged to avoid double-hashing and broken logins after profile edits.
- frontend/src/pages/Home.jsx: Reworked search/category controls to apply only on search button click or Enter, added a search button with icon, preserved manual trigger workflow, and reset drafts with Clear Filters.
- frontend/index.html + frontend/public/favico.png: Set site favicon to the provided PNG and copied it to the Vite public assets.
- frontend/src/components/PostCard.jsx: Hid post images on cards and limited content preview to a 3-line clamp with ellipsis; full content remains visible on detail page.

