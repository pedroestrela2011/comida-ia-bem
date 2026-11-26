# Architecture rules

- Keep the disabled-Journey notice shared by the Achievements and Daily Score pages, reading the profile preference without awarding XP or changing settings, so both pages present the same read-only status.
- Use a shared plan catalog for all plan-selection and pricing displays, preserving billing identifiers, so signup, public pages and settings cannot drift apart.
- Keep local password validation and auth-error explanations in one shared module used by every create/reset/change-password form; let hosted authentication enforce its essential protections without presenting composition as mandatory.
- Export adapted-diet shopping PDFs from the displayed shopping list and its original checkbox keys, scaling by the selected portion multiplier and preserving missing quantities explicitly, so downloads match the screen without inventing nutrition data.
- Enforce the monthly menu-creation limit server-side in the menu-generation function, recording a creation only after a valid menu is produced, so create and recreate share one counter and failures never consume it.
