# Buerli 2d Demo

Showcase 2D drawing functionality of the [buerli](https://buerli.io/) CAD application.

## Getting Started


### ClassCAD Server

To be able to this web application, you need a running ClassCAD server which offers the CAD service via WebSockets.

Please follow the instructions in [ClassCAD Server](https://buerli.io/docs/setup-environment/server/) run the ClassCAD server.

### Client Application

First, install the dependencies with:

```
yarn
```

Next, launch the application with:

```
yarn dev
```

### Credit

This example largely relies on the ``with-history-run/src/App.jsx``
[awv-informatik/buerli-starter](https://github.com/awv-informatik/buerli-starter),
but has been modified to load a STEP file rather than build a part from scratch.
