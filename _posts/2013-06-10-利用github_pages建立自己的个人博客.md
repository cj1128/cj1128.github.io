---
title: 利用github pages搭建自己的个人博客
tags: github-pages blog
---

很早之前就想写这篇文章，无奈因为一些事情，一直耽误到今天。这个学期学了rails以后，早就萌生了建立自己的个人网站的想法。无奈rails学的不精，本来打算学通rails以后再买主机建站的。后来google个人博客的时候，发现了**github pages**这样一个好东东。可以免去你管理网站的麻烦。这真是喜从天降。管理网站确实麻烦无比。我想建立个人网站，最主要的目的也是为了写博文，记录生活与技术上的点滴发现。github pages 完美满足了我的这个要求。下面详细来说建站步骤。



###了解什么是静态博客###
github pages提供的个人博客是一种静态博客，所谓静态博客，也就是github pages后台不会运行任何后台程序来动态生成页面。一般我们访问网站的时候，网站内部都会运行后台程序，来从数据库中抓取数据生成动态页面。比如说淘宝网。每次进去的时候，内容都可能已经更新，这是因为每次请求淘宝网页面时，淘宝网服务器后台程序都动态的根据最新的数据来生成一个。比如说你留下了一个评论，然后刷新，评论立刻显示出来，因为页面动态更新了。但是静态页面不会。静态页面的html文件早已经生成好放在了那里，服务器唯一做的功能便是响应你的请求，返回给你早已经存在好的页面。所以静态博客没有任何能存储数据的手段。因为后台没有数据库。除了云端方式。后面会介绍。

###预备知识###
如果你想要玩转你的博客，要精通html，最不济也要懂。
然后是基本的Ruby知识。
对于git的工作方式也要有初步了解。
这些都自行google。


