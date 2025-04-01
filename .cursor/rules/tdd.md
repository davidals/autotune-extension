# Test-Driven Development Rules

## Core TDD Rule
All code changes must follow the Test-Driven Development (TDD) cycle:
1. Write a failing test
2. Write code to make the test pass
3. Refactor if needed

## TDD Process
1. **Identify Test Need**
   - Before making any changes, identify if existing tests cover the change
   - If not, create a new test first

2. **Write Failing Test**
   - Create or update test file
   - Write test that captures desired behavior
   - Run `npm test` to verify test fails
   - Only proceed to code changes after confirming test failure

3. **Implement Code**
   - Write minimal code to make test pass
   - Run `npm test` to verify test passes
   - If test fails, fix implementation
   - If test passes, proceed to user acceptance

4. **User Acceptance**
   - After tests pass, present changes to user
   - Wait for user acceptance
   - If user requests changes, return to step 2 or 3 as needed

5. **Commit Process**
   - After user acceptance, run `npm test` one final time
   - Create commit with test and implementation changes
   - Follow conventional commit format

## Example TDD Flow
```
User: "Add error handling for API calls"
AI: *identifies no existing test for API error handling*
AI: *creates new test for API error scenarios*
AI: *runs tests, confirms new test fails*
AI: *implements error handling code*
AI: *runs tests, confirms all tests pass*
AI: "I've added error handling for API calls. Would you like to review the changes?"
User: "Yes, looks good"
AI: *runs tests one final time*
AI: *creates commit with test and implementation*
```

## Exception Handling
- If existing tests already cover the change, skip step 2
- If test is too complex to write first, break down the change into smaller testable units
- If user rejects changes, revert both test and implementation changes
- Never commit code without corresponding tests 