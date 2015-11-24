---
---

// add code highlight
hljs.initHighlightingOnLoad()

// add copy code buttn
var blocks = document.querySelectorAll(".highlight")
for(var i = 0; i < blocks.length; i++) {
  ele = blocks[i]
  var id = "code-block-" + i
  var pre = ele.childNodes[0]
  pre.id = id
  var btn = document.createElement("span")
  btn.innerText = "copy code"
  btn.className = "copy-code-btn"
  btn.setAttribute("data-clipboard-target", "#" + id)
  ele.appendChild(btn)
}

var clipboard = new Clipboard(".copy-code-btn")

clipboard.on('success', function(e) {
  notie.alert(4, "Copy Successfully!", 1);
  e.clearSelection();
})

// add search support
var index = []
{% for post in site.posts %}
  index.push({
    title: "{{ post.title }}",
    text: ("{{ post.title }}" + "{{ post.tags }}").toLowerCase(),
    url: "{{ post.url }}",
  })
{% endfor %}

var searchInput = document.getElementById("search-input")
var typingTimer                //timer identifier
var doneTypingInterval = 500  //time in ms, 5 second for example
var searchBox = document.getElementById("search-box")

//on keyup, start the countdown
searchInput.addEventListener("keyup", function() {
  clearTimeout(typingTimer)
  if (searchInput.value) {
    typingTimer = setTimeout(doneTyping, doneTypingInterval)
  } else {
    // clear all children
    while (searchBox.firstChild) {
      searchBox.removeChild(searchBox.firstChild)
    }
    searchBox.style.display = "none"
  }
})

//user is "finished typing," do something
function doneTyping () {
  var text = searchInput.value.toLowerCase()
  var result = index.filter(function(item) {
    return item.text.indexOf(text) !== -1
  })
  if(result.length === 0) {
    searchBox.style.display = "none"
  } else {
    showSearchBox(result)
  }
}


function showSearchBox(result) {
  // clear all children
  while (searchBox.firstChild) {
    searchBox.removeChild(searchBox.firstChild)
  }

  for(var i = 0; i < result.length; i++) {
    var item = result[i]
    var li = document.createElement("li")
    var a = document.createElement("a")
    a.href = item.url
    a.innerText = item.title
    li.appendChild(a)
    searchBox.appendChild(li)
  }
  searchBox.style.display = "block"
}





