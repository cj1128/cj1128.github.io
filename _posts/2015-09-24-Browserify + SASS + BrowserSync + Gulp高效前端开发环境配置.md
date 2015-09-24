---
layout: post
title: Browserify + SASS + BrowserSync + Gulp高效前端开发环境配置
description: 
category: FE
tags: Browserify BrowserSync Gulp
---

之前开发的前端应用都是些比较简单的页面，开发的时候一般就是sublime，然后命令行里面启动`sass --watch` 以及 `coffee --watch` 就行了，修改代码以后自动编译，但是浏览器需要手动刷新。凑合着也能用，所以也就一直这样没有去理会别的解决方案了。

工作了以后，编写的应用规模变大了很多，而且前端的依赖也变得复杂了。传统的方式显示是解决不了问题的。这段时间，我一直在寻找一套高效的开发环境，要求如下：

- 使用CommonJS进行依赖引用
- ES6支持
- React + JSX支持
- SASS支持
- 修改以后自动高速编译，即便是很大的依赖
- 修改JS、HTML以后浏览器自动刷新
- 修改CSS浏览器使用Style Injection刷新
- 生产环境下合并压缩


先后尝试了`browserify + gulp` 以及 `webpack`的解决方案，最终还是选定browserify + gulp。完美满足了以上几个要求。

第一次尝试是使用`browserify + gulp`，配合使用`browserSync`进行浏览器自动刷新以及Style Injection，使用`Notifier`在错误发生时推送通知，配置文件如下，`gulpfile.js`:

``` javascript
var gulp = require("gulp")
var sass = require('gulp-ruby-sass')
var browserify = require('browserify')
var reactify = require('reactify')
var babelify = require('babelify')
var vinylSource = require('vinyl-source-stream')
var browserSync = require('browser-sync').create()
var autoprefixer = require('gulp-autoprefixer')
var cssnano = require('gulp-cssnano')
var uglify = require('gulp-uglify')
var buffer = require('vinyl-buffer');
var notifier = require('node-notifier')
var fs = require("fs")

var source = {
    script: ["src/**/*.js", "src/**/*.jsx"],
    style: "sass/**/*.sass",
};

var dest = {
    script: "js/",
    style: "css/",
};

var pages = ["dashboard", "data-analysis", "login", "campaign-overall"]
var current = "reporting"

gulp.task('serve', ['sass', 'browserify'], function() {
    browserSync.init({
        ghostMode: false,
        server: './'
    });
    gulp.watch(source.style, ['sass']);
    gulp.watch(source.script, ['script-watch']);
    gulp.watch(["./*.html"], function() {
        browserSync.reload();
    });
});

gulp.task('sass', function() {
    return sass("sass/" + current +".sass", { style: 'expanded' })
        .on('error', function(err) {
            console.error('Error!', err.message);
        })
        .pipe(browserSync.stream())
        .pipe(gulp.dest(dest.style));
});

gulp.task('script-watch', ['browserify'], function() {
    browserSync.reload();
});

gulp.task('browserify', function() {
    return browserify("./src/" + current + ".jsx")
        .transform(babelify)
        .transform(reactify)
        .bundle()
        .on('error', function(err){
            var reg=/(.*\/)(.*)(?= while)/
            if(reg.test(err.message)) {
                notifier.notify({
                    title: "Browserify Error!",
                    message: err.message.match(reg)[2]
                })
            }
            console.log("[Error]: " + err.message);
            this.emit('end');
        })
        .pipe(vinylSource(current + ".js"))
        .pipe(gulp.dest(dest.script))
});

gulp.task('build-js', function() {
    pages.map(function(name, index) {
        var filename = "./src/" + name + ".jsx"
        if(!fs.existsSync(filename)) {
            return
        }
        return browserify(filename)
           .transform(babelify)
           .transform(reactify)
           .bundle()
           .pipe(vinylSource(name + ".js"))
           .pipe(buffer())
           .pipe(uglify())
           .pipe(gulp.dest(dest.script))
    })
})

gulp.task('build-css', function() {
    pages.map(function(name) {
        var filename = "./sass/" + name + ".sass"
        if(!fs.existsSync(filename)) {
            return
        }
        return sass(filename, { style: 'expanded' })
            .on('error', function(err) {
                console.error('Error!', err.message);
            })
            .pipe(autoprefixer({
                browsers: ['last 2 versions'],
                cascade: false
            }))
            .pipe(cssnano())
            .pipe(gulp.dest(dest.style));
    })
})

gulp.task('build', ['build-js', 'build-css'])
gulp.task('default', ['serve']);
```

