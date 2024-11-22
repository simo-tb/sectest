
window.addEventListener('tb_libs_loaded', (event) => {

/*
    $(document).change('[name="queue"]', function() {
        if($('#tb-jfp-form').length > 0
                    && $('#tb-jfp-form').getFormValue() !== null 
                    && $('#tb-jfp-form').getFormValue().queue !== null)
        {
            var form = $('#tb-jfp-form').getFormValue();

            var queue_object = JSON.parse(JSON.parse($('#tb-jfp-form').data().tbJfTree.formDesc.content.queue_settings_hash)[form['queue']]);

            if(typeof queue_object !== "undefined" && queue_object !== null)
            {
                if(queue_object['sender_options'] !== null && typeof queue_object['sender_options'] !== "undefined")
                {
                    if(typeof queue_object['sender_options']['supported_payload_encodings'] !== "undefined" 
                        && queue_object['sender_options']['supported_payload_encodings'] !== null 
                        && queue_object['sender_options']['supported_payload_encodings'].length == 1)
                    {
                        $('[name="encoding"]').prop('disabled',true); 
                        $('[name="encoding"]').val(queue_object['sender_options']['supported_payload_encodings'][0]);
                    }
                    else if(typeof queue_object['sender_options']['supported_payload_encodings'] !== "undefined" 
                        && queue_object['sender_options']['supported_payload_encodings'] !== null 
                        && queue_object['sender_options']['supported_payload_encodings'].length == 2)
                    {
                        $('[name="encoding"]').removeAttr('readonly'); 
                        $('[name="encoding"]').prop('disabled',false); 
                    }
                    else
                    {
                        $('[name="encoding"]').val('utf8');
                        $('[name="encoding"]').prop('disabled',true); 
                    }
                }
                else
                {
                    $('[name="encoding"]').val('utf8');
                    $('[name="encoding"]').prop('disabled',true);
                }
            }
            else
            {
                $('[name="encoding"]').val('utf8');
                $('[name="encoding"]').prop('disabled',true);
            }
        }
    });
*/

    $(document).change('[name="recipients_tabs/target_group_id"]', function() {
        if($('#tb-jfp-form').length > 0                                                                                                                                                                                                      
                    && $('#tb-jfp-form').getFormValue() !== null                                                                                                                                                                             
                    && $('#tb-jfp-form').getFormValue().recipients_tabs.target_group_id )
				{
            console.log("TGID", $('#tb-jfp-form').getFormValue().recipients_tabs.target_group_id);
						var span_element;
						if($('#target_group_info_span').length == 0)
						{
								span_element = document.createElement('span');
								span_element.id = "target_group_info_span";
								$(span_element).addClass("help-block tb-jf-description tb-jf-clear-margins");
								$(span_element).html(JSON.parse($('#tb-jfp-form').data().tbJfTree.formDesc.content.target_groups_hash)[$('#tb-jfp-form').getFormValue().recipients_tabs.target_group_id].replace(/\n/g, '<br />'));
								$(span_element).insertAfter($('select[name="recipients_tabs/target_group_id"]'));
						}
						else
						{
								span_element = $('#target_group_info_span');
								$(span_element).html(JSON.parse($('#tb-jfp-form').data().tbJfTree.formDesc.content.target_groups_hash)[$('#tb-jfp-form').getFormValue().recipients_tabs.target_group_id].replace(/\n/g, '<br />'));
						}
				}
				else if($('#tb-jfp-form').length > 0
							&& $('#tb-jfp-form').getFormValue() !== null
							&& $('#tb-jfp-form').getFormValue().recipients_tabs.target_group_id == null
							&& $('#target_group_info_span').length == 1)
				{
						$('#target_group_info_span').text('');
				}
    });

    $(document).change('[name="recipients_tabs/contact_list_id"]', function() {
        if($('#tb-jfp-form').length > 0
                    && $('#tb-jfp-form').getFormValue() !== null 
                    && $('#tb-jfp-form').getFormValue().recipients_tabs.contact_list_id !== null
                    && $('#tb-jfp-form').getFormValue().recipients_tabs.contact_list_id == 2)
        {
            $('[name="recipients_tabs/notification_contact_types_id"]').prop('disabled',true);
            $('[name="recipients_tabs/notification_contact_types_id"]').val('');
        }
        else if($('#tb-jfp-form').length > 0
                    && $('#tb-jfp-form').getFormValue() !== null
                    && $('#tb-jfp-form').getFormValue().recipients_tabs.contact_list_id !== null
                    && $('#tb-jfp-form').getFormValue().recipients_tabs.contact_list_id != 2)
        {
            $('[name="recipients_tabs/notification_contact_types_id"]').prop('disabled',false);
        }
        else if($('#tb-jfp-form').length > 0
                    && $('#tb-jfp-form').getFormValue() !== null
                    && $('#tb-jfp-form').getFormValue().recipients_tabs.contact_list_id == null)
        {
            $('[name="recipients_tabs/notification_contact_types_id"]').prop('disabled',false);
        }
    });

/*
    $(document).change('[name="recipients_tabs/send_to_all"]', function() {
        if($('#tb-jfp-form').length > 0 
            && $('#tb-jfp-form').getFormValue() !== null 
            && $('#tb-jfp-form').getFormValue().recipients_tabs.send_to_all !== null 
            &&  $('#tb-jfp-form').getFormValue().recipients_tabs.send_to_all == true)
        {
            $('[name="target_list_id"]').prop('disabled',true);
            $('[name="target_list_id"]').val("");
        }
        else
        {
            $('[name="target_list_id"]').prop('disabled',false);
        }
    });
*/

});
