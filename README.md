# Bad SNS

This is a significant vulnerable SNS web application made with Ruby on Rails.

The product is meant for educational purposes only.
DO NOT use any portion of the code for production.

このWebアプリは、脆弱性を多く含むRuby on Railsで作られたSNS風のアプリケーションです。

教育用の用途でのみ利用してください。製品の一部としてのコードの流用は厳禁です。

## Build

    $ docker build -t local/bcsec2018 .

## Run

    $ docker run --privileged -d --rm -p 10080:80 --name bcsec2018 local/bcsec2018

## Web

http://localhost:10080/

## その他

チャット機能がちょっと不安定かもしれません。動作がおかしい時は再ログインやリロードをして再度試してみてください。
