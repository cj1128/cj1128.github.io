// init gittalk
function initGitalk() {
  if(document.querySelector("#post__comments")) {
    const gitalk = new Gitalk({
      clientID: "f26cc90ab221487c7c8f",
      clientSecret: "fed1fa4d13c28f37a3a9087c6bb5585e14a87439",
      repo: "cj1128.github.io",
      owner: "cj1128",
      admin: ["cj1128"],
      id: location.pathname,
      labels: [PAGE.section],
      title: PAGE.title,
    })
    gitalk.render("post__comments")
  }
}

var notyf = new Notyf()

;(function() {
  // replace post header image
  var $postHeader = $(".post__header")
  if($postHeader) {
    $postHeader.style.backgroundImage = `url(${$postHeader.dataset.cover})`
  }

  $$("pre > code").forEach(function(ele) {
    var div = document.createElement("div")
    div.setAttribute("class", "post__content__code")
    // wrapElement(ele.parentNode, div)
  })

  // add copy code buttn
  $$(".highlight pre").forEach(function(ele, index) {
    var id = "code-block-" + index
    ele.setAttribute("id", id)

    var btn = document.createElement("span")
    btn.innerText = "copy"
    btn.classList.add("copy-code-btn")
    btn.setAttribute("data-clipboard-target", "#" + id)
    ele.parentElement.appendChild(btn)
  })

  var clipboard = new ClipboardJS(".copy-code-btn")

  clipboard.on("success", function(e) {
    notyf.success("Copied")
    e.clearSelection()
  })

  // make all links opened at new tab
  $$(".post__body a").forEach(function(ele){
    ele.setAttribute("target", "_blank")
  })

  // make images zoomable
  function magnificPopup(ele) {
    if(ele.naturalWidth > ele.width) {
      ele.classList.add("u-cursor-zoom-in")
      $(ele).magnificPopup({
        type: "image",
        items: {
          src: ele.getAttribute("src"),
        },
      })
    }
  }

  $$(".post__body img").forEach(function(ele) {
    if(ele.naturalWidth > ele.width) {
      ele.dataset.action = "zoom"
    }
  })

  initGitalk()
})()
