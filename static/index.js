function readUrl(input) {
  // clear old options when a new image is uploaded
  var sMsg = document.getElementById("s-msg");
  sMsg.innerHTML = "";
  var emPred = document.getElementById("em-pred");
  emPred.innerHTML = "";
  $('.emGen').hide();

  imagebox = $('#imagebox');
  console.log("evoked readUrl");
  if (input.files && input.files[0]) {
    let reader = new FileReader();
    reader.onload = function (e) {
      imagebox.attr('src', e.target.result);
      imagebox.width(500);
    };
    reader.readAsDataURL(input.files[0]);
  }
  $("body,html").animate({ scrollTop: $("#send-tst").offset().top }, 1500);
}
