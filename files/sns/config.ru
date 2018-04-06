# This file is used by Rack-based servers to start the application.

require_relative 'config/environment'

# example.comのサブドメインからの接続は許可する
# ActionCable.server.config.allowed_request_origins=[/https?:\/\/(.*\.)?example\.com/,/https?:\/\/localhost/]

run Rails.application
