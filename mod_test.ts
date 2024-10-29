import {
	assertEquals,
	assertExists,
	assertFalse,
	assertIsError,
	assertNotEquals,
	assertRejects,
	assertStringIncludes,
} from "@std/assert";
import { ConsoleHandler, FileHandler, jsonFormatter, setup } from "@std/log";
import process from "node:process";
import {
	ConfigFileReadError,
	ConfigParseError,
	EnvNotSetError,
	initVariable,
	OPTIONAL,
	REQUIRED,
	REQUIRED_NON_EMPTY,
	type ZodSchemaCompat,
} from "./mod.ts";

setup({
	handlers: {
		console: new ConsoleHandler("DEBUG"),
		file: new FileHandler("DEBUG", {
			filename: "./log.jsonl",
			mode: "a",
			formatter: jsonFormatter,
		}),
	},
	loggers: {
		default: {
			level: "DEBUG",
			handlers: ["console", "file"],
		},
		"@wuespace/envar": {
			level: "DEBUG",
			handlers: ["file"],
		},
	},
});

const PARSE_ERROR = new Error("parse error");

const OPTIONAL_PASSING = {
	isOptional: () => true,
	safeParse: () => ({ error: null }),
};
const OPTIONAL_FAILING = {
	isOptional: () => true,
	safeParse: () => ({ error: PARSE_ERROR }),
};
const REQUIRED_PASSING = {
	isOptional: () => false,
	safeParse: (val: unknown) => ({
		error: typeof val === "string" ? null : PARSE_ERROR,
	}),
};
const REQUIRED_FAILING = {
	isOptional: () => false,
	safeParse: () => ({ error: PARSE_ERROR }),
};

Deno.test("EnvNotSetError", async (t) => {
	await t.step("without cause", () => {
		const err = new EnvNotSetError("TEST");
		assertStringIncludes(
			err.message,
			"TEST",
			"Expected the message to contain the env variable name",
		);
		assertStringIncludes(
			err.message,
			"TEST_FILE",
			"Expected the message to contain a note about setting the variable using TEST_FILE",
		);
		assertEquals(
			err.envVariable,
			"TEST",
			"Expected the envVariable to be set correctly",
		);
		assertIsError(
			err,
			EnvNotSetError,
			undefined,
			"Expected the error to be an Error instance of EnvNotSetError",
		);
	});

	await t.step("with cause", () => {
		const err = new EnvNotSetError("TEST", new Error("cause"));
		assertStringIncludes(
			err.message,
			"TEST",
			"Expected the message to contain the env variable name",
		);
		assertStringIncludes(
			err.message,
			"TEST_FILE",
			"Expected the message to contain a note about setting the variable using TEST_FILE",
		);
		assertEquals(
			err.envVariable,
			"TEST",
			"Expected the envVariable to be set correctly",
		);
		assertEquals(
			err.cause,
			new Error("cause"),
			"Expected the cause to be set correctly",
		);
		assertIsError(
			err,
			EnvNotSetError,
			undefined,
			"Expected the error to be an Error instance of EnvNotSetError",
		);
	});
});

