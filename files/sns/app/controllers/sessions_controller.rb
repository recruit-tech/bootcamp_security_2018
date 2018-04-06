class SessionsController < ApplicationController
  before_action :authenticate_user!, only: [:clear]

  def create
    begin
      # 2018/04/05 harupu Fixed SQL Injection vulnerability
      user = User.find_by(login_id: params[:login_id], pass:  Digest::SHA256.hexdigest(params[:pass]))
      token = log_in user
      render json: {id: user.id, name: user.name, icon: icon_user_path(user), token: token} and return
    rescue
      render json: {errors: ['ログインに失敗しました']}, status: :bad_request and return
    end
  end

  def clear
    log_out
    render json: {} and return
  end
end