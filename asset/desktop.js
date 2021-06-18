;(function() {
  function initGitalk() {
  }

  var notyf = new Notyf()

  // replace post header image
  var $postHeader = $(".post__header")
  if($postHeader) {
    $postHeader.style.backgroundImage = `url(${$postHeader.dataset.cover})`
  }

  $$("pre > code").forEach(function(ele) {
    var div = document.createElement("div")
    div.setAttribute("class", "post__content__code")
  })

  // add copy code buttn
  $$(".highlight pre").forEach(function(ele, index) {
    var id = "code-block-" + index
    ele.setAttribute("id", id)

    var icon = document.createElement("i")
    icon.classList.add("iconfont", "icon-copy", "copy-code-btn")
    icon.setAttribute("data-clipboard-target", "#" + id)
    ele.parentElement.appendChild(icon)
  })

  var clipboard = new ClipboardJS(".copy-code-btn")

  clipboard.on("success", function(e) {
    notyf.success("Copied")
    e.clearSelection()
  })

  // make all links opened at new tab
  $$(".post__content a").forEach(function(ele){
    ele.setAttribute("target", "_blank")
  })

  // make images zoomable
  $$(".post__content img").forEach(function(ele) {
    var f = function() {
      if(ele.naturalWidth > ele.width) {
        ele.dataset.action = "zoom"
      }
    }

    if(ele.naturalWidth == 0) {
      ele.onload = f
    } else {
      f()
    }
  })

  // init gitalk
  if(document.querySelector("#post__comments") && location.hostname !== "localhost") {
    const gitalk = new Gitalk({
      clientID: "bbd19fbff5bc623e090e",
      clientSecret: "e751f74757554518d7f935005876dee2ae4589cd",
      repo: "cj1128.github.io",
      owner: "cj1128",
      admin: ["cj1128"],
      id: location.pathname,
      labels: [PAGE.section],
      title: PAGE.title,
    })
    gitalk.render("post__comments")
  }

  // init tocbot
  if(document.querySelector(".post__toc")) {
    tocbot.init({
      tocSelector: ".post__toc",
      contentSelector: ".post__content",
      headingSelector: "h1, h2, h3, h4, h5, h6",
      collapseDepth: 6,
      positionFixedSelector: ".post__toc",
      positionFixedClass: "post__toc--fixed",
    })
  }
})()

