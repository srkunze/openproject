class AddInitialStatusToTypes < ActiveRecord::Migration[7.0]
  def change
    add_reference :types, :initial_status, foreign_key: { to_table: :statuses }
  end
end
