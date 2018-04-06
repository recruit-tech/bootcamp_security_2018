class CreateAnswers < ActiveRecord::Migration[5.1]
  def change
    create_table :answers do |t|
      t.integer :feed_id
      t.integer :user_id
      t.string :reply
      t.timestamps
    end
  end
end
