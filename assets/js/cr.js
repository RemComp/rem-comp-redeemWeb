;(function () {
    // ignore in all form if keyboard event is not number
    document.querySelectorAll('input[expected="number"]').forEach((input) => {
        input.addEventListener('keydown', (event) => {
            // if key is delete or backspace, allow it
            if (event.key === 'Delete' || event.key === 'Backspace') {
                return;
            }
            // if key has ctrlKey or metaKey, allow it
            if (event.ctrlKey || event.metaKey) {
                return;
            }
            if (!/^[0-9]*$/.test(event.key)) {
                event.preventDefault();
            }
        });
    });

    // listen keyboard event when input/delete number in form to format numberWithCommas
    document.querySelectorAll('input[expected="number"]').forEach((input) => {
        input.addEventListener('keyup', (event) => {
            commasEvent(event.target.id);
        });
    });
    

    // listen form addItemRedeemForm, then add item to <table> list
    document.getElementById('addItemRedeemForm').addEventListener('submit', (event) => {
        event.preventDefault();

        // cell1 is icon and item name
        const buttonItemNameSelect = document.getElementById('itemName');
        const itemName = buttonItemNameSelect.dataset.value;
        if (!itemName) {
            showToast('bg-warning', 'Failed!', 'Pilih jenis Item!');
            document.getElementById('itemName').style.outline = '1px solid red';
            return;
        } else {
            document.getElementById('itemName').style.outline = 'none';

            // remove data-value and set back to default
            buttonItemNameSelect.dataset.value = '';
            buttonItemNameSelect.innerHTML = 'Tidak Dipilih';
        }
        const itemCount = document.getElementById('itemCount').value;

        let table = document.getElementById('listItemRedeem');
        let row = table.insertRow(-1);
        let cell1 = row.insertCell(0);
        let cell2 = row.insertCell(1);
        let cell3 = row.insertCell(2);

        const tablePos = table.rows.length - 1;

        cell1.innerHTML = `<i class="${mapRedeemItem[itemName].icon}"></i> ${itemName}`;
        cell2.innerHTML = itemCount;
        let dropdown = document.createElement('div');
        dropdown.className = 'dropdown';
        dropdown.innerHTML = `<button type="button" class="btn p-0 dropdown-toggle hide-arrow" data-bs-toggle="dropdown">
          <i class="bx bx-dots-vertical-rounded"></i>
        </button>
        <div class="dropdown-menu">
          <a class="dropdown-item" href="javascript:editCountItem(${tablePos});"><i class="bx bx-edit-alt me-1"></i> Edit</a>
          <a class="dropdown-item" href="javascript:removeItem(${tablePos});"><i class="bx bx-trash me-1"></i> Delete</a>
        </div>`;
        cell3.appendChild(dropdown);
        document.getElementById('addItemRedeemForm').reset();
        refreshTableItemCalculation();
    });

    // submit redeem form
    document.querySelector('form.submit-redeem').addEventListener('submit', async (event) => {
        event.preventDefault();

        const priceRedeem = Number(document.getElementById('priceRedeem').value.replace(/\./g, '').split(' ')[1]);
        if(priceRedeem === 0) {
            showToast('bg-warning', 'Failed!', 'Tambahkan item redeem!');
            return;
        }

        // change submit button to loading, '<span class="bx bx-loader bx-spin" role="status" aria-hidden="true"></span>';
        document.querySelector('button.submit-redeem').innerHTML = '<span class="bx bx-loader bx-spin" role="status" aria-hidden="true"></span>';
        document.querySelector('button.submit-redeem').setAttribute('disabled', 'disabled');
        
        const redeemCount = Number(document.getElementById('redeemCount').value.replace(/\./g, ''));
        const timeRedeem = document.getElementById('timeRedeemSelect').dataset.value.replace(/\./g, '');
        const timeValueRedeem = Number(document.getElementById('timeRedeem').value.replace(/\./g, ''));
        const table = document.getElementById('listItemRedeem');
        const redeemItems = [];
        for (let i = 1; i < table.rows.length; i++) {
            const cell = table.rows[i].querySelectorAll('td')[0];
            const itemName = cell.innerText.trim();
            const itemCount = table.rows[i].querySelectorAll('td')[1].innerText.replace(/\./g, '');
            redeemItems.push({
                name: itemName,
                count: Number(itemCount)
            });
        }

        const formDataBody = new FormData();
        formDataBody.append('redeemCount', redeemCount);
        formDataBody.append('timeRedeem', timeRedeem);
        formDataBody.append('timeValueRedeem', timeValueRedeem);
        formDataBody.append('priceRedeem', priceRedeem);
        formDataBody.append('redeemItems', JSON.stringify(redeemItems));

        fetch('/api/submit-redeem', {
            method: 'POST',
            body: formDataBody
        }).then((response) => {
            if (response.ok) {
                const data = response.json();
                if(data.status) {
                    document.querySelector('input#resultCodeRedeem').value = data.data.codeRedeem;
                    document.querySelector('input#resultOwnerRedeem').value = data.data.ownerRedeem;
                    document.querySelector('input#resultLimitRedeem').value = data.data.limitRedeem;
                    document.querySelector('input#resultTimeRedeem').value = data.data.timeRedeem;
                    document.querySelector('input#resultTimeExpired').value = data.data.timeExpired;
                    $('#modalCenter').modal('show');
                } else {
                    throw new Error(data.message);
                }
            }
            throw new Error('Network response was not ok. Response: ' + response.ok + '\n' + response.statusText);
        }).then((data) => {
            console.log(data);
            showToast('bg-success', 'Success!', data.message);
        }).catch((error) => {
            console.error('Error:', error);
            showToast('bg-danger', 'Error!', 'Something went wrong!\n' + error.message);
        });

        // change submit button to normal, 'Submit'
        document.querySelector('button.submit-redeem').innerHTML = 'SUBMIT';
        document.querySelector('button.submit-redeem').removeAttribute('disabled');
    });
})()

