#-- copyright
# OpenProject is an open source project management software.
# Copyright (C) 2012-2023 the OpenProject GmbH
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License version 3.
#
# OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
# Copyright (C) 2006-2013 Jean-Philippe Lang
# Copyright (C) 2010-2013 the ChiliProject Team
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
#
# See COPYRIGHT and LICENSE files for more details.
#++

require 'spec_helper'
require_relative 'support/board_index_page'

RSpec.describe 'Work Package Project Boards Index Page',
               :js,
               :with_cuprite,
               with_ee: %i[board_view] do
  # The identifier is important to test https://community.openproject.com/wp/29754
  shared_let(:project) { create(:project, identifier: 'boards', enabled_module_names: %i[work_package_tracking board_view]) }

  shared_let(:management_permissions) do
    %i[show_board_views manage_board_views add_work_packages view_work_packages manage_public_queries]
  end
  shared_let(:view_only_permissions) do
    %i[show_board_views add_work_packages view_work_packages]
  end

  shared_let(:priority) { create(:default_priority) }
  shared_let(:status) { create(:default_status) }

  let(:user) do
    create(:user,
           member_in_project: project,
           member_through_role: role)
  end
  let(:permissions) { management_permissions }
  let(:role) { create(:role, permissions:) }

  let(:board_view) { create(:board_grid_with_query, name: 'My board', project:) }
  let(:other_board_view) { create(:board_grid_with_query, name: 'My other board', project:) }

  let(:board_index) { Pages::BoardIndex.new(project) }

  before do
    login_as user
  end

  context 'as a user with board management permissions' do
    let(:permissions) { management_permissions }

    it 'shows a create button' do
      board_index.visit!

      board_index.expect_create_button
    end
  end

  context 'as a user without board management permissions' do
    let(:permissions) { view_only_permissions }

    it 'does not show a create button' do
      board_index.visit!

      board_index.expect_no_create_button
    end
  end

  context 'when no boards exist' do
    it 'displays the empty message' do
      board_index.visit!

      board_index.expect_no_boards_listed
    end
  end

  context 'when boards exist' do
    before do
      board_view
      other_board_view
    end

    it 'lists the boards' do
      board_index.visit!

      board_index.expect_boards_listed(board_view, other_board_view)
    end

    context 'as a user with board management permissions' do
      let(:permissions) { management_permissions }

      it 'renders delete links for each board' do
        board_index.visit!

        board_index.expect_delete_button(board_view)
        board_index.expect_delete_button(other_board_view)
      end
    end

    context 'as a user without board management permissions' do
      let(:permissions) { view_only_permissions }

      it 'does not render delete links' do
        board_index.visit!

        board_index.expect_no_delete_button(board_view)
        board_index.expect_no_delete_button(other_board_view)
      end
    end

    it 'paginates results', with_settings: { per_page_options: '1' } do
      # First page displays the historically last meeting
      board_index.visit!
      board_index.expect_boards_listed(board_view)
      board_index.expect_boards_not_listed(other_board_view)

      board_index.expect_to_be_on_page(1)

      board_index.to_page(2)
      board_index.expect_boards_listed(other_board_view)
      board_index.expect_boards_not_listed(board_view)
    end
  end
end
