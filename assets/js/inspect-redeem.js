;(function(){
    document.querySelector('form.inspect-redeem').addEventListener('submit', function(e){
        e.preventDefault();
        const codeGet = document.querySelector('input#code-redeem-form').value
        if(!codeGet) {
            showToast('bg-warning', 'Failed!', 'Please enter redeem code!');
            return;
        }

        document.querySelector('button.inspect-redeem').innerHTML = '<span class="bx bx-loader bx-spin" role="status" aria-hidden="true"></span>';
        document.querySelector('button.inspect-redeem').setAttribute('disabled', 'disabled');

        const formDataBody = new FormData();
        formDataBody.append('action', 'inspect');
        formDataBody.append('code', codeGet);
        fetch('/api/inspectRedeem', {
            method: 'POST',
            body: formDataBody
        })
        .then(async (response) => {
            document.querySelector('button.inspect-redeem').innerHTML = 'SUBMIT';
            document.querySelector('button.inspect-redeem').removeAttribute('disabled');
            if(response.ok) {
                const data = await response.json();
// server response
// {
//     status: true,
//     data: {
//         id: 'xxxxx',
//         statusRedeem: 1, // 1: active, 0: inactive
//         codeRedeem: '123456',
//         ownerRedeem: 'John Doe',
//         usedRedeem: 1,
//         limitRedeem: 3,
//         timeCreated: '2021-08-02 12:00:00',
//         timeExpired: '2021-08-02 12:00:00',
//         itemRedeem: [
//             {
//                 item: 'Item 1',
//                 qty: 1
//             },
//             {
//                 item: 'Item 2',
//                 qty: 9
//             },
//             {
//                 item: 'Item 3',
//                 qty: 10,
//                 expired: '2021-08-02 12:00:00'
//             }
//         ]
//     }
// }
                if(data.status) {
                    document.querySelector('input#result-code-status').value = data.data.statusRedeem === 1 ? 'Active' : 'Expired';
                    document.querySelector('input#result-code-id').value = data.data.id;
                    document.querySelector('input#result-code-code').value = data.data.codeRedeem;
                    document.querySelector('input#result-code-owner').value = data.data.ownerRedeem;
                    document.querySelector('input#result-code-limit').value = data.data.usedRedeem + ' / ' + data.data.limitRedeem;
                    document.querySelector('input#result-code-created').value = data.data.timeCreated;
                    document.querySelector('input#result-code-expired').value = data.data.timeExpired;

                    const tBodyTableItem = document.querySelector('table#result-code-item tbody');
                    if(tBodyTableItem) tBodyTableItem.innerHTML = '';
                    data.data.itemRedeem.forEach((item) => {
                        let tr = document.createElement('tr');
                        let tdItem = document.createElement('td');
                        let tdQty = document.createElement('td');
                        let tdExpired = document.createElement('td');
                        const itemIcon = document.createElement('i');
                        itemIcon.classList.add(mapRedeemItem[item.item].icon);
                        tdItem.appendChild(itemIcon);
                        tdItem.textContent = item.item;
                        tdQty.textContent = item.qty;
                        if(item.expired) {
                            tdExpired.textContent = item.expired;
                        }
                        tr.appendChild(tdItem);
                        tr.appendChild(tdQty);
                        tr.appendChild(tdExpired);
                        document.querySelector('table#result-code-item tbody').appendChild(tr);
                    })
                } else {
                    throw new Error(data.message);
                }
            } else {
                throw new Error('Network response was not ok. Response: ' + response.ok + '\n' + response.statusText);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            showToast('bg-danger', 'Error!', 'Something went wrong!\n' + error.message);
        })
    });

    document.querySelector('form.result-code').addEventListener('submit', function(e){
        e.preventDefault();
        const codeId = document.querySelector('input#result-code-id').value;
        if(!codeId) {
            showToast('bg-warning', 'Failed!', 'Please inspect redeem code first!');
            return;
        }

        document.querySelector('button.delete-redeem').innerHTML = '<span class="bx bx-loader bx-spin" role="status" aria-hidden="true"></span>';
        document.querySelector('button.delete-redeem').setAttribute('disabled', 'disabled');

        const formDataBody = new FormData();
        formDataBody.append('id', codeId);
        fetch('/api/delete-redeem', {
            method: 'POST',
            body: formDataBody
        })
        .then((response) => {
            if(response.ok) {
                const data = response.json();
                if(data.status) {
                    showToast('bg-success', 'Success!', 'Redeem code deleted!');
                    document.querySelector('form.inspect-redeem').reset();
                    document.querySelector('table#result-code-item tbody').innerHTML = '';
                } else {
                    throw new Error(data.message);
                }
            } else {
                throw new Error('Network response was not ok. Response: ' + response.ok + '\n' + response.statusText);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            showToast('bg-danger', 'Error!', 'Something went wrong!\n' + error.message);
        })

        document.querySelector('button.delete-redeem').innerHTML = 'HAPUS';
        document.querySelector('button.delete-redeem').removeAttribute('disabled');
    });
})();