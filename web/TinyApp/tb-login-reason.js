let login_reason_form = $('#login-reason-form')[0];
let login_reason_input = $('#login_reason')[0];
let login_reason_submit_button = $('#login-reason-submit')[0];

const LOGIN_REASON_MAX_LENGTH = 400;
const ENTER_KEY_CODE = 13;

login_reason_form.addEventListener('submit', e => {
    e.preventDefault();
    let login_reason_value = login_reason_input.value;

    ASSERT_USER(login_reason_value.length > 0, "Missing login reason!", "LR100");
    
    ASSERT_USER(login_reason_input.value.length <= LOGIN_REASON_MAX_LENGTH, "Login reason is too long!", "LR200");

    login_reason_form.submit();
});

window.addEventListener("keydown", event => {
    if (event.keyCode === ENTER_KEY_CODE) {
        login_reason_submit_button.click();
    }
});

