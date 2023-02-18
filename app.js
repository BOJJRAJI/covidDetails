const express = require("express");
const app = express();
app.use(express.json());

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const path = require("path");
const dbpath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1
app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `SELECT * FROM state;`;

  const states = await db.all(getAllStatesQuery);

  function convertCamelCase(dbObject) {
    return {
      stateId: dbObject.state_id,
      stateName: dbObject.state_name,
      population: dbObject.population,
    };
  }
  response.send(states.map((stateDetails) => convertCamelCase(stateDetails)));
});

//API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getAllStatesQuery = `SELECT * FROM state WHERE state_id=${stateId};`;

  const stateDetails = await db.get(getAllStatesQuery);

  function convertCamelCase(dbObject) {
    return {
      stateId: dbObject.state_id,
      stateName: dbObject.state_name,
      population: dbObject.population,
    };
  }
  response.send(convertCamelCase(stateDetails));
});

//API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictDetailsQuery = `
    INSERT INTO district 
    (district_name,state_id,cases,cured,active,deaths)
    VALUES (
    '${districtName}',
    '${stateId}',
    '${cases}',
    '${cured}',
    '${active}',
    '${deaths}')
      ;`;
  await db.run(addDistrictDetailsQuery);
  response.send("District Successfully Added");
});

//API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getAllDistrictQuery = `SELECT * FROM district WHERE district_id=${districtId};`;

  const districtDetails = await db.get(getAllDistrictQuery);

  function convertCamelCase(dbObject) {
    return {
      districtId: dbObject.district_id,
      districtName: dbObject.district_name,
      stateId: dbObject.state_id,
      cases: dbObject.cases,
      cured: dbObject.cured,
      active: dbObject.active,
      deaths: dbObject.deaths,
    };
  }

  response.send(convertCamelCase(districtDetails));
});

//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id=${districtId};`;

  await db.get(deleteDistrictQuery);
  response.send("District Removed");
});

//API6

app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictDetailsQuery = `
    UPDATE district SET
    district_name='${districtName}',
    state_id= '${stateId}',
    cases='${cases}',
    cured='${cured}',
    active='${active}',
    deaths='${deaths}'
    WHERE district_id=${districtId}
      ;`;
  await db.run(addDistrictDetailsQuery);
  response.send("District Details Updated");
});

//API7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT SUM(cases) ,
    SUM(cured) ,
    SUM(active) ,
    SUM(deaths) 
    FROM district WHERE state_id=${stateId}
    ;`;
  const stats = await db.get(getStateStatsQuery);
  response.send({
    totalCase: stats["SUM(cases)"],
    totalCure: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  //const getAllDistrictQuery = `SELECT state_id FROM district WHERE district_id=${districtId};`;

  //const stateNameDetails = `SELECT state_name as stateName FROM state WHERE
  //state_id =${getAllDistrictQuery.state_id} `;

  const getDistrictIdQuery = `
select state_id from district
where district_id = ${districtId};`;

  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);

  const getStateNameQuery = `
select state_name as stateName from state
where state_id = ${getDistrictIdQueryResponse.state_id};`;

  const stateName = await db.get(getStateNameQuery);

  response.send(stateName);
});

module.exports = app;
