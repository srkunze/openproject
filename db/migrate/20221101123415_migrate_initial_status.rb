class MigrateInitialStatus < ActiveRecord::Migration[7.0]
  def up
    execute <<~SQL.squish
      UPDATE types SET initial_status_id = (SELECT id FROM statuses WHERE is_default=true);
    SQL
  end
end
