# Specification

## Summary
**Goal:** Replace the free-text beneficiary name input in the "Catat Distribusi" (Record Distribution) form with a searchable, village-grouped checklist that pulls from existing Sasaran records, and update the backend to handle batch distribution record creation.

**Planned changes:**
- Replace the free-text beneficiary name field in the distribution form with a searchable checklist input that filters by beneficiary name or village as the user types.
- Group beneficiaries in the checklist under their respective village (desa) headers, with expand/collapse support per group.
- Allow selection of multiple beneficiaries across villages before submitting; show a visual summary of selected beneficiaries.
- Fetch checklist data from existing Sasaran records (active/eligible only) rather than accepting manual text input.
- Update the backend distribution endpoint to accept a batch of sasaran IDs, creating one individual distribution record per selected beneficiary with the same package, date, and status.
- Ensure existing single-beneficiary distribution creation remains backward compatible.

**User-visible outcome:** Users recording a distribution can now search and check multiple beneficiaries organized by village from the existing Sasaran data, and submitting the form automatically creates a separate distribution record for each selected beneficiary.
