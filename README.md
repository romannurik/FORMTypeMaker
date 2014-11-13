FORM Type Maker
===============

A [text generator](http://formtypemaker.appspot.com/) and
[in-conference intermission screensaver](http://formtypemaker.appspot.com/rotater)
for [#FORMSF14](https://twitter.com/search?q=%23FORMSF14).

This project demonstates use of
[Polymer's implementation of material design](https://www.polymer-project.org/docs/elements/material.html),
[Web Starter Kit](https://developers.google.com/web/starter-kit/),
and more.

GIF generation is done using the [jsgif](https://github.com/antimatter15/jsgif) library,
with some help from [FileSaver.js](https://github.com/eligrey/FileSaver.js/).

Example GIF output:

<img src="https://raw.githubusercontent.com/romannurik/FORMTypeMaker/master/example.gif" width="300">

Requirements
------------

You'll need a few things like [gulp](https://github.com/gulpjs/gulp/), [node](http://nodejs.org/), and [sass](http://sass-lang.com/). Check out the [Set Up Web Starter Kit](https://developers.google.com/web/fundamentals/getting-started/web-starter-kit/setting-up) docs for details.

Building
--------
Just like with the Web Starter Kit, there are a couple ways to build everything:

- `gulp` will build a distributable, minified version of everything and put it in the `dist` folder.
- `gulp serve` will start a local webserver and open a web browser.
- `gulp serve:dist` will build everything and then serve the `dist` folder.
