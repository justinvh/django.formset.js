/**
 * Copyright 2013 Justin Bruce Van Horne <justinvh@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 */
var django = django || {};
django.formset = {};

/**
 * Extend, update, etc. these options which configure the data-type accessed
 * and how the selectors are pulled from a Django formset.
 */
django.formset.opts = {

    /**
     * These are the parameters that are default to any formset creation.
     */
    create_params: {
        // After a form is added this method will be called
        on_form_add: function ($formset, $form) { },

        // After a form is removed this method will be called
        on_form_remove: function ($formset, $form) { },

        // Before a form is removed this method will be called.
        // By default it is a confirmation box.
        before_form_remove: function ($formset, $form) {
            return django.formset.before_form_remove($formset, $form);
        },

        // Before a form is added this method will be called
        // By default it is a noop that returns true.
        before_form_add: function ($formset, $form) {
            return django.formset.before_form_add($formset, $form);
        },

        // There is support for jQuery sortable(). It is disabled by default.
        make_sortable: false
    },

    /**
     * These are the specific data-* attributes
     */
    data: {
        formset: 'django-formset',
        add: 'django-formset-add',
        remove: 'django-form-remove',
        order: 'django-form-order',
        priority: 'django-form-priority',
        form: 'django-form',
        initial: 'django-initial',
        prefix: 'django-prefix'
    },

    /**
     * These are the specific Django formset selectors
     */
    selectors: {
        remove: 'input[id$="DELETE"]',
        order: 'input[id$="ORDER"]'
    },

    /**
     * These are the elements and attributes updated when a form is cloned.
     */
    updateable: {
        element_selector: 'input,select,textarea,label,div',
        attributes: ['for', 'id', 'name']
    }
};


/**
 * Transforms a data attribute into an appropriate selector
 */
django.formset.data_selector = function (key) {
    var data = django.formset.opts.data;
    return '[data-' + data[key] + ']';
};

/**
 * When a user clicks delete, this method is called.
 */
django.formset.before_form_remove = function ($formset, $form) {
    return confirm('Are you sure you want to remove this form?');
};

/**
 * When a user clicks add, this method is called.
 */
django.formset.before_form_add = function ($formset, $form) {
    return true;
};

/**
 * Inner-function call for reordering properties of a formset
 */
django.formset.reorder_property = function ($input, attrs, prefix, index) {
    var search = new RegExp('(' + prefix + '-\\d+-)');
    var replace = prefix + '-' + index + '-';
    for (var i = 0; i < attrs.length; i++) {
        var attr = attrs[i];
        if (!$input.is('[' + attr + ']')) continue;
        var value = $input.attr(attr).replace(search, replace);
        $input.attr(attr, value);
    }
};

/**
 * Reprioritize or reorder the forms within a formset
 */
django.formset.reprioritize_formset = function ($formset) {
    var opts = django.formset.opts;
    var data = opts.data;
    var selectors = opts.selectors;

    var prefix = $formset.data(data.prefix);
    var non_removed_counter = 0;

    var opts = django.formset.opts;
    var data = opts.data;
    var selectors = opts.selectors;

    var data_form = django.formset.data_selector('form');
    var priority_element = django.formset.data_selector('priority');
    var order_element = django.formset.data_selector('order');
    var updateable = opts.updateable;
    var attributes = updateable.attributes;

    $(data_form, $formset).each(function (i, e) {
        var $form = $(e);
        var $remove_checkbox = $(selectors.remove, $form);
        var $order_input = $(selectors.order, $form);
        var $priority_input = $(priority_element, $form);

        // Update any HTML priority
        if ($remove_checkbox && !$remove_checkbox.is(':checked')) {
            $(order_element, $form).html(++non_removed_counter);
        }

        // Update any priorities for ordering
        if ($order_input.length) {
            $order_input.val(i);
        }

        // Update any custom priorities
        if ($priority_input.length) {
            $priority_input.each(function (j, k) {
                $(k).val(i).attr('value', i);
            });
        };

        $(updateable.element_selector, $form).each(function (j, input) {
            django.formset.reorder_property($(input), attributes, prefix, i);
        });
    });
};

