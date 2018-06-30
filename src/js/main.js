let dbPromise;

/*
	check if the navigator supports service worker then register serviceWorker
*/
if(navigator.serviceWorker) {
	navigator.serviceWorker.register('/sw.js').then(reg => {
		if (navigator.serviceWorker.controller) {
			if (reg.waiting) {
	    		//show refresh modal
				updateReady(reg);	
				return;
		    }

		    if (reg.installing) {
		    	reg.installing.addEventListener('statechange', function() {
			    	if (reg.installing.state == 'installed') {
			    		updateReady(reg);
			    	}
			  	});
      			return;
		    }
		    
		    reg.addEventListener('updatefound', function() {
		    	reg.installing.addEventListener('statechange', function() {
			    	if (reg.waiting) {
			    		updateReady(reg);
			    	}
			  	});
		    });
		    
		}
	})


	var refreshing;
	navigator.serviceWorker.addEventListener('controllerchange', function() {
		if (!refreshing) {;
			window.location.reload();
			refreshing = true;
		}
	});

	


	//create an IndexedDB for fetched rates with an index for the date and time of request
	//id: is the concatenaion of source and destination currency
	dbPromise = idb.open('currency-converter-db', 1, upgradeDB => {
		let store = upgradeDB.createObjectStore('rates', { keyPath: 'id' });
		store.createIndex('by-date', 'date');
	})
}


/*
	fetch all currencies then add them to the two lists(#srcCurrency and #destCurrency)
*/
fetch('https://free.currencyconverterapi.com/api/v5/currencies').then(response => {
	response.json().then(data => {
		for (const key in data.results) {
			let obj = data.results[key];
			var newListItem = document.createElement('li');
			newListItem.append(obj.id + ' (' + obj.currencyName + ')');
			let firstList = document.getElementById("srcCurrency");
			firstList.append(newListItem.cloneNode(true));
			let secondList = document.getElementById("destCurrency");
			secondList.append(newListItem);
		}
	})
})


/*
	convert currency click event
*/
document.getElementById('convert').addEventListener('click', () => {
	let srcCurrency = '', destCurrency = '';
	
	let firstList = document.getElementById("srcCurrency").getElementsByClassName('selected')[0];
	if(firstList !== undefined)
		srcCurrency = firstList.innerText.split(' ', 1)[0];
	
	let secondList = document.getElementById("destCurrency").getElementsByClassName('selected')[0];
	if(secondList !== undefined)
		destCurrency = secondList.innerText.split(' ', 1)[0];

	let inputValue = document.getElementById('srcInput').value;
	let id = `${srcCurrency}_${destCurrency}`;

	/*
		fetch rates
		id: is the concatenaion of source and destination currency
		
		if the fetch success put the results in the store and show it in the input field
		and limit stored rates to last fetched one hundered rate
		if the fetch fails in the catch block search the store if it fullfils
		put results in input field else empty the input field
	*/
	fetch(`https://free.currencyconverterapi.com/api/v5/convert?q=${id}&compact=ultra`)
	.then(response => {
		response.json().then(results => {
			let rate = results[Object.keys(results)[0]];
			document.getElementById('destInput').value = rate * inputValue;
			dbPromise.then(db => {
		    	if (db) {

		    		let store = db.transaction('rates', 'readwrite').objectStore('rates');
					store.put({id, rate, date: new Date()});

					//limit store to 100 items
				    store.index('by-date').openCursor(null, "prev").then(cursor => {
				    	return cursor.advance(100);
				    }).then(function deleteRemaining(cursor) {
				    	if (cursor) {
				    		cursor.delete();
				      		return cursor.continue().then(deleteRemaining);
				    	}
				    });
		    	}
			})
		})
	}).catch(() => {
		dbPromise.then(db => {
		    if (db) {
			    let index = db.transaction('rates').objectStore('rates').index('by-date');
		    	index.getAll().then(rates => {
		    		let value = '';
		    		rates.forEach(rate => {
		    			if(rate.id === id) {
							value = rate.rate * inputValue
						}
		    		})
		    		document.getElementById('destInput').value = value;
		    	});
			}
  		});
	})
})


/*
	Bind click event to the lists of currencies
	and add "selected" class to chosen list item
*/
let lists = document.getElementsByClassName("currencyList");
[].forEach.call(lists, list => {
	list.addEventListener("click", e => {
		if (e.target && e.target.matches("li")) {
			let selectedItem = e.target.parentElement.getElementsByClassName('selected')[0];
			if(selectedItem !== undefined)
				selectedItem.classList.remove('selected');
			e.target.className = "selected";
		}
	})
});



let now = new Date()
months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
let formattedDate = now.getDate()  + "-" + months[now.getMonth()] + "-" + now.getFullYear()
document.getElementById('date').innerText = formattedDate;



function updateReady(reg) {
	document.getElementById('message').className = 'shown';
	document.getElementById('refresh').addEventListener('click', () => {
		reg.waiting.postMessage({action: 'skipWaiting'});
	})
	document.getElementById('dismiss').addEventListener('click', () => {
		this.parentElement.classList.remove('shown');
	})		
}	