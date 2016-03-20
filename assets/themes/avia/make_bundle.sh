#!/bin/bash
set -eu

js_files="
../../vendors/highlight.pack.js
../../vendors/clipboard.min.js
../../vendors/notie.js
"

uglifyjs $js_files -o bundle.min.js

stylus -c -o bundle.min.css main.styl
postcss -r -u autoprefixer bundle.min.css
