# Pre-Commit Code Quality, EditorConfig & TypeScript Compilation Check Rule

## Rule: Never Commit Code With Compilation Errors, Formatting Violations, or Unused Code

1. **Mandatory Verification**:
   - Before completing any feature, fix, or code modification in this web service:
     a) Run TypeScript type-check (`npx tsc --noEmit`) to verify code compiles cleanly without errors.
     b) Verify `.editorconfig` formatting (LF line endings, no trailing whitespace, max line length).
     c) Verify TS/JS code quality (no unused imports or unused variables).

2. **Commit Policy**:
   - DO NOT commit changes if TypeScript compilation, `.editorconfig` rules, or code checks fail.
   - Fix all compilation errors, formatting violations, and unused code problems prior to committing.

3. **Automated Enforcement**:
   - A pre-commit hook (`.git/hooks/pre-commit`) is installed in this repository to automatically block `git commit` if any of these checks fail.

