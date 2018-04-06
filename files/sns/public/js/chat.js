var my_id = 0;
var chatroom_list = [];
var notification_channel;
var ping_timer = [];
var room_info = [];

function startChat(friend_id,received){
  var room_id = my_id<friend_id?my_id+"-"+friend_id:friend_id+"-"+my_id;
  room_info[room_id]=[];
  room_info[room_id]["friend_id"]=friend_id;
  if(!document.getElementById("friend_"+friend_id)){return;}
  var name = document.getElementById("friend_"+friend_id).getElementsByClassName("name")[0].textContent;

  if($("#chatroom-container-"+room_id)[0] == undefined) {
    createChatWindow(room_id, friend_id, name);
  }
  if(received) {
    changeChatInputStatus(room_id, false);    
  }

  if(chatroom_list[room_id] != undefined) {
    return;
  }

  chatroom_list[room_id] = App.cable.subscriptions.create(
    {"channel":"ChatChannel","channel_id":createChannelId2(my_id,friend_id)}, {
    connected: function() {
    },

    disconnected: function() {
      // 個別チャットチャンネルは継続させる必要はないので、一度unsubscribeする。
      chatroom_list[room_id].unsubscribe();
      chatroom_list[room_id] = undefined;
    },

    received: function(data) {
      var type = data["message"]["type"];

      //接続確認処理
      if(my_id != data['message']['user_id']){
        if (type == "pong"){
          console.log("Received pong:"+room_id);
          connectionTimerClear(room_id);
          changeChatInputStatus(room_id, false);
          return;
        }
        console.log("Send pong");
        //接続がうまく言っていない時にオブジェクトがなくなる？要確認。
        chatroom_list[room_id].post({"message":"","user_id":my_id,"room_id":room_id,"type":"pong"});        
      }
      if (type == "pong"){
        return;
      }        
      createCommentBaloon(room_id,data);
      return;    
    },

    post: function(message) {
      return this.perform('post', { message: message });
    }
  });

  // 相手のNotificationの応答を確認する
  connectionTimer(room_id, "接続できませんでした。相手がオフラインの可能性があります。");
  
  // Enter押したら投稿されるようにする
  $(document).on('keypress', '[data-behavior~=chat_post-'+room_id+']', function(event) {
    if (event.keyCode === 13) {
      var chatInput = $('#chat-input-'+room_id);
      if(chatInput.val()=="") return false;
      //TODO 接続が完全に切れると（PCスリープ）、ここでエラーになってた。disconnect処理で灰色にしてないところがあるはず。
      try{
        chatroom_list[room_id].post({"message":chatInput.val(),"user_id":my_id,"room_id":room_id,"type":"post"});
        chatInput.val('');
        connectionTimer(room_id, "接続できませんでした。相手がオフラインのため、メッセージが届いていない可能性があります。<br><button onclick='startChat("+friend_id+",false);this.parentNode.removeChild(this);'>再接続</button>");
      } catch (e){
        printSystemMessage(room_id, "接続できません。再接続します。");
        changeChatInputStatus(room_id, false);
        startChat(friend_id,false);
      }
      return false;
    }
  });
}

function createCommentBaloon(room_id,data) {
  var message = data["message"]["message"];

  // URLがある場合、リンクを生成する
  var regex = new RegExp(/^[\s\S]*(https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-]+)[\s\S]*$/);
  var link_flg = message.match(regex);
  if(link_flg) {
    var url = message.replace(regex,"$1");
    var splitted_mess = message.split(url);
    message = splitted_mess.join("<a href='"+url+"' target='blank'>"+url+"</a>")
  }
  
  if(my_id == data['message']['user_id']) {
    //自分のコメント
    var comment_right = $("<div>", {class: 'comment-right'});
    $("<div>", {class: 'icon'}).appendTo(comment_right);
    var balloon2 = $("<div>", {class: 'balloon2'});
    //URLがある場合はAタグを有効にする
    $("<p>", link_flg?{html: message}:{text: message}).appendTo(balloon2);
    balloon2.appendTo(comment_right);
    comment_right.appendTo("#chat-index-"+room_id);
  }else {
    //相手のコメント
    var comment_left = $("<div>", {class: 'comment-left'});
    $("<div>", {
      class: 'icon',
      html: document.getElementById("friend_"+room_info[room_id]["friend_id"]).getElementsByTagName("img")[0].outerHTML
    }).appendTo(comment_left);

    var balloon1 = $("<div>", {class: 'balloon1'});
    //URLがある場合はAタグを有効にする
    $("<p>", link_flg?{html: message}:{text: message}).appendTo(balloon1);
    balloon1.appendTo(comment_left);
    comment_left.appendTo("#chat-index-"+room_id);
  }

  nyuru(room_id);
}

