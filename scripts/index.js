$(function () {
	/**
	 * Breaks down given fieldName string to pieces. For ex:
	 *
	 * If fieldName is "contact[person][name]" result is ["person", "name"].
	 * If keepFirstElement is true then result is ["contact", "person", "name"].
	 * Result may vary if you pass different expression.
	 *
	 * @param {string} fieldName that will be splited by expression param.
	 * @param {regexp} expression used to break down fieldName to pieces.
	 * @param {boolean} keepFirstElement if false/null first extracted name part will be ommited.
	 * @return {array} array of strings.
	 */
	var extractFieldNames = function (fieldName, expression, keepFirstElement) {
		expression = expression || /([^\]\[]+)/g;
		keepFirstElement = keepFirstElement || false;

		var elements = [];
		while ((searchResult = expression.exec(fieldName))) {
			elements.push(searchResult[0]);
		}

		if (!keepFirstElement && elements.length > 0) elements.shift();

		return elements;
	}

	/**
	 * This function modifies target object by setting chain of nested fields.
	 * Fields will have names as passed in properties array. Value param is assigned to
	 * field at the end of chain. For ex:
	 *
	 * If properties array is ["person", "name"] and value is "abc", target object will be
	 * modified in this way: target.person.name = "abc";
	 *
	 * If field at the end is already defined in target, function won't overwrite it.
	 *
	 * @param {object} object that this function will modify.
	 * @param {array} properties to be createad in target object.
	 * @param {*} value that will be assigned to the field at the end of chain.
	 */
	var attachProperties = function (target, properties, value) {
		var currentTarget = target;
		var propertiesNum = properties.length;
		var lastIndex = propertiesNum - 1;

		for (var i = 0; i < propertiesNum; ++i) {
			currentProperty = properties[i];

			if (currentTarget[currentProperty] === undefined) {
				currentTarget[currentProperty] = (i === lastIndex) ? value : {};
			}

			currentTarget = currentTarget[currentProperty];
		}
	}

	/**
	 * This function converts form fields and values to object stucture that
	 * then can be easely stringyfied with JSON.stringify() method.
	 *
	 * Form fields shoud be named in [square][brackets] convention.
	 * Nesting of fields will be keeped.
	 *
	 * @param {object} jQuery object that represents form element.
	 * @return {object} plain JS object with properties named after form fields.
	 */
	var convertFormDataToObject = function (form) {

		var currentField = null;
		var currentProperties = null;

		// result of this function
		var data = {};

		// get array of fields that exist in this form
		var fields = form.serializeArray();
		for (var i = 0; i < fields.length; ++i) {
			currentField = fields[i];
			// extract field names
			currentProperties = extractFieldNames(currentField.name);
			// add new fields to our data object
			attachProperties(data, currentProperties, currentField.value);
		}

		return data;
	}

	const $form = $('#calculatorForm');
	const $priceInput = $form.find("#price");
	$priceInput.on("keyup", function (event) {
		// When user select text in the document, also abort.
		var selection = window.getSelection().toString();
		if (selection !== '') {
			return;
		}

		// When the arrow keys are pressed, abort.
		if ($.inArray(event.keyCode, [38, 40, 37, 39]) !== -1) {
			return;
		}

		var $this = $(this);

		// Get the value.
		var input = $this.val();

		var input = input.replace(/[\D\s\._\-]+/g, "");
		input = input ? parseInt(input, 10) : 0;

		$this.val(function () {
			return (input === 0) ? "" : input.toLocaleString("en-US");
		});
	});

	$form.on('click', 'input[type="submit"]', (evt) => {
		evt.preventDefault();

		const formData = $form.serializeArray();

		// Sanitize data
		for (var i = 0; i < formData.length; i++) {
			if (formData[i].name == 'property_price') {
				formData[i].value = formData[i].value.replace(/,/g, ''); // Sanitize the values.
			}
		};
		console.log(formData);

		var gSheetUrl = 'https://script.google.com/macros/s/AKfycbyZ4OMLeAPFnjkHjLJef4gorUDUxOa7_JIWSo9U-8z-0ClxY6pb/exec';

		function insertValue(formData) {
			var locationObj = formData.find(elem => elem.name == 'location') || {};
			var transactionTypeObj = formData.find(elem => elem.name == 'transaction_type') || {};
			var propertyPrice = formData.find(elem => elem.name == 'property_price') || {};
			var firstTimeBuyer = formData.find(elem => elem.name == 'first_time_buyer') || {};
			var firstTimeCoPurchaser = formData.find(elem => elem.name == 'first_time_co_purchaser') || {};
			var customerName = formData.find(elem => elem.name == 'customer_name') || {};
			var customerEmail = formData.find(elem => elem.name == 'customer_email') || {};

			var url = gSheetUrl + `?callback=callback&action=insert&location=${locationObj.value}&transaction_type=${transactionTypeObj.value}&property_price=${propertyPrice.value}&first_time_buyer=${firstTimeBuyer.value}&first_time_co_purchaser=${firstTimeCoPurchaser.value}&customer_name=${customerName.value}&customer_email=${customerEmail.value}`;

			var request = jQuery.ajax({
				crossDomain: true,
				url: url,
				method: "GET",
				dataType: "jsonp"
			});
		}

		function callback(data) {
			console.log(data);
		}

		insertValue(formData);
	});
});