这个方案满足了以上所有需求，除了在监听文件变化时再次编译，基本上随着入口js文件变得越来越大，编译时间越来越长，后来每次修改需要等待8秒中所有，这促使了我寻找别的方案来把他换掉。

第二次尝试使用了`Webpack`。用React的人不可能不知道Webpack，正好借此机会，好好去研究了一下Webpack。Webpack自带一个`webpack-dev-server`，能够实现自动刷新功能。SASS、ES6、JSX可以使用Loader进行处理。我摸索了一下配置方案如下（CSS使用了Stylus），`webpack.config.js`：

``` javascript
var webpack = require("webpack")
var path = require("path")

module.exports = {
    devtool: "eval",
    entry: {
        "campaign-overall": "./src/campaign-overall.jsx",
        vendors: [
            "jquery",
            "react",
        ],
    },
    output: {
        path: path.join(__dirname, "./js"),
        filename: "[name].js",
        publicPath: "/js/",
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: "vendors",
            filename: "vendors.js",
            minChunks: Infinity,
        }),
    ],
    resolve: {
        alias: {
            "highcharts": path.join(__dirname, "assets/vendor/highcharts.js"),
        },
    },
    module: {
        noParse: [
            /highcharts/,
        ],
        loaders: [
            {
                test: /\.jsx$/,
                loader: "react-hot!jsx!babel",
            },
            {
                test: /\.js$/,
                loader: "babel",
                exclude: /node_modules/,
            },
            {
                test: /\.styl$/,
                loader: "style!css!stylus",
            },
            {
                test: /\.css$/,
                loader: "style!css",
            },
            {
                test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
                loader: "url?limit=10000&mimetype=application/font-woff",
            },
            {
                test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
                loader: "url?limit=10000&mimetype=application/font-woff",
            },
            {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                loader: "url?limit=10000&mimetype=application/octet-stream",
            },
            {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                loader: "file",
            },
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                loader: "url?limit=10000&mimetype=image/svg+xml",
            },
        ],
        resolve: {
            extensions: ["", ".js", ".jsx"]
        }
    },
}
```

通过使用`webpack --hot --inline`配置`react-hot-loader`可以使用react的`Hot Module Replacement`。

