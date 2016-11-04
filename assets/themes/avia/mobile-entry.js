/*
* @Author: CJ Ting
* @Date: 2016-11-04 13:49:49
* @Email: cj.ting@fugetech.com
*/

var postHeader = document.querySelector(".post__header")
if(postHeader) {
  var url = postHeader.getAttribute("data-cover")
  url = url.replace("large", "bmiddle")
  postHeader.style.backgroundImage = "url(" + url + ")"
}

// change disqus info
document.querySelector(".dsq-brlink").innerText = "disable disqus for mobile devices"
