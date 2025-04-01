# Cursor Commit Rule

This rule ensures that all changes made in Cursor are properly committed after acceptance.

## Rule Flow

1. **Change Creation**
   - Make changes to the codebase
   - Review changes in the diff view
   - Get user acceptance

2. **Commit Creation**
   - After user accepts changes, create a commit
   - Follow conventional commit format
   - Include detailed description

3. **Commit Message Structure**
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

## Validation

Before committing:
1. All changes are reviewed
2. Code works as expected
3. No linting errors
4. Tests pass (if applicable)
5. User has accepted changes

## Error Handling

If commit fails:
1. Check git status
2. Verify file changes
3. Ensure proper permissions
4. Check git configuration
5. Retry commit with corrected information 

# Commit Rules for Cursor AI

## Core Rule
A commit must be made after responding to a user prompt and before waiting for the next one, but only after verifying that all tests pass.

## When to Commit
1. After making changes in response to a user prompt
2. After running `npm test` and confirming all tests pass
3. Before proceeding to the next user prompt

## Process
1. Make the requested changes
2. Run `npm test` to verify all tests pass
3. If tests fail:
   - Fix the failing tests
   - Run tests again
   - Only proceed to commit once all tests pass
4. Create a commit with:
   - A descriptive message following conventional commits format
   - Details of what was changed
   - Mention of test verification

## Exception Handling
- If the user rejects a commit, revert the changes and wait for further instructions
- If tests are failing and cannot be fixed immediately, inform the user and seek guidance
- Do not commit code that has failing tests

## Examples

Good Flow:
```
User: "Update the popup component"
AI: *makes changes*
AI: *runs tests*
AI: *tests pass*
AI: *creates commit*
AI: "Changes committed successfully. What would you like me to do next?"
```

Bad Flow:
```
User: "Update the popup component"
AI: *makes changes*
AI: *creates commit without running tests*
AI: "Changes committed. What's next?"
```

Test Failure Flow:
```
User: "Update the popup component"
AI: *makes changes*
AI: *runs tests*
AI: *tests fail*
AI: "The changes I made caused test failures. Would you like me to fix them before committing?"
``` 