# Architecture rules

- Keep the disabled-Journey notice shared by the Achievements and Daily Score pages, reading the profile preference without awarding XP or changing settings, so both pages present the same read-only status.
- Use a shared plan catalog for all plan-selection and pricing displays, preserving billing identifiers, so signup, public pages and settings cannot drift apart.
- Keep password rules in one shared module consumed by the strength indicator and by every create/reset/change-password validation, so the requirements shown to the user always match the rules actually enforced.