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

## Core Rule: Commit Between User Prompts

The fundamental rule is that a commit MUST be made after responding to a user prompt and before waiting for the next one.

### Process

1. User provides a prompt
2. AI makes necessary changes to satisfy the prompt
3. AI MUST create a commit for those changes
4. Only then can AI wait for the next prompt

### What to Include in Each Commit

- All changes made in response to the user's prompt
- Changes can span multiple files if they're part of the same logical change
- Follow conventional commit format

### When to Commit

✅ DO commit:
- After completing all changes for a user prompt
- Before waiting for the next user prompt
- When the user explicitly requests a commit

❌ DO NOT:
- Wait for the user to ask for a commit
- Move on to the next prompt without committing
- Split changes from a single prompt into multiple commits (unless explicitly requested)

### Example Flow

```
User: "Fix the module loading issue"
AI: *makes changes to multiple files*
AI: *creates commit*
AI: "Changes have been committed. What would you like me to do next?"
User: "Update the documentation"
...
```

### Exception Handling

If the user rejects a commit or requests changes:
1. Address the requested changes
2. Create a new commit
3. Wait for user confirmation before proceeding to next prompt 