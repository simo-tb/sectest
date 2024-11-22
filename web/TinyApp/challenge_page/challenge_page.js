const loginBtn = document.getElementById('login-submit');
const tb_login_form = document.getElementById('tb-login-form');
const toggle_password_btn = document.getElementById('toggle-password');
const toggle_old_password_btn = document.getElementById('toggle-old-password');
const toggle_new_password_btn = document.getElementById('toggle-new-password');
const toggle_confirm_password_btn = document.getElementById('toggle-confirm-password');
const usernameInput = document.getElementById('login-username');
const passwordInput = document.getElementById('login-password');
const captcha_code = document.getElementById('captcha-code');
const captcha_token = document.getElementById('captcha-token');
const alert_show_details = document.getElementById('alert-show-details');
const captcha_group = document.getElementById('captcha-group');
const captcha_image = document.getElementById('captcha-image');
const captchaRefresh = document.getElementById('captcha-refresh');
const login_form = document.getElementById('login-form');
const change_password_form = document.getElementById('tb-change-password-form');
const change_password_panel = document.getElementById('tb-change-password-panel');
const otp_validate_form = document.getElementById('tb-otp-validate-form');
const otp_validate_panel = document.getElementById('tb-otp-validate-panel');
const otp_validate_button = document.getElementById('otp-validate-submit');
const otp_setup_form = document.getElementById('tb-otp-setup-form');
const otp_setup_panel = document.getElementById('tb-otp-setup-panel');
const otp_setup_button = document.getElementById('otp-setup-submit');
const otp_recovery_form = document.getElementById('tb-otp-recovery-form');
const otp_recovery_panel = document.getElementById('tb-otp-recovery-panel');
const otp_recovery_button = document.getElementById('otp-recovery-submit');
const login_form_panel = document.getElementById('login-form-panel');
const login_submit_button = document.getElementById('login-submit-button');

const TIMEOUT_REQ_MS = 3000;
const MAX_ALLOWED_TIME_DIFF = 1000 * 60 * 120;
const USERNAME_INPUT_MAX_LENGTH = 50;
const PASSWORD_INPUT_MAX_LENGTH = 200;
const ENTER_KEY_CODE = 13;
const WRONG_AUTH_CODE = 'U/WA/Sec/13000';
const WRONG_AUTH_MESSAGE = "Username or password is incorrect!";
const EMPTY_FIELD_MESSAGE = "Please fill all the fields!";
const TIMEOUT_MESSAGE = "Connection timeout. Please try again!";
const LOGIN_COMMAND = 'login';
const THIRD_PARTY_COOKIES_ERROR = "Failed to read the 'localStorage' property from 'Window': Access is denied for this document.";
const apiKey = 'f31axzbcl134asqw3601selaxx3zy123';
const pathArr = window.location.pathname.split('/');
const backoffice_apikey = pathArr[1];

const showOverlay = function() {
	if (login_form.classList.contains('d-none')) {
		document.getElementById('tinyapp-overlay').style.display = "block";
	}
};

const hideOverlay = function() {
	document.getElementById('tinyapp-overlay').style.display = "none";
};

const clearMessage = function () {
	document.querySelector('#error-msg>div').classList.add('d-none');
}

const showDetailedErrorMessage = function(err) {
    ASSERT(err != null);

    if (err.name === TB.CONFIG.ERR_USER) {
        document.querySelector('#error-msg>div').classList.remove('alert-danger');
        document.querySelector('#error-msg>div').classList.add('alert-warning');
    }
    else {
        document.querySelector('#error-msg>div').classList.add('alert-danger');
        document.querySelector('#error-msg>div').classList.remove('alert-warning');
    }

	document.querySelector('#error-msg>div').classList.remove('d-none');
    document.querySelector('#alert-show-details').classList.remove('d-none');
    document.querySelector('#alert-details').classList.add('d-none');
    document.querySelector('#error-msg').classList.remove('d-none');
    document.querySelector('#error-msg-text').innerHTML = err.message;
    document.querySelector('#tb-error-audit-code').innerText = err.code;

    if (_.get(err, "tbData.addParams.req_err.details.checksum")) {
        document.getElementById('tb-error-checksum').innerText = _.get(err, "tbData.addParams.req_err.details.checksum");
    }
    
    if (_.get(err, "tbData.addParams.req_err.details.timestamp")) {
        document.getElementById('tb-error-timestamp').innerText = _.get(err, "tbData.addParams.req_err.details.timestamp");
    }
}