/**
 * Make a form into an *actual* form for a formset.
 */
django.formset.make_form = function ($formset, $form, params) {
    var opts = django.formset.opts;
    var data = opts.data;
    var selectors = opts.selectors;

    var remove_element = django.formset.data_selector('remove');

    var $remove_checkbox = $(remove_element, $form);
    var prefix = $formset.data(data.prefix);
    var form_element = django.formset.data_selector('form');
    var $form_element = $(form_element, $formset);

    // Increase the number of total forms and sort the formset
    var $total_forms = $('#id_' + prefix + '-TOTAL_FORMS');
    $total_forms.val(parseInt($(form_element, $formset).length));
    django.formset.reprioritize_formset($formset);

    // When the user clicks remove, then we need to either
    // remove the form or hide it and mark it for deletion
    $(remove_element, $form).click(function () {
        var cancel_remove = !params.before_form_remove($formset, $form);
        if (cancel_remove)
            return false;

        if ($form.data('existed')) {
            $form.hide();
            $remove_checkbox.attr('checked', 'checked');
        } else {
            $form.remove();
            $total_forms.val(parseInt($(form_element, $formset).length));
        }

        params.on_form_remove($formset, $form);
        django.formset.reprioritize_formset($formset);
    });

    if (params.make_sortable) {
        django.formset.make_formset_sortable($formset);
    }

    params.on_form_add($formset, $form);
};

/*
 * Sortability
 */
django.formset.make_formset_sortable = function ($formset) {
    $formset.sortable({
        stop: function (event, ui) {
            django.formset.reprioritize_formset($formset);
        }
    });
};

/**
 * Create a new formset
 */
django.formset.create = function ($formset, params) {
    var opts = django.formset.opts;
    var data = opts.data;
    var selectors = opts.selectors;

    var form_element = django.formset.data_selector('form');
    var last_form_element = form_element + ':last';
    var add_element = django.formset.data_selector('add');

    var initial = parseInt($formset.data(data.initial) || 1);

    // Remove the template and prepare for it to be used on any add
    var $last_element = $(last_form_element, $formset);
    var $template = $last_element.clone();
    $last_element.remove();

    var content = $template.html();
    var prefix = $formset.data(data.prefix);
    content = content.replace(/__prefix__/g, '0')
    $template = $template.html(content);

    django.formset.reprioritize_formset($formset);

    $(add_element, $formset).click(function () {
        var $form = $template.clone();
        $form.data('existed', false);

        var cancel_add = !params.before_form_add($formset, $form);
        if (cancel_add)
            return false;

        var $last_form = $(last_form_element, $formset);

        if ($last_form.length) {
            $form.insertAfter($last_form);
        } else {
            $formset.prepend($form);
        }

        django.formset.make_form($formset, $form, params);
    });

    // Now handle the actions for the form (namely remove)
    $(form_element, $formset).each(function (j, form) {
        var $form = $(form);
        $form.data('existed', true);
        django.formset.make_form($formset, $form, params);
    });

    // Now create the initial number of forms

    var total = $(form_element, $formset).length;
    for (var j = total; j < initial; j++) {
        $(add_element, $formset).click();
    }

    return $formset;
};

/**
 * Just find all the default formsets and make them django.formsets
 */
django.formset.autoconfig = function (options) {
    var settings = $.extend(true, django.formset.opts.create_params, options);
    var formset_element = django.formset.data_selector('formset');
    $(formset_element).each(function (i, e) {
        var $formset = $(e);
        django.formset.create($formset, settings);
    });
};

/**
 * A thin wrapper around jQuery for creating formsets around containers.
 */
$.fn.formset = function (options) {
    var settings = $.extend(true, django.formset.opts.create_params, options);
    return django.formset.create($(this), settings);
};
