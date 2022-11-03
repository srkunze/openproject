class RemoveIsDefaultFromStatuses < ActiveRecord::Migration[7.0]
  def change
    remove_column :statuses, :is_default, :boolean
  end
end
