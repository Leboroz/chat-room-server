$(document).ready(function () {
  /* Global io */
  let socket = io();

  socket.on("user", (data) => {
    $("#num-users").text(data.currentUsers + " user online");
    console.log(data)
    let message =
      data.name +
      (data.connected ? " has joined the chat." : " has left the chat.");
    $("#messages").append($("<li>").html("<b>" + message + "</b>"));
  });

  socket.on("chat message", (data) => {
    let message = "<b>" + data.name + ":</b> " + data.message;
    $("#messages").append($("<li>").html(message));
  });

  // Form submittion with new message in field with id 'm'
  $("form").submit(function () {
    var messageToSend = $("#m").val();
    socket.emit("chat message", messageToSend);

    $("#m").val("");
    return false; // prevent form submit from refreshing page
  });
});
