'use strict';

(function () {
  // listen when button id "code-verif-send" is clicked, then send request to server with data from form loginForm
  document.getElementById('code-verif-send').addEventListener('click', async () => {
    const getNumberVerif = document.getElementById('number-verif').value;
    let loginForm = new FormData();
    loginForm.append('numberVerif', getNumberVerif);
    loginForm.append('action', 'verify');

    // if loginForm number-verif is empty, show toast with bg-warning and message "Please enter your verification code"
    if (!getNumberVerif) {
      // set outline to danger
      document.getElementById('number-verif').style.outline = '1px solid red';
      showToast('bg-warning', 'Failed!', 'Nomer WhatsApp tidak boleh kosong!');
      return;
    }
    
    // if loginForm number-verif is not a number, show toast with bg-warning and message "Verification code must be a number"
    if (isNaN(getNumberVerif)) {
      // set outline to danger
      document.getElementById('number-verif').style.outline = '1px solid red';
      showToast('bg-warning', 'Failed!', 'Nomer WhatsApp harus berupa angka!');
      return;
    }

    // change the code-verif-send button to loading state
    document.getElementById('code-verif-send').innerHTML = '<span class="bx bx-loader bx-spin" role="status" aria-hidden="true"></span>';
    document.getElementById('code-verif-send').setAttribute('disabled', 'disabled');

    fetch('/api/login', {
      method: 'POST',
      body: loginForm
    }).then(async (response) => {
      let data = await response.json();
      if (data.status) {
        document.getElementById('code-verif').removeAttribute('disabled');
        document.getElementById('code-verif').focus();

        document.getElementById('code-verif-send').innerHTML = '<span class="bx bx-check" role="status" aria-hidden="true"></span>';
        // after 2 seconds, change the code-verif-send button to timer 30s
        setTimeout(() => {
          let timer = 30;
          document.getElementById('code-verif-send').innerHTML = timer + 's';
          let interval = setInterval(() => {
            timer--;
            document.getElementById('code-verif-send').innerHTML = timer + 's';
            if (timer === 0) {
              clearInterval(interval);
              document.getElementById('code-verif-send').innerHTML = 'Kirim Ulang';
              document.getElementById('code-verif-send').removeAttribute('disabled');
            }
          }, 1000);
        }, 2000);
      } else {
        // if countdown is number, change the code-verif-send button to timer countdown
        if(data.countdown) {
          let timer = data.countdown;
          document.getElementById('code-verif-send').innerHTML = timer + 's';
          let interval = setInterval(() => {
            timer--;
            document.getElementById('code-verif-send').innerHTML = timer + 's';
            if (timer === 0) {
              clearInterval(interval);
              document.getElementById('code-verif-send').innerHTML = 'Kirim Ulang';
              document.getElementById('code-verif-send').removeAttribute('disabled');
            }
          }, 1000);
        }
        showToast('bg-warning', 'Failed!', data.message);
      }
    }).catch((error) => {
      console.error('Error:', error);
      showToast('bg-danger', 'Error!', 'Something went wrong!\n' + error.message);
    });
  });

  // listen submit form loginForm, then send request to server with data from form loginForm
  document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const getNumberVerif = document.getElementById('number-verif').value;
    const getCodeVerif = document.getElementById('code-verif').value;
    let loginForm = new FormData();
    loginForm.append('numberVerif', getNumberVerif);
    loginForm.append('codeVerif', getCodeVerif);
    loginForm.append('action', 'login');

    if(!getNumberVerif) {
      document.getElementById('number-verif').style.outline = '1px solid red';
      showToast('bg-warning', 'Failed!', 'Nomer WhatsApp tidak boleh kosong!');
      return;
    }

    if(isNaN(getNumberVerif)) {
      document.getElementById('number-verif').style.outline = '1px solid red';
      showToast('bg-warning', 'Failed!', 'Nomer WhatsApp harus berupa angka!');
      return;
    }

    // if loginForm code-verif is empty, show toast with bg-warning and message "Please enter your verification code"
    if (!getCodeVerif) {
      // set outline to danger
      document.getElementById('code-verif').style.outline = '1px solid red';
      showToast('bg-warning', 'Failed!', 'Kode Verifikasi tidak boleh kosong!');
      return;
    }

    fetch('/api/login', {
      method: 'POST',
      body: loginForm
    }).then(async (response) => {
      if(response.ok) {
        let data = await response.json();
        if (!data.status) {
          showToast('bg-warning', 'Failed!', data.message);
        } else {
          window.location.href = '/';
        }
      } else {
        throw new Error('Network response was not ok. Response: ' + response.ok + '\n' + response.statusText);
      }
    }).catch((error) => {
      console.error('Error:', error);
      showToast('bg-danger', 'Error!', 'Something went wrong!\n' + error.message);
    });
  });
  
        function addEventListeners() {
            document.getElementById('loginWithEmail').addEventListener('click', function () {
                document.getElementById('whatsapp-login-form').style.display = 'none';
                document.getElementById('email-login-form').style.display = 'block';
            });

            document.getElementById('loginWithPhone').addEventListener('click', function () {
                document.getElementById('email-login-form').style.display = 'none';
                document.getElementById('whatsapp-login-form').style.display = 'block';
            });

            document.getElementById('loginForm').addEventListener('submit', function (event) {
                var recaptchaResponse = grecaptcha.getResponse();
                if (document.getElementById('email-login-form').style.display === 'block' && recaptchaResponse.length === 0) {
                    event.preventDefault();
                    alert('Please complete the CAPTCHA');
                }
            });

            document.getElementById('togglePassword').addEventListener('click', function (e) {
                // Toggle the type attribute
                const password = document.getElementById('password');
                const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
                password.setAttribute('type', type);
                // Toggle the eye icon
                this.classList.toggle('bx-hide');
                this.classList.toggle('bx-show');
            });
        }

        document.addEventListener('DOMContentLoaded', addEventListeners);
})()