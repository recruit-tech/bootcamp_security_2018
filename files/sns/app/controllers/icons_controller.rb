class IconsController < ApplicationController
  def create
    file_name = params[:image].original_filename.downcase
    mime_type = params[:image].content_type.downcase
    if !!file_name.match(/png|jpeg|jpg|gif/) and mime_type.start_with? 'image/'
      dest_file_name = "#{SecureRandom.uuid}#{File.extname(file_name)}"
      image_path = "#{Rails.root}/public/icons/#{dest_file_name}"
      FileUtils.mv params[:image].tempfile, image_path
      FileUtils.chmod 0644, image_path
      if px = params[:resize_max_pixel]
        # 2018/04/05 harupu Fixed critical vulnerability :-)
        # `convert -resize #{px}x#{px} #{image_path} #{image_path}`
        px.gsub!(/"/, '\"')
        image_path.gsub!(/"/, '\"')
        `convert -resize "#{px}x#{px}" "#{image_path}" "#{image_path}"`
      end
      render json: {file_name: dest_file_name} and return
    else
      render json: {errors: ['アイコンの登録に失敗しました']}, status: :bad_request and return
    end
  end
end