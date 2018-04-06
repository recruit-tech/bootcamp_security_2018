class RepliesController < ApplicationController
  before_action :authenticate_user!

  def create
    answer = Reply.create reply: params[:reply], feed_id: params[:feed_id], user_id: @current_user.id
    render json: {errors: answer.errors.full_messages}, status: :bad_request and return if answer.errors.any?
    redirect_to "/"
  end
end