function createChatWindow(room_id, friend_id, name){
  var title = name;  
  // Templateからチャットウィンドウを作成。文字列置換の方が簡単な気が。
  var clone = document.importNode($('#chat-template')[0].content, true);
  clone.getElementById("chatroom-container").id="chatroom-container-"+room_id;
  clone.getElementById("chatroom-content").id="chatroom-content-"+room_id;
  clone.getElementById("chat-index").id="chat-index-"+room_id;
  clone.getElementById("chat-input").setAttribute("data-behavior","chat_post-"+room_id);
  clone.getElementById("chat-input").id="chat-input-"+room_id;
  clone.getElementById("chatroom-title").id="chatroom-title-"+room_id;
  clone.getElementById("chatroom-close-button").id="chatroom-close-button-"+room_id;
  
  $('#chat-container').append(clone);
  $("#chatroom-title-"+room_id).text(title);
  $("#chatroom-title-"+room_id)[0].room_id = room_id;
  $("#chatroom-title-"+room_id).on("click", function(){
    if($("#chatroom-content-"+this.room_id)[0].style.visibility=="hidden") {
      $("#chatroom-content-"+this.room_id)[0].style.visibility="inherit";
      $("#chatroom-container-"+this.room_id)[0].style.height="350px";
      $("#chatroom-container-"+this.room_id)[0].style.marginTop="4px";
      $("#chatroom-content-"+this.room_id)[0].style.bottom="0";
    }else {
      $("#chatroom-content-"+this.room_id)[0].style.visibility="hidden";
      $("#chatroom-container-"+this.room_id)[0].style.height="20px";
      $("#chatroom-container-"+this.room_id)[0].style.marginTop="334px";
    }
  });
  $("#chatroom-close-button-"+room_id)[0].room_id = room_id;    
  $("#chatroom-close-button-"+room_id).on("click", function(){
    closeChat(this.room_id);
  });
}

function connectionTimer(room_id, message){
  connectionTimerClear(room_id);
  ping_timer[room_id] = setTimeout(function(){
    printSystemMessage(room_id, message)
    disconnectChat(room_id);
    nyuru(room_id);
  },3000);
}

function printSystemMessage(room_id, message){
  var div = $("<div>", {class: 'chatroom-sysmessage',html:message});
  div.appendTo("#chat-index-"+room_id);
}

function connectionTimerClear(room_id){
  clearTimeout(ping_timer[room_id]);
}


// TODO チャット終了時に相手にNotify

function nyuru(room_id) {
  // にゅるっとする
  if ($('#chat-index-'+room_id)[0] != undefined) {
    $('#chat-index-'+room_id).animate({
      scrollTop: $('#chat-index-'+room_id)[0].scrollHeight
    }, { duration: "normal", easing: "swing"});
}
}

function subscribeNotificationChannel(id) {
  my_id = id;
  if(notification_channel != undefined) {
    return;
  }
  notification_channel = App.cable.subscriptions.create(
    {"channel":"ChatChannel","channel_id":createChannelId2(my_id,0)}, {
    connected: function() {
      // Called when the subscription is ready for use on the server
      console.log("Subscribe notification channel:"+my_id);
    },

    disconnected: function() {
      // Called when the subscription has been terminated by the server
      console.log("Disconnected from notification channel:"+my_id);
    },

    received: function(data) {
      var friend_id = data['friend_id'];
      console.log("Notified from "+friend_id);      
      var room_id = my_id<friend_id?my_id+"-"+friend_id:friend_id+"-"+my_id;
      if(chatroom_list[room_id] != undefined) {
        changeChatInputStatus(room_id, false);
        chatroom_list[room_id].post({"message":"","user_id":my_id,"room_id":room_id,"type":"pong"});
        return;
      }
      console.log("Resume chat by friend's start chat.");
      startChat(friend_id,true);
      if(chatroom_list[room_id] != undefined) {
        chatroom_list[room_id].post({"message":"","user_id":my_id,"room_id":room_id,"type":"pong"});
      }
    },

    post: function(message) {
      return this.perform('post', { message: message });
    }
  });
}

function closeChat(room_id){
  disconnectChat(room_id);
  var container = $("#chatroom-container-"+room_id)[0];
  container.parentNode.removeChild(container);
}

function disconnectChat(room_id) {
  if(chatroom_list[room_id] != undefined) {
    chatroom_list[room_id].unsubscribe();
    delete chatroom_list[room_id];
  }
  changeChatInputStatus(room_id, true);
}

function changeChatInputStatus(room_id, disabled) {
  var chatInput = $('#chat-input-'+room_id);
  if(chatInput[0] != undefined) {
    if(disabled) {
      chatInput[0].disabled = true;
      chatInput[0].style.backgroundColor = "#888";
    }else {
      chatInput[0].disabled = false;
      chatInput[0].style.backgroundColor = "#fff";
    }
  }
}

function createChannelId(my_id, friend_id) {
  return Math.random()+":"+my_id+":"+friend_id;
}

function createChannelId2(my_id, friend_id) {
  return xorEncode(Math.random()+":"+my_id+":"+friend_id);
}

function xorEncode(text) {
  return btoa(xorString(text));
}

function xorDecode(text) {
  return xorString(atob(text));
}

function xorString(text) {
  var key = "S3cUR1Ty_k3Y1234";
  var output = [];
  var keyIndex = 0;
  for(var i=0; i<text.length; ++i) {
    output[i] = String.fromCharCode(text[i].charCodeAt(0) ^ key[keyIndex].charCodeAt(0));
    keyIndex = (keyIndex + 1) % key.length;
  }
  return output.join("");
}