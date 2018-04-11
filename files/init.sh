#!/bin/bash
ln -s /etc/apparmor.d/usr.sbin.mysqld /etc/apparmor.d/disable/
apparmor_parser -R /etc/apparmor.d/usr.sbin.mysqld
mkdir /var/run/mysqld
chown -R mysql:mysql /var/lib/mysql /var/run/mysqld
mysql_install_db --datadir=/var/lib/mysql --user=mysql
systemctl start mysql
cd /var/www/app/sns/;
rake db:create RAILS_ENV=production
rake db:reset RAILS_ENV=production
chown www-data:www-data /var/www/app/sns/db/production.sqlite3
mysql -u root -ptoor -D bad_sns_production < /root/bad_sns_production.sql
systemctl daemon-reload
export LC_ALL="en_US.UTF-8"
bundle exec unicorn_rails -c config/unicorn.rb -E production -D


