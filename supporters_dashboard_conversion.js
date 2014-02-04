#= require 'models/supporter'
#= require 'models/nonprofit'
#= require 'lib/Chart.min'
#= require 'lib/page'

var nonprofit_dashboard = Machine();

class NonprofitDashboard

	constructor: (data) ->
		@nonprofit_id = data.nonprofit_id
		@supporters = []
		@el = $('#supporter-table')
		@query =
			order_field: 'total_raised'
			order_direction: 'DESC'
		@populate_table =>
			@list_tags()
		@events()
	
	events: ->
		# Search supporters
		@el.delegate '#supporter-search', 'keyup', @search
		# Remove search string
		@el.delegate '.search i.icon-remove', 'click', @clear_search
		# Select supporters
		@el.delegate '.data-row .checkbox', 'click', @toggle_checkbox
		@el.delegate '#checkbox-all', 'click', @mass_selection
		# Open and close the details for a supporter
		@el.delegate '.data-row .data', 'click', @toggle_supporter_details
		@el.delegate '.details-row .slide-up-button', 'click', @toggle_supporter_details
		# Save the fields for a supporter
		@el.delegate '.details-row form input, .details-row form textarea', 'keyup', @field_enter_or_delay
		# Add fields for a supporter
		@el.delegate '.new-field', 'click', @show_new_field
		# Add a new tag for a supporter
		@el.delegate '.add-tag-button', 'click', @show_new_tag
		@el.delegate '.new-tag', 'keyup', @save_tag
		# Remove tags on supporters
		@el.delegate '.remove-tag-button', 'click', @remove_tag
		# Filter the table by tags
		@el.delegate '.tag-select', 'click', @toggle_tag
		# Add a new supporter
		@el.delegate '#add-supporter-button, #cancel-new-supporter-button', 'click', @toggle_new_supporter
		@el.delegate '#create-new-supporter-button', 'click', @create_supporter
		# Sort the supporters
		@el.delegate '#sort-arrow-asc, #sort-arrow-desc', 'click', @toggle_sort_direction
		@el.delegate '.sort-select', 'click', @change_sort_field
		# Remove a custom field
		@el.delegate '.remove-field-button', 'click', @remove_field
	
	change_sort_field: (e) =>
		e.preventDefault()
		selected_el = $(e.currentTarget)
		previous_el = @el.find('#sort-field-select')
		selected_text = selected_el.text()
		previous_text = previous_el.text()
		selected_field = selected_el.data('field')
		previous_field = previous_el.data('field')
		selected_el.text(previous_text)
		previous_el.text(selected_text)
		selected_el.data('field', previous_field)
		previous_el.data('field', selected_field)
		@query['order_field'] = selected_field
		@populate_table()

	toggle_sort_direction: (e) =>
		e.preventDefault()
		$('#sort-arrow-asc, #sort-arrow-desc').removeClass('selected')
		$(e.currentTarget).addClass('selected')
		@query['order_direction'] = $(e.currentTarget).data('direction')
		@populate_table()
	
	create_supporter: (e) =>
		e.preventDefault()
		data = $(e.currentTarget).parents('form').serializeObject()
		data = _.extend(data, {nonprofit_id: @nonprofit_id})
		Supporter.create {supporter: data}, (response) =>
			if response.success
				$('#new-supporter').hide()
				@prepend_new_supporter(response.data)
			else
				console.log("errrrrror")
				console.log(response.message)

	toggle_new_supporter: (e) =>
		e.preventDefault()
		$('#new-supporter').slideToggle()
		$('#new-supporter form input[name="name"]').select()

	remove_tag: (e) =>
		e.preventDefault()
		tag_id = $(e.currentTarget).data('id')
		div = $(e.currentTarget).parents('.data-row')
		supporter_id = div.data('id')
		Supporter.remove_tag @nonprofit_id, supporter_id, tag_id, (response) =>
			@rerender_open_supporter div, response.data
	
	remove_field: (e) =>
		e.preventDefault()
		div = $(e.currentTarget).parents('.data-row')
		supporter_id = div.data('id')
		row = $(e.currentTarget).parents('.field')
		key = row.find('.key').text()
		data = {supporter: {remove_field: key}}
		Supporter.save @nonprofit_id, supporter_id, data, (response) =>
			if response.success
				row.remove()
			else
				console.log('could not remove that field, bro')

	show_new_field: (e) =>
		e.preventDefault()
		div = $(e.currentTarget).parents('.data-row')
		supporter_id = div.data('id')
		new_field = div.find('.new-field-form-template').clone()
		new_field.removeClass('new-field-form-template').addClass('new-field-form')
		div.find('.custom-fields').prepend(new_field.show())

		new_field.fadeIn()
		new_field.find('.key').select()
	
	field_enter_or_delay: (e) =>
		$(e.currentTarget).addClass('selected')
		@el.find('.saved-message, .error-message').hide()
		if e.which is 13
			@save_fields(e)
		else
			utils.delay 2500, () =>
				@save_fields(e)

	save_fields: (e) =>
			field_id = $(e.currentTarget).attr('id')
			console.log(field_id)
			div = $(e.currentTarget).parents('.data-row')
			loader = div.find('.loading-indicator').show()
			supporter_id = div.data('id')
			data = div.find('.left form').serializeObject()
			Supporter.save @nonprofit_id, supporter_id, {supporter: data}, (response) =>
				$(e.currentTarget).removeClass('selected')
				if response.success
					loader.hide()
					div.find('.saved-message').show()
					@update_supporter_header(div, response.data)
				else
					div.find('.error-message').text(response.message).show()

	update_supporter_header: (div, data) =>
		div.find('h4 a').text(data.name)
		div.find('.location a').text(data.location)

	toggle_tag: (e) =>
		e.preventDefault()
		tag_el = $(e.currentTarget)
		tag_name = tag_el.find('.tag-name').text()
		@query['tags'] ?= []
		if tag_name.replace(/[ ]/g, '') is 'all'
			@query['tags'] = []
			$('.tag-select.selected').removeClass('selected').data('selected', 'false')
			tag_el.addClass('selected')
		else
			@el.find('#tag-select-all').removeClass('selected')
			if tag_el.data('selected') is 'true'
				tag_el.removeClass('selected')
				tag_el.data('selected', 'false')
				@query['tags'] = _.without(@query['tags'], tag_name)
				if @el.find('.tag-select.selected').length is 0
					@el.find('#tag-select-all').addClass('selected')
			else
				tag_el.addClass('selected')
				tag_el.data('selected', 'true')
				@query['tags'].push(tag_name)
		@populate_table()

	save_tag: (e) =>
		if e.which is 13
			tag = $(e.currentTarget).val()
			data = {supporter: {tags_attributes: [{name: tag}]}}
			Supporter.save @nonprofit_id, @supporter_id, data, (response) =>
				if response.success
					div = $(e.currentTarget).parents('.data-row')
					@rerender_open_supporter div, response.data
				else
					console.log('Could not save that tag, bro')

	show_new_tag: (e) =>
		e.preventDefault()
		div = $(e.currentTarget).parents('.details-tags').find('.tag-listing')
		input = div.find('.new-tag-template').clone().removeClass('new-tag-template').addClass('new-tag')
		div.prepend(input)
		input.hide().fadeIn().select()

	construct_opened_supporter: (data) ->
		template = _.template($('#supporter-table-row-template').html())
		new_el = $(template(data))
		@supporter_id = data.id
		new_el.find('.details-row').show()
		new_el.addClass('opened').data('shown', 'true')

	prepend_new_supporter: (data) =>
		el = @construct_opened_supporter(data)
		el.hide()
		$('#supporter-listing').prepend(el)
		el.slideDown()

	rerender_open_supporter: (div, data) =>
		el = @construct_opened_supporter(data)
		div.replaceWith(el)
		@list_tags()
		return el
	
	clear_search: (e) =>
		@el.find('#supporter-search').val('')
		@query['search'] = ''
		@populate_table()
	
	search: (e) =>
		if e.which is 13
			@query['search'] = $(e.target).val()
			@populate_table()

	mass_selection: (e) =>
		box = $(e.currentTarget)
		if box.data('selected') is 'true'
			box.data('selected', 'false').removeClass('selected')
			@select_none()
		else # deselected
			box.data('selected', 'true').addClass('selected')
			@select_all()
		@toggle_master()
	
	select_all: =>
		@el.find('.data-row .checkbox').addClass('selected').data('selected', 'true')
	
	select_none: =>
		@el.find('.data-row .checkbox').removeClass('selected').data('selected', 'false')

	toggle_checkbox: (e) =>
		box = $(e.currentTarget)
		if box.data('selected') is 'true'
			box.removeClass('selected').data('selected', 'false')
		else
			box.addClass('selected').data('selected', 'true')
		@toggle_master()
	
	toggle_master: =>
		box = @el.find('#checkbox-all')
		if @all_selected()
			box.data('selected', 'true').addClass('selected')
			box.find('i').removeClass('icon-minus').addClass('icon-ok')
		else if @any_selected()
			box.data('selected', 'true').addClass('selected')
			box.find('i').addClass('icon-minus').removeClass('icon-ok')
		else
			box.data('selected', 'false').removeClass('selected')
	
	all_selected: =>
		return @el.find('.data-row .checkbox').length is
			@el.find('.data-row .checkbox.selected').length
	
	any_selected: =>
		return @el.find('.data-row .checkbox.selected').length > 0

	toggle_supporter_details: (e) =>
		div = $(e.currentTarget).parents('.data-row')
		details = div.find('.details-row')
		if div.data('shown') is 'true' # then hide details
			div.removeClass('opened')
			details.slideUp ->
				div.data('shown', 'false')
		else # show details
			@supporter_id = div.data('id')
			div.addClass('opened')
			details.slideDown ->
				div.data('shown', 'true')

	populate_table: (callback) ->
		@toggle_loader()
		Supporter.index @nonprofit_id, @query, (response) =>
			@toggle_loader()
			if response.success
				@supporters = response.data
				@render_table()
				if callback then callback()
			else
				console.log 'could not fetch supporters'

	render_table: ->
		body = @el.find('#supporter-listing')
		compiled = _.template($("#supporter-table-row-template").html())
		body.html('')
		_.each @supporters, (s) =>
			body.append(compiled(s)).hide().fadeIn()

	toggle_loader: ->
		el = @el.find('#loading-message')
		if el.data('shown') is 'true'
			el.hide()
			el.data('shown', 'false')
		else
			messages = ['wrangling the hamsters', 'cogitating', 'underwater spelunking', 'gathering a million monkeys', 'daydreaming', 'mulling it over', 'spinning the wheels']
			rn = _.random(0, messages.length - 1)
			el.find('span').text(messages[rn]).fadeIn()
			el.show()
			el.data('shown', 'true')

	list_tags: ->
		index = $('#tag-index')
		Nonprofit.tags @nonprofit_id, (response) =>
			if response.success
				$('#overall-tag-total').text(@supporters.length)
				index.html('')
				_.each response.data, (tag) ->
					new_el = $('#tag-select-template').clone()
					new_el.find('.tag-name').text(tag[0])
					new_el.find('.tag-total').text(tag[1])
					index.append(new_el.show())

jQuery ->

	nonprofit_id = $('#nonprofit-title').data('id')
	table = new NonprofitDashboard({nonprofit_id: nonprofit_id})
