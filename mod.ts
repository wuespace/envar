/**
 * @module
 *
 * This module provides functions to set up environment variables in a Deno application.
 *
 * The main function in this module is {@link initVariable}, which sets up an environment variable.
 * The variable can have three different sources:
 * 1. The environment variable itself;
 * 2. A file specified by another environment variable with the name `[variable]_FILE`; or
 * 3. A default value.
 *
 * The environment variable takes precedence over the file, which takes precedence over the default value.
 *
 * The function also validates the environment variable's value using a Zod schema.
 *
 * After this is set up, you can simply read values synchronously from the environment using `Deno.env.get`.
 *
 * If, at that point, the environment variable is not set, the application shall throw an {@link EnvNotSetError}.
 */
import { getLogger } from "@std/log";

/**
 * Whereas `envVariable` is the name of an environment variable used in the application,
 * this error shall be thrown when the application tries to access an environment variable
 * that is not set.
 *
 * Note that such variables should be set using {@link initVariable} at the beginning
 * of the application's execution.
 */
export class EnvNotSetError extends Error {
  /**
   * @param envVariable name of the environment variable
   */
  constructor(public readonly envVariable: string, cause?: unknown) {
    super(
      `Environment variable ${envVariable} is not set.\n` +
        `You can also set it by specifying a path to a file ` +
        `with its value using ${envVariable}_FILE.`,
    );
    this.cause = cause;
  }
}

/**
 * Whereas:
 * 1. `envVariable` is the name of an environment variable used in the application,
 * 2. `defaultValue` is the default value for the environment variable (can be undefined), and
 * 3. `validator` is a Zod schema used to validate the environment variable's value,
 *
 * this function will:
 *
 * 1. Look for the environment variable `envVariable`;
 * 2. If it is not set, try to set it by reading the file specified by `${envVariable}_FILE`;
 * 3. If `${envVariable}_FILE` is not set, set the environment variable to `defaultValue`;
 * 4. If `defaultValue` is undefined, delete the environment variable;
 * 5. Validate the environment variable's value using `validator`.
 *
 * @param envVariable name of the environment variable
 * @param validator Zod schema used to validate the environment variable's value
 * @param defaultValue default value for the environment variable
 *
 * @throws {ConfigParseError} If the final environment variable's value cannot be parsed using `validator`,
 * this function will throw a `ConfigParseError`.
 * @throws {ConfigFileReadError} If the file at the path specified by `${envVariable}_FILE` cannot be read,
 * this function will throw a `ConfigFileReadError`.
 */
export async function initVariable(
  envVariable: string,
  validator: ZodSchemaCompat,
  defaultValue?: string,
): Promise<void> {
  logger().debug(`(${envVariable}) Setting up environment variable.`, {
    envVariable,
    defaultValue,
  });

  let source = `Environment variable ${envVariable}`;

  if (!Deno.env.get(envVariable)) {
    source = `File from ${envVariable}_FILE`;
    await setFromFile(envVariable);
  }

  if (!Deno.env.get(envVariable)) {
    source = `Default value ${defaultValue ? `"${defaultValue}"` : "[none]"}`;
    setFromDefault(envVariable, defaultValue);
  }

  const { error: parseError } = validator.safeParse(
    Deno.env.get(envVariable) || defaultValue,
  );

  if (parseError) {
    logger().error(`Could not parse variable ${envVariable}.`, {
      error: parseError,
      value: Deno.env.get(envVariable),
    });
    throw new ConfigParseError(
      `Could not parse variable ${envVariable}. Details:\n${parseError}`,
    );
  }

  logger().info(`Variable: ${envVariable} (using ${source})`, {
    envVariable,
    value: Deno.env.get(envVariable),
    source,
    required: validator.isOptional(),
  });
}

/**
 * Whereas
 * 1. `envVariable` is the name of an environment variable used in the application not set,
 * 2. `pathVariable` is the name of the environment variable that specifies the path to the
 *    file containing the desiredvalue of `envVariable`, and
 * 3. `cause` is the error that occurred while trying to read the file at the path specified by `pathVariable`,
 *
 * this error shall be thrown when reading the file at the path specified by `pathVariable` fails.
 */
export class ConfigFileReadError extends Error {
  constructor(
    public readonly envVariable: string,
    public readonly pathVariable: string,
    cause: Error,
  ) {
    super(
      `Could not read file "${
        Deno.env.get(pathVariable)
      }" to set ${envVariable} (based on ${pathVariable}). Details:\n${cause}`,
    );
    this.cause = cause;
  }
}

/**
 * An error that gets thrown by {@link initVariable} when the environment variable
 * cannot be parsed using the Zod schema.
 */
export class ConfigParseError extends Error {}

/**
 * Set the environment variable from the default value.
 * If the default value is not set, the environment variable is deleted.
 * @param envVariable name of the environment variable
 * @param defaultValue default value for the environment variable
 */
