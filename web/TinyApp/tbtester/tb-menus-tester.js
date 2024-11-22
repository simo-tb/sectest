let componentsTesterBtn = $('#test-components-btn')[0];
let componentsTesterForm = $('#components-tester-form')[0];
//let otpTesterForm = $('#otp-tester-form')[0];
//let otpTesterBtn = $('#otp-tester-btn')[0];
let tinyAppOverlay = $('#tinyapp-overlay')[0];
//let subscriptionsTesterBtn = $('#subscriptions-tester-btn')[0];
//let subscriptionsTesterForm = $('#subscriptions-tester-form')[0];

if (componentsTesterForm != null) {
	componentsTesterForm.addEventListener('submit', e => {
		e.preventDefault();
		tinyAppOverlay.style.display = 'block';
		componentsTesterBtn.disabled = true;
		componentsTesterForm.submit();
	});
}

//otpTesterForm.addEventListener('submit', e => {
//    e.preventDefault();
//    tinyAppOverlay.style.display = 'block';
//    otpTesterBtn.disabled = true;
//    otpTesterForm.submit(); 
//});

//subscriptionsTesterForm.addEventListener('submit', e => {
//    e.preventDefault();
//    tinyAppOverlay.style.display = 'block';
//    subscriptionsTesterBtn.disabled = true;
//    subscriptionsTesterForm.submit();
//});

