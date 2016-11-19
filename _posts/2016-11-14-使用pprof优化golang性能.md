---
layout: post
title: 使用pprof优化golang性能
description: 
category: golang
tags: golang pprof
cover: http://ww2.sinaimg.cn/large/9b85365djw1f9xjicmnn7j213r0p178e.jpg


---

*Donald E.Knuth*说过一句非常著名的话，**过早的优化是万恶之源**。原文如下：

> We should forget about small efficiencies, say about 97% of the time; premature optimization is the root of all evil

我是十分赞同这句话的，并且在开发过程中也深有体会。什么叫做*过早的优化*呢？即不需要考虑优化的时候你在考虑优化。这绝对不意味着可以任性地写代码，随意地选择数据结构和算法。这句话是告诉我们，在程序开发的早期阶段，程序员应该专注在程序的**逻辑实现**上，而不是专注在程序的**性能优化**上。用正确的数据结构和算法，优美合理的语句实现你要的功能。而不是满脑子在想：“这个函数是不是可以优化一下？”。





我们都知道，性能最好的代码往往并不是优美直观的代码，往往看起来非常晦涩。下图是JS转换字符串到数字的三个方法在Chrome下的性能对比。可以看出，`+`是最快的方法。但是`+str`这种写法明显是不如`parseInt(str)`或者是`Number(str)`容易理解。*Donald E.Knuth*的那句话，我的理解就是在提醒我们，不用使用`+str`，而应该使用更加语义化的`parseInt(str)`。

