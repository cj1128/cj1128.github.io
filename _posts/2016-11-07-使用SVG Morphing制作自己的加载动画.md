---
layout: post
title: 使用SVG Morphing制作自己的加载动画
cover: http://ww1.sinaimg.cn/large/9b85365djw1f9ji109m0jj21jk0rstb8.jpg
category: web2.0
tags: svg morphing loading gif animation
---

每一个需要让用户等待的应用都应该有加载界面，可以是简单的文本，比如`加载中…`，也可以是有趣的动画。当然，一个好玩的加载动画能够大大增加用户等待的耐心，谁喜欢枯燥的文字呢。所以，投入点时间寻找或者制作一个加载动画是很有意义的。感谢SVG和相关的动画技术，现在制作一款复杂的动画已经变得十分容易了。

这里我使用SVG的形变技术(Shape Morphing)来做一个简单的矩形、三角形、圆形变换的动画。





<p data-height="500" data-theme-id="light" data-slug-hash="QGwMXP" data-default-tab="result" data-user="fatelovely" data-embed-version="2" data-pen-title="SVG Morphing Loading Animation" class="codepen">See the Pen <a href="http://codepen.io/fatelovely/pen/QGwMXP/">SVG Morphing Loading Animation</a> by fatelovely (<a href="http://codepen.io/fatelovely">@fatelovely</a>) on <a href="http://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>

## SVG Shape Morphing

上面的动画里，有三个量在变换。图形的形状，图形的位置以及颜色。位置和颜色都是比较简单的，CSS Transition就可以搞定。问题就是形状的变化比较复杂。形变技术理解起来比较简单，图形从一个形状变换到另一个形状，无非就是构成图形的顶点位置发生了变化。所以，只要将开始图形和结束图形的顶点之间的对应关系找到，然后对顶点进行transition就行了。从这可以看出，SVG的形变必须要求开始图形和结束图形的顶点数一定要相同。如下所示。

![](http://ww2.sinaimg.cn/large/9b85365dgw1f9jdl0i3e2g20a008gh6t.gif)

<p data-height="500" data-theme-id="light" data-slug-hash="XNJBOy" data-default-tab="result" data-user="fatelovely" data-embed-version="2" data-pen-title="SVG Morphing Demo" class="codepen">See the Pen <a href="http://codepen.io/fatelovely/pen/XNJBOy/">SVG Morphing Demo</a> by fatelovely (<a href="http://codepen.io/fatelovely">@fatelovely</a>) on <a href="http://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>

## GSAP

SVG的形变有两种方式，第一是使用*SMIL*，第二是使用JS库。SMIL目前已经被废弃，这里我们使用大名鼎鼎的[GreenSock Animation Platform,GSAP](http://greensock.com/gsap)动画库来实现。GSAP是一个非常高级的动画库，功能强大接口简洁，我们使用[MorphSVGPlugin](https://greensock.com/morphSVG)插件来完成SVG的形变功能。

上面我们说过，SVG的形变动画要求开始图形和结束图形顶点数一样，但这并不意味着我们提供给GSAP的开始图形和结束图形顶点数必须一致。GSAP的一大特点便是允许我们提供顶点数完全不一样的图形来进行形状变换，GSAP内部会自己计算顶点并进行Transition。使用GSAP进行SVG形变非常简单，指定开始图形，指定结束图形以及顶点映射关系即可。顶点映射关系表示开始图形的哪一个顶点对应结束图形的第一个顶点。

关于顶点映射关系的问题，可以使用GSAP官方提供的一个工具[findShapeIndex](http://codepen.io/GreenSock/pen/LpxOqR)，非常直观。

下面的代码表示从`startShape`形变到`endShape`，时间为1秒钟，同时开始图形的第三个顶点对应结束图形的第一个顶点。

```javascript
var stratShape = document.getElementById("start")
var endShape = document.getElementById("end")

TweenLite.to(endShape, 1, {
  morphSVG: endShape,
  shapeIndex: 2,
})
```

## Loading Animation

根据上面的知识，我们来制作一个矩形、三角形、圆形之间的形变动画就变得非常简单了。首先，定义这三个图形，这里图形的位置都在`0,0,100,100`之间。注意隐藏`triangle`以及`circle`，只显示`rect`。

```html
 <path id="rect" fill="#1EB287" d="M 0,0
                   C 50,0 50,0 100,0
                   100,50 100,50 100,100
                   50,100 50,100 0,100
                   0,50 0,50 0,0
                   Z"></path>

<path id="triangle" fill="#188fc2" d="M 25,50
                   C 37.5,25 37.5,25 50,0
                   75,50 75,50 100,100
                   50,100 50,100 0,100
                   12.5,75 12.5,75 25,50
                   Z"></path>
<path id="circle" fill="#bb625e" d="M 50,0
                   C 77.6,0 100,22.4 100,50
                   100,77.6 77.6,100 50,100
                   22.4,100, 0,77.6, 0,50
                   0,22.4, 22.4,0, 50,0
                   Z"></path>
```

然后，使用GSAP进行变换即可，因为涉及到一系列变换，矩形到三角形，三角形到圆形，圆形到矩形，我们使用GSAP提供的`TimelineLite`来调度时间使这三个变换顺序进行。

```javascript
var tl = new TimelineLite()
var duration = 1
tl.to(rect, duration, {
  morphSVG: triangle,
})
tl.to(rect, duration, {
  morphSVG: circle,
})
tl.to(rect, duration, {
  morphSVG: rect,
})
```

到了这里，形变就已经完成了。但是还缺少了颜色变换和位置变换。颜色和位置变换需要使用GSAP的CSS插件，增加一点代码即可。这里不再赘述了。

## 导出为Gif

SVG的动画做好了，但并不是所有的平台都支持SVG，并且每次使用动画都要加载一堆库和一堆代码也比较麻烦。最好的解决方案是导出为Gif。

比较简单的方法是使用[LICEcap](http://www.cockos.com/licecap/)软件直接录制浏览器屏幕生成Gif，缺点是控制度不高，不好微调。

这里我使用[Nightmare]()渲染我们的文档，然后自己截屏，最后合成为GIf。

Nightmare是类似Phantom的一个Headless Browser，特别适合这种类型的任务，优点是代码比Phantom要简洁。

```javascript
var Nightmare = require("nightmare")
var nightmare = new Nightmare({
  width: 400,
  height: 400,
  titleBarStyle: "hidden", // 影藏标题栏，这样内容区和视口一样大
})
  .goto("http://localhost:8080") // 这是我们的动画页面
  .wait(1000)

for(var i = 0; i < 60; i++) {
  nightmare.screenshot("loading/loading_" + i + ".png")
  nightmare.wait(16.6)
})

nightmare.run(function(err) {
  if(err) {
    console.log(err)
  } else {
    console.log("Done")
  }
})
```

运行以后，可以在loading文件夹里面看到所有截屏出来的图片，将多余的图片剔除掉以后，上传到[gifcreator](http://gifcreator.me/)上，调整一下速度，然后导出即可。

![](http://ww1.sinaimg.cn/large/9b85365djw1f9jheun5t8j20rt0r60yg.jpg)

最终，Gif效果如下。

<img width="100" src="http://ww1.sinaimg.cn/large/9b85365djw1f9jhfdkgy8g20b40b4wfc.gif">