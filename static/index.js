function readUrl(input) {
  var sMsg = document.getElementById("s-msg");
  sMsg.innerHTML = "";
  var emPred = document.getElementById("em-pred");
  emPred.innerHTML = "";
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
}
