# Contributing to Autotune

Thank you for your interest in contributing to Autotune! This document provides guidelines for contributing to the project.

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for our commit messages. This helps maintain a clear and consistent commit history.

### Commit Message Format

```
type(scope): subject

body

footer
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Performance improvements
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

### Scope

The scope should be the name of the module affected (e.g., `popup`, `content`, `background`).

### Subject

- Use imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize first letter
- No dot (.) at the end

### Body

- Use imperative, present tense
- Include motivation for the change and contrast with previous behavior
- List specific changes made
- Explain the impact on user experience
- Use bullet points for better readability

### Footer

- Reference any breaking changes
- Reference issues that this commit closes
- Format: `BREAKING CHANGE: <description>`
- Format: `Closes #<issue-number>`

### Example

```
refactor(popup): simplify UI with single text container and dynamic button

- Replace multiple containers with a single text container
- Implement dynamic button state management
- Add state transitions: original → enhanced → accepted → revert
- Improve visual feedback for each state
- Add ability to revert changes
- Enhance error handling and state recovery

This change improves the user experience by:
- Reducing visual clutter
- Making the interface more intuitive
- Providing clear feedback for each action
- Maintaining all functionality in a more compact form

BREAKING CHANGE: The popup interface has been completely redesigned with a new
state-based approach. Users will now see a single text container and a button
that changes based on the current state.
```

## Commit Process

1. Make your changes
2. Review your changes thoroughly
3. Test your changes
4. Stage your changes: `git add <files>`
5. Create commit following the format above
6. Push your changes

## Review Process

Before committing:
1. Self-review your changes
2. Ensure all tests pass
3. Check for linting errors
4. Verify the changes work as expected
5. Get feedback from team members if needed

## Questions?

If you have any questions about these guidelines, please open an issue or contact the maintainers. 