# Account-access repair

- [x] Repair confirmed platform-owner membership and preserve invited roles without elevating uninvited accounts.
- [x] Complete enrollment before opening project screens and report retryable access failures.
- [x] Assign drawing ownership from the signed-in identity.
- [x] Add account-access regression checks and update the live QA list.
- [ ] Verify signed-in drawing upload through the browser — blocked: external Supabase does not provide an automated sign-in session.

# RFI creation and offline fieldwork

- [x] Add complete RFI creation fields, register creation, and pin-only location rules.
- [x] Persist account/project-isolated read caches and durable RFI, snag and observation/photo outbox with retry status.
- [x] Add guarded published-app offline shell and mobile connection status.
- [x] Add regression tests and update live QA cases.
- [ ] Verify authenticated offline creation and reconnect in the published app — blocked: external Supabase cannot mint automated sessions; local simulated mobile saving/reconnect passed, published offline reopening remains unverified.