const showWarningMessage = function(message) {
	ASSERT(message != null);

    document.querySelector('#error-msg>div').classList.remove('alert-danger');
    document.querySelector('#error-msg>div').classList.add('alert-warning');
    document.querySelector('#error-msg>div').classList.remove('alert-success');
    document.querySelector('#error-msg>div').classList.remove('d-none');
    document.querySelector('#alert-show-details').classList.add('d-none');
    document.querySelector('#error-msg').classList.remove('d-none');
    document.querySelector('#error-msg-text').innerHTML = message;
}

const showSuccessfulMessage = function(message) {
	ASSERT(message != null);

    document.querySelector('#error-msg>div').classList.remove('alert-danger');
    document.querySelector('#error-msg>div').classList.remove('alert-warning');
    document.querySelector('#error-msg>div').classList.add('alert-success');
    document.querySelector('#error-msg>div').classList.remove('d-none');
    document.querySelector('#alert-show-details').classList.add('d-none');
    document.querySelector('#error-msg').classList.remove('d-none');
    document.querySelector('#error-msg-text').innerHTML = message;
}

// TODO DON'T BE GLOBAL
let referer;
let is_geolocation_required = false;
let otp_secret;

function removeQueryParam(param) {
    ASSERT(param != null);

    const params = new URLSearchParams(window.location.search);
    params.delete(param);
    const url_path = window.location.pathname;
    const new_url = `${url_path}?${params}`;

    history.pushState({}, "", new_url);

    return new_url;
}  

function addQueryParam(key, value) {
	ASSERT(key != null);
	ASSERT(value != null);
	
	const params = new URLSearchParams(window.location.search);
	params.set(key, value);

	const url_path = window.location.pathname;
	const new_url = `${url_path}?${params}`;

	history.pushState({}, "", new_url);

	return new_url;
}
 

function toggleChangePasswordForm() {
	clearMessage();
	if (login_form_panel.classList.contains('d-flex')) {
		login_form_panel.classList.remove('d-flex');
		login_form_panel.classList.add('d-none');
		login_submit_button.classList.add('d-none');
		change_password_panel.classList.remove('d-none');
	}
	else
	{
		login_form_panel.classList.remove('d-none');
		login_form_panel.classList.add('d-flex');
		login_submit_button.classList.remove('d-none');
		change_password_panel.classList.add('d-none');
		document.getElementById('captcha-group').classList.add('d-none');
	}
}

function toggleOTPForm(form_obj) {
	clearMessage();
	if (login_form_panel.classList.contains('d-flex')) {
		login_form_panel.classList.remove('d-flex');
		login_form_panel.classList.add('d-none');
		login_submit_button.classList.add('d-none');
		form_obj.classList.remove('d-none');
		form_obj.classList.add('d-flex');
	}
}

function togglePassword() {
	if (this.classList.contains('fa-eye')) {
		this.parentElement.previousElementSibling.type = "text";
		this.classList.replace('fa-eye', 'fa-eye-slash');
	}
	else {
		this.parentElement.previousElementSibling.type = "password";
		this.classList.replace('fa-eye-slash', 'fa-eye');
	}
}

function checkInputFieldsLength(username, password) {
    ASSERT_USER(username.length < USERNAME_INPUT_MAX_LENGTH && password.length < PASSWORD_INPUT_MAX_LENGTH && document.getElementById('captcha-code').value.length < 10, "Invalid input!", "LP/2000");	
}

function validateRequiredFields(username, password) {
    ASSERT_USER(username.length > 0 && password.length > 0, EMPTY_FIELD_MESSAGE, "LP/1000"); 

    if ( ! document.getElementById('captcha-group').classList.contains('d-none')) {
        ASSERT_USER(document.getElementById('captcha-code').value.length > 0, EMPTY_FIELD_MESSAGE, "LP/1001");
    }

	if ( ! document.getElementById('login-reason-group').classList.contains('d-none')) {
        ASSERT_USER(document.getElementById('login-reason').value.length > 0 && document.getElementById('login-reason').value.trim() != '', EMPTY_FIELD_MESSAGE, "LP/1002");
	}
}

