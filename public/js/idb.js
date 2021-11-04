let db;
//open budget version 1
const request = indexedDB.open('budget', 1);

//will create  an object
request.onupgradeneeded = function(event){
  const db = event.target.result;
  db.createObjectStore('new_budget_item', { autoIncrement: true});
};

//if back online it will upload buget entry
request.onsuccess = function(event){
  db = event.target.result
  if(navigator.onLine){
    uploadBudgetEntry();
  }
};

//if there is an error it will be console logged
request.onerror = function(event){
  console.log(event.target.errorCode);
};

//will save record if off line
function saveRecord(record){
  const transaction = db.transaction(['new_budget_item'], 'readwrite');
  const budgetObjectStore = transaction.objectStore('new_budget_item');
  budgetObjectStore.add(record);
  alert("Offline")
}

//upload function to post when back online
function uploadBudgetEntry() {
  //gets all the records on the db
  const transaction = db.transaction(['new_budget_item'], 'readwrite');
  const budgetObjectStore = transaction.objectStore('new_budget_item');
  const getAll = budgetObjectStore.getAll();
  //post records to mongo db
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
        //returns response
        .then(response => response.json())
        //if error it console log
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          //clears the database after uploaded on line
          const transaction = db.transaction(['new_budget_item'], 'readwrite');
          const budgetObjectStore = transaction.objectStore('new_budget_item');
          budgetObjectStore.clear();
          alert("Update: All pending offline transactions have been posted please reload the page");
        })
        .catch(err => {
          console.log(err);
        });
    }
  };
}