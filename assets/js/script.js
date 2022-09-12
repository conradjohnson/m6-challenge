// api key for Open Weather Maps API (OWM)
let apiKey = "3d1b685f97f6f721376ef1a79f897d24";

// page elements for input and dom manipulation
let searchForm = $('#search-form');
let searchInput = $('#city-search');
let searchList = $('#search-list');
let cityTitle = $('#h2-city-title');
let cityTemp = $('#city-temp');
let cityWind = $('#city-wind');
let cityHumidity = $('#city-humidity');
let cityUV = $('#city-uv');
let forecastRow = $('#forecast-row');
let pageTime = $('#page-time');

//initial values for localStorage array storage.
let citySearchList = [];


//set initial time
pageTime.text(moment().format('h:mm A - M/D/YYYY'));

//update time on page if user is here longer than a minute
setInterval( function(){ pageTime.text(moment().format('h:mm A - M/D/YYYY'));}, 60000 )

// show list of previous searches
populateList();


//listen for submits on city search
searchForm.on('submit', addToList);
//listen for delete x button on search list.
searchList.on('click', listClick);


// function add a city to the list
function addToList(event){
    event.preventDefault();

    //pull existing localStorage city list
    citySearchList =  JSON.parse(localStorage.getItem("citySearchList")|| "[]");
    
    //get city to add to list
    let cityToAdd = searchInput.val().trim();
    // if nothing in search field, then don't add.  
    // search field has also been restricted to the city list
    if (cityToAdd.length == 0){
        return;
    }
    //check that we don't already have this in the list
    //and that we can resolve the city with OWM api.
      //console.log(cityCheck);
    if (citySearchList.indexOf(cityToAdd) == -1){
        let cityLabel = cityToAdd.split(', ');
        //see if the city resolves with OWM api
        fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityLabel[0]).trim()},${encodeURIComponent(cityLabel[1].trim())},US&limit=1&appid=${apiKey}`)
        .then( function(response){
            return response.json();
        })
        .then( function(data){
            //if we get a result from api
            if (data.length==1){
                //add city to beginning of UI array for localStorage
                citySearchList.unshift(cityToAdd);
                //overwrite localstorage for our city search list
                localStorage.setItem("citySearchList", JSON.stringify(citySearchList));
                //call populate list function
                populateList();
                //clear out the search field
                searchInput.val('');
                //show the detail of the just entered city
                cityDetail(cityToAdd);
            } 
        })
      
    }
    
}




// forwarding function to see if the click action 
//  on our list is to show detail or to delete list item.

function listClick(event){
    let element = event.target;
    // if it is a remove from list, then let's remove from list.
    if (element.matches("button") === true) {
        removeFromList(event);
    }
    //if it is a search list item to show detail, then let's populate the detail.
    if (element.matches("a") === true){
        //get the index of the list item
        let index = element.getAttribute("data-list-index");
        //pull the city name, ST from the local storage at that index
        citySearchList =  JSON.parse(localStorage.getItem("citySearchList")|| "[]");
        let cityNameSt = citySearchList[index];
        //call our city detail function.
        cityDetail(cityNameSt);

    }

}


// function to populate UI for City Detail
function cityDetail(cityNameSt){
    console.log(cityNameSt);
    let cityLabel = cityNameSt.split(', ');
    console.log('"'+cityLabel[0]+'", "'+ cityLabel[1]+'"');
    console.log(`https://api.openweathermap.org/geo/1.0/direct?q=${cityLabel[0]},${cityLabel[1]},US&limit=1&appid=${apiKey}`);
    console.log(`https://api.openweathermap.org/data/2.5/forecast?q=${cityLabel[0]},${cityLabel[1]},US&units=imperial&appid=${apiKey}`);
    // first, lets get the lat/long for the city, st combo
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityLabel[0]},${cityLabel[1]},US&units=imperial&appid=${apiKey}`)
    .then( function(response){
        return response.json();
    })
    .then( function(data) {
        //set the UI Elements to values of the weather details
        cityTitle.text(cityNameSt);
        cityTitle.append(`<img src="https://openweathermap.org/img/w/${data.weather[0].icon}.png" alt="${cityNameSt + " weather icon"}"/>`);
        cityTemp.text(data.main.temp + "°F");
        cityWind.text(data.wind.speed + " MPH");
        cityHumidity.text(data.main.humidity+ " %");
        
        //get the geocoding here for the UV Index
        fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${cityLabel[0]},${cityLabel[1]},US&limit=1&appid=${apiKey}`)
        .then(function(response){
            return response.json();
        })
        .then( function(geocodes){
            // get the lat/lon values.
            // there is a bug in here where we don't qualify the state with the API
            // use case: Breckenridge, CO will return the UV index of Breckenridge, TX
            // as we only accept the 1st data object ("...&limit1..."), otherwise we'd need to read the whole list and 
            // resolve the state code with the API value of long state name. (does 'Colorado' equal 'CO'?)
            let lat = geocodes[0].lat;
            let lon = geocodes[0].lon;
            // now lets get the UV Index:
            fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`)
            .then(function(response){
                return response.json();
            })
            .then(function(data){
                
                let uvIndex = parseInt(data.value);
                //clear out the old classes
                cityUV.removeClass();
                // add text value
                cityUV.text(data.value);
                // see which background color to apply depending on severity of UV Index value
                if (uvIndex<3){
                    //apply background and text color changes
                    cityUV.addClass("uv-low");
                    //append UV Index label
                    cityUV.append(" LOW");
                } else if (uvIndex<6){
                    //apply background and text color changes
                    cityUV.addClass("uv-mod");
                    //append UV Index label
                    cityUV.append(" MODERATE");
                } else if (uvIndex<8){
                    //apply background and text color changes
                    cityUV.addClass("uv-high");
                    //append UV Index label
                    cityUV.append(" HIGH");
                } else if (uvIndex<11){
                    //apply background and text color changes
                    cityUV.addClass("uv-vhigh");
                    //append UV Index label
                    cityUV.append(" VERY HIGH");
                } else {
                    //apply background and text color changes
                    cityUV.addClass("uv-ext");
                    //append UV Index label
                    cityUV.append(" EXTREME");
                }
                
            });
        });

            

       
        // call our city Forecast function to populate the 5 day forecast cards
        cityForecast(cityLabel[0], cityLabel[1]);
    });

}


//function to populate our 5 day forecast based on the lat/long passed
function cityForecast(city,state){
    //get the 5 day forecast array
    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city},${state},US&units=imperial&appid=${apiKey}`)
    .then( function(response){
        return response.json();
    })
    .then( function(data){
        //clear previous forecast UI
        forecastRow.html('');
        
        //store the array of forecast items
        let forecast = data.list;
        //since the 5 day api only gives 3 hour increments, and not a day's forecast, lets
        // pull the values from hour 18 on each day.  we'll set a target date with that 
        // same format and use string compare to see where we match it, and then 
        // use that object's data to fill out our cards.
        // the 16 day api would have been better to avoid this technique
        // but that is a paid service.
        let dateTarget = moment().add(1, 'days').set("hour", 18).set("minute", 00).set("second", 00).format('YYYY-MM-DD HH:mm:ss');
        // since we need to use the above technique, we might not poll the API late enough in the day to get a 5th day.
        //   let's check to see if we have 5 days total. 
        let daysFound = 0;
        for (let i=0; i<forecast.length; i++ ){
            let dateString = forecast[i].dt_txt;
            // if we hit our date/time target, then add the card.
            if (dateString===dateTarget){
                //function for appending card
                // for ease, we pass date string generated from a moment object
                appendForecastCard(forecast[i], moment(dateString).format('M/D/YYYY'));
                // advance the dateTarget to get the next day at the target hour
                dateTarget = moment(dateTarget).add(1, 'days').format('YYYY-MM-DD HH:mm:ss');
                // advance the days found
                daysFound++;
                
            }
        }
        // if too early in the day, then the API doesn't give us a slot for the last day and only gives us 4 day forecast.
        //   in this case, we'll use the last object in the forecast as the 5th day. 
        if (daysFound < 5){
            // advance the dateTarget object for our date label.
            dateTarget = moment(dateTarget).format('M/D/YYYY');
            // draw the last card for the last object in forecast.
            appendForecastCard(forecast[forecast.length-1], dateTarget);
        }
        

    })
}


