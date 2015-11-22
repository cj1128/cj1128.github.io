#!/bin/bash
set -eu

# <link href='/assets/css/normalize.css' rel="stylesheet" media="all">

# <!-- for markdown render -->
# <link href='/assets/theme/avia/markdown.css' rel="stylesheet" media="all">
# <!-- for code highlight -->
# <link rel="stylesheet" href="/assets/css/code_highlight/tomorrow.css">

# <link href='/assets/theme/avia/main.css' rel="stylesheet" media="all">
css_files="
assets/css/normalize.css
assets/theme/avia/markdown.css
assets/css/code_highlight/tomorrow.css
assets/theme/avia/main.css"


# <script src="/assets/js/highlight.pack.js"></script>
# <script src="/assets/js/clipboard.min.js"></script>
# <script src="/assets/js/lunr.min.js"></script>
# <script src="/assets/js/notie.js"></script>
js_files="
assets/js/highlight.pack.js
assets/js/clipboard.min.js
assets/js/lunr.min.js
assets/js/notie.js
"

cd ../../../

uglifyjs $js_files -o assets/theme/avia/bundle.min.js

cat $css_files > bundle.css
postcss -u autoprefixer -u cssnano bundle.css -o bundle.min.css
rm bundle.css
mv bundle.min.css assets/theme/avia/
