const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

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
    console.log(`DB error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertObjectIntoList = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertObjectIntoResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

// API 1
app.get("/players/", async (request, response) => {
  const playersList = `
            Select
               *
            From 
                 player_details;`;

  const players = await db.all(playersList);

  response.send(players.map((eachPlayer) => convertObjectIntoList(eachPlayer)));
});

//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerId = `
    SELECT
    *
    FROM
    player_details
    WHERE
    player_id = ${playerId};`;

  const player = await db.get(getPlayerId);
  response.send(convertObjectIntoList(player));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;

  const { playerName } = playerDetails;

  const updatePlayer = `
    UPDATE
       player_details
    SET
       player_name = "${playerName}"
    WHERE
      player_id = ${playerId};`;

  await db.run(updatePlayer);
  response.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const getPlayer = `
    SELECT
      * 
    FROM
      match_details
    WHERE
    match_id = ${matchId};`;

  const match = await db.get(getPlayer);
  response.send(convertObjectIntoResponseObject(match));
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `
    SELECT
    *
    FROM
    match_details NATURAL JOIN player_match_score 
    WHERE
    player_id = ${playerId};`;

  const matchPlayer = await db.all(getPlayer);
  response.send(
    matchPlayer.map((eachMatch) => convertObjectIntoResponseObject(eachMatch))
  );
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayers = `
    SELECT
    *
    FROM
      player_details NATURAL JOIN player_match_score
    WHERE
        match_id = ${matchId};`;

  const playersList = await db.all(getPlayers);
  response.send(
    playersList.map((eachPlayer) => convertObjectIntoList(eachPlayer))
  );
});

// API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerId = `
    SELECT  player_id as playerId,player_name as playerName,
    sum(score) as totalScore, sum(fours) as totalFours, sum(sixes) as totalSixes FROM player_details NATURAL JOIN player_match_score 
    WHERE player_id = ${playerId}
    GROUP BY
    player_id;`;

  const player = await db.get(getPlayerId);
  response.send(player);
});

module.exports = app;
