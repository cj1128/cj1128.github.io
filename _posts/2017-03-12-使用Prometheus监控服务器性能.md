---
layout: post
title: 使用Prometheus监控服务器性能
description: 
category: misc
tags: prometheus golang 
cover: http://ww1.sinaimg.cn/large/9b85365dgy1fdllodi902j21ff0ciq33
---

最近一直在思考如何对线上服务做深度监控。基础的服务可用性监控很简单，定期Ping即可。但是怎样才能监控服务器的一些更加关键的数据呢？比如，每一个API Point的请求次数（QPS），最大响应时间，平均响应时间等。最终我希望实现的效果是有一个Dashboard，我可以清楚地看到各种参数曲线，对服务器的运行情况了然于胸。

绘制Dashboard不难，目前提供数据可视化的工具很多，随便选一个都能满足需要。关键问题是，怎样将整个流程打通？

- 服务器该以怎样的形式暴露出数据？
- 数据怎样被收集和存储起来？
- 存储起来的数据怎样提供给数据可视化工具？
- 怎样做到足够灵活，可以可视化自己感兴趣的任意数据？



## Prometheus

像QPS和响应时间这些数据，外部工具是没办法直接拿到的，必须要服务器以某种方式将数据暴露出来。最常见的做法是写日志。比如Nginx，每一条请求对应一个日志，日志中有响应时间这个字段。通过对日志分析，我们就可以得到QPS，最大响应时间，平均响应时间等，再通过可视化工具即可绘制我们想要的Dashboard。

日志这个方法固然是可行的，但是还有更好的方法。这个方法就是**时序数据库（Time Series Database）**。时序数据库简单来说就是存储随时间变化的数据的数据库。什么是随时间变化的数据呢？举个简单的例子，比如，CPU使用率，典型的随时间变化的量，这一秒是50%，下一秒也许就是80%了。或者是温度，今天是20度，明天可能就是18度了。

