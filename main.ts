import {
  format,
  greaterOrEqual as semverGreaterOrEqual,
  greaterThan as semverGreaterThan,
  lessOrEqual as semverLessOrEqual,
  lessThan as semverLessThan,
  notEquals as semverNotEquals,
  parse,
  parseRange,
  type Range,
  satisfies as semverSatisfies,
  type SemVer,
} from '@std/semver';
import type * as zod from '@zod/zod';

export type SemVerSchema = zod.ZodType<SemVer> & {
  parse(input: unknown): SemVer;
  refine(
    check: (value: SemVer) => boolean,
    params: { error: string },
  ): SemVerSchema;
  greaterOrEqual(version: string): SemVerSchema;
  greaterThan(version: string): SemVerSchema;
  lessOrEqual(version: string): SemVerSchema;
  lessThan(version: string): SemVerSchema;
  notEquals(version: string): SemVerSchema;
  satisfies(range: string): SemVerSchema;
};

type RefineableSchema<TOutput> = {
  parse(input: unknown): TOutput;
  refine(
    check: (value: TOutput) => boolean,
    params: { error: string },
  ): RefineableSchema<TOutput>;
};

function withSemVerMethods<T extends RefineableSchema<SemVer>>(
  schema: T,
): T & SemVerSchema {
  const current = schema as T & SemVerSchema;

  current.greaterOrEqual = (version: string): SemVerSchema => {
    const target = parse(version);
    const next = schema.refine(
      (value) => semverGreaterOrEqual(value, target),
      { error: `Version must be greater than or equal to ${version}` },
    );
    return withSemVerMethods(next);
  };

  current.greaterThan = (version: string): SemVerSchema => {
    const target = parse(version);
    const next = schema.refine(
      (value) => semverGreaterThan(value, target),
      { error: `Version must be greater than ${version}` },
    );
    return withSemVerMethods(next);
  };

  current.lessOrEqual = (version: string): SemVerSchema => {
    const target = parse(version);
    const next = schema.refine(
      (value) => semverLessOrEqual(value, target),
      { error: `Version must be less than or equal to ${version}` },
    );
    return withSemVerMethods(next);
  };

  current.lessThan = (version: string): SemVerSchema => {
    const target = parse(version);
    const next = schema.refine(
      (value) => semverLessThan(value, target),
      { error: `Version must be less than ${version}` },
    );
    return withSemVerMethods(next);
  };

  current.notEquals = (version: string): SemVerSchema => {
    const target = parse(version);
    const next = schema.refine(
      (value) => semverNotEquals(value, target),
      { error: `Version must not equal ${version}` },
    );
    return withSemVerMethods(next);
  };

  current.satisfies = (range: string): SemVerSchema => {
    const parsedRange: Range = parseRange(range);
    const next = schema.refine(
      (value) => semverSatisfies(value, parsedRange),
      { error: `Version must satisfy range ${range}` },
    );
    return withSemVerMethods(next);
  };

  return current;
}

function createSemVerSchema(z: typeof zod): SemVerSchema {
  const base = z.codec(
    z.string(),
    z.object({
      major: z.number().int().nonnegative(),
      minor: z.number().int().nonnegative(),
      patch: z.number().int().nonnegative(),
      prerelease: z.array(z.union([z.string(), z.number()])).optional(),
      build: z.array(z.string()).optional(),
    }),
    {
      decode: (value: string): SemVer => parse(value),
      encode: (value: SemVer): string => format(value),
    },
  );

  return withSemVerMethods(base);
}

export type ZodSemVerExtension = {
  semver: () => SemVerSchema;
};

export function ExtendZodWithSemVer<T extends typeof zod>(
  z: T,
): T & ZodSemVerExtension {
  const extended = Object.create(
    Object.getPrototypeOf(z),
    Object.getOwnPropertyDescriptors(z),
  ) as T & Partial<ZodSemVerExtension>;
  extended.semver = (): SemVerSchema => createSemVerSchema(z);
  return extended as T & ZodSemVerExtension;
}
