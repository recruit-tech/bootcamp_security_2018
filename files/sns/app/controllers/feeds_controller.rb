class FeedsController < ApplicationController
  before_action :authenticate_user!

  def create
    case params[:feed_type]
      when 'text'
        feed = @current_user.feed.create feed_type: 'text', comment: params[:comment]
        render json: {errors: feed.errors.full_messages}, status: :bad_request and return if feed.errors.any?
      when 'image'
        begin
          img = Magick::Image.from_blob(File.read params[:image].tempfile).shift
          exif = "#{img.properties['exif:Make']||=''} #{img.properties['exif:Model']||=''}"
          img.format = "JPEG"
          img.resize_to_fit!(500, 500)
          feed = @current_user.feed.create feed_type: 'image', exif: exif, image_file_name: 'default.png'
          image_file_name = "#{feed.id}.jpg"
          img.write "#{Rails.root}/public/images/#{image_file_name}"
          feed.update image_file_name: image_file_name
          render json: {errors: feed.errors.full_messages}, status: :bad_request and return if feed.errors.any?
        rescue
          render json: {errors: ['画像の投稿に失敗しました']}, status: :bad_request and return
        end
      else
        render json: {errors: ['Feed種別が正しくありません']}, status: :bad_request and return
    end
    render json: {} and return
  end

  def index
    feeds = Feed.joins(:user).where(user_id: scope_user_ids).select('feeds.*,users.name').order('id DESC').limit(30)
    feed_ids = list_feed_ids feeds
    replies = Reply.joins(:user).where(feed_id: feed_ids).select('replies.*,users.name').order('updated_at ASC')
    render json: {count: feeds.count, feeds: feeds, replies: replies} and return
  end

  def find_new
    feeds = Feed.joins(:user).where(user_id: scope_user_ids).where("feeds.id > ?", params[:id].to_i).select('feeds.*,users.name').order('id DESC')
    feed_ids = list_feed_ids feeds
    replies = Reply.joins(:user).where(feed_id: feed_ids).select('replies.*,users.name').order('updated_at ASC')
    render json: {count: feeds.length, feeds: feeds, replies: replies} and return if params[:include_items] == '1'
    render json: {count: feeds.length} and return
  end

  def find_old
    feeds = Feed.joins(:user).where(user_id: scope_user_ids).where("feeds.id < ?", params[:id].to_i).select('feeds.*,users.name').order('id DESC').limit(30)
    feed_ids = list_feed_ids feeds
    replies = Reply.joins(:user).where(feed_id: feed_ids).select('replies.*,users.name').order('updated_at ASC')
    render json: {count: feeds.length, feeds: feeds, replies: replies} and return if params[:include_items] == '1'
    render json: {count: feeds.length} and return
  end

  private

  def list_feed_ids (feeds)
    res = Array.new
    feeds.each do |x|
      res.push(x.id)
    end
    return res
  end

  def scope_user_ids
    ids = @current_user.friends_from_user_ids + @current_user.friends_to_user_ids + [@current_user.id]
    ids.uniq
  end
end
