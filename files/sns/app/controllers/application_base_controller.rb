class ApplicationBaseController < ActionController::Base
  protect_from_forgery with: :exception

  private
  
  def authenticate_user!
    @current_user = User.find_by(id: session[:id])
    render :nothing => true, :status => :forbidden and return if @current_user.nil?
  end
end
