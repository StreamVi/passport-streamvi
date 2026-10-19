# Changelog

## 1.0.8 (2026-10-20)

- Verify OAuth state before exchanging an authorization code, including state-only configurations.
- Stop after rejected state, store errors, missing PKCE verifiers and replayed callbacks.
- Wait for asynchronous state stores and support their metadata argument.
- Build Git installations through prepare; document the server session required by state/PKCE.
- Cover valid S256 exchanges, rejected callbacks and asynchronous stores with tests.
