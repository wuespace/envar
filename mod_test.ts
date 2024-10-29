import {
	assertEquals,
	assertExists,
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
		assertStringIncludes(err.message, "TEST");
		assertStringIncludes(err.message, "TEST_PATH");
		assertIsError(err);
	});

	await t.step("with cause", () => {
		const err = new EnvNotSetError("TEST", new Error("cause"));
		assertStringIncludes(err.message, "TEST");
		assertStringIncludes(err.message, "TEST_PATH");
		assertEquals(err.cause, new Error("cause"));
		assertIsError(err);
	});
});

Deno.test("initVariable", async (t) => {
	const ENV_VAR = "TEST";

	const EXISTING_FILE = import.meta.filename;
	const NONEXISTING_FILE = import.meta.filename + ".nonexistent";

	const DEFAULT_VALUE = "default";

	function prepare(TEST?: string, TEST_PATH?: string) {
		Deno.env.delete(ENV_VAR);
		Deno.env.delete(ENV_VAR + "_PATH");
		TEST && Deno.env.set(ENV_VAR, TEST);
		TEST_PATH && Deno.env.set(ENV_VAR + "_PATH", TEST_PATH);
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
		assertRejects(
			() => initVariable(ENV_VAR, REQUIRED_FAILING),
			ConfigParseError,
			undefined,
			"Expected a ConfigParseError when the value cannot be parsed",
		);
		assertRejects(
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
			`Expected the Environment Variable to take precedence over the ${ENV_VAR}_PATH file`,
		);
		assertEquals(
			process.env[ENV_VAR],
			"value",
			`Expected the Environment Variable to take precedence over the ${ENV_VAR}_PATH file in process.env`,
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

	await t.step(`Value from ${ENV_VAR}_PATH file`, async (t) => {
		prepare(undefined, EXISTING_FILE);
		await initVariable(ENV_VAR, REQUIRED_PASSING);
		assertExists(
			Deno.env.get(ENV_VAR),
			`Expected the value to be filled from the ${ENV_VAR}_PATH file`,
		);
		assertExists(
			process.env[ENV_VAR],
			`Expected the value to be filled from the ${ENV_VAR}_PATH file in process.env`,
		);

		prepare(undefined, EXISTING_FILE);
		assertRejects(
			() => initVariable(ENV_VAR, REQUIRED_FAILING),
			ConfigParseError,
			undefined,
			`Expected a ConfigParseError when the value cannot be parsed`,
		);

		prepare(undefined, NONEXISTING_FILE);
		assertRejects(
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
			`Expected the ${ENV_VAR}_PATH file to take precedence over the default value`,
		);
		assertNotEquals(
			process.env[ENV_VAR],
			DEFAULT_VALUE,
			`Expected the ${ENV_VAR}_PATH file to take precedence over the default value in process.env`,
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
		assertRejects(
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
});
