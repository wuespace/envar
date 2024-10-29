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
variables to provide first-class support for [secrets and the like in your Docker Swarm or Kubernetes deployments](https://docs.docker.com/engine/swarm/secrets/#build-support-for-docker-secrets-into-your-images).

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

If the `PORT` environment variable is not found, Envar looks for a variable named `PORT_FILE`. If `PORT_FILE` exists, Envar reads the file specified by this variable and uses its contents as the value for `PORT`.

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

## 🚀 Deployment Options

Due to Envar's flexible source system, you have multiple options for deploying your application. We'll demonstrate these with a Docker Compose configuration, but the same principles apply to other deployment methods as well.

### 💻 Application

```ts
await initVariable("PORT", z.string().match(/^[0-9]{1,5}$/), "8080");
await initVariable("OAUTH_TOKEN", z.string());
await initVariable("DB_URI", z.string().url());
await initVariable("SECRET", z.string());
await initVariable("CONFIG", z.string());
await initVariable("ANOTHER_SECRET", z.string());

const rawConfig = Deno.env.get("CONFIG");
if (rawConfig == undefined) {
    throw new EnvNotSetError("CONFIG");
}
const config = JSON.parse(rawConfig);
console.log(config); // { key: "value" }
```

### 🐳 Docker Compose

```yaml
name: My Application

services:
  my-service:
    image: my-service
    environment:
      - PORT # Loaded from environment. Defaults to 8080 if not set
      - SECRET_FILE=/run/secrets/my-secret # Mounted as secret file
      - OAUTH_TOKEN_FILE=/run/secrets/another-secret # Mounted as secret file
      - CONFIG_FILE=/my-service-config # Mounted as config file
      - DB_URI=${DB_URI:-mongodb://mongo:27017/my-database} # Default value
      - ANOTHER_SECRET=${ANOTHER_SECRET:?ANOTHER_SECRET is required} # Required variable
    secrets:
      - my-secret
      - another-secret
    configs:
      - my-service-config
  mongo:
    image: mongo

secrets:
  my-secret:
    file: ./secret.txt # Loaded from a file
  another-secret:
    environment: "OAUTH_TOKEN" # Loaded from an environment variable

configs:
  my-service-config:
    file: ./config.json # Loaded from a file
```

This configuration ensures that your application variables are securely managed and validated, leveraging Docker's secrets and configs features.

## 👥 Authors

This package was created and is maintained by [WüSpace e. V.](https://github.com/wuespace)

Its primary author is [Zuri Klaschka](https://github.com/pklaschka).

## 📄 License

This package is licensed under the MIT license. See the [LICENSE](LICENSE) file for more information.