###jekyll###
因为是静态博客，所以一定要有一个生成引擎，来帮助你生成各种html文件。github用的是jekyll模板引擎。不用猜也知道，jekyll是我大Ruby写的。如果有Ruby基础，jekyll上手很快。jekyll具体信息可以查看其官网[jekyll官网](http://jekyllrb.com/)。如果你问：jekyll是不是必须的？当然不是的，如果你闲的慌，你完全可以把所有的页面全部手动写出来。不需要引擎来帮助你生成。所谓引擎，就是他会根据一些内容以及模板，来帮助你生成页面，这会省去你很多事情。


###liquid###
jekyll内部用的是liquid模板语言，这是一个非常简单的语言。看一下API就行了。参考这里[liquid API](https://github.com/Shopify/liquid/wiki/Liquid-for-Designers)。这门语言很简单，也很好用。。我不知道为什么很多人说他不好用。。。

###注册github帐号###
注册一个github帐号，然后进入你的账号，新建一个repo.名字为:your_account_name.github.com.比如说我的账号是fate-lovely,那么我的仓库名称便是fate-lovely.github.com.当你建立这样一个仓库的时候，github默认这个仓库为你的pages仓库。好吧，强大的**convention over configuration**.我喜欢~~~。当你向这个仓库推送内容的时候，github在内部调用jekyll模板引擎，为你生成所有页面，然后，当你访问your_account_name.github.com的时候，比如我的是fate-lovely.github.com页面就呈现出来了。当然，对于geek来说，肿么能够容忍这么搓的域名了？定制域名后面再谈。

###在本地安装jekyll###
这个so easy。最起码对于mac和linux来说，一句话搞定，终端，`gem install jekyll`.ok。windows用户请自行google。当然，前面这句代码的前提是你的电脑里面装有ruby。好吧，如果你没有的话，mac和linux还是超级简单，也是一个命令安装ruby，具体去ruby官网。这里推荐安装RVM。这货真心好用。听说windows装ruby有点蛋疼，这个我不清楚了。自行google。（话说windows装这些动态语言都很蛋疼）

###新建本地工作目录###
这里推荐使用jekyll-bootstrap这个库，挺好用的。自带了一个twitter主题，还能安装各种主题，如果你想倒腾，可以在其基础上改。挺方便的。附上官网。[jekyll-bootstrap](http://jekyllbootstrap.com/)。如果你不想用jekyll-bootstrap。那就直接jekyll new your_directory_path.如果你想用Jekyll-bootstrap，那就照着官网做。官网教程很详细。

###本地端写好代码###
jekyll的基本知识我不介绍了，包括各种变量，目录结构等等，去官网看吧。可以在命令行里面开启jekyll serve --watch 命令，这样你一修改，页面自动重新生成，速度非常快。非常好用。你改完代码后，直接去浏览器刷新。就可以看见效果。


###连接github###
因为你要向库写入文件，必须要用ssh协议连接github。
如果这之前你没有创建过本地ssh。那么照下面步骤来，终端键入命令，

1. ssh-keygen 然后连敲三次回车，生成的ssh文件存放在~/.ssh/中。
2. 打开目录中id_rsa.pub文件，复制其中的所有的内容。
3. 登录github，在设置界面中选择"SSH Keys",点击"Add ssh key",然后输入一个名称（随意），再将刚才复制的内容粘贴到key一栏，然后点击add按钮。
4. 到这里来已经差不多大功告成，接下来测试一下，输入`ssh -T git@github.com  `.如果，终端显示信息`“Hi "username"! You're successfully authentiated,but GitHub does not provide shell access”。`那就说明搞定了。

5. 接下来就是在你的工程目录中设置remote远程库。具体参考git教程。


###提交代码到github###
设置好remote远程库以后，写好代码，然后git commit，然后git push 代码就会自动推送到github你的仓库中，然后就可以通过浏览器进入your_account_name.github.com访问了。

###购买域名###
作为一个geek，自定义自己的域名那是必不可少的。二话不说，上“去他爹”网[go daddy](http://www.godaddy.com/)。搜索一个你喜欢的域名，买下来把。。go daddy可以使用支付宝，这个太方便了。这里要吐槽啊。。为什么.me的域名那么贵啊。。已经接近.com了。。我当时买的时候发现，.info的域名在常见域名中最不值钱。。dingxijin.me 是$9.99；dingxijin.info是$2.99。。。。。算了，我是有节操的人，我就是喜欢.me。咬咬牙，还是买.me把。。当然，网上一大堆go daddy 网站优惠码优惠连接之类的东西，我当时试了一下，貌似没什么用。就没管了。。大家可以去试试。

###配置DNS###
买好域名以后，因为go daddy默认提供的DNS服务可能会被GFW墙掉，所以，我们换一个比较稳定点的DNS比较好。国内的Dnspod比较好。免费~~~。附官网[Dnspod](http://www.dnspod.cn/)。先注册一个帐号。然后进我的域名，再点添加域名，然后添加一条你买的域名的A记录。A记录的IP地址应该怎么填呢。。原谅我才疏学浅。网上说的什么ping什么dig命令我全都用了，全都没有用（或者我看不懂）。所以我直接登录我的账号，然后进github pages主页，然后点击pages help。再点击“Setting up a custom domain with Pages”这一条。。里面出现的那个IP地址复制到刚才dnspod里面即可。在dnspod添加域名面板，会自动出现两个记录类型为“NS”的记录值，这个就是DNS服务器的地址。然后去go daddy 网站，进入域名配置，不要问我怎么进，摸索一下，就那么几个按钮。。然后在Nameservers里面选上“I have specific nameservers for my domains.”。填入刚才dnspod里面给你的两个记录类型为“NS”的地址。还空两个不用管。至此，还差一步就搞定了。那就是进入你的工作目录，新建一个名为CNAME的文件，里面只填上你的域名，如:dingixjin.me  然后，push上去。等待十分钟左右，域名就可以生效啦！

###评论模块###
因为静态博客没有数据库，所以评论只能依靠云端存储来实现，然后利用js来进行动态加载。这些都不用你操心。如果你用了jekeyll-bootstrap库，里面自动为你配好。如果你不用的话，自己去discus官网看一下API接口。照着复制进去就行了。这不是咱们关心的事~~~。


###结束语###
好吧，接下来你就可以尽情折腾这个博客了。包括做基于js的搜索等等。虽然没有数据库，不能动态生成页面。但是我们手里有强悍的js。足够支撑你完成一切创意。OK。祝大家建站愉快。










