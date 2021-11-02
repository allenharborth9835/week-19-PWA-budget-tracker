let db;
const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function(event){
  const db = event.target.result;
  db.createObjectStore('new_budget_item', { autoIncrement: true});
};

request.onsuccess = function(event){
  db = event.target.result
  if(navigator.onLine){
    uploadBudgetEntry();
  }
};

request.onerror = function(event){
  console.log(event.target.errorCode);
};

function saveRecord(record){
  const transaction = db.transaction(['new_budget_item'], 'readwrite');
  const budgetObjectStore = transaction.objectStore('new_budget_item');
  budgetObjectStore.add(record);
  alert("Offline")
}

function uploadBudgetEntry() {
  const transaction = db.transaction(['new_budget_item'], 'readwrite');

  const budgetObjectStore = transaction.objectStore('new_budget_item');

  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const transaction = db.transaction(['new_budget_item'], 'readwrite');
          const budgetObjectStore = transaction.objectStore('new_budget_item');
          budgetObjectStore.clear();
          location.reload()
          alert("Update: All pending offline transactions have been posted please reload the page");
        })
        .catch(err => {
          console.log(err);
        });
    }
  };
}