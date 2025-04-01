# Specification Management Rules

## Core Rule
Any behavior change (not refactors or UI/UX design changes) must be accompanied by updates to the specifications in the `spec` directory.

## When to Update Specs
1. When adding new features
2. When modifying existing feature behavior
3. When changing system requirements
4. When updating error handling
5. When modifying data flow

## Spec Update Process
1. **Identify Affected Specs**
   - Check `spec/index.md` for relevant features
   - Review linked feature specs
   - Identify use cases that need updating

2. **Update Specs**
   - Modify relevant feature specs
   - Update use cases if needed
   - Update technical specifications if needed
   - Update index if adding new features

3. **Review Changes**
   - Ensure specs accurately reflect new behavior
   - Verify all links are working
   - Check for consistency across specs

4. **Commit Changes**
   - Include spec updates in the same commit as code changes
   - Follow conventional commit format
   - Reference spec changes in commit message

## Spec File Structure
1. **Feature Specs** (`spec/features/*.md`)
   - Overview
   - Requirements (Functional & Technical)
   - User Interface
   - Error Cases
   - Success Criteria

2. **Use Cases** (`spec/use-cases/*.md`)
   - Step-by-step flow
   - Preconditions
   - Postconditions
   - Error scenarios

3. **Index** (`spec/index.md`)
   - Feature overview
   - Links to all specs
   - System architecture
   - Data flow

## Example

When adding a new feature:
```
1. Create new feature spec: spec/features/new-feature.md
2. Update spec/index.md to include new feature
3. Update relevant use cases
4. Commit changes:
   ```bash
   git add spec/features/new-feature.md spec/index.md spec/use-cases/*.md
   git commit -m "feat(new-feature): add new feature" -m "- Add new feature implementation\n- Add feature specification\n- Update use cases\n- Update system documentation"
   ```
```

## Exception Handling
- UI/UX changes that don't affect behavior don't require spec updates
- Refactoring that maintains existing behavior doesn't require spec updates
- If a spec is too large, consider splitting it into multiple focused specs
- If a change affects multiple features, update all relevant specs 