function getFormDataValues(form) {
	ASSERT(form != null);

    let form_data = new FormData(form);
	let form_values = {};

	for (const [key, value] of form_data) {
		if (value === "true") {
			form_values[key] = true;
		}
		else if (value === "false") {
			form_values[key] = false;
		}
		else {
			form_values[key] = value.trim();
		}
	}

	return form_values;
}

function refreshCaptcha() {
	ProcessEventWithErrorHandling(() => {
		let captcha_token = document.getElementById('captcha-token').value;
	
		let body = {
			method: "refresh_captcha",
			params: {
				captcha_token: captcha_token
			}
		};

		ASSERT(apiKey != null);

        let baseUrl = `authentication-api/${apiKey}`;

        let refreshCaptchaRequest = new XMLHttpRequest();
        refreshCaptchaRequest.open('POST', baseUrl, true);
       
        refreshCaptchaRequest.onreadystatechange = () => {
            ProcessEventWithErrorHandling(() => {
                if (refreshCaptchaRequest.readyState == 4) {
                    if (refreshCaptchaRequest.status === 200) {
	                    let result = JSON.parse(refreshCaptchaRequest.responseText);
						
						ASSERT(result.result.captcha_token != null);
						ASSERT(result.result.captcha_image != null);

						visualizeCaptcha(result.result.captcha_image, result.result.captcha_token);
					}
				}
			});
		};

        refreshCaptchaRequest.setRequestHeader("Content-Type", "application/jsonrpc;charset=UTF-8");

		refreshCaptchaRequest.send(JSON.stringify(body));
	});
}

function handleChangePassword() {
	ProcessEventWithErrorHandling(async () => {
		let body = getFormDataValues(change_password_form);

		let are_all_fields_filled = body.old_password != null && body.old_password != ""
                 && body.new_password != null && body.new_password != ""
                 && body.confirm_password != null && body.confirm_password != "";

		ASSERT_USER(are_all_fields_filled, "Please fill all fields", "CL/3333");	
		ASSERT_USER(body.confirm_password === body.new_password, "Passwords do not match", "CL/3334");
		ASSERT_USER(body.old_password != body.new_password, "New password cannot be the same as the old password", "CL/3335");

		loginBtn.disabled = true;

		let res = await window.TB.fgSiteAPI.send('change_password', body, { timeout: TIMEOUT_REQ_MS, retry: false });

		loginBtn.disabled = false;

		if (res.status.status === 'ok') {
            window.localStorage.removeItem(`_session_${backoffice_apikey}`);
            let newUrl = removeQueryParam("change_password");
            newUrl += `&success_message=${res.message}`;
            window.location.href = newUrl;
		}
	});
}

function handleOTPValidateForm() {
	ProcessEventWithErrorHandling(async () => {
		let body = getFormDataValues(otp_validate_form);

		loginBtn.disabled = true;

		ASSERT_USER(body.otp_code.length === 6, "Invalid input!", "CL/3336");

		let res = await window.TB.fgSiteAPI.send('validate_otp', body, { timeout: TIMEOUT_REQ_MS, retry: false });

		loginBtn.disabled = false;

		if (res.status.status === 'ok') {
			window.location.href = res.location;
		}
	});
}

function handleOTPRecoveryForm() {
	ProcessEventWithErrorHandling(async () => {
		let body = getFormDataValues(otp_recovery_form);

		loginBtn.disabled = true;

		let res = await window.TB.fgSiteAPI.send('recover_otp', body, { timeout: TIMEOUT_REQ_MS, retry: false });

		loginBtn.disabled = false;

		console.log(res);

		if (res.status.status === 'ok') {
			clearMessage();
			ASSERT(res.otp.state === "setup");
			ASSERT(res.otp.qr_code != null);
			ASSERT(res.otp.secret != null);
			let qr_code = res.otp.qr_code;
			let qr_code_obj = new QRCode("qrcode", qr_code);
			document.querySelector('#qrcode-url').src = document.querySelector('#qrcode > canvas').toDataURL("image/png");
			otp_secret = res.otp.secret;
            document.getElementById('login-form-title-text').innerText = "Setup Two Factor Authentication";
			otp_recovery_panel.classList.remove('d-flex');
			otp_recovery_panel.classList.add('d-none');
			otp_setup_panel.classList.remove('d-none');
			otp_setup_panel.classList.add('d-flex');
		}
	});
}

