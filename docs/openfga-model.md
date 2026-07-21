# OpenFGA authorization model

The model uses four resource types: `organization`, `team`, `project`, and `document`, plus `user`.

A document inherits `can_view` and `can_edit` from its parent project. A project can grant access directly to a user or indirectly through `team#member`. Organization administrators inherit management/edit rights through the project's `organization` relationship.

## Training scenarios

- `user:alice` owns `project:orion`; she can edit its child document.
- `user:bob` is a project viewer; he can view but cannot edit the document.
- `user:mallory` belongs to an unrelated organization; she receives no access.

Run model tests with `npm run fga:test`. Bootstrap a live store/model/tuples with `npm run fga:bootstrap`. The bootstrap script prints immutable store and model IDs. Pin both in the wrapper environment rather than silently using the latest model.

## Next modeling exercise

Add time-limited emergency access using an OpenFGA condition, then add assertions for active and expired contexts. This is the clearest next step toward ABAC without polluting the relationship model.
