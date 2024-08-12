;(function () {

    // if params has code, set value to input basic-default-code
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if(code) document.querySelector('input#basic-default-code').value = code;

    document.querySelector('form.submit-redeem').addEventListener('submit', function (event) {
        event.preventDefault();

        document.querySelector('button.submit-redeem').innerHTML = '<span class="bx bx-loader bx-spin" role="status" aria-hidden="true"></span>';
        document.querySelector('button.submit-redeem').setAttribute('disabled', 'disabled');

        let data = new FormData();
        data.append('action', 'redeem');
        data.append('code', document.querySelector('input#basic-default-code').value);

        // server response
        // {
        //     status: true,
        //     data: {
        //         statusRedeem: 1, // 1: active, 0: inactive
        //         codeRedeem: '123456',
        //         ownerRedeem: 'John Doe',
        //         usedRedeem: 1,
        //         limitRedeem: 3,
        //         timeExpired: '2021-08-02 12:00:00',
        //         itemRedeem: [
        //             {
        //                 item: 'Item 1',
        //                 amount: 1
        //             },
        //             {
        //                 item: 'Item 2',
        //                 amount: 9
        //             },
        //             {
        //                 item: 'Item 3',
        //                 amount: 10,
        //                 expired: '2021-08-02 12:00:00'
        //             }
        //         ]
        //     }
        // }

        // Fetch API
        fetch('/api/redeem', {
            method: 'POST',
            body: data
        }).then(async (response) => {
            // change submit button to normal, 'Submit'
            document.querySelector('button.submit-redeem').innerHTML = 'Tukar Kode';
            document.querySelector('button.submit-redeem').removeAttribute('disabled');
            if (response.ok) {
                const data = await response.json();
                if(data.status) {
                    let modalBody = '';
                    modalBody += '<div class="row mb-4">';
                    modalBody += '<label class="col-sm-2 col-form-label" for="resultCodeRedeem" class="form-label">Kode</label>';
                    modalBody += '<div class="col-sm-10">';
                    modalBody += '<input type="text" id="resultCodeRedeem" class="form-control" value="' + data.data.codeRedeem + '" disabled/>';
                    modalBody += '</div>';
                    modalBody += '</div>';
                    modalBody += '<div class="row mb-4">';
                    modalBody += '<label class="col-sm-2 col-form-label" for="resultOwnerRedeem" class="form-label">Dibuat Oleh</label>';
                    modalBody += '<div class="col-sm-10">';
                    modalBody += '<input type="text" id="resultOwnerRedeem" class="form-control" value="' + data.data.ownerRedeem + '" disabled/>';
                    modalBody += '</div>';
                    modalBody += '</div>';
            
                    modalBody += '<div class="mb-4">';
                    modalBody += '<label class="col-sm-2 col-form-label" for="resultItemRedeem" class="form-label">Item Redeem</label>';
            
                    data.data.itemRedeem.forEach((item) => {
                        if(item.expired) {
                            modalBody += '<input type="text" class="form-control mb-2" value="' + item.item + ' (' + item.amount + ') - Expired: ' + item.expired + '" disabled/>';
                            return;
                        }
                        modalBody += '<input type="text" class="form-control mb-2" value="' + item.item + ' (' + item.amount + ')" disabled/>';
                    });
            
                    modalBody += '</div>';
            
                    document.querySelector('.modal-body').innerHTML = modalBody;
                    $('#modalCenter').modal('show');
                } else {
                    console.log(data);
                    throw new Error(data.message);
                }
            } else {
                throw new Error('Network response was not ok. Response: ' + response.ok + '\n' + response.statusText);
            }
        }).catch((error) => {
            console.error('Error:', error);
            showToast('bg-danger', 'Error!', 'Something went wrong!\n' + error.message);
        });
    });
})();