![](http://ww1.sinaimg.cn/large/9b85365dgw1f9xaluvkarj20qp0733zq.jpg)

不应该过早的优化，那么应该做的就是在适当的时候进行优化。程序在功能开发完毕并且测试好以后，就可以进入优化环节了。所有的优化都应该基于性能分析（Profiling），凭空想象进行优化是一件很危险并且没有效率的事情。很多你觉得可以优化的点说不定编译器早替你做了，很多你觉得很慢的地方说不定非常快。

Golang提供了非常棒的Profiling工具，可以很容易地得到CPU和内存的Profiling数据。更加赞的是，Golang还提供了工具来可视化这些数据，一眼就可以看出程序的性能瓶颈在哪儿。调优从未如此轻松。

## Package pprof

Golang标准库里，有一个叫做`pprof`的包，通过这个包，我们可以profiling任意的程序，两个函数调用即可。

```golang
func main() {
  ....
  f, err := os.Create("cpu-profile.prof")
  if err != nil {
    log.Fatal(err)
  }
  pprof.StartCPUProfile(f)
  ... // this is program you want to profile
  pprof.StopCPUProfile()
}
```

程序运行后，pprof会将Profiling数据写到指定的文件当中，然后通过`go tool pprof`就可以查看。

我们来Profiling一个简单的Fibonacci程序。

```golang
package main

import (
	"fmt"
	"log"
	"os"
	"runtime/pprof"
)

func main() {
	f, err := os.Create("cpu-profile.prof")
	if err != nil {
		log.Fatal(err)
	}
	pprof.StartCPUProfile(f)
	fmt.Println(fibonacci(45))
	pprof.StopCPUProfile()
}

func fibonacci(n int) int {
	if n < 2 {
		return n
	}
	return fibonacci(n-1) + fibonacci(n-2)
}
```

编译以后，运行程序便可以生成`cpu-profile.prof`文件。使用`go tool pprof finabocci cpu-profile.prof`进入Profiling控制台，输入`web`指令跳入浏览器中查看Golang为我们生成的可视化性能数据。

![](http://ww4.sinaimg.cn/large/9b85365djw1f9xgcymlqpj20zo0h3jvw.jpg)

## Benchmark Test

每一次都手动引入`pprof`包比较麻烦，也没有必要。一般Golang的性能测试我们会使用Golang提供的Benchmark功能，Golang提供了命令行参数我们可以直接得到测试文件中Benchmark的Profiling数据。不需要添加任何代码。

下面我们来写一个Benchmark测试一下Golang的标准库函数`rand.Intn`的性能如何。

```golang
package main

import (
	"math/rand"
	"testing"
)

func BenchmarkRandom(b *testing.B) {
	for i := 0; i < b.N; i++ {
		random()
	}
}

func random() int {
	return rand.Intn(100)
}

```

因为pprof需要编译好的二进制文件以及prof文件一起才可以分析。所以先要编译这一段测试程序。

```bash
$ go test -c go_test.go
$ ./main.test -test.bench=. -test.cpuprofile=cpu-profile.prof
testing: warning: no tests to run
BenchmarkRandom-8       50000000                30.5 ns/op
```

可以看出Go标准库的`rand.Intn`性能很好。测试运行完毕以后，我们也得到了相应的CPU Profiling数据。使用`go tool pprof`打开以后，使用`top 5`指令得到开销排名前五的函数。五个里面有两个是`sync/atomic`包的函数，很明显，`rant.Intn`是并发安全的。

```bash
$ go tool pprof main.test cpu-profile.prof
(pprof) top 5
780ms of 1370ms total (56.93%)
Showing top 5 nodes out of 35 (cum >= 610ms)
      flat  flat%   sum%        cum   cum%
     270ms 19.71% 19.71%      270ms 19.71%  runtime.usleep
     170ms 12.41% 32.12%      840ms 61.31%  math/rand.(*Rand).Int31n
     150ms 10.95% 43.07%      150ms 10.95%  sync/atomic.AddUint32
     110ms  8.03% 51.09%      110ms  8.03%  sync/atomic.CompareAndSwapUint32
      80ms  5.84% 56.93%      610ms 44.53%  math/rand.(*Rand).Int63
```

## Example Sudoku

下面我用[Godoku](https://github.com/paddie/godoku)这个项目为例，看看怎么具体优化一个程序。Godoku是一个Go编写的暴力破解数独的程序，逻辑比较简单，从上到下从左到右扫描每一个空格，从1到9开始填写数字，一旦数字无效（行冲突，列冲突或者9宫格冲突），那么就换一个数字，如果所有数字都换了还无效，那么就退回上一个格子。继续这个过程。

### Step1

程序自带了测试和Benchmark，所以我们先来生成一个Profiling文件，看看哪个地方开销最大。

![](http://ww2.sinaimg.cn/large/9b85365dgw1f9xhhnlv05j20s70mcafx.jpg)

很明显，`ValidInSquare`这个函数开销很大。这个函数是检测一个数字在九宫格里面存不存在。作者的实现如下。

```golang
func (s *Sudoku) ValidInSquare(row, col, val int) bool {
	row, col = int(row/3)*3, int(col/3)*3

	for i := row; i < row+3; i++ {
		for j := col; j < col+3; j++ {
			//fmt.Printf("row, col = %v, %v\n", i, j)
			if s.board[i][j] == val {
				return false
			}
		}
	}
	return true
}
```

循环判断有没有这个数。逻辑很简单，但是Profiling告诉我们，这里成了性能瓶颈。每一次测试数字都要调用这个方法，而这个方法内部是一个循环，调用如此频繁的方法采用循环肯定是不行的。

### Step2

这里我们采用经典的**空间换时间**思路，使用另外一个结构存储九宫格内的状态信息，使得查询一个数字在九宫格内有没有可以通过简单的数组访问得到。

```golang
s.regionInfo = make([]int, s.dim * s.dim / 9)
func (s *Sudoku) updateRegion(row, col, val, delta int) {
	region := (row/3)*3 + col/3
	key := region*9 + val - 1
	s.regionInfo[key] += delta
}

func (s *Sudoku) checkRegion(row, col, val int) bool {
	region := (row/3)*3 + col/3
	key := region*9 + val - 1
	return s.regionInfo[key] == 1
}
```

我们使用一个额外的`regionInfo`slice来存储九宫格里的情况，每一次设置数独中格子的值时，我们更新一下regionInfo的信息。当要检查某个数在某个九宫格中是否已经存在时，直接查询regionInfo即可。

```golang
func (s *Sudoku) ValidInSquare(row, col, val int) bool {
	return !s.checkRegion(row, col, val)
}
```



再运行一次测试，看看性能改善了多少。

![](http://ww1.sinaimg.cn/large/9b85365dgw1f9xhx008q9j212g0m3q8x.jpg)

很好！CPU开销已经由9770ms降低到了5460ms，性能提高79%。现在程序的性能瓶颈已经是`ValidInColumnAndRow`这个函数了。

### Step3

作者`ValidInColumnAndRow`函数的实现仍然是直观简单的循环。

```golang
func (s *Sudoku) ValidInColumnAndRow(row, col, val int) bool {
	for i := 0; i < 9; i++ {
		if s.board[row][i] == val ||
			s.board[i][col] == val {
			return false
		}
	}
	return true
}
```



我们使用同样的策略来优化`ValidInColumnAndRow`这个函数，使用额外的数据结构存储每一行和每一列的数字状态信息。这样查询时可以马上返回，而不需要做任何循环比较。

```golang
func (s *Sudoku) updateRowAndCol(row, col, val, delta int) {
	rowKey := row*9 + val - 1
	colKey := col*9 + val - 1
	s.rowInfo[rowKey] += delta
	s.colInfo[colKey] += delta
}

func (s *Sudoku) checkRowOrCol(row, col, val int) bool {
	rowKey := row*9 + val - 1
	colKey := col*9 + val - 1
	return s.rowInfo[rowKey] == 1 || s.colInfo[colKey] == 1
}
func (s *Sudoku) ValidInColumnAndRow(row, col, val int) bool {
	return !s.checkRowOrCol(row, col, val)
}
```

我们再来看看Profiling数据。

![](http://ww4.sinaimg.cn/large/9b85365dgw1f9xi9qhf6uj211m0idjvs.jpg)

性能再次得到了提升，由5460ms降低到了3610ms。初步看来，已经没有了明显可以优化的地方了。到此为止，我们的程序性能已经得到了170%的提升！我们并没有怎么努力，只不过是生成了Profiling文件，一眼看出问题在哪儿，然后针对性的优化而已。

感谢Golang提供了这套超赞的pprof工具，性能调优变得如此轻松和愉悦。这里我所举的只是pprof功能的冰山一角，pprof的强大功能远不止这些。比如可以使用`list`指令查看函数的源码中每一行代码的开销以及使用`weblist`指令查看函数汇编以后每一句汇编指令的开销等等。不仅是CPU Profiling，pprof同样支持Memory Profiling，可以帮助你检查程序中内存的分配情况。总之，在pprof的帮助下，程序的开销信息变得一清二楚，优化自然变得轻而易举。