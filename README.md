django.formset.js
-----------------

This small JavaScript library is a complete solution for easily creating
sorteable and reusable Django formsets in JavaScript.

Example
-------

A live example is available at: http://jsfiddle.net/AFV3w/

First create the container (ul, div, etc) and specify it as the formset holder.
You may configure various options using the data-attribute. For example, this
ul element states that initialize the formset with at least one form.

    <ul data-django-formset
        data-django-initial=1
        data-django-prefix='{{ form.prefix }}' id="my-formset">

Now you can loop over your Django formset and add the forms as necessary. The
important bit is that the you can use multiple forms within your container,
so the data-django-form attribute allows you to specify the form name. By
default it is 'form'. This example also shows using an external library to
set a data-djang-form-priority tag to the form.priority element.

      {% for form in formset %}
      <li data-django-form='form'>
        {{ form.priority|attr:"data-django-form-priority:0" }}
        Priority #<span data-django-form-order>{{ forloop.counter }}</span>
        <button data-django-form-remove>Delete Form</button>
      </li>
      {% endfor %}
      <li>{{ formset.management_form }}</li>

Finally we just need a way to specify how to add forms. Just add the
appropritate data selector to the element that will handle the click event.

      <li><button data-django-formset-add>Add Form</button></li>
    </ul>

That's it for your DOM changes. Now you just need to make a small JavaScript
call to initialize the form. If you used the default parameters, then you
can conveniently use autoconfig(), otherwise you can call create() manually
or use the $.formset() method.

    <script>
    django.formset.autoconfig();
    </script>

    <script>
    $('#my-form').formset();
    </script>
