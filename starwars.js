const express = require('express')
const app = express()
const port = 3000
const fetch = require('node-fetch')
const _ = require('lodash');


CACHE = {
  PEOPLE: null,
  PLANETS: null,
  PEOPLE_NAMES: {} // A map from url -> person's name
}

async function getPeople() {
  // This is a simple function to cache the value for PEOPLE
  // In a production system, a different mechanism should be used 
  // that allows for cache-invalidation and other factors
  if (CACHE.PEOPLE !== null) {
    return CACHE.PEOPLE
  } else {
    CACHE.PEOPLE = await fetchPeople();
    return CACHE.PEOPLE
  }
}

async function getPlanets() {
  // This is a simple function to cache the value for PEOPLE
  // In a production system, a different mechanism should be used 
  // that allows for cache-invalidation and other factors
  if (CACHE.PLANETS !== null) {
    return CACHE.PLANETS
  } else {
    CACHE.PLANETS = await fetchPlanets();
    return CACHE.PLANETS
  }
}

async function getPersonName(url) {
  if (!CACHE.PEOPLE_NAMES[url]) {
    const response = await fetch(url);
    const json = await response.json();
    CACHE.PEOPLE_NAMES[url] = json.name;
  }
  return CACHE.PEOPLE_NAMES[url];
}

async function fetchAll(initial) {
  let response;
  let ret = []
  let json = {next: initial};

  // Normally would wrap this in try/catch
  // But to keep things short, no error handling is done
  while (json.next !== null) {
    response = await fetch(json.next);
    json = await response.json()
    ret = ret.concat(json.results)
  }
  return ret
}

async function fetchPlanets() {
  planets = await fetchAll('https://swapi.dev/api/planets/');

  // Substitute resident links for resident names
  for (let planet of planets) {
    planet.residents = await Promise.all(planet.residents.map((url) => getPersonName(url)))
  }

  return planets;
}

async function fetchPeople() {
  return await fetchAll('https://swapi.dev/api/people/');
}

app.get('/people', async (req, res) => {
  ppl = await getPeople();
  // Lodash sortBy returns a new sorted array
  // Lodash sortBy can handle undefined or values that don't exist
  sorted_ppl = _.sortBy(ppl, [req.query.sortBy])
  res.send(sorted_ppl);
})

app.get('/planets', async (req, res) => {
  planets = await getPlanets();
  res.send(planets)
})

app.listen(port, () => {
  console.log(`Star Wars app listening at http://localhost:${port}`)
})