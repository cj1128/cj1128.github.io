---
layout: post
title: JavaScript Infinite Currying
category: web2.0
tags: JavaScript Curry
---

很久之前曾看到一个很有意思的JS问题，

``` javascript
// 定义一个函数add，满足如下性质：
add(1) == 1
add((1)(2) == 3
add(1)(2)(3) == 6
...

var g = add(1)(2)
g(100) == 103
g(200) == 203
...
```





乍一看，这应该是需要用到柯里化(Curry)的知识。但是好像又不够。当时忙别的事情就没管了。现在想起来，便认真研究了一下。

首先我们需要来说一下柯里化，柯里化是一个在函数编程中十分重要的概念，如果大家熟悉`Haskell`的话就知道`Haskell`中的函数都是默认柯里化的。JS随便找一个函数编程库（比如Ramda）肯定也会有柯里化。因为他实在是太重要了。这里我们用一个简单的例子来看看什么是柯里化。

``` javascript
// f是一个普通函数，接受两个参数，并返回他们相加的结果
function f(x, y) {
  return x + y
}

// g是一个柯里化函数，接受一个参数，返回一个新的函数
function g(x) {
  return function(y) {
  	return x + y
  }
}

// 传统函数调用是接收多个参数返回一个值，而柯里化函数则是接收参数返回新的函数，新的函数又可以接受参数再返回新的函数，直至最后返回结果值
// 使用柯里化函数的优势是我们可以"部分应用"(Partial Application)函数的参数，生成新的函数，这在函数编程中是至关重要的
// g(1)(2) == 3
// var add1 = g(1)
// add1(100) == 101
// var add100 = g(100)
// add100(100) == 200
```



现在我们来分析上面的问题。

首先，`add(1) == 1`，说明`add`函数应该返回一个整数。但是`add(1)(2) == 3`表明毫无疑问`add(1)`返回的值应该是一个函数。所以现在我们的问题就变成了，有没有可能让一个函数等于一个整数呢？（注意比较操作符是松散的`==`，而不是严格`===`。

答案是有可能的。这里需要我们了解JS的一个小知识。那就是`valueOf`属性。当我们将一个对象和一个primitive进行比较的时候，JS会调用对象的`valueOf`方法获取一个primitive值，然后在进行比较。

``` javascript
var a = {}
a.valueOf = function(){ return "hello world!" }
a == "hello world!" // true
a === "hello world!" // false，严格等于操作符会比较数据类型
```

从这里就可以看出，只要我们定义了对象a的`valueOf`方法，我们可以让他和任意的primite值相等。

函数也是一个对象。所以这个问题的解决方法就很清楚了。每次返回的都是一个函数。这个函数的`valueOf`会返回传入参数的和。

大家可以试试看自己实现，下面是我的实现～

``` javascript
function total(args) {
  return [].slice.call(args).reduce((t, c) => t + c, 0)
}

function add() {
  function factor(value) {
    var result = function(){
      return factor(value + total(arguments))
    }
    result.value = value
    result.valueOf = function(){ return this.value }

    return result
  }

  return factor(total(arguments))
}
```

