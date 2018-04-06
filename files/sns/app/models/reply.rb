class Reply < ApplicationRecord
  belongs_to :feed
  belongs_to :user
  validates :feed_id, presence: true
  validates :user_id, presence: true
  validates :reply, length: { maximum: 140 }

end
