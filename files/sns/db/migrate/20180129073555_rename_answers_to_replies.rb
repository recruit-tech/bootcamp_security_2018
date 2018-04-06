class RenameAnswersToReplies < ActiveRecord::Migration[5.1]
  def change
    rename_table :answers, :replies
  end
end
