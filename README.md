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

## 👥 Authors

This package was created and is maintained by [WüSpace e. V.](https://github.com/wuespace)

Its primary author is [Zuri Klaschka](https://github.com/pklaschka).

## 📄 License

This package is licensed under the MIT license. See the [LICENSE](LICENSE) file for more information.
