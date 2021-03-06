# frozen_string_literal: true
require 'europeana/styleguide/version'
require 'europeana/styleguide/engine' if defined?(Rails)

module Europeana
  module Styleguide
    autoload :View, 'europeana/styleguide/view'

    extend ActiveSupport::Concern

    included do
      if respond_to?(:prepend_view_path)
        prepend_view_path(File.expand_path('../../../app/views', __FILE__))
        prepend_view_path('app/views')
      end

      if respond_to?(:layout)
        layout false
      end
    end
  end
end
