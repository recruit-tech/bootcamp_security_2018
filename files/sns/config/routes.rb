Rails.application.routes.draw do

#              Prefix Verb   URI Pattern                    Controller#Action
#      clear_sessions DELETE /sessions(.:format)            sessions#clear
#            sessions POST   /sessions(.:format)            sessions#create
#           icon_user GET    /users/:id/icon(.:format)      users#icon
#               users POST   /users(.:format)               users#create
#             friends GET    /friends(.:format)             friends#index
#             friends GET    /friends/:id(.:format)         friends#show
#                     POST   /friends(.:format)             friends#create
#               icons POST   /icons(.:format)               icons#create
#                     POST   /answers(.:format)             answers#create
#       find_new_feed GET    /feeds/:id/find_new(.:format)  feeds#find_new
#       find_old_feed GET    /feeds/:id/find_old(.:format)  feeds#find_old
#               feeds GET    /feeds(.:format)               feeds#index
#                     POST   /feeds(.:format)               feeds#create

  resources :sessions, only: [:create, :clear] do
    collection do
      delete '', to: "sessions#clear", as: 'clear'
    end
  end

  resources :users, only: [:create, :icon] do
    member do
      get 'icon'
    end
  end

  resources :friends, only: [:index, :create, :show] do
  end

  resources :icons, only: [:create] do
  end

  resources :replies, only: [:create] do
  end

  resources :feeds, only: [:index, :create, :find_new, :find_old] do
    member do
      get 'find_new'
      get 'find_old'
    end
  end

  resources :chat, only: [:index] do
  end
end