function handleOTPSetupForm() {
	ProcessEventWithErrorHandling(async () => {
		let body = getFormDataValues(otp_setup_form);
		body.otp_secret = otp_secret;

		let res = await window.TB.fgSiteAPI.send('setup_otp', body, { timeout: TIMEOUT_REQ_MS, retry: false });

		if (res.status.status === 'ok') {
			clearMessage();
			otp_setup_panel.classList.remove('d-flex');
			otp_setup_panel.classList.add('d-none');
			document.getElementById('login-form-title-text').innerText = "Two Factor Authentication";
			otp_validate_panel.classList.remove('d-none');
			otp_validate_panel.classList.add('d-flex');
		}
	});
}

function handleLoginButtonClick() {
    ProcessEventWithErrorHandling(async () => {
        let _username = (usernameInput.value).trim();
        let _password = (passwordInput.value).trim();

        validateRequiredFields(_username, _password);
        checkInputFieldsLength(_username, _password);

        loginBtn.disabled = true;

        let captcha_code = (document.getElementById('captcha-code').value).toUpperCase();
        let apiKeyUrl = window.location.pathname;
        let captcha_token = document.getElementById('captcha-token').value;

        if (window.location.pathname.indexOf('/') > -1) {
            apiKeyUrl = window.location.pathname.split('/')[1];
        }
       
        let body = {
            method: LOGIN_COMMAND,
            params: {
	            captcha_code: captcha_code,
	            captcha_token: captcha_token,
	            username: _username,
	            password: _password
			}
        }; 

		if (document.getElementById('login-reason').value != null) {
			body.params.login_reason = document.getElementById('login-reason').value;
		}

        let baseUrl = `authentication-api/${apiKey}`;
        
        let loginRequest = new XMLHttpRequest();
        loginRequest.open('POST', baseUrl, true);
        loginRequest.withCredentials = true;
       
        loginRequest.onreadystatechange = () => {
            ProcessEventWithErrorHandling(() => {
                if (loginRequest.readyState == 4) {
                    clearTimeout(tinyapp_overlay_timeout);
                    hideOverlay();
                    if (loginRequest.status === 200) {
                        let result = JSON.parse(loginRequest.responseText);

						if (result.error != null) {
							loginRequestErrorCallback(loginRequest, loginBtn);
						}
	            		else {
							ASSERT(result.result.location != null);

							referer = referer || window.localStorage.getItem('_referer');

							let iframe_query_param = "";

							if (window != window.top) {
								iframe_query_param = "&show_body_only=1";
							}

							if (result.result.otp != null && result.result.otp.state != null) {
								loginBtn.disabled = false;

								if (result.result.otp.state === "validate") {
									document.getElementById('login-form-title-text').innerText = "Two Factor Authentication";
									toggleOTPForm(otp_validate_panel);
								}
								else if (result.result.otp.state === "setup") {
									ASSERT(result.result.otp.qr_code != null);
									ASSERT(result.result.otp.secret != null);
									let qr_code = result.result.otp.qr_code;
									let qr_code_obj = new QRCode("qrcode", qr_code);
									document.querySelector('#qrcode-url').src = document.querySelector('#qrcode > canvas').toDataURL("image/png");

									otp_secret = result.result.otp.secret;
									document.getElementById('login-form-title-text').innerText = "Setup Two Factor Authentication";
									toggleOTPForm(otp_setup_panel);
								}
								else if (result.result.otp.state === "recovery") {
									document.getElementById('login-form-title-text').innerText = "Two Factor Authentication Recovery";
									toggleOTPForm(otp_recovery_panel);
								}
							}
							else if (referer != null) {
								const url_params = new URLSearchParams(window.location.search);
								const realm = url_params.get('realm');
								window.localStorage.removeItem('_referer_');
								window.localStorage.removeItem(`_sess_token_${backoffice_apikey}`);
								loginBtn.disabled = false;
								document.getElementById('tinyapp-overlay').style.display = 'block';

								if (referer.includes('?')) {
									let splits = referer.split('?');
									window.location.href = `${result.result.location}&${splits[1]}&realm=${realm}${iframe_query_param}`;
								}
								else {
									window.location.href = result.result.location + iframe_query_param;
								}	
							}
							else {
								document.getElementById('tinyapp-overlay').style.display = 'block';
								loginBtn.disabled = false;
								window.location.href = result.result.location + iframe_query_param;
							}
						}
                    }
                    else if (loginRequest.status === 0) {
                    	loginBtn.disabled = false;
                        ASSERT_USER(0, TIMEOUT_MESSAGE, "LP/2100");
                    }
                    else {
						loginRequestErrorCallback(loginRequest, loginBtn);
                    }           
                                
                } 
            });
        };

        loginRequest.setRequestHeader("Content-Type", "application/jsonrpc;charset=UTF-8");

		if (is_geolocation_required && navigator.geolocation != null) {
			await new Promise((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(pos => {
					const coords = pos.coords;
					console.log(coords);		
					body.params.geolocation = {};
					body.params.geolocation.latitude = coords.latitude;
					body.params.geolocation.longitude = coords.longitude;
					body.params.geolocation.altitude = coords.altitude;

					resolve();
				}, err => {
					reject(err);
				});
			})
			.catch(err => {
				console.error(err);
			});
		}
	
        loginRequest.send(JSON.stringify(body));

        let tinyapp_overlay_timeout = setTimeout(() => {
            document.getElementById('tinyapp-overlay').style.display = 'block';
        }, 500);

        setTimeout(() => {
            loginRequest.abort();
        }, TIMEOUT_REQ_MS);
    });
};

