api_version = "1.10.0.0"

local ffi = require("ffi")
local json = (loadfile "dkjson.lua")()

local SERVER_QUERY = 1
local ADMIN_QUERY_BASE = 2

ffi.cdef [[
    typedef void http_response;
    http_response *http_get(const char *url, bool async);
    void http_destroy_response(http_response *);
    bool http_response_is_null(http_response *);
    const char *http_read_response(const http_response *);
    bool http_response_received( http_response *);
    uint32_t http_response_length(const http_response *);
]]

local http_client = ffi.load("lua_http_client")

local http_get = http_client.http_get
local http_destroy = http_client.http_destroy_response
local http_is_null = http_client.http_response_is_null
local http_read = http_client.http_read_response
local http_received = http_client.http_response_received
local http_length = http_client.http_response_length

local authFileName = "ServerAuth.json"
local authData = {}
local queries = {}
local maxAwaitTime = 5000 -- miliseconds
local recurrenceTime = 50 -- miliseconds

local validationToken

local admins = {}
--[[
	[ ip:port ] = { level, token }
]]--
function OnScriptLoad()
	cprint("====LOADING ADMINS MANAGEMENT====")
	cprint("Reading server auth data....")

	local authFile = io.open( authFileName, "r" )

	if not authFile then
		cprint( "Could not find auth data, admins management init cancelled")
		return
	end

	local authFileContent = authFile:read("a")

	authData = json.decode( authFileContent );

	if not authData then
		cprint( "Could not find auth data, admins management init cancelled")
		return
	end

	if not authData["ServerName"] or not authData["ServerPassword"] or not authData["QueryUrl"] then
		cprint( "Invalid auth fileds data, admins management init cancelled")
		return
	end

	authFile : close()
	cprint( "Successfully read auth data !!" )
	cprint( "Checking server record on database..." )


	local url = 
		authData["QueryUrl"] .. 
		"/api/servers/create/" .. authData["ServerName"] .. 
		"/" .. authData["ServerPassword"]
	GenGetRequest( url, SERVER_QUERY, OnServerLogin )

end


function OnScriptUnload()
	authData = {}
end

function getArgs(str)
	args = {}
	for arg in string.gmatch(str,"[^%s]+") do
		table.insert(args,arg)
	end
	return args
end

function GenGetRequest( url, queryId, callback, ... )

	if not args then
		args = "nothing"
	end
	
	if queries[queryId] then
		return "There is a already a running query for this id"
	end

	local query = http_get( 
		url,
		true
	)

	queries[ queryId ] = {
		["query"] = query,
		["callback"] = callback
	}

	local time_cumulated = 0
	timer(recurrenceTime, "CheckResponse", queryId, time_cumulated, args)

end

function CheckResponse( query_id, time_cumulated, ... )
	query_id = tonumber(query_id)
	local await_time = tonumber(time_cumulated)

	if( not query_id or not await_time ) then
		return false
	end

	local queryData = queries [ query_id ]
	
	local query, callback
	if( not queryData ) then 
		return false
	end

	query = queryData["query"]
	callback = queryData["callback"]

	if query then
		if http_received (query) then
			local received_string = ffi.string( http_read( query ))
			local received_data = json.decode( received_string )

			
			queries [query_id] = received_data
			http_destroy ( query )
			callback( query_id, args )
			queries [query_id] = nil
			return false
		else
			await_time = await_time + recurrenceTime
		end

		if await_time >= maxAwaitTime then
			callback( -1, args )
			queries [query_id] = nil
		else
			timer(recurrenceTime, "CheckResponse", query_id, await_time)
		end
	end
	return false
end

function GetBaseUrlAdminQuery ()

	local token = "invalid"

	if validationToken then
		token = validationToken		
	end
	
	return authData["QueryUrl"] .. "/api/servers/query/" ..
		token .. "/admins/"
end

function OnCommand( PlayerIndex, Command, env)

	local args = getArgs( Command )
	local size = #args
	local playerQueryId = ADMIN_QUERY_BASE + ( PlayerIndex - 1)

	if size > 0 then

		local commandName = args[1]
		local level = tonumber(get_var( PlayerIndex, "$lvl"))

		if commandName == "alogin" and size > 1 then

			local baseUrl = GetBaseUrlAdminQuery()
			local playerName = get_var( PlayerIndex, "$name" )

			local errorMessage = GenGetRequest(
				baseUrl + "login/" .. 
					playerName .. "/" .. args[2] ,
					playerQueryId,
					PlayerIndex
				)

			if errorMessage then
				say(PlayerIndex, errorMessage)
			end


		elseif commandName == "reconnect" and level > -1 then

			local url = 
			authData["QueryUrl"] .. 
			"/api/servers/create/" .. authData["ServerName"] .. 
			"/" .. authData["ServerPassword"]

			GenGetRequest( url, SERVER_QUERY, OnServerLogin )
		end	
	end
	
end

function OnLeave ( PlayerIndex )
	local playerQueryId = ADMIN_QUERY_BASE + ( PlayerIndex - 1)

	local currentQuery = queries [playerQueryId]

	if currentQuery then
		http_destroy ( query )
		queries [playerQueryId] = nil
	end

end

function OnJoin( PlayerIndex )
	
	local ip = get_var( PlayerIndex, "$ip" )

	local adminData = admins [ip]

	if adminData then
		-- login admin again if needed via memory
	end
end

function OnServerLogin( queryId, ... )

	if queryId < 0 then
		-- Timeout or error
		cprint("Could not connect to server, admins management init cancelled ")
	end

	local response = queries [queryId]

	if response then
		if response["statusMessage"] == "success" then
			cprint("Added server to database successfully")

			validationToken = response["token"]

		elseif response["statusCode"] == 409 then
			cprint("Succesfully found server record")
			validationToken = response["token"]
		else
			cprint("Unknown error, admins management init cancelled")
			return
		end
		
		register_callback( cb["EVENT_COMMAND"], "OnCommand")
		register_callback( cb["EVENT_LEAVE"], "OnLeave")
		register_callback( cb["EVENT_JOIN"], "OnJoin")
	end
end

function OnPlayerLogin ( queryId, ... )
	if #args > 0 then

		local PlayerIndex = args[1]

		if queryId < 0 then
			-- Timeout or error
			say(PlayerIndex,"Could not connect to database server")
			return
		end

		local response = queries[queryId]

		if response["statusMessage"] == "success" then
			
			local level = response["admLevel"]
			local token = response["token"]

			local name = get_var( PlayerIndex, "$name")
			local ip = get_var( PlayerIndex, "$ip" )

			admins[ ip ] = { level, token }

			-- if possible, change default sapp's level via memory

			say( PlayerIndex, "Successfully logged in, " .. name)
		elseif response["statusCode"] == 401 then
			say( PlayerIndex, "Invalid user / password data")
		else
			say( PlayerIndex, "Unknown error while logging in")
		end

	else
		return
	end
end