---
layout: post
title: Webpack Long Term Caching 101
description: 
category: web2.0
tags: webpack caching

---

缓存是Web中无法回避的话题，不仅因为缓存非常重要，能极大地改善用户体验，而且因为缓存很难做好。一旦生产环境出现了缓存失效，那就是一个十分棘手的问题。

在各种缓存的方案中，基于hash的Long Term Caching（永久缓存）在我看来是最简单也是最高效。每一个资源名称上都带有自身内容的hash值，然后全部设置为永久缓存永不过期。所有资源的索引文件全部设置为永不缓存。这样就保证了当资源更新时，资源名称会变化，索引文件会引入新的资源名称，也就保证了缓存永远不会失效。

这个处理方案显然和前端自身的编码没有关系，而是需要打包工具的支持。以下我们就用webapck为例，详细讲述怎样一步步实现Long Term Caching。项目最终的仓库[long-term-caching-demo](https://github.com/fate-lovely/long-term-caching-demo.git)。



## Basic Project

> cd long-term-caching-demo && git checkout basic-project



我们先来新建一个基础的React + Webpack项目。项目结构如下。

```shell
.
├── dist
│   └── index.html
├── package.json
├── src
│   ├── app.jsx
│   └── app.styl
└── webpack.config.js
```



对于一个新项目，首先当然是装依赖，这个很简单，缺什么装什么。我们的这个基础项目用到了以下依赖。

```
  "dependencies": {
    "babel-loader": "6.2.4",
    "babel-preset-es2015": "6.9.0",
    "babel-preset-react": "6.5.0",
    "css-loader": "0.23.1",
    "react": "15.1.0",
    "react-dom": "15.1.0",
    "style-loader": "0.13.1",
    "stylus": "0.54.5",
    "stylus-loader": "2.1.1",
    "webpack": "1.13.1",
    "webpack-dev-server": "1.14.1"
  }
```



`webpack.config.js`的配置如下，主要是处理一下`jsx`以及`stylus`。

```
var path = require("path")

module.exports = {
  entry: {
    app: "./src/app.jsx",
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].bundle.js",
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: "babel?presets[]=es2015&presets[]=react",
        exclude: /node_modules/,
      },
      {
        test: /\.styl$/,
        loader: "style!css!stylus",
        exclude: /node_modules/,
      },
    ],
  },
}
```



接着在`package.json`里面配置一下开发script，方便我们进行开发。

```javascript
  "scripts": {
    "dev": "webpack-dev-server --color --progress --content-base dist"
  },
```



到这里，我们输入`npm run dev`便可以将我们的应用启动起来了。



## Split vendors and app

> cd long-term-caching-demo && git checkout split-vendors

上一步中，我们的所有代码都打成了一个包，`app.bundle.js`，这显然是不合理的。我们需要将第三方代码和app代码分离开，因为第三方代码基本上不会变化，而且相对应用代码来说体积大，分离开以后用户下载一次缓存好便再也无需下载了。能够大大提高加载速度。



这里我们使用的是`webpack`的`CommonsChunkPlugin`插件来分离vendors代码到独立的文件当中。因为开发时不需要这样配置，我们新建一个生产环境使用的webpack配置文件`webpack.config.production.js`以及一个新的指令用来打包项目。



```javascript
var path = require("path")
var webpack = require("webpack")
var devConfig = require("./webpack.config.js")
var fs = require("fs")

module.exports = {
  entry: {
    app: "./src/app.jsx",
    vendors: [
      "react",
      "react-dom",
    ],
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].bundle.[chunkhash].js",
  },
  module: devConfig.module,
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: "vendors",
      minChunks: Infinity,
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
    function() {
      this.plugin("done", function(stats) {
        if (stats.toJson().errors.length === 0) {
          copyFile("html/index.html", "dist/index.html")
          var assets = stats.toJson().assetsByChunkName
          var appName = assets.app
          var vendorsName = assets.vendors
          replaceInFile("dist/index.html", "<app_js>", appName)
          replaceInFile("dist/index.html", "<vendors_js>", vendorsName)
        }
      })
    },
  ],
}

function copyFile(from, to) {
  var content = fs.readFileSync(from, "utf8")
  fs.writeFileSync(to, content)
}

function replaceInFile(filePath, regexp, replacement) {
  var replacer = function (match) {
    console.log("\nReplacing in %s: %s => %s", filePath, match, replacement)
    return replacement
  }
  var content = fs.readFileSync(filePath, "utf8")
  var out = content.replace(new RegExp(regexp, "g"), replacer)
  fs.writeFileSync(filePath, out)
}

```



```javascript
"scripts": {
  "build": "webpack --config webpack.config.production.js --color --progress"
}
```



我们先使用插件将vendors代码分离出来独立，并且打包文件名中带上`chunkhash`，作为文件的指纹。同时注意，在上一步中，我们的`index.html`文件直接存放在了`dist`目录中，这是不太合理的，因为`dist`目录里面的内容应该是忽略掉的，不纳入git管理。所以这里我们将`index.html`文件放在`html`目录中，在每次打包以后，从`html`目录中拷贝`index.html`文件到`dist`目录中去，同时，用打包生成好的带有指纹的文件名去替换`index.html`文件中的两个占位符，这样做了以后，我们就可以直接将dist目录推送到服务器上作为Web应用的根目录了。



因为我们处理`html`文件的方式有了变化，所以开发时也有相应改动，具体可以查看代码。



## WebpackMD5Hash

> cd long-term-caching-demo && git checkout md5



我们已经将`app`代码和`vendors`代码分开了，正常情况下，我们修改`app`代码，`vendors`应该是保持不变的。不过由于`webpack`自身的一个BUG，详见[Vendor chunkhash changes when app code changes](https://github.com/webpack/webpack/issues/1315)。每当我们改动`app`代码时，生成的`vendors`文件的hash值也会变化，这就导致我们之前的步骤 变得毫无意义了。具体看下图。

第一次打包生成的文件。

![](http://ww2.sinaimg.cn/large/9b85365djw1f57kkb9sbej20q402yabi.jpg)



修改`app.jsx`以后，再打包。

![](http://ww2.sinaimg.cn/large/9b85365djw1f57ky72ob6j20p30380u3.jpg)



这里我们采取的解决办法是使用`webpack-md5-hash`这个插件。插件会根据文件内容的md5值来生成`chunkhash`，从而当我们改变`app`代码时，`vendors`文件hash不会发生改变。



重新测试，结果如图所示。

![](http://ww3.sinaimg.cn/large/9b85365djw1f57lekjjipj20pw0cuwkf.jpg)



可以看见，`vendors`代码的hash值不再变化了。



## Nginx

webpack已经不需要再做什么了，其余的资源比如图片、字体等在loader里面设置一下输出文件名中含有`hash`即可。

```javascript
{
  test: /\.(png|jpg|jpeg|gif|svg|eot|svg|ttf|woff)(\?.*)?$/,
  exclude: /node_modules/,
  loader: "url?limit=10000&name=images/[name].[hash].[ext]",
}
```



最后一步是设置我们的服务器，这里以Nginx为例，设置对于所有的资源文件，`js`、`jpg`，`png`等，全部为永久缓存，然后`html`文件为永不缓存即可。



```nginx
# caching
# html
location ~* \.html$ {
  expires -1;
}


# images and fonts
location ~* \.(?:jpg|jpeg|gif|png|ico|cur|gz|svg|svgz|mp4|ogg|ogv|webm|htc|eot|ttf)$ {
  expires max;
}

# js and css
location ~* \.(?:css|js|js\.map)$ {
  expires max;
}
```



到了这里，我们项目的永久缓存机制就已经建立了。开发时，使用`npm run dev`，开发好后，`npm run build`，然后将`dist`目录上传到服务器中作为Web Root即可。



## 最后

以上的方法解决了我们永久缓存的需求，但是有一个很明显可以优化的地方。我们每次`npm run build`的时候，`vendors`代码都需要重新生成，而这个过程其实是没有必要的，因为`vendors`代码很少变化。怎样配置Webpack支持我们只需要生成一次`vendors`代码，从而加快编译时间，我会在下篇博客中讲述。