function loginRequestErrorCallback(loginRequest, loginBtn) {
	loginBtn.disabled = false;

	ASSERT(loginRequest.responseText != null);

	document.getElementById('captcha-code').value = "";
	let res = loginRequest.responseText;
	let res_body = JSON.parse(res);
	let response_details = res_body.error.data.details;

	if (res_body.error.data.status.code === "U/AAPI107") {
		window.location.href = "./";
		return;
	}

	if (response_details != null) {
		let captcha_image_data = response_details.captcha_image;

		if (response_details.is_password_expired === true)
		{
			document.getElementById('login-form-title-text').innerText = "Change Password";
			toggleChangePasswordForm();
		}

		if (captcha_image_data != null) {
			visualizeCaptcha(captcha_image_data, response_details.captcha_token);
		}
	}

	TB.RAServiceParseBaseProtocolExceptionAndThrow(null, new TB.RAServiceUnpackError(res_body));
}

async function ProcessEventWithErrorHandling(cb) {
    ASSERT(cb != null && typeof(cb) === typeof(function(){}));

    try {
		console.log("BEFORE_CB");
        await cb();
		console.log("AFTER_CB");
    } catch (err) {
        loginBtn.disabled = false;
        err = TB.NORMALIZE_ERROR(err);
        TB.ERROR_HANDLER(err);
		if (login_form.classList.contains('d-none')) {
			login_form.classList.remove('d-none');
			login_form.classList.add('d-flex');
	
			showDetailedErrorMessage(err);
			hideOverlay();
		}
	
		if (err.code === "U/AAPI/9999") {
			window.localStorage.removeItem(`_sess_token_${backoffice_apikey}`);
			window.location.reload();
		}
		else if (_.get(err, "tbData.addParams.req_err.status.status") === 'session_error' || err.code === "U/ERR500") {
			const new_url = addQueryParam('warning_message', 'Your session has expired! Please try again!');
			window.location.href = new_url;
		}
    }
}    

const visualizeLoginReason = function() {
	document.getElementById('login-reason-group').classList.remove("d-none");
}

const visualizeCaptcha = function(data, token) {
    ASSERT(data != null);
    ASSERT(token != null);

    captcha_group.classList.remove("d-none");	
    document.getElementById('captcha-image-parent').innerHTML = `<img src="data:image/png;base64,${data}" class="w-100" id="captcha-image" alt="captcha-image">`;
    document.getElementById('captcha-token').value = token;
}

window.TB.CONFIG.XERRORS_HOOK_ERROR_HANDLER_UI = function (err) {
    showDetailedErrorMessage(err);
}

window.addEventListener('tb_libs_loaded', main);

