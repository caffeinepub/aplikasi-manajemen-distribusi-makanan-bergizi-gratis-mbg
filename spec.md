# Aplikasi Manajemen Distribusi MBG

## Current State
App deployed with backend canister. Data lost on redeploy because canister is replaced. Backend mutations reject anonymous callers.

## Requested Changes (Diff)

### Add
- localStorage-based data persistence layer

### Modify
- Replace canister calls with localStorage operations for all data CRUD
- Keep all v13 features: checklist, edit, monthly filter, PDF, rekapan

### Remove
- Backend dependency for data storage

## Implementation Plan
1. Create localStore.ts utility for sasaran, paket, distribusi
2. Update all pages to use localStore
3. Validate and deploy
