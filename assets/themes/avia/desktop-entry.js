/*
* @Author: CJ Ting
* @Date: 2016-11-04 13:37:44
* @Email: cj.ting@fugetech.com
*/


window.$ = require("jquery")
require("magnific-popup")
var Clipboard = require("clipboard")
var notie = require("notie")
require("notie/dist/notie.css")

// enable disqus
// http://perfectionkills.com/global-eval-what-are-the-options/
// disqus的相关代码放在了#disqus中，eval就可以激活disqus功能
;(1, eval)($("#disqus").text())

// replace post header image
var $postHeader = $(".post__header")
if($postHeader.length !== 0) {
  url = $postHeader.data("cover")
  $postHeader.css("background-image", "url(" + url + ")")
}

// add copy code buttn
$(".highlight").each(function(index, ele) {
  var id = "code-block-" + index
  $(ele).find("code").attr("id", id)
  $("<span />").text("copy code").addClass("copy-code-btn").attr("data-clipboard-target", "#" + id).appendTo(ele)
})

var clipboard = new Clipboard(".copy-code-btn")

clipboard.on('success', function(e) {
  notie.alert(4, "Copy Successfully!", 1);
  e.clearSelection();
})

// make all links opened at new tab
$(".post__body a").each(function(index, ele){
  $(ele).attr("target", "_blank")
})

// add popups for images
var magnificPopup = function(ele) {
  if(ele.naturalWidth > $(ele).width()) {
    $(ele).addClass("u-cursor-zoom-in")
    $(ele).magnificPopup({
      type: "image",
      items: {
        src: $(ele).attr("src"),
      },
    })
  }
}

$(".post__body img").each(function(index, ele) {
  if(ele.complete) {
    magnificPopup(ele)
    return
  }
  ele.onload = function() {
    magnificPopup(ele)
  }
})

// // add search
// if($("body").hasClass("page-index")) {
//   addSearch()
// }

// function addSearch() {
//   // add search support
//   // postData if filled in layout/page.html
//   var postData = window.postData

//   var searchInput = document.getElementById("search-input")
//   var typingTimer                //timer identifier
//   var doneTypingInterval = 500  //time in ms, 5 second for example
//   var searchBox = document.getElementById("search-box")

//   //on keyup, start the countdown
//   searchInput.addEventListener("keyup", function() {
//     clearTimeout(typingTimer)
//     if (searchInput.value) {
//       typingTimer = setTimeout(doneTyping, doneTypingInterval)
//     } else {
//       // clear all children
//       while (searchBox.firstChild) {
//         searchBox.removeChild(searchBox.firstChild)
//       }
//       searchBox.style.display = "none"
//     }
//   })
// }

// //user is "finished typing," do something
// function doneTyping () {
//   var text = searchInput.value.toLowerCase()
//   var result = postData.filter(function(item) {
//     return item.text.indexOf(text) !== -1
//   })
//   if(result.length === 0) {
//     searchBox.style.display = "none"
//   } else {
//     showSearchBox(result)
//   }
// }


// function showSearchBox(result) {
//   // clear all children
//   while (searchBox.firstChild) {
//     searchBox.removeChild(searchBox.firstChild)
//   }

//   for(var i = 0; i < result.length; i++) {
//     var item = result[i]
//     var li = document.createElement("li")
//     var a = document.createElement("a")
//     a.href = item.url
//     a.innerText = item.title
//     li.appendChild(a)
//     searchBox.appendChild(li)
//   }
//   searchBox.style.display = "block"
// }
