Just create a pull-request.

# Development

## Prerequisites

- Node.js and Yarn
- For the desktop app, Rust and the
  [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your
  platform

Install dependencies with `yarn install`.

## Running it locally

Desktop app (starts the Vite dev server and opens the Tauri window):

`yarn start-desktop`

Web version, served at http://localhost:1234:

`yarn start-web`

## Running the tests

`yarn test`

or

`yarn test:watch`

## Type checking and formatting

`yarn typecheck`

Code is formatted with [dprint](https://dprint.dev/):

`yarn format`

## Building

- `yarn build-web` - web version, output in `docs/`
- `yarn ship-linux`, `yarn ship-mac`, `yarn ship-windows` - desktop installers,
  output in `src-tauri/target/release/bundle/`