[Prometheus](https://prometheus.io/)就是一个用Go编写的时序数据库，官网对其的优点介绍的很清楚，这里就不再赘述了。总之，使用简单，功能强大。

### 安装

安装直接去官网下载对应的[安装包](https://prometheus.io/download/)即可。当然，如果你是Mac用户的话，brew永远不会让你失望`brew install prometheus`。

### 格式

Prometheus获取数据的策略是**Pull**而不是**Push**，也就是说，它会自己去抓取，而不用你来推送。抓取使用的是HTTP协议，在配置文件中指定目标程序的端口，路径及间隔时间即可。这也就意味着任何程序想要使用Prometheus存储数据都很简单，定义一个HTTP接口即可。

Prometheus的数据格式是简单的文本格式，可以直接阅读。其中，`#`号开头的是注释，除此之外，每一行一个数据项，数据名在前，值在后。`{}`中是标签，一条数据可以有多个标签。

```text
# HELP go_gc_duration_seconds A summary of the GC invocation durations.
# TYPE go_gc_duration_seconds summary
http_request_count{endpoint="/a"} 10
http_request_count{endpoint="/b"} 200
http_request_count(endpoint="/c") 3
```

### 配置

Prometheus使用YAML进行配置。`global`配置一些全局信息，`scrape_configs`配置具体想要抓取的目标。这段配置的含义是：启动一个叫做`go-test`的任务，每隔五秒钟，访问`localhost:8888/metrics`获取数据。

```yaml
global:
  scrape_interval:     15s # By default, scrape targets every 15 seconds.

  # Attach these labels to any time series or alerts when communicating with
  # external systems (federation, remote storage, Alertmanager).
  external_labels:
    monitor: 'codelab-monitor'

# A scrape configuration containing exactly one endpoint to scrape:
# Here it's Prometheus itself.
scrape_configs:
  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: 'go-test'
    metrics_path: "/metrics"

    # Override the global default and scrape targets from this job every 5 seconds.
    scrape_interval: 5s

    static_configs:
      - targets: ['localhost:8888']
```

### 测试程序

我们来写一个程序测试一下Prometheus的功能。虽然可以手动返回Prometheus需要的数据，但是使用开发好的客户端会更加方便。

这里我们使用Go语言，编写一个简单的服务器和客户端。客户端会以一个稳定的速度请求服务器的`/test`路径，但是每两分钟会加大流量，持续30秒再回到之前的水平。服务器95%的情况下会花费50ms进行响应，还有5%的情况下会花费100ms。

这里我们定义了两个指标，`httpRequestCount`记录HTTP的请求数，`httpRequestDuration`记录响应时间，他们都有一个`endpoint`标签用于记录请求路径。这两个指标分别是`Counter`类型和`Summary`类型，Prometheus定义了四种指标类型，基本涵盖了各种用例场景，具体可以去看[相关文档](https://prometheus.io/docs/concepts/metric_types/)。简单来说，Counter类型的数据表示一个只会向上增加的数据，比如请求数。而Summary类型的数据表示一个按区间分布的数据，比如响应时间或者请求体大小。

```go
/*
* @Author: CJ Ting
* @Date:   2017-03-12 17:27:23
* @Last Modified by:   CJ Ting
* @Last Modified time: 2017-03-12 23:49:55
 */

package main

import (
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var httpRequestCount = prometheus.NewCounterVec(
	prometheus.CounterOpts{
		Name: "http_request_count",
		Help: "http request count",
	},
	[]string{"endpoint"},
)

var httpRequestDuration = prometheus.NewSummaryVec(
	prometheus.SummaryOpts{
		Name: "http_request_duration",
		Help: "http request duration",
	},
	[]string{"endpoint"},
)

func init() {
	prometheus.MustRegister(httpRequestCount)
	prometheus.MustRegister(httpRequestDuration)
}

func main() {
	http.Handle("/metrics", promhttp.Handler())
	http.HandleFunc("/test", handler)
	go func() {
		http.ListenAndServe(":8888", nil)
	}()
	startClient()
	doneChan := make(chan struct{})
	<-doneChan
}

func handler(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	path := r.URL.Path
	httpRequestCount.WithLabelValues(path).Inc()

	n := rand.Intn(100)
	if n >= 95 {
		time.Sleep(100 * time.Millisecond)
	} else {
		time.Sleep(50 * time.Millisecond)
	}

	elapsed := (float64)(time.Since(start) / time.Millisecond)
	httpRequestDuration.WithLabelValues(path).Observe(elapsed)
}

func startClient() {
	sleepTime := 1000

	go func() {
		ticker := time.NewTicker(2 * time.Minute)
		for {
			<-ticker.C
			sleepTime = 200
			<-time.After(30 * time.Second)
			sleepTime = 1000
		}
	}()

	for i := 0; i < 100; i++ {
		go func() {
			for {
				sendRequest()
				time.Sleep((time.Duration)(sleepTime) * time.Millisecond)
			}
		}()
	}
}

func sendRequest() {
	resp, err := http.Get("http://localhost:8888/test")
	if err != nil {
		log.Println(err)
		return
	}
	resp.Body.Close()
}
```

启动Prometheus`prometheus -config.file config.yml`以后，再启动我们的测试程序`go run test.go`。打开Prometheus控制台`localhost:9090/targets`就可以看到Prometheus正在抓取数据，一切正常。

![](http://ww1.sinaimg.cn/large/9b85365dgy1fdki1jpblnj21gk06mjs1)

### 控制台

Prometheus的一个强大之处在于可以使用各种函数和操作符来查询数据。在上面的测试程序中，每个数据都带有`endpoint`这个标签，表示请求的路径。打开Prometheus的控制台`http://localhost:9090/graph`，点击`console`标签页，输入`http_request_count{endpoint="/a"}`就可以查询路径为`/a`的API Point到目前为止的总请求数。如果想看QPS的话，可以使用自带的函数`rate`，`rate(http_request_count[10s])`表示以10s作为时间单元来统计QPS。

Prometheus的控制台自带一个简单的绘图系统，点击`graph`标签页，输入表达式就可以看到图表。例如，输入`rate(http_request_count{endpoint="/test"}[10s])`就可以看到我们测试程序中`/test`路径的QPS，从图中可以明显发现，每隔一段时间就会有一个波峰流量。

![](http://ww1.sinaimg.cn/large/9b85365dgy1fdkick67anj21ha0lw416)

`httpRequestDuration`是一个Summary类型的指标，比简单的Counter要复杂，会生成三个数据项。分别是`http_request_duration_sum`，表示响应时间加在一起的总和，`http_request_duration_count`，表示响应时间的总个数，以及`http_request_duration`，表示响应时间的分布情况，这个数据项会使用`quantile`标签对响应时间进行分组。

如下图所示，`quantile=0.5`值为50，表示50%的请求响应时间都在50ms以下。`quantile=0.9`的值为54，表示90%的请求响应时间都在54ms以下。但是，`quantile=0.99`的值为103，表示99%的请求响应时间在103ms以下。这就说明了一个问题，那就是极个别的请求耗费了大量时间。

![](http://ww1.sinaimg.cn/large/9b85365dgy1fdkikzfoyyj21gp0k8tat)

通过使用表达式`http_request_duration_sum / http_request_duration_count`我们可以得到平均响应时间，如下图。当然，这个图的作用不大（平均数往往反映不了什么问题），不像上图那样，我们无法看出有部分请求花费了大量时间。

![](http://ww1.sinaimg.cn/large/9b85365dgy1fdkiurz15sj21h70kftap)

以上只是对数据项的最简单利用，Prometheus自带了很多函数和操作符，可以方便地对数据进行处理，具体可以参考[官方文档](https://prometheus.io/docs/querying/basics/)。

## Grafana

Prometheus自带的图表是非常基础的，只能用来临时查看一下数据。如果要构建强大的Dashboard，还是需要更加专业的工具才行。这个工具就是[Grafana](http://grafana.org/)。

### 安装

同样是去官网下载相应的[安装包](http://grafana.org/download/)。Mac用户可以再次感受到brew的优越性。`brew install grafana`。

### 启动

直接用默认配置就挺好的。在Mac上，启动指令如下。

```bash
$ grafana-server --config=/usr/local/etc/grafana/grafana.ini --homepath /usr/local/share/grafana cfg:default.paths.logs=/usr/local/var/log/grafana cfg:default.paths.data=/usr/local/var/lib/grafana cfg:default.paths.plugins=/usr/local/var/lib/grafana/plugins
```

Grafana默认监听在3000端口上，默认用户名和密码都是`admin`。

### 设置

输入用户名和密码以后，进入Grafana页面。第一件事是要设置数据源（Data Source），即Grafana从什么地方获取数据，选择Prometheus即可。

![](http://ww1.sinaimg.cn/large/9b85365dgy1fdll4hyc91j20sk0joaeg)

数据源设置好以后，接下来就是创建Dashboard了。Dashboard里面可以放置很多“组件”。比如，图表，状态值，表格，文字等等。这里我们选择`Graph`图表，Grafana会创建一个默认的空图表。

点击图表标题，选择`Edit`来编辑图表参数。最重要的参数就是`Metrics`标签里的`Query`字段，这个字段定义了我们的图表到底要展示什么数据。输入`rate(http_request_count{endpoint="/test"}[10s])`，就可以看到`/test`路径的QPS曲线了。

![](http://ww1.sinaimg.cn/large/9b85365dgy1fdllazj0cvj20ya0k841q)

 同理，在Query中输入`http_request_duration`就可以得到响应时间曲线。通过使用Prometheus提供的操作符和函数，我们可以对数据进行我们想要的任意可视化，十分灵活。

在这两个工具的配合使用下，对服务器信息的监控变得非常简单。首先，服务器定义一个HTTP接口，暴露出想要监控的数据，然后使用Prometheus收集并存储这些数据，最后在Grafana中绘制这些数据。一个完整的监控方案就诞生了。

当然，在实际系统中，还缺少了一个环节，那就是报警。监控发现问题以后，需要马上报警通知相关的维护人员。这是另外一个话题了，以后再介绍。