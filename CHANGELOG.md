<!-- markdownlint-disable -->
# Changelog

### [1.1.1](https://github.com/wuespace/envar/compare/v1.1.0...v1.1.1) (2024-12-07)


### Bug Fixes

* :ambulance: Fix `ZodSchemaCompat` type incompatibility with zod ([9636fbd](https://github.com/wuespace/envar/commit/9636fbdf1a3464f4b17e7835d173d3346a2c7335))





## [1.1.0](https://github.com/wuespace/envar/compare/v1.0.1...v1.1.0) (2024-10-29)


### Features

* :label: Make `value` parameter of `ZodSchemaCompat.safeParse` more precise ([a310740](https://github.com/wuespace/envar/commit/a310740647606f5a5cd7d9d13a42893bdd06e244))
* :memo: Add documentation around built-in validators to the `README.md` ([6475cae](https://github.com/wuespace/envar/commit/6475caee9b629cc5c4134581fb37a62d021e254f))
* :memo: Add missing doc comments ([d22425e](https://github.com/wuespace/envar/commit/d22425e2666eb51b73e7d48d2a2cbff2b78fd362))
* :memo: Demonstrate inline configuration in for Docker Compose in `README.md` ([8f85b44](https://github.com/wuespace/envar/commit/8f85b4402f0886c823afa80a19f9162f64ddffb4))
* :memo: Improve overall documentation ([3f81d3e](https://github.com/wuespace/envar/commit/3f81d3e8ff243793e5dc9937932f588eb20ae56d))
* :sparkles: Add built-in `REQUIRED` validator for projects not using zod ([d5a8e12](https://github.com/wuespace/envar/commit/d5a8e12348fe7c85f15be9edfc86f06e6a694902))
* :sparkles: Add the `public readonly envVariable` to the `EnvNotSetError` based on the pre-existing constructor parameter ([98bf3a4](https://github.com/wuespace/envar/commit/98bf3a4cbe23b180ccb6f9a6bfe56e802548103f))
* :technologist: Allow single-argument call of `initVariable(envVariable: string)`, defaulting to the `OPTIONAL` built-in validator ([6fe664d](https://github.com/wuespace/envar/commit/6fe664dff2271eaa99b70e74b316a8b6ebf4ea13))
* ✨ Add built-in `OPTIONAL_NON_EMPTY` validator for projects not using zod ([c64120f](https://github.com/wuespace/envar/commit/c64120f19107e0eca6301d9b62275f6cce13b0ba))
* ✨ Add built-in `OPTIONAL` validator for projects not using zod ([623fd65](https://github.com/wuespace/envar/commit/623fd65ad0c80f5b3e5b8a17dd557723f25cc8a0))
* ✨ Add built-in `REQUIRED_NON_EMPTY` validator for projects not using zod ([4bc18eb](https://github.com/wuespace/envar/commit/4bc18eb9cbddfbfd37ae8e9a44d9abae88c94e97))





### [1.0.1](https://github.com/wuespace/envar/compare/v1.0.0...v1.0.1) (2024-10-29)


### Bug Fixes

* :bug: Fix `ZodSchemaCompat` type incompatibility with `zod` ([b87cf99](https://github.com/wuespace/envar/commit/b87cf9941ca63cad1ea231a800cba24efc82f63e))





## [1.0.0](https://github.com/wuespace/envar/compare/v0.1.0...v1.0.0) (2024-10-29)


### Features

* :boom: Replace `[VAR]_PATH` with `[VAR]_FILE` ([a35bb63](https://github.com/wuespace/envar/commit/a35bb6368c5cd20ce1aaddb6726a6ca0ce216b11))


### BREAKING CHANGES

* The `[VAR]_PATH` environment variable has been replaced with `[VAR]_FILE`.





## [0.1.0](https://github.com/wuespace/envar/compare/v0.0.4...v0.1.0) (2024-10-29)


### Features

* :bookmark: Initial release ([2b5084c](https://github.com/wuespace/envar/commit/2b5084c559dd11800adb4d5005be7f2d718b2f04))





### [0.0.4](https://github.com/wuespace/envar/compare/v0.0.3...v0.0.4) (2024-10-29)


### Bug Fixes

* :green_heart: Attempt 2 to fix JSR provenance ([48260d3](https://github.com/wuespace/envar/commit/48260d3f60264fbf8cc63261a2330a61f01b04e0))





### [0.0.3](https://github.com/wuespace/envar/compare/v0.0.2...v0.0.3) (2024-10-29)


### Bug Fixes

* Try to fix JSR provenance ([e133785](https://github.com/wuespace/envar/commit/e133785522e05e34f86f9398bd965e1fa7c19dbe))





### 0.0.2 (2024-10-29)



