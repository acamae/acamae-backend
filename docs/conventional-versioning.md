# Conventional Versioning with Lerna

## Summary

This project uses **Lerna** with **Conventional Commits** for automatic versioning. The system analyzes commit messages to automatically determine the version type (patch, minor, major).

## Workflow

### 1. Development in Feature Branches

```bash
# Create feature branch
git checkout -b feature/new-functionality

# Make conventional commits
git commit -m "feat(auth): add OAuth2 login"
git commit -m "fix(api): handle null responses"
git commit -m "docs(readme): update installation steps"

# Push and create PR
git push origin feature/new-functionality
```

### 2. Merge to Main

- PRs are reviewed and merged to `main`
- **CI validates only PR commits** (not entire history)
- All commits must follow conventional format

### 3. Release

```bash
# Merge main to release
git checkout release
git merge main
git push origin release
```

### 4. Automatic Versioning

- The `release.yml` workflow runs automatically
- **Lerna analyzes only commits included in the release push**
- Determines version type based on PR commits
- Creates tag and publishes package

## Commit Types

### Automatic Versioning

| Type              | Description         | Version |
| ----------------- | ------------------- | ------- |
| `feat`            | New feature         | Minor   |
| `fix`             | Bug fix             | Patch   |
| `BREAKING CHANGE` | Incompatible change | Major   |

### No Versioning

| Type       | Description              | Version |
| ---------- | ------------------------ | ------- |
| `docs`     | Documentation            | -       |
| `style`    | Code formatting          | -       |
| `refactor` | Code refactoring         | -       |
| `perf`     | Performance improvements | -       |
| `test`     | Tests                    | -       |
| `build`    | Build system             | -       |
| `ci`       | CI/CD                    | -       |
| `chore`    | Maintenance tasks        | -       |

## Commit Examples

### ✅ Correct

```bash
feat(auth): add OAuth2 login with Google
fix(api): handle null responses in user service
docs(readme): update installation steps
test(hooks): add unit tests for useAuth hook
refactor(store): simplify Redux middleware configuration
BREAKING CHANGE(auth): remove deprecated login method
```

### ❌ Incorrect

```bash
feat(authentication): implement comprehensive OAuth2 authentication flow with Google, Facebook, and Twitter providers including token refresh mechanism
fix: fixed some bugs
Updated stuff
```

## Configuration

### Lerna (lerna.json)

```json
{
  "command": {
    "version": {
      "conventionalCommits": true,
      "conventionalPrerelease": false,
      "conventionalGraduate": false
    }
  }
}
```

### Workflow (release.yml)

- Runs only on `release` branch
- **Analyzes only commits from current push** (not entire history)
- Only versions if there are conventional commits in PR
- Creates tags and publishes automatically

### Validation (Husky + CI)

- **Pre-commit hooks with Husky** validate conventional format
- **CI validates critical configuration** and workflows
- Prevents incorrect commits before push

## Useful Commands

### Local Validation

```bash
# Validate critical configuration
npm run validate:config

# Validate workflows
npm run validate:workflows

# Validate everything
npm run validate

# Husky validates commits automatically in pre-commit
```

### Manual Versioning

```bash
# Version with conventional commits
npx lerna version --conventional-commits --yes

# Publish
npx lerna publish from-package --yes
```

### View History

```bash
# View commits from current PR
git log main..HEAD --oneline

# View conventional commits in PR
git log main..HEAD --oneline | grep -E "^(feat|fix|BREAKING CHANGE)"

# View commits since last release
git log $(git describe --tags --abbrev=0)..HEAD --oneline
```

## Troubleshooting

### Error: "No conventional commits found"

- Verify that PR commits follow correct format
- Ensure they are not only `chore`, `docs`, etc. commits
- Check that merge to `release` includes feature/fix commits

### Error: "Commit message validation failed"

- Use format: `type(scope): description`
- Keep description under 100 characters
- Use valid types: `feat`, `fix`, `docs`, etc.

### Error: "Version already exists"

- Check for duplicate tags
- Use `git tag -l` to see existing tags
- Consider using `--force` if necessary

## Important Rules

1. **Always use conventional commits** in feature branches
2. **Never direct commits** to `main` or `release`
3. **Husky validates automatically** commit format
4. **Review CHANGELOG.md** after each release
5. **Use descriptive scopes** for better organization
6. **Only PR commits are analyzed** for versioning

## GitHub Integration

- **Automatic releases** on GitHub
- **Generated changelog** automatically
- **Version tags** created by Lerna
- **CI validation** prevents errors
- **Specific analysis** of PR commits
