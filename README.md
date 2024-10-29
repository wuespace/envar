# @wuespace/envar

[![JSR Scope](https://jsr.io/badges/@wuespace)](https://jsr.io/@wuespace)
[![JSR](https://jsr.io/badges/@wuespace/envar)](https://jsr.io/@wuespace/envar)
[![JSR Score](https://jsr.io/badges/@wuespace/envar/score)](https://jsr.io/@wuespace/envar)
[![Deno CI](https://github.com/wuespace/envar/actions/workflows/deno-ci.yml/badge.svg)](https://github.com/wuespace/envar/actions/workflows/deno-ci.yml)
[![Publish Workflow](https://github.com/wuespace/envar/actions/workflows/publish-jsr.yml/badge.svg)](https://github.com/wuespace/envar/actions/workflows/publish-jsr.yml)

🚀 **Envar** makes it easy to add configurability to your Deno applications.
It supports loading configuration from environment variables as well as
specifying default values.
It even supports configuration values from files specified by environment
variables to provide first-class support for secrets and the like in your
Docker Swarm or Kubernetes deployments.

## 📦 Usage

You can use Envar in your Deno application by importing it from the
`jsr:@wuespace/envar` module.

```tsx
// Import the initVariable function from the module
import { initVariable, EnvNotSetError } from "jsr:@wuespace/envar";
import { z } from "npm:zod";

// Initialize the application variables
await initVariable("PORT", z.string().match(/^[0-9]{1,5}$/), "8080");
await initVariable("SECRET", z.string().min(32));
// At this point, we can rest assured that we have valid values for
// PORT and SECRET. Otherwise, the promises would have been rejected.

// Access the variables like you normally would.
// Everything's synchronous now, so it's quite easy.
console.log(Deno.env.get("PORT"));
console.log(Deno.env.get("SECRET"));

// For type safety, you'll need to check if it's undefined:
const port = Deno.env.get("PORT");
if (port == undefined) {
    // Automatically generate a nice error message for the user
    throw new EnvNotSetError("PORT");
}

// Alternatively, you can also use process.env in Deno 2.0+
console.log(process.env.PORT);
```

## 🔍 Variable Sources

But why does `initVariable` return a `Promise`? Because Envar doesn't just look at environment variables. It also supports loading variables from files. This asynchronous behavior ensures that all potential sources are checked and validated before the variable is set.

Let's illustrate this with an example:

```ts
await initVariable("PORT", z.string().match(/^[0-9]{1,5}$/), "8080");
```

This call attempts to load the `PORT` variable from the following sources, in order:

### 🌐 Environment Variables

First, Envar checks if an environment variable named `PORT` exists. If it does, the value is validated and used.

### 📂 Files

If the `PORT` environment variable is not found, Envar looks for a variable named `PORT_PATH`. If `PORT_PATH` exists, Envar reads the file specified by this variable and uses its contents as the value for `PORT`.

### 🛠️ Defaults

If neither an environment variable nor a file is found, the default value specified in the `initVariable` call (`"8080"` in this case) is used.

### 🚨 Validation

Regardless of the source, the value is validated using the `validator` provided in the `initVariable` call, which is typically a zod schema. If the value is invalid, an error is thrown, and the application should handle it accordingly.

The `validator` can also specify whether the variable can be `undefined` (if no value is found and there is no default value):

```ts
// Throws an error if the variable isn't set
await initVariable("SECRET", z.string()); 

// Uses the default value if SECRET is not set
await initVariable("SECRET", z.string(), 'xxx'); 

// Allows SECRET to be undefined without throwing an error
await initVariable("SECRET", z.string().optional()); 
```

## 👥 Authors

This package was created and is maintained by [WüSpace e. V.](https://github.com/wuespace)

Its primary author is [Zuri Klaschka](https://github.com/pklaschka).

## 📄 License

This package is licensed under the MIT license. See the [LICENSE](LICENSE) file for more information.
