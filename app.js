const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server started at http://localhost3000");
    });
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertDBMatchObjectToResponseMatchObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//Returns a list of all the players in the player table API
app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
    SELECT 
       *
    FROM 
        player_details`;

  const allPlayersArray = await db.all(getAllPlayersQuery);
  response.send(
    allPlayersArray.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

//Returns a specific player based on the player ID API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
       *
    FROM 
        player_details
    WHERE 
        player_id = ${playerId}`;

  const player = await db.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject(player));
});

//Updates the details of a specific player based on the player ID API
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE 
        player_details
    SET
        player_name = '${playerName}'
        
    WHERE 
        player_id = ${playerId}`;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Returns the match details of a specific match API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
       *
    FROM 
        match_details
    WHERE 
        match_id = ${matchId}`;

  const match = await db.get(getMatchQuery);
  response.send(convertDBMatchObjectToResponseMatchObject(match));
});

//Returns a list of all the matches of a player API
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getAllMatchesPlayerQuery = `
    SELECT 
       *
    FROM 
        player_match_score 
    NATURAL JOIN
       match_details
    WHERE 
        player_id = '${playerId}'`;

  const allMatchesPlayerArray = await db.all(getAllMatchesPlayerQuery);
  response.send(
    allMatchesPlayerArray.map((eachMatch) =>
      convertDBMatchObjectToResponseMatchObject(eachMatch)
    )
  );
});

//Returns a list of players of a specific match API
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getAllPlayersMatchQuery = `
    SELECT 
       *
    FROM 
       player_match_score
    NATURAL JOIN
        player_details
    WHERE 
        match_id = '${matchId}'`;

  const allPlayersMatchArray = await db.all(getAllPlayersMatchQuery);
  response.send(
    allPlayersMatchArray.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID API
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatsPlayerQuery = `
    SELECT 
       player_id AS playerId,
       player_name AS playerName,
       SUM(score) AS totalScore,
       SUM(fours) AS totalFours,
       SUM(sixes) AS totalSixes
    FROM 
        player_match_score
    NATURAL JOIN
       player_details
    WHERE 
        player_id = '${playerId}'`;

  const playerStats = await db.get(getStatsPlayerQuery);
  response.send(playerStats);
});

module.exports = app;
