# Conventional Commits

This document defines the format and structure for commit messages in the project.

## Commit Message Structure
```
type(scope): subject

body

footer
```

## Commit Types

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test changes
- `chore`: Maintenance tasks

## Required Commit Information

1. **Subject Line**
   - Clear, concise description
   - Present tense
   - No period at end

2. **Body**
   - List of specific changes
   - Impact on user experience
   - Technical details if relevant

3. **Footer**
   - Breaking changes (if any)
   - Issue references (if any)

## Example

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

## Implementation

1. After each change is accepted:
   ```bash
   git add <changed-files>
   git commit -m "type(scope): subject" -m "body" -m "footer"
   ```

2. Verify commit:
   ```bash
   git log -1
   ``` 