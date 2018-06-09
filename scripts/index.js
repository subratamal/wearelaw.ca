$(function () {
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

	function blockNavigation(element) {
		const elem = $(element).closest('.item').find('input[type="submit"]');
		elem && elem[0].setAttribute('data-slide-to', 5);
	}

	function unBlockNavigation(element) {
		const elem = $(element).closest('.item').find('input[type="submit"]');
		elem && elem[0].setAttribute('data-slide-to', 6);
	}

	const $form = $('#calculatorForm');
	const $priceInput = $form.find("#price");
	const $carousel = $('.carousel');

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

	$form.validator()
		.on('click', 'input[type="submit"]', (evt) => {
			if (evt.isDefaultPrevented()) {
				// handle the invalid form...
				blockNavigation($(evt.target));
				$carousel.carousel(5);
				return;
			}

			unBlockNavigation($(evt.target));

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

	$('#navbarCollapse')
		.on('shown.bs.collapse', function () {
			$('#navbar-hamburger').addClass('hidden');
			$('#navbar-close').removeClass('hidden').addClass('remove-btn');

			$("#navbarCollapse").addClass('navbar-collapse-mobile');
		})
		.on('hidden.bs.collapse', function () {
			$('#navbar-hamburger').removeClass('hidden');
			$('#navbar-close').addClass('hidden').removeClass('remove-btn');

			$("#navbarCollapse").removeClass('navbar-collapse-mobile');
		});


	$('#imageCarousel.carousel').carousel({
		interval: 6000,
		pause: "false",
	}).on('slid.bs.carousel', function (evt) {
		// console.log(relatedTarget);
		const $img = $(evt.relatedTarget).find("img");
		const src = $img.attr("src");
		const color = $img.attr('data-color');
		$('body').css({
			'background-image': 'url(' + src + ')',
			'background-color': color
		});
	})
});
