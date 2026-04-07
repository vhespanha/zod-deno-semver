# zod-deno-semver

Utility library adding support for semantic validation of SemVer strings.

## Usage

Declare your SemVer schema:

```typescript
const z = ExtendZodWithSemVer(zod);
const schema = z.semver().greaterThan('0.1.2');
```

Validate it:

```typescript
schema.parse('0.1.3'); // Valid
schema.parse('0.0.1'); // Not valid
```
