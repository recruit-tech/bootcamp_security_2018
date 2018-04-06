'use strict';

var latestFeedId = 0;
var oldestFeedId = 0;

document.addEventListener('DOMContentLoaded', () => {

  (function init() {
    if(!localStorage.getItem('name')) {
      // ログイン・ユーザ登録画面表示
      $('#modal-login').modal({keyboard: false, backdrop: 'static'}).modal('show');
      $$('footer-login').addEventListener('click', () => {
        $$('header-login').textContent = '新規ユーザ登録';
        $$('footer-login').style.visibility = 'hidden';
      });
    } else {
      // メイン画面
      $$('form-text-feed').reset();
      $$('img-profile').src = localStorage.getItem('icon');
      $$('span-self').textContent = localStorage.getItem('name');
      $$('div-new-feeds').style.display = 'none';
      $$('div-old-feeds').style.display = 'none';
      loadInitialFeeds();
      loadFriendList();
      document.body.removeChild($$('mask'));
      //Notification channelの購読
      subscribeNotificationChannel(localStorage.getItem('id'));
      setInterval(loadNewFeeds, 600000);
    }
  })();

  // ログアウトボタン
  $$('button-logout').addEventListener('click', function(e) {
    let process = result => {
      localStorage.removeItem('name');
      localStorage.removeItem('icon');
      localStorage.removeItem('id');
      top.location = '/'; // ログイン画面を表示
    }
    fetcher('/sessions', {method: 'DELETE'}, process);
  });

  // 友達一覧取得
  function loadFriendList() {
    let process = result => {
      if (result.friends && result.friends.length > 0) {
        $$('div-chat-list').appendChild(createFriendListFragment(result.friends));
      }
    }
    fetcher('/friends', {method: 'GET'}, process);
  }

   // フィードのDOM生成
   function createFriendListFragment(friends) {
    var tmpl = `
    <div class='friends' id='id'>
      <div class='container'>
        <div class='media'>
          <div class='pull-left'><img class='media-object' id='icon'></div>
          <div class='text'>
            <div class='name' id='name'></div>
            <small class='datetime' id='time'></small>
          </div>
        </div>
    </div>`;
    var fragment = document.createDocumentFragment();

    for (var i = 0; i < friends.length; i++) {
      if(friends[i].id == my_id) {continue;}
      var range = document.createRange();
      range.selectNode(document.body);
      var cf = range.createContextualFragment(tmpl);
      cf.getElementById('id').onclick = function(){
        startChat(this.id.replace("friend_",""),false);
      };
      cf.getElementById('id').id = "friend_"+friends[i].id;
      cf.getElementById('icon').src = `/icons/${friends[i].icon_file_name}`;
      cf.getElementById('name').textContent = friends[i].name;
      fragment.appendChild(cf);
    }
    return fragment;
  }

  // 友達登録ボタン
  $$('form-add-user').addEventListener('submit', (event) => {
    event.preventDefault();
    let body = new FormData();
    body.append('login_id', $$('input-login-id').value);
    let process = result => {
      if (result.errors) {
        // 友達登録失敗
        $$('div-errors-add-friend').innerHTML = '';
        result.errors.forEach(value => $$('div-errors-add-friend').innerHTML += `<p class="bg-danger text-danger">${value}</p>` );
      } else {
        // 友達登録成功
        // top.location = '/'; // メイン画面を再読み込み
        $$('div-feeds').innerHTML="";
        loadInitialFeeds();
      }
      //友達一覧を更新
      $$('div-chat-list').innerHTML="";
      loadFriendList();
    }
    fetcher('/friends', {method: 'POST', body: body}, process);
  });

  // 友達検索ボタン
  $$('form-search-user').addEventListener('submit', (event) => {
    event.preventDefault();
    let body = new FormData();
    body.append('login_id', $$('input-login-id').value);
    let process = result => {
        // 検索結果
        $$('div-results-search-friend').innerHTML = '';
        for (var counter in result.friends) {
          var value = result.friends[counter];
          $$('div-results-search-friend').innerHTML += `<div class="user-search-result"><img src="/users/${value.id}/icon"> ${value.name} <form class="form-search-add-user"><input type="hidden" name="login_id" value="${value.login_id}"><input type="submit" class="btn btn-primary" value="追加"></form></div>`;
        }

        var forms = document.getElementsByClassName("form-search-add-user");
        for (var counter=0; counter<forms.length; ++counter) {
          var value = forms[counter];
          console.log(value);
          value.onsubmit = function (event) {
            event.preventDefault();
            var login_id = this.login_id;
            let body = new FormData();
            body.append('login_id', login_id.value);
            let process = result => {
              $$('div-feeds').innerHTML="";
              loadInitialFeeds();
              //友達一覧を更新
              $$('div-chat-list').innerHTML="";
              loadFriendList();
            }
            fetcher('/friends', {method: 'POST', body: body}, process);
            return false;
          }
        }

      }
    fetcher('/friends/'+$$('input-search-user').value+"?order=name+asc", {method: 'GET'}, process);
  });

  // テキストフィード投稿
  $$('form-text-feed').addEventListener('submit', (event) => {
    // テキストが入力されていなければ投稿しない
    if(!$$('input-text-feed').value.length) return;
    event.preventDefault();
    let body = new FormData();
    body.append('comment', $$('input-text-feed').value);
    body.append('feed_type', 'text');
    $$('input-text-feed').value = "";
    //let process = result => top.location = '/'; // メイン画面を再読み込み
    let process = result => {
      $$('div-feeds').innerHTML="";
      loadInitialFeeds();
    }
    fetcher('/feeds', {method: 'POST', body: body}, process);
  });

  // 画像フィード投稿
  $$('div-image-drop').addEventListener('dragover', (event) => {
    event.preventDefault();
  });
  $$('div-image-drop').addEventListener('drop', (event) => {
    event.preventDefault();
    $$('div-image-drop').textContent = '画像アップロード中';
    $$('div-image-drop').classList.add('drop-zone-droped');

    let body = new FormData();
    body.append('image', event.dataTransfer.files[0]);
    body.append('feed_type', 'image');
    let process = result => {
      if(result.errors) {
        $$('div-image-drop').textContent = 'ここに画像をドロップ';
        $$('div-image-drop').classList.remove('drop-zone-droped');
        result.errors.forEach(value => alert(value));
      } else {
        // top.location = '/'; // メイン画面を再読み込み
        $$('div-feeds').innerHTML="";
        loadInitialFeeds();
      }
    }
    fetcher('/feeds', {method: 'POST', body: body}, process);
  });


  // 初期フィード取得
  function loadInitialFeeds() {
    let process = result => {
      if (result.feeds && result.feeds.length > 0) {
        latestFeedId = result.feeds[0].id;
        oldestFeedId = result.feeds[result.feeds.length-1].id;
        $$('div-feeds').appendChild(createFeedFragment(result.feeds, result.replies));
        setTimeout(loadOldFeeds, 1000);
      }
    }
    fetcher('/feeds', {method: 'GET'}, process);
  }

  // 新着フィード取得ボタン
  $$('button-load-new').addEventListener('click', (event) => {
    event.preventDefault();
    loadNewFeeds(true);
  });

  // 過去フィード取得
  function loadNewFeeds(withItems=false) {
    let url = `/feeds/${latestFeedId}/find_new`;
    if(withItems) url += '?include_items=1';
    let process = result => {
      if(result.count > 0) {
        $$('span-new-feed-count').textContent = result.count;
        $$('div-new-feeds').style.display = 'block';
        if (result.feeds && result.feeds.length > 0) {
          latestFeedId = result.feeds[0].id;
          $$('div-feeds').prependChild(createFeedFragment(result.feeds, result.replies));
          $$('span-new-feed-count').textContent = 0;
          $$('div-new-feeds').style.display = 'none';
        }
      } else {
        $$('span-new-feed-count').textContent = 0;
        $$('div-new-feeds').style.display = 'none';
      }
    }
    fetcher(url, {method: 'GET'}, process);
  }

  // 過去フィード取得ボタン
  $$('button-load-old').addEventListener('click', (event) => {
    event.preventDefault();
    loadOldFeeds(true);
  });

  // 過去フィード取得
  function loadOldFeeds(withItems=false) {
    let url = `/feeds/${oldestFeedId}/find_old`;
    if(withItems) url += '?include_items=1';
    let process = result => {
      $$('div-old-feeds').style.display = (result.count > 0 ? 'block' : 'none');
      if (result.feeds && result.feeds.length > 0) {
        oldestFeedId = result.feeds[result.feeds.length-1].id;
        $$('div-feeds').appendChild(createFeedFragment(result.feeds, result.replies));
        $$('div-old-feeds').style.display = 'none';
        setTimeout(loadOldFeeds, 1000);
      }
    };
    fetcher(url, {method: 'GET'}, process);
  }

  function createCommentFragment(replies) {
    var tmpl = `
    <div class='reply' id='id'>
      <div class='container'>
        <div class='media'>
          <div class='pull-left' style="float:left"><img class='media-object' id='icon'></div>
          <div class='media-body' id='body'>
            <div class='baloon'>
              <span class='name' id='name'></span>:
              <span id='content'></span>
            </div>
            <small class='datetime' id='time'></small>
          </div>
        </div>
      </div>
    </div>`;
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < replies.length; i++) {
      var range = document.createRange();
      range.selectNode(document.body);
      var cf = range.createContextualFragment(tmpl);
      cf.getElementById('id').id = replies[i].id;
      cf.getElementById('icon').src = `/users/${replies[i].user_id}/icon`;
      cf.getElementById('name').textContent = replies[i].name;
      let date = new Date(replies[i].created_at);
      cf.getElementById('time').textContent = date.toLocaleString();
      cf.getElementById('content').textContent = replies[i].reply;
      fragment.appendChild(cf);
    }
    return fragment;
  }

  // フィードのDOM生成
  function createFeedFragment(feeds, replies) {
    var tmpl = `
    <div class='feed' id='id'>
      <div class='container'>
        <div class='media'>
          <div class='media-header' id='header'>
          <div class='pull-left'><img class='media-object' id='icon'></div>
          <div class='text'>
            <div class='name' id='name'></div>
            <small class='datetime' id='time'></small>
          </div>
        </div>
        <div class='media-body' id='body'>
          <span id='content'></span>
        </div>
      </div>
      <div class='replies' id='replies'></div>
      <div class='reply_box container no-padding'>
        <form role="form" id="form-reply-feed" onsubmit='return false;'>
          <div class="form-group">
            <input type="text" class="form-control" id="input-reply-feed" name="reply" placeholder="コメント">
            <input type="hidden" id="feed_id" name="feed_id" value="0">
          </div>
        </form>
      </div>
    </div>`;
    var fragment = document.createDocumentFragment();

    var replyArray = {};
    for (var i = 0; i < replies.length; i++) {
      if (replies[i]['feed_id'] in replyArray == false) {
        replyArray[replies[i]['feed_id']] = [];
      }
      replyArray[replies[i]['feed_id']].push(replies[i]);
    }

    for (var i = 0; i < feeds.length; i++) {
      var range = document.createRange();
      range.selectNode(document.body);
      var cf = range.createContextualFragment(tmpl);
      cf.getElementById('id').id = feeds[i].id;
      cf.getElementById('feed_id').value = feeds[i].id;
      cf.getElementById('icon').src = `/users/${feeds[i].user_id}/icon`;
      cf.getElementById('name').textContent = feeds[i].name;
      let date = new Date(feeds[i].created_at);
      cf.getElementById('time').textContent = date.toLocaleString();

      if(feeds[i].feed_type == 'text') {
        // テキストフィードの場合
        cf.getElementById('content').textContent = feeds[i].comment;
      } else {
        // 画像フィードの場合
        let caption = (feeds[i].exif.length > 1) ? `${feeds[i].exif}にて撮影`.replace(/[<>]+/g,'_') : '';//2018/04/06 harupu XSS対策
        cf.getElementById('content').innerHTML = `
          <img class='img-responsive img-thumbnail' src='/images/${feeds[i].image_file_name}' alt='${caption}'>
          <br><small class='exif'>${caption}</small>`;
      }

      if (feeds[i].id in replyArray) {
        let replyFragment = createCommentFragment(replyArray[feeds[i].id]);
        cf.getElementById('replies').appendChild(replyFragment);
      }

      // コメント投稿
      cf.getElementById('form-reply-feed').onsubmit = function() {
        // テキストが入力されていなければ投稿しない
        var reply = this.reply;
        var feed_id = this.feed_id;
        if(!reply.value.length) return false;
        //event.preventDefault();
        let body = new FormData();
        body.append('reply', reply.value);
        body.append('feed_id', feed_id.value);
        let process = result => {
          //alert("add_reply"); TODO XHRだけで完結する
          //top.location = '/'; // メイン画面を再読み込み
          $$('div-feeds').innerHTML="";
          loadInitialFeeds();
        }
        fetcher('/replies', {method: 'POST', body: body}, process);
        return false;
      };

      fragment.appendChild(cf);
    }
    return fragment;
  }
});
