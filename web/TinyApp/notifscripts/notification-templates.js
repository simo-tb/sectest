$('#tb-jfp-form').on('jfload', function() {
    if($('#tb-jfp-form').getFormValue() == null) {
      return;
    }

    var initial_encoding = $('#tb-jfp-form').getFormValue().settings_json.settings.sms.encoding || 'utf8';
    var encodings_steps_dict = 
    {
      latin: {
        one_max: 160,
        step_after: 153
      },
      utf8: {
        one_max: 70,
        step_after: 67
      }
    };
    

    $('textarea[name^="settings_json/settings/sms/msg"]').each( function( index ) {
      let span_chars = document.createElement('span');
      $(span_chars).attr('id', index + '_chars_span');
      let span_messages = document.createElement('span');
      $(span_messages).attr('id', index + '_messages_span');
      let textarea_element = this;

      $(span_chars).addClass("badge badge-pill badge-dark");
      $(span_messages).addClass("badge badge-pill badge-info");

      $(span_chars).text(this.value.length + ' Chars');
	  $(span_messages).text(0 + ' Messages');

      if(textarea_element.value.length == 0) {
	        $(span_messages).text(0 + ' Messages');
      }
      else if(textarea_element.value.length <= encodings_steps_dict[initial_encoding].one_max) {
			$(span_messages).text(1 + ' Messages');
      }
      else if(textarea_element.value.length > encodings_steps_dict[initial_encoding].one_max) {
			$(span_messages).text(Math.ceil(textarea_element.value.length / encodings_steps_dict[initial_encoding].step_after) + ' Messages');
      }

      $(span_chars).insertAfter($(this));
      $(span_messages).insertAfter($(this));

      $(this).on("keyup", function() {
        $(span_chars).text(this.value.length + ' Chars');
        let encoding = $('#tb-jfp-form').getFormValue().settings_json.settings.sms.encoding || 'utf8';
        let chars_count = this.value.length;

        if(chars_count == 0) {
            $(span_messages).text(0 + ' Messages');
        }
        else if(chars_count <= encodings_steps_dict[encoding].one_max) {
            $(span_messages).text(1 + ' Messages');
        }
        else if(chars_count > encodings_steps_dict[encoding].one_max) {
            $(span_messages).text(Math.ceil(chars_count / encodings_steps_dict[encoding].step_after) + ' Messages');
        }
      });
    });

    $(document).change('[name="settings_json/settings/sms/encoding"]', function() {  
        let encoding = $('#tb-jfp-form').getFormValue().settings_json.settings.sms.encoding || 'utf8';
        $('textarea[name^="settings_json/settings/sms/msg"]').each( function( index ) {
          let textarea_element = this;
          let span_chars = $('#' + index + '_chars_span');
          let span_messages = $('#' + index + '_messages_span');
          $(span_chars).text(textarea_element.value.length + ' Chars');
          let chars_count = textarea_element.value.length;

          if(chars_count == 0) {
              $(span_messages).text(0 + ' Messages');
          }
          else if(chars_count <= encodings_steps_dict[encoding].one_max) {
              $(span_messages).text(1 + ' Messages');
          }
          else if(chars_count > encodings_steps_dict[encoding].one_max) {
              $(span_messages).text(Math.ceil(chars_count / encodings_steps_dict[encoding].step_after) + ' Messages');
          }
        });
    });
});
