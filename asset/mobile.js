(function() {
  // change top image size
  var postHeader = $(".post__header")

  if(postHeader) {
    var url = postHeader.getAttribute("data-cover")
    postHeader.style.backgroundImage = "url(" + url.replace("large", "bmiddle") + ")"
  }
})()
