#!/bin/bash
cd /var/www/app/sns/;
rake db:create RAILS_ENV=production
rake db:reset RAILS_ENV=production
chown www-data:www-data /var/www/app/sns/db/production.sqlite3
mysql -u root -ptoor -D bad_sns_production < /root/bad_sns_production.sql
systemctl daemon-reload
export LC_ALL="en_US.UTF-8"
bundle exec unicorn_rails -c config/unicorn.rb -E production -D