//function to populate 1 forecast card
function appendForecastCard(forecast, date){
    // build card from forecast object data and date string passed
    let card = `<div class="card col-lg-2 col-md-6 col-sm-6 m-2 p-0 custom-card" style="width: 200px;">
                    <div class="card-body">
                    <h5 class="card-title">${date}</h5>
                    <img src="https://openweathermap.org/img/w/${forecast.weather[0].icon}.png" alt="${date + " forecast icon"}"/>
                    <p class="card-text">Temp: ${forecast.main.temp} °F</p>
                    <p class="card-text">Wind: <span class="font-weight-bold">${forecast.wind.speed} MPH</span></p>
                    <p class="card-text">Humidity: <span class="font-weight-bold">${forecast.main.humidity} %</span></p>
                    <p class="card-text">Chance of Rain: <span class="font-weight-bold">${(forecast.pop*100).toFixed()} %</span></p>
                    </div>
                </div>`;
    // append to the forecast section
    forecastRow.append(card);
}

//function to remove search list item
function removeFromList(event) {
    
    let element = event.target;
   
    // Get its data-list-index value and remove the search element from the list
    let index = element.parentElement.getAttribute("data-list-index");
    // lets get the array from local storage.
    citySearchList =  JSON.parse(localStorage.getItem("citySearchList")|| "[]");
    // remove the list item from that index
    citySearchList.splice(index, 1);
    // overwrite localstorage with the new array
    localStorage.setItem("citySearchList", JSON.stringify(citySearchList));
    
    //populate the list
    populateList();
}


//function to populate the city search list from local storage.
function populateList(){
    // clear the list
    searchList.html("");
    // get city search list from localstorage
    citySearchList =  JSON.parse(localStorage.getItem("citySearchList")|| "[]");
    // for each item in the list, make a list item.
    for (let i=0; i < citySearchList.length; i++){
        searchList.append(`<a href="#" class="list-group-item m-2 list-group-item-action" data-list-index="${i}">${citySearchList[i]} <button>x</button></a>`);
        
    }
}




