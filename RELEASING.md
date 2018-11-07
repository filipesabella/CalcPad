## Shipping it to github releases

Create a `token` file in the root with your github token with
full repository rights, then:

`yarn ship`

## Certificates and signatures

For the auto updater to work on macs, you need:

1. A valid mac developer certificate in your machine:
https://github.com/electron/electron/issues/7476#issuecomment-339428399

2. To sign the electron app:
codesign --deep --force --verbose --sign - node_modules/electron/dist/Electron.app