function setFromDefault(envVariable: string, defaultValue?: string) {
  if (defaultValue === undefined) {
    logger().debug(
      `(${envVariable}) No default value set for environment variable.`,
      {
        envVariable,
      },
    );
    return Deno.env.delete(envVariable);
  }

  logger().debug(
    `(${envVariable}) Setting environment variable from default.`,
    {
      envVariable,
      defaultValue,
    },
  );
  Deno.env.set(envVariable, defaultValue);
}

/**
 * Whereas `envVariable` is the name of an environment variable currently not set, this function will:
 *
 * 1. Look for an environment variable named `${envVariable}_FILE`.
 * 2. If it exists, read the file at the path specified by `${envVariable}_FILE`.
 * 3. Set the environment variable `envVariable` to the contents of the file.
 *
 * If `${envVariable}_FILE` is not set, this function will do nothing.
 * @throws {ConfigFileReadError} If the file at the path specified by `${envVariable}_FILE` cannot be read,
 * this function will throw a `ConfigFileReadError`.
 *
 * @param envVariable name of the environment variable
 */
async function setFromFile(envVariable: string): Promise<void> {
  const pathVariable = `${envVariable}_FILE`;

  logger().debug(
    `(${envVariable}) Trying to read environment variable from file.`,
    {
      envVariable,
      pathVariable,
    },
  );

  const configValuePath = Deno.env.get(`${envVariable}_FILE`);

  if (!configValuePath) {
    logger().debug(
      `(${envVariable}) No ${envVariable}_FILE environment variable set. Skipping.`,
    );
    return; // No file to read
  }

  const [fileContent, readFileError] = await Deno.readTextFile(configValuePath)
    .then(
      (content) => [content, null] as const,
    ).catch((error) => [null, error as unknown as Error] as const);

  if (readFileError) {
    logger().error(`Could not read file.`, {
      envVariable,
      pathVariable,
      configValuePath,
      readFileError,
    });
    throw new ConfigFileReadError(envVariable, pathVariable, readFileError);
  }

  logger().debug(`(${envVariable}) Setting environment variable from file.`, {
    envVariable,
    pathVariable,
    configValuePath,
  });

  Deno.env.set(envVariable, fileContent);
}

/**
 * Get the logger for this module.
 */
function logger() {
  return getLogger("@wuespace/envar");
}

/**
 * A type that is compatible with Zod schemas.
 */
export type ZodSchemaCompat = {
  safeParse: (value?: string) => { error: Error | null | undefined };
  isOptional: () => boolean;
};

/**
 * A `ZodSchemaCompat` validator that represents a required variable.
 *
 * Useful for projects where you don't need full-blown Zod schemas.
 *
 * @example
 * ```typescript
 * import { initVariable, REQUIRED } from "@wuespace/envar/";
 * // This will throw an error if MY_ENV_VAR is not set in one of the sources.
 * await initVariable("MY_ENV_VAR", REQUIRED);
 * ```
 */
export const REQUIRED: ZodSchemaCompat = {
  isOptional: () => false,
  safeParse: (val) => ({
    error: typeof val === "string"
      ? undefined
      : new Error(`Expected value to be a string, but got ${typeof val}`),
  }),
};

/**
 * A `ZodSchemaCompat` validator that represents an optional variable.
 * 
 * Useful for projects where you don't need full-blown Zod schemas.
 * 
 * @example
 * ```typescript
 * import { initVariable, OPTIONAL } from "@wuespace/envar/";
 * // This will not throw an error if MY_ENV_VAR is not set in one of the sources.
 * await initVariable("MY_ENV_VAR", OPTIONAL);
 * ```
 */
export const OPTIONAL: ZodSchemaCompat = {
  isOptional: () => true,
  safeParse: (val) => ({
    error: typeof val === "string" || val === undefined
      ? undefined
      : new Error(`Expected value to be a string, but got ${typeof val}`),
  }),
};

/**
 * A `ZodSchemaCompat` validator that represents a required, non-empty variable.
 * 
 * Useful for projects where you don't need full-blown Zod schemas.
 * 
 * @example
 * ```typescript
 * import { initVariable, REQUIRED_NON_EMPTY } from "@wuespace/envar/";
 * // This will throw an error if MY_ENV_VAR is not set in one of the sources or if it is an empty string.
 * await initVariable("MY_ENV_VAR", REQUIRED_NON_EMPTY);
 * ```
 */
export const REQUIRED_NON_EMPTY: ZodSchemaCompat = {
  isOptional: () => false,
  safeParse: (val) => ({
    error: typeof val === "string" && val.length > 0
      ? undefined
      : new Error(`Expected value to be a non-empty string, but got "${val?.toString()}"`),
  }),
};