function removeItem(tablePos) {
    document.getElementById('listItemRedeem').deleteRow(tablePos);
    refreshTableItemCalculation();
}

function editCountItem(tablePos) {
    let row = document.getElementById('listItemRedeem').rows[tablePos];
    let cell = row.querySelectorAll('td')[1];
    let count = cell.innerHTML;
    const idRandom = Math.floor(Math.random() * 1000);
    cell.innerHTML = `<input type="text" expected="number" class="form-control" value="${count}" style="width: 100px;" id="${idRandom}" onkeyup="commasEvent('${idRandom}')">`;
    let dropdown = row.querySelectorAll('td')[2].querySelector('button');
    // change dropdown to save button
    dropdown.innerHTML = '<button class="btn btn-primary">Save</button>';
    dropdown.setAttribute('onclick', `saveEditItem(${tablePos})`);
    dropdown.removeAttribute('data-bs-toggle');
}

function saveEditItem(tablePos) {
    let row = document.getElementById('listItemRedeem').rows[tablePos];
    let cell = row.querySelectorAll('td')[1];
    let count = cell.querySelector('input').value;
    cell.innerHTML = count;
    let dropdown = row.querySelectorAll('td')[2].querySelector('button');
    dropdown.innerHTML = '<i class="bx bx-dots-vertical-rounded"></i>';
    dropdown.setAttribute('data-bs-toggle', 'dropdown');
    dropdown.removeAttribute('onclick');

    refreshTableItemCalculation();
}

function changeItemName(item, liPos) {
    let itemName = document.getElementById('itemName');
    itemName.innerHTML = item;
    itemName.dataset.value = item;

    // unhide all dropdown liPos
    let listItems = document.querySelectorAll('.list-item-name li');
    listItems.forEach((li) => {
        // check table listItemRedeem if item already exist
        let table = document.getElementById('listItemRedeem');
        let exist = false;
        for (let i = 1; i < table.rows.length; i++) {
            let cell = table.rows[i].querySelectorAll('td')[0];
            if (cell.innerText.includes(li.innerText)) {
                exist = true;
                break;
            }
        }
        if (!exist) {
            li.style.display = 'block';
        }
    });

    // hide the current dropdown liPos
    document.querySelector('.list-item-name').children[liPos].style.display = 'none';
}

function refreshTableItemCalculation() {
    let table = document.getElementById('listItemRedeem');
    let totalPricePerKey = 0;
    for (let i = 1; i < table.rows.length; i++) {
        let cell = table.rows[i].querySelectorAll('td')[0];
        let itemName = cell.innerText.trim();
        let itemCount = table.rows[i].querySelectorAll('td')[1].innerText.replace(/\./g, '');
        totalPricePerKey += mapRedeemItem[itemName].price * itemCount;
    }
    const redeemCount = document.getElementById('redeemCount').value.replace(/\./g, '');
    const timeRedeem = document.getElementById('timeRedeemSelect').dataset.value.replace(/\./g, '');
    let timeValueRedeem = Number(document.getElementById('timeRedeem').value.replace(/\./g, ''));
    if (timeRedeem === 'Jam') {
        timeValueRedeem = 1;
    }
    const allKeyPrice = total = redeemCount * totalPricePerKey;
    const countDayPrice = timeValueRedeem * allKeyPrice;
    document.getElementById('priceRedeem').value = 'Rp. ' + numberWithCommas(countDayPrice);
}

// Submit Section
function changeTimeRedeem(item) {
    let timeRedeem = document.getElementById('timeRedeemSelect');
    timeRedeem.innerHTML = item;
    timeRedeem.dataset.value = item;
    refreshTableItemCalculation();
}

function commasEvent(event) {
    const getEvent = document.getElementById(event);
    getEvent.value = numberWithCommas(removeNaN(getEvent.value.replace(/\./g, '')));
    if((event === 'redeemCount') || (event === 'timeRedeem')) {
        refreshTableItemCalculation();
    }
} 

function removeNaN(value) {
    return value.replace(/\D/g, '');
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}