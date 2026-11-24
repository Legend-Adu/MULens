MULens Stage 2A: backend authorization (local development only)

Copy the src and netlify directories and server.ts into D:\MULens, merging directories and replacing matching files. Do not delete existing directories. Back up the project first. Do not commit or deploy this incomplete migration. No environment file is included or needs to be changed for this step. VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured on the server.

Admin actions now require verified access token, live role lookup and aal2. Admin UI remains disabled until MFA enrollment/verification and UI migration are implemented. Existing ADMIN_SECRET_KEY is no longer accepted by these five protected endpoints.

Local checks: node --check .\src\js\main.js; node --check .\src\js\auth.js; node --check .\src\js\supabase.js; npm run build; npm.cmd run dev.
Open http://localhost:3000 in a normal browser; F12 Console: await window.mulensAuthCheck() and await window.mulensAdminCheck(). Use guest, normal user, then admin before MFA. Expected 401 guest; 200 user/aal1/false and four 403s; 200 admin/aal1/false and four 403s. The admin probes use unknown actions; no real edits.

Verification performed here: JS syntax, TypeScript transpilation (not full type-check/build), 37 mocked assertions covering authorization denial and role checks. Live testing required.

Remaining: MFA UI and admin UI, remove old admin secret prompts and direct legacy calls, review DB/storage policies, private pending media and Campus Voices JSON, owner delete behavior, safe HTML rendering, recovery, production configuration and tests.
