# Bad SNS

This is a significant vulnerable SNS web application made with Ruby on Rails.

The product is meant for educational purposes only.
DO NOT use any portion of the code for production.

このWebアプリは、脆弱性を多く含むRuby on Railsで作られたSNS風のアプリケーションです。

教育用の用途でのみ利用してください。製品の一部としてのコードの流用は厳禁です。

## Install

    $ git clone https://github.com/recruit-tech/bootcamp_secuirty_2018.git
    $ cd bootcamp_secuirty_2018
    $ docker build -t local/bcsec2018 .
    $ docker run --privileged -d --rm -p 10080:80 --name bcsec2018 local/bcsec2018

