# Rule Management Guidelines

## Core Rule
All rules must be documented in separate files, with each file focusing on a specific aspect of the development process.

## Rule File Structure
1. Each rule set should have its own `.md` file in the `.cursor/rules/` directory
2. File names should be kebab-case and descriptive
3. Files should be referenced in the main `commit.md` file

## Creating New Rules
1. Create a new `.md` file in `.cursor/rules/`
2. Follow the established documentation format:
   - Clear title
   - Core rule statement
   - Detailed process/steps
   - Examples
   - Exception handling
3. Update `commit.md` to reference the new rule file
4. Commit both the new file and the updated `commit.md`

## Modifying Existing Rules
1. Edit the specific rule file directly
2. Maintain the existing structure and format
3. Update any related examples or references
4. Commit the changes to the specific file

## Example

Creating a new rule:
```
1. Create new file: .cursor/rules/code-review.md
2. Document the rule
3. Update commit.md:
   ```markdown
   ## Rule Sets
   1. [Conventional Commits](conventional-commits.md)
   2. [Test-Driven Development](tdd.md)
   3. [Commit Process](commit-process.md)
   4. [Code Review](code-review.md)  # New entry
   ```
4. Commit both files
```

## Exception Handling
- If a rule is too small to warrant its own file, it should be added to the most relevant existing file
- If a rule spans multiple aspects, it should be split into multiple focused files
- Rule files should not exceed 200 lines; if they do, consider splitting into sub-rules 