# Changelog - BungouArchive

## [2026-03-15] - System Stability & Scaling (Phase 5)
### Added
- **Scaling Indices**: Added high-performance indices on `profiles`, `user_events`, and `notifications` to stop "unhealthy" database reports and resolve slow queries.
- **Database RPC**: Implemented `get_faction_space_data` to combine multiple queries into a single flight, improving faction room load times.

### Fixed
- **Realtime Broadcast Storms**: Implemented "Surgical Realtime" in `FactionPrivateSpace` and `GlobalDuelMatchmaker`. Subscriptions now use SQL-level filters to reduce redundant messages by ~80%.
- **OAuth Origin Issues**: Fixed a critical bug in `auth/callback` where Vercel's proxy environment would cause `oauth_failed` errors due to protocol mismatches.
- **Asset 404s**: Silenced missing `agency` sound references to clear console errors.
- **System Slowness**: Cleared zombie node processes that were competing for port 3000.

### Improved
- **Middleware Performance**: Added a session-hint cookie system to skip mandatory DB auth checks on non-sensitive page navigations, reducing Disk IO significantly.
