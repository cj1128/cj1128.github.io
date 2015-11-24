#!/bin/bash
set -eu


css_files="
assets/vendors/normalize.css
assets/themes/avia/markdown.css
assets/vendors/code_highlight/tomorrow.css
assets/themes/avia/main.css"


js_files="
assets/vendors/highlight.pack.js
assets/vendors/clipboard.min.js
assets/vendors/notie.js
"

cd ../../../

uglifyjs $js_files -o assets/themes/avia/bundle.min.js

cat $css_files > bundle.css
postcss -u autoprefixer -u cssnano bundle.css -o bundle.min.css
rm bundle.css
mv bundle.min.css assets/themes/avia/
