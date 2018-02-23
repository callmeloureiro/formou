const messages = {
  fields: {
    requireError: "Oops! Você ainda não preencheu todos os campos.",
    success: "Sucesso! Obrigado por participar",
    sending: "Ok! estamos processando sua solicitação",
    error: "Aconteceu um erro, por favor, tente novamente mais tarde",
    qtyChoices: "Máximo de escolhas: "
  },
  swal: {
    requireError: {
      title: "Oops!",
      message: "Você ainda não preencheu todos os campos"
    }
  }
};

const $checkbox = $('.toggleForm--js').not(":radio");
$checkbox.on('change', function() {
  const that = $(this);
  const thatParent = that.parent().parent().find('.form__group-hidden');
  const fields = thatParent.find('input, textarea');

  thatParent.toggleClass('open');
  if (thatParent.hasClass('open')) {
    thatParent.show();
  } else {
    thatParent.hide();
    fields.val('');
  }
});

const $radios = $('input[type="radio"]');
const $radio = $('.toggleForm--js');

$radios.on('change', function() {
  const that = $(this);
  const thatParent = that.parent().parent().parent().find('.form__group-hidden');
  const fields = thatParent.find('input, textarea');

  if (that.hasClass('toggleForm--js')) {
    thatParent.addClass('open');
    if (thatParent.hasClass('open')) {
      thatParent.show();
    } else {
      thatParent.hide();
    }
  } else {
    thatParent.removeClass('open');
    thatParent.hide();
    fields.val('');
  }
});

const $formSend = $('.form--js');
$formSend.submit(function(e) {
  e.preventDefault();

  let error = 0;

  const that = $(this);
  const ajaxSettings = {
    url: that.attr('action'),
    type: "POST",
    dataType: 'json',
    data: that.serialize(),
    breforeSend: function() {
      createStatusElement(messages.fields.sending, 'warning');
    },
    complete: function (data) {
      const $buttonSend = $('.button-send');

      if (data.responseText === "sucesso") {
        createStatusElement(messages.fields.success, 'success', 0);
        $buttonSend.attr('disabled', 'disabled');
      }

      if (data.responseText === "erro") {
        createStatusElement(messages.fields.error, 'error');
      }
    }
  };

  const $sectionsValidations = $('[section-required]');
  if ($sectionsValidations.length > 0) {
    $sectionsValidations.each(function() {
      const that = $(this);
      const $textFields = that.find('input[type="text"]:visible, textarea:visible');
      if ($textFields.length > 0) {
        $textFields.each(function() {
          const that = $(this);
          const noHasAnswer = that.val() === "";
          if (noHasAnswer) {
            error++;
            setAlertBorder(that, 'error');
          }
        });
      }

      if( that.find( 'input[type="checkbox"], input[type="radio"]' ).length > 0 ) {
        const $noValueChecked = that.find('input[type="checkbox"]:checked, input[type="radio"]:checked').length === 0;
        if ($noValueChecked) {
          error++;
          setAlertBorder(that, 'error');
        }
      }
    });
  }

  if (error) {
    swal(messages.swal.requireError.title, messages.swal.requireError.message, 'warning');
    scrollToTarget($('.validation-error')[0]);
    return;
  }

  $.ajax(ajaxSettings);
  
});

const $checkboxSelect = $("input[type='checkbox']");
$checkboxSelect.on('change', function () {
  const that = $(this);
  const parentThat = that.parent().parent().parent();
  const limitSelected = parentThat.attr('max-checkbox-selected');
  const hasQuantifyValue = parentThat.find('.count--js').length > 0;

  if (hasQuantifyValue) {
    const tagManipulation = parentThat.find('.count--js');
    const valueOnTag = parseInt(tagManipulation.text());

    if (that.is(':checked')) {
      tagManipulation.text(valueOnTag === 0 ? 0 : valueOnTag - 1);
    } else {
      tagManipulation.text(valueOnTag + 1);
    }
  }

  if (limitSelected) {
    if (parentThat.find('input[type=checkbox]:checked').length >= limitSelected) {
      parentThat.find('input[type=checkbox]').not(':checked').attr('disabled', 'disabled');
    } else {
      parentThat.find('input[type=checkbox]').removeAttr('disabled');
    }
  }
});

const $setLimitText = $('[max-checkbox-selected]');
if ($setLimitText.length > 0) {
  $setLimitText.each(function() {
    const that = $(this);
    const limit = that.attr('max-checkbox-selected');
    that.find('h2').addClass('title-section').after(`<small class='text'>${messages.fields.qtyChoices}<span class='count--js'>${limit}</span></small>`);
  });
}

function scrollToTarget(el) {
  const target = $(el);

  if (target.length) {
    $('html, body').animate({
      scrollTop: target.offset().top - 20
    }, 1 * 1000);
  }
}

function createStatusElement(message, elementClass, seconds = 3) {
  const $buttonSend = $('.button-send');
  const idElement = 'status-send'; 
  const element = `
    <div id="${idElement}" class="${elementClass}" style="display: none">
      <p>${message}</p>
    </div>
  `;

  if ($(`#${idElement}`).length > 0) {
    $(`#${idElement}`).find('p').text(message);
  } else {
    $buttonSend.after(element);
    $(`#${idElement}`).fadeIn("slow");
  }

  if (seconds !== 0) {
    setTimeout(() => {
      $(`#${idElement}`).fadeOut("slow", function() {
        $(this).remove();
      });
    }, seconds * 1000);
  }
}

function setAlertBorder(elm, status = null) {
  if (status === 'error') {
    elm.addClass('validation-error').animate({ borderColor: 'red' });
    setTimeout(function () {
      elm.removeClass('validation-error').animate({ borderColor: 'transparent' });
    }, 3 * 1000);
  }
}