function main() {
    ProcessEventWithErrorHandling(async () => {
        const url_params = new URLSearchParams(window.location.search);
        const success_message = url_params.get('success_message');
		const warning_message = url_params.get('warning_message');
 
        loginBtn.disabled = true;

        removeQueryParam("success_message");
		removeQueryParam("warning_message");

        window.TB.fgSiteAPI = new TB.service_loader({
              apiUrl: `authentication-api/${apiKey}`,
              apiKey: apiKey,
        });
       
        referer = url_params.get('referer'); 

        if (referer != null) {
            window.localStorage.setItem('_referer_', referer);
        } else {
            referer = window.localStorage.getItem('_referer_');
        }

        let res;
      
		alert_show_details.addEventListener('click', () => {
            document.getElementById('alert-details').classList.remove('d-none');
            document.getElementById('alert-show-details').classList.add('d-none');
        });

		try { 
			res = await window.TB.fgSiteAPI.send('validate_session', {}, { timeout: TIMEOUT_REQ_MS, retry: false, retardCb: showOverlay });

			window.localStorage.setItem(`_sess_token_${backoffice_apikey}`, res.session_token)
		} catch (err) {
			clearMessage();
			res = await window.TB.fgSiteAPI.send('create_session', {
				session_token: window.localStorage.getItem(`_sess_token_${backoffice_apikey}`)
			}, { timeout: TIMEOUT_REQ_MS, retry: false, retardCb: showOverlay });

			window.localStorage.setItem(`_sess_token_${backoffice_apikey}`, res.session_token);
		}

		if (warning_message != null) {
			showWarningMessage(warning_message);
		}
        else if (success_message != null) {
    	    showSuccessfulMessage(success_message);
        }

        if (res.location != null && (url_params.get('change_password') == null || url_params.get('change_password') != '1')) {
            window.localStorage.removeItem(`_session_${backoffice_apikey}`);
            window.location.href = res.location;
            return;
        }		
 
        hideOverlay();

        ASSERT(res && res.status && res.status.status && res.status.status === 'ok');

		ASSERT(res.realm != null);

        document.getElementById('realm').innerHTML = res.realm;

		if (res.otp != null && res.otp.state === 'validate') {
            document.getElementById('login-form-title-text').innerText = "Two Factor Authentication";
			toggleOTPForm(otp_validate_panel);
		}
		else if (res.otp != null && res.otp.state === 'setup') {
			ASSERT(res.otp.qr_code != null);
			ASSERT(res.otp.secret != null);
			let qr_code = res.otp.qr_code;
			let qr_code_obj = new QRCode("qrcode", qr_code);
			document.getElementById('qrcode-url').src = document.querySelector('#qrcode > canvas').toDataURL("image/png");
			otp_secret = res.otp.secret;
            document.getElementById('login-form-title-text').innerText = "Setup Two Factor Authentication";
			toggleOTPForm(otp_setup_panel);
		}
		else if (res.otp != null && res.otp.state === 'recovery') {
			ASSERT(res.otp.secret != null);
			otp_secret = res.otp.secret;
            document.getElementById('login-form-title-text').innerText = "Two Factor Authentication Recovery";
			toggleOTPForm(otp_recovery_panel);
		}

        if (res.captcha != null) {
            ASSERT(res.captcha.captcha_image != null);
            ASSERT(res.captcha.captcha_token != null);
            visualizeCaptcha(res.captcha.captcha_image, res.captcha.captcha_token);
        }

		if (res.login_reason != null) {
			is_geolocation_required = true;
			visualizeLoginReason();
		}

        loginBtn.disabled = false;
		toggle_password_btn.addEventListener('click', togglePassword);
		toggle_old_password_btn.addEventListener('click', togglePassword);
		toggle_new_password_btn.addEventListener('click', togglePassword);
		toggle_confirm_password_btn.addEventListener('click', togglePassword);
		captchaRefresh.addEventListener('click', refreshCaptcha);

		change_password_form.addEventListener('submit', e => {
			e.preventDefault();
			handleChangePassword();
		});

		tb_login_form.addEventListener('submit', e => {
			e.preventDefault();
			handleLoginButtonClick();
		});

		otp_validate_form.addEventListener('submit', e => {
			e.preventDefault();
			handleOTPValidateForm();				
		});

		otp_recovery_form.addEventListener('submit', e => {
			e.preventDefault();
			handleOTPRecoveryForm();
		});

		otp_setup_form.addEventListener('submit', e => {
			e.preventDefault();
			handleOTPSetupForm();
		});

        document.querySelector('#login-form').classList.remove('d-none');
        document.querySelector('#login-form').classList.add('d-flex');

        if (url_params.get('reason') != null) {
            showSuccessfulMessage(url_params.get('reason'));
        }
		  
		if (url_params.get('change_password') != null && url_params.get('change_password') == '1') {
            document.getElementById('login-form-title-text').innerText = "Change Password";
			toggleChangePasswordForm();
		} 
    });
}