Deno.test("initVariable", async (t) => {
	const ENV_VAR = "TEST";

	const EXISTING_FILE = import.meta.filename;
	const NONEXISTING_FILE = import.meta.filename + ".nonexistent";

	const DEFAULT_VALUE = "default";

	function prepare(TEST?: string, TEST_FILE?: string) {
		Deno.env.delete(ENV_VAR);
		Deno.env.delete(ENV_VAR + "_FILE");
		TEST && Deno.env.set(ENV_VAR, TEST);
		TEST_FILE && Deno.env.set(ENV_VAR + "_FILE", TEST_FILE);
	}

	await t.step("Value from Environment", async (t) => {
		prepare("value");
		await initVariable(ENV_VAR, REQUIRED_PASSING);
		assertEquals(
			Deno.env.get(ENV_VAR),
			"value",
			"Expected the value to match the Environment Variable",
		);
		assertEquals(
			process.env[ENV_VAR],
			"value",
			"Expected the value to match the Environment Variable in process.env",
		);
		prepare("value2");
		await initVariable(ENV_VAR, REQUIRED_PASSING);
		assertEquals(
			Deno.env.get(ENV_VAR),
			"value2",
			"Expected the value to match the Environment Variable",
		);
		assertEquals(
			process.env[ENV_VAR],
			"value2",
			"Expected the value to match the Environment Variable in process.env",
		);

		prepare("value");
		await assertRejects(
			() => initVariable(ENV_VAR, REQUIRED_FAILING),
			ConfigParseError,
			undefined,
			"Expected a ConfigParseError when the value cannot be parsed",
		);
		await assertRejects(
			() => initVariable(ENV_VAR, OPTIONAL_FAILING),
			ConfigParseError,
			undefined,
			"Expected a ConfigParseError when the value cannot be parsed",
		);

		prepare("value", EXISTING_FILE);
		await initVariable(ENV_VAR, REQUIRED_PASSING);
		assertEquals(
			Deno.env.get(ENV_VAR),
			"value",
			`Expected the Environment Variable to take precedence over the ${ENV_VAR}_FILE file`,
		);
		assertEquals(
			process.env[ENV_VAR],
			"value",
			`Expected the Environment Variable to take precedence over the ${ENV_VAR}_FILE file in process.env`,
		);
		prepare("value2");
		await initVariable(ENV_VAR, REQUIRED_PASSING, DEFAULT_VALUE);
		assertEquals(
			Deno.env.get(ENV_VAR),
			"value2",
			"Expected the Environment Variable to take precedence over the default value",
		);
		assertEquals(
			process.env[ENV_VAR],
			"value2",
			"Expected the Environment Variable to take precedence over the default value in process.env",
		);
	});

	await t.step(`Value from ${ENV_VAR}_FILE file`, async (t) => {
		prepare(undefined, EXISTING_FILE);
		await initVariable(ENV_VAR, REQUIRED_PASSING);
		assertExists(
			Deno.env.get(ENV_VAR),
			`Expected the value to be filled from the ${ENV_VAR}_FILE file`,
		);
		assertExists(
			process.env[ENV_VAR],
			`Expected the value to be filled from the ${ENV_VAR}_FILE file in process.env`,
		);

		prepare(undefined, EXISTING_FILE);
		await assertRejects(
			() => initVariable(ENV_VAR, REQUIRED_FAILING),
			ConfigParseError,
			undefined,
			`Expected a ConfigParseError when the value cannot be parsed`,
		);

		prepare(undefined, NONEXISTING_FILE);
		await assertRejects(
			() => initVariable(ENV_VAR, REQUIRED_PASSING),
			ConfigFileReadError,
			undefined,
			"Expected a ConfigFileReadError when the file does not exist",
		);

		prepare(undefined, EXISTING_FILE);
		await initVariable(ENV_VAR, REQUIRED_PASSING, DEFAULT_VALUE);
		assertNotEquals(
			Deno.env.get(ENV_VAR),
			DEFAULT_VALUE,
			`Expected the ${ENV_VAR}_FILE file to take precedence over the default value`,
		);
		assertNotEquals(
			process.env[ENV_VAR],
			DEFAULT_VALUE,
			`Expected the ${ENV_VAR}_FILE file to take precedence over the default value in process.env`,
		);
	});

	await t.step("value from default", async (t) => {
		prepare();
		await initVariable(ENV_VAR, REQUIRED_PASSING, DEFAULT_VALUE);
		assertEquals(
			Deno.env.get(ENV_VAR),
			DEFAULT_VALUE,
			"Expected the default value to be used",
		);
		assertEquals(
			process.env[ENV_VAR],
			DEFAULT_VALUE,
			"Expected the default value to be used in process.env",
		);

		prepare();
		await assertRejects(
			() => initVariable(ENV_VAR, REQUIRED_FAILING, DEFAULT_VALUE),
			ConfigParseError,
			undefined,
			"Expected a ConfigParseError when the default value cannot be parsed",
		);

		prepare();
		await initVariable(ENV_VAR, OPTIONAL_PASSING, DEFAULT_VALUE);
		assertEquals(
			Deno.env.get(ENV_VAR),
			DEFAULT_VALUE,
			"Expected the default value to be used",
		);
		assertEquals(
			process.env[ENV_VAR],
			DEFAULT_VALUE,
			"Expected the default value to be used in process.env",
		);
	});

	await t.step("No Value", async (t) => {
		prepare();
		await assertRejects(
			() => initVariable(ENV_VAR, REQUIRED_PASSING),
			ConfigParseError,
			undefined,
			"Expected a ConfigParseError when no value is set",
		);

		prepare();
		await initVariable(ENV_VAR, OPTIONAL_PASSING);
		await assertEquals(
			Deno.env.get(ENV_VAR),
			undefined,
			"Expected the value to be undefined",
		);
	});
});

Deno.test("Built-in ZodSchemaCompat Validators", async (t) => {
	await testZodSchemaCompatValidator(t, "REQUIRED", REQUIRED, false, [
		"value",
		"",
	]);
	await testZodSchemaCompatValidator(t, "OPTIONAL", OPTIONAL, true, [
		"value",
		"",
	]);
	await testZodSchemaCompatValidator(
		t,
		"REQUIRED_NON_EMPTY",
		REQUIRED_NON_EMPTY,
		false,
		[
			"value",
			"xxx",
		],
		[
			"",
		],
	);

	function testZodSchemaCompatValidator(
		ctx: Deno.TestContext,
		name: string,
		validator: ZodSchemaCompat,
		isOptional: boolean,
		validValues: string[],
		invalidValues: string[] = [],
	) {
		return ctx.step(name, async (t) => {
			await t.step("isOptional", () => {
				assertEquals(
					validator.isOptional(),
					isOptional,
					`Expected isOptional to return ${isOptional}`,
				);
			});

			await t.step("safeParse", () => {
				const NOT_A_STRING = Symbol("not a string");
				for (const value of validValues) {
					assertFalse(
						validator.safeParse(value).error,
						`Expected "${value}" to be parsed successfully`,
					);
				}

				for (const value of invalidValues) {
					assertIsError(
						validator.safeParse(value).error,
						Error,
						undefined,
						`Expected "${value}" to produce an error`,
					);
				}

				assertIsError(
					validator.safeParse(NOT_A_STRING as unknown as string)
						.error,
					Error,
					undefined,
					"Expected a non-string value to produce an error",
				);

				if (!isOptional) {
					return assertIsError(
						validator.safeParse(undefined).error,
						Error,
						undefined,
						"Expected undefined to produce an error for non-optional validator",
					);
				}

				assertFalse(
					validator.safeParse(undefined).error,
					"Expected undefined to be parsed successfully for optional validator",
				);
			});
		});
	}
});
