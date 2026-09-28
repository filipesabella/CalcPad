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
  output in `src-tauri/target/release/bundle/`. These also sign the files for
  the auto updater, so they need the private key:
  `TAURI_SIGNING_PRIVATE_KEY=~/.tauri/calcpad.key yarn ship-linux`

## Releasing

Bump the version in `package.json`, `src-tauri/tauri.conf.json` and
`src-tauri/Cargo.toml`, commit, then tag and push:

`git tag -a vX.Y.Z -m vX.Y.Z && git push origin master vX.Y.Z`

The `Release` GitHub workflow builds the macOS, Windows and Linux installers
and attaches them to a draft release, ready to be edited and published. It
signs the updates with the `TAURI_SIGNING_PRIVATE_KEY` repository secret, the
contents of `~/.tauri/calcpad.key`.

The desktop app checks for updates on start, against the `latest.json` of the
latest published release, and asks before installing. Drafts are not seen by
it. The private key must never be lost: installed apps only accept updates
signed with it.
