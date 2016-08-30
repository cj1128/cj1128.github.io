---
title: 使用Dnsmasq搭建内网DNS服务器
category: misc
tags: dns dnsmasq
cover: http://ww1.sinaimg.cn/large/9b85365djw1f7bjp0tf5dj21jk0ikq95.jpg
---

在日常开发过程中，我们经常要配置各种
host，比如公司内部的各种服务，或者测试项目的时候暂时把生产环境URL配置到本地上等等。一般采取的方法都是每个人手动编辑自己的`/etc/hosts`文件。这个做法有两个缺点：

- 手动编辑`/etc/hosts`文件非常麻烦，需要`sudo`
- 工作量重复，团队内每个人都要配置一遍


对于第一个缺点，在经历了长时间手动修改`/etc/hosts`文件以后，我实在是忍无可忍，自己写了一个小工具[mh](https://github.com/fate-lovely/mh)来快速添加删除host记录。有需要的朋友可以用用看。

当然，在团队中，怎样解决第二个问题才是关键。试想，有一个新的项目`test`要开始开发了，内部搭建了sandbox环境和staging环境，这时候，参与项目的所有人（包括开发人员，测试人员，PM等）都要手动添加`sandbox.test.dev`以及`staging.test.dev`这两条记录到`/etc/hosts`文件中。这实在是无比繁琐（和非开发人员说怎么配host也是一件很痛苦的事情）。

解决这个问题的思路也很简单，我们需要一个内部的DNS服务器能够控制DNS查询就行，然后把所有的`host`配置在这台DNS服务器上，从而实现一次配置，所有人都可以使用。

这里我们使用的是`Dnsmasq`，一个轻量的支持`DNS`,`DHCP`以及`TFTP`协议的小工具。功能很多，有兴趣可以自己研究，这里我们主要关心他的DNS功能。

## 安装

OSX上很简单，`brew install dnsmasq`即可。Linux上可以使用相应的包管理器来装。

## 配置

在OSX上，`Dnsmasq`使用的配置文件是`/usr/local/etc/dnsmasq.conf`文件。Linux上是`/etc/dnsmasq.conf`。

默认配置文件中列举了所有的配置和解释，所以很容易看懂。这里我们使用以下的配置。

```text
# 所有没有.号的域名(plain names)都不会向上游DNS Server转发，只查询hosts文件
domain-needed
# 所有保留IP地址段内的反向查询都不会向上游DNS Server转发，只查询hosts文件
bogus-priv
# 不要读取/etc/resolver中的DNS Server的配置
no-resolv
# 不要poll /etc/resolver文件的更新
no-poll
# 下面这两个配置我们的上游DNS服务器
server=8.8.8.8
server=8.8.4.4
```

配置完了以后，在`/etc/hosts`中添加我们的内部hosts。启动`Dnsmasq`就行了。

## 配置路由器

默认情况下，每一台新进入网络的计算机，默认DNS Server是路由器，而路由器的默认DNS Server是自动根据ISP获取。我们最后一步是把路由器的DNS服务器设置为启动了Dnsmasq的机器即可。每一台路由器修改DNS Server不一样，找一找可以很容易找到。


## 最后

到这里，我们的目标就实现了，以后所有的host只需要配置在Dnsmasq服务器上的`/etc/hosts`文件中（每一次修改/etc/hosts文件以后，需要重启Dnsmasq）。网络中的每一台主机都可以访问配置的域名，再也不用自己手动配置了。同时，Dnsmasq还默认提供dns cache功能，可以一定程度上加速网站访问。





