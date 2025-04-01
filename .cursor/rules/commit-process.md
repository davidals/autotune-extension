# Commit Process Rules

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

## Validation
Before committing:
1. All changes are reviewed
2. Code works as expected
3. No linting errors
4. Tests pass (if applicable)
5. User has accepted changes

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

## Error Handling
If commit fails:
1. Check git status
2. Verify file changes
3. Ensure proper permissions
4. Check git configuration
5. Retry commit with corrected information

## Exception Handling
- If the user rejects a commit, revert the changes and wait for further instructions
- If tests are failing and cannot be fixed immediately, inform the user and seek guidance
- Do not commit code that has failing tests 