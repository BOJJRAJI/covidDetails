const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
const dbPath = path.join(__dirname, "covid19India.db");
app.use(express.json());
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API1
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
  SELECT state_id as stateId,
  state_name as stateName,
  population
  FROM state
  order by state_id;
  `;

  const stateDetails = await db.all(getStatesQuery);
  response.send(stateDetails);
});

//API2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const getStateQuery = `
  SELECT state_id as stateId,
  state_name as stateName,
  population
  FROM state
  WHERE state_id=${stateId};
  `;

  const stateDetails = await db.get(getStateQuery);

  response.send(stateDetails);
});

//API3
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const addDistrictQuery = `
  INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
  VALUES 
  ('${districtName}',
  ${stateId},
  ${cases},
  ${cured},
  ${active},
  ${deaths}
  );`;

  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//API4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictQuery = `
  SELECT 
   district_id as  districtId,
    district_name as  districtName,state_id as stateId,
    cases,cured,active,deaths
  FROM district
  WHERE district_id=${districtId};
  `;

  const districtDetails = await db.get(getDistrictQuery);

  response.send(districtDetails);
});

//API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const deleteDistrictQuery = `
  DELETE 
  FROM district
  WHERE district_id=${districtId};
  `;

  await db.run(deleteDistrictQuery);

  response.send("District Removed");
});

//API6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const updateDistrictQuery = `
  UPDATE 
  district SET 
 district_name='${districtName}',
 state_id= ${stateId},
 cases= ${cases},
 cured= ${cured},
 active= ${active},
  deaths=${deaths}
  WHERE district_id=${districtId}
  ;`;

  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const getDetailsQuery = `
 SELECT 
 SUM(cases) as  totalCases,
 SUM(cured) AS  totalCured,
 SUM(active) AS    totalActive,
 SUM(deaths) AS   totalDeaths
 FROM 
 district 
 where 
 state_id=${stateId}
 ;`;

  const statsDetails = await db.get(getDetailsQuery);
  response.send(statsDetails);
});

//API7

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictStateQuery = `
  SELECT 
  state.state_name as  stateName
  FROM state join district on state.state_id=district.state_id
  WHERE district_id=${districtId};
  `;

  const StateNameDetails = await db.get(getDistrictStateQuery);

  response.send(StateNameDetails);
});

module.exports = app;

