//fn that saves the record of transaction
//sends to index db for offline

let db;

const request = indexedDB.open('Budget_db', 1);

request.onupgradeneeded = function (evt) {
    console.log('Upgrade needed in index db');

    const temp_db = evt.target.result;

    if(temp_db.objectStoreNames.length === 0){
        temp_db.createObjectStore('BudgetStore', { autoIncrement: true })
    }
};

request.onerror = evt => {
    console.log(`Error: ${ evt.target.errorCode }`);
};

const dbCheck = function () {
    console.log('Checking db');

    let transaction = db.transaction(['BudgetStore'], 'readwrite');

    const store = transaction.objectStore('BudgetStore');

    const getAll = store.getAll();
    
    getAll.onsuccess = function (){

        if(getAll.result.length > 0){
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*', 'Content-Type': 'application/json',
                },
            })
            .then(res => res.json())
            .then(data => {
                if(data.length !== 0) {
                    transaction = db.transaction(['BudgetStore'], 'readwrite');

                    const currentStore = transaction.objectStore('BudgetStore');
                    
                    currentStore.clear();
                    console.log('Clearing store');
                }
            })
            .catch( err => console.log('Fetch Bulk Add Error:', err))
        }
    };
};

request.onsuccess = evt => {
    console.log('success');
    db = evt.target.result;

    if(navigator.onLine){
        console.log('backend online');
        dbCheck();
    }
};

const saveRecord = rec => {
    console.log('save record envoked');

    const transaction = db.transaction(['BudgetStore'], 'readwrite');
    const store = transaction.objectStore('BudgetStore');
    store.add(rec);
};

window.addEventListener('online', dbCheck);