但是这个方案的缺点，我需要用CommonJS的方式去使用CSS，比如说在入口文件里面`import "main.styl"`。虽然有这篇很出名的文章，[React: CSS in JS by vjeux](https://speakerdeck.com/vjeux/react-css-in-js)。里面的很多观点我都很赞同。比如CSS的隔离问题，确实十分头痛。但我不觉得用JS来写是正确的解决方案。而且在预处理器的帮助下，文中提到的很多问题是可以解决的。

在使用webpack的情况下，如果要使用单独的SASS，并能在修改以后进行`Style Injection`，刷新浏览器样式，需要使用Gulp之类的工具，但是这样的话，配置`webpack-dev-server`又很麻烦。

webpack在watch情况下，重新编译的速度非常快。其实原因很简单，webpack缓存了上一次编译的结果。而browseriy的方案之所以重新编译慢，是因为每次gulp调用`browserify`的时候，都相当于重新完整了编译一次，自然是非常慢的。顺着这个思路，我便去找找看有没有browserify的缓存插件，果然找到了，`browserify-incremental`。browserify-incremental会产生一个缓存文件，除了第一次（the very first），之后的所有编译都会非常快。

最终的配置文件如下，`gulpfile.js`：

``` javascript
var gulp = require("gulp")
var sass = require("gulp-ruby-sass")
var browserify = require("browserify")
var reactify = require("reactify")
var babelify = require("babelify")
var vinylSource = require("vinyl-source-stream")
var browserSync = require("browser-sync").create()
var autoprefixer = require("gulp-autoprefixer")
var cssnano = require("gulp-cssnano")
var uglify = require("gulp-uglify")
var buffer = require("vinyl-buffer")
var notifier = require("node-notifier")
var fs = require("fs")
var browserifyInc = require("browserify-incremental")

var source = {
  script: ["src/**/*.js", "src/**/*.jsx"],
  style: "sass/**/*.sass",
}
var dest = {
  script: "js/",
  style: "css/",
}

var current = "new-campaign"

var pages = [
    "dashboard",
    "data-analysis",
    "login",
    "campaign-overall",
    "new-campaign",
]

gulp.task("serve", ["sass", "browserify"], function() {
  browserSync.init({
    ghostMode: false,
    server: "./",
  })
  gulp.watch(source.style, ["sass"])
  gulp.watch(source.script, ["script-watch"])
  gulp.watch(["./*.html"], function() {
    browserSync.reload()
  })
})

gulp.task("sass", function() {
  return sass("sass/" + current + ".sass", { style: "expanded" })
        .on("error", function(err) {
          notifier.notify({
            title: "SASS Error!",
            message: err.message,
          })
          console.error("Error!", err.message)
        })
        .pipe(browserSync.stream())
        .pipe(gulp.dest(dest.style))
})

gulp.task("script-watch", ["browserify"], function() {
  browserSync.reload()
})

gulp.task("browserify", function() {
  var currentFile = "./src/" + current + ".jsx"
  return getBundler(currentFile)
      .pipe(vinylSource(current + ".js"))
      .pipe(gulp.dest(dest.script))
})

function getBundler(filename) {
  var config = {
    cache: {},
    packageCache: {},
    fullPaths: true,
    cacheFile: "./browserify-cache.json",
  }
  bundler = browserify(filename, config)
      .transform(babelify)
      .transform(reactify)

  return browserifyInc(bundler)
      .bundle()
      .on("error", handleError)
}

function handleError(err) {
  var reg = /(.*\/)(.*)(?= while)/
  if (reg.test(err.message)) {
    notifier.notify({
      title: "Browserify Error!",
      message: err.message.match(reg)[2],
    })
  }

  console.log("[Error]: " + err.message)
  this.emit("end")
}

gulp.task("build-js", function() {
  pages.map(function(name, index) {
    var filename = "./src/" + name + ".jsx"
    if (!fs.existsSync(filename)) {
      return
    }

    return getBundler(filename)
       .pipe(vinylSource(name + ".js"))
       .pipe(buffer())
       .pipe(uglify())
       .pipe(gulp.dest(dest.script))
  })
})

gulp.task("build-css", function() {
  pages.map(function(name) {
    var filename = "./sass/" + name + ".sass"
    if (!fs.existsSync(filename)) {
      return
    }

    return sass(filename, { style: "expanded" })
            .on("error", function(err) {
              console.error("Error!", err.message)
            })
            .pipe(autoprefixer({
              browsers: ["last 2 versions"],
              cascade: false,
            }))
            .pipe(cssnano())
            .pipe(gulp.dest(dest.style))
  })
})

gulp.task("build", ["build-js", "build-css"])
gulp.task("default", ["serve"])
```

开发时只要启动`gulp`，自动编译，打开浏览器，修改JS、HTML代码自动刷新（1s左右），修改样式表自动刷新样式（使用Style Injection不刷新浏览器），生产部署时`gulp build`即可。在加上两个屏幕，这是目前让我十分满意的解决方案。 

