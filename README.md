# alexa-runtime

[![circle ci](https://circleci.com/gh/voiceflow/alexa-runtime/tree/master.svg?style=shield)](https://circleci.com/gh/voiceflow/alexa-runtime/tree/master)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=voiceflow_alexa-runtime&metric=coverage)](https://sonarcloud.io/dashboard?id=voiceflow_alexa-runtime)
[![sonar quality gate](https://sonarcloud.io/api/project_badges/measure?project=voiceflow_alexa-runtime&metric=alert_status)](https://sonarcloud.io/dashboard?id=voiceflow_alexa-runtime)

`alexa-runtime` is an http webhook service that handles Alexa requests and generates a response. It manages the state of the Alexa user based on the programs (flows) made on the Voiceflow Creator tool. It can be run independently from Voiceflow.

This is the same service that hosts all Alexa skills created on Voiceflow. This includes serving production apps on and handling millions of requests

![image](https://user-images.githubusercontent.com/5643574/132608647-7f64832d-87e3-41f8-b4c9-0f7c4ba4ff8f.png)

## client architecture

![client architecture](https://user-images.githubusercontent.com/5643574/114078647-343ee780-9877-11eb-8460-83dc46708b19.png)

Upon uploading to Alexa through the desktop, it is important that on your [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask) for the skill, that the webhook endpoint is pointed at the `alexa-runtime` - it essentially acts in place of the typical Lambda Function.

<img width="1281" alt="Screen Shot 2021-04-08 at 2 41 31 PM" src="https://user-images.githubusercontent.com/5643574/114080457-6c472a00-9879-11eb-9fe1-a772f5e526c2.png">

It is important to understand the Alexa Request/Response webhook model
https://developer.amazon.com/en-US/docs/alexa/custom-skills/request-and-response-json-reference.html

### Anatomy of an interaction

1. user says something to Alexa, Alexa uses natural language processing to transcribe user intent, then sends it via webhook (along with other metadata i.e. _userID_) to `alexa-runtime`
2. fetch user state (JSON format) from **end user session storage** based on a _userID_ identifier
3. fetch project version data for initialization parameters from **Voiceflow API/Project File**
4. fetch the current program (flow) that the user is on from **Voiceflow API/Project File**
5. go through each block and update the user state
6. save the final user state to **end user session storage**
7. generate a response based on the final user state, send back to Alexa
8. Alexa interprets response and speaks to user

repeat all steps each time a user speaks to the Alexa skill, to perform a conversation

# configurations

## local/debugging setup

export your voiceflow project from the creator tool. Each time you update your project you will need to export again. You can find the export option here:

![Screenshot from 2020-09-07 12-14-44](https://user-images.githubusercontent.com/5643574/92405522-c3c6c100-f103-11ea-8ba8-6c10173e3419.png)

It should save a .vfr (voiceflow runtime) JSON file from your browser that would be named similar to this: `VF-Project-nPDdD6qZJ9.vfr`

fork `voiceflow/alexa-runtime` and clone to your local machine. Ensure `nodejs`, `npm`, and `yarn` are set up on your local machine. Run `yarn` to install all dependencies.

Add your VF-Project JSON file under `projects/`

Also add the following file to the local repository:

> `.env.local`
>
> ```
> SESSIONS_SOURCE='local'
> PROJECT_SOURCE='[YOUR EXPORTED PROJECT FILE HERE (i.e. VF-Project-nPDdD6qZJ9.json)]'
>
> PORT=4000
> SESSIONS_DYNAMO_TABLE="none"
> VF_DATA_ENDPOINT="none"
>
> INTEGRATIONS_HANDLER_ENDPOINT="none"
>
> LOG_LEVEL="debug"
> MIDDLEWARE_VERBOSITY="short"
>
> ADMIN_SERVER_DATA_API_TOKEN="none"
> DATADOG_API_KEY="none"
>
> PG_USERNAME='PG_USERNAME'
> PG_HOST='PG_HOST'
> PG_DBNAME='PG_DBNAME'
> PG_PASSWORD='PG_PASSWORD'
> PG_PORT='PG_PORT'
> ```

Install a localhost tunnel tool such as [ngrok](https://ngrok.com/), or [localtunnel](https://github.com/localtunnel/localtunnel), or [bespoken proxy](https://read.bespoken.io/cli/commands/#bst-proxy-http). This will allow you expose a localhost endpoint on the internet for Alexa to hit. For the purposes of this guide, we will implement `ngrok`

Run your local instance of `voiceflow/alexa-runtime` with

```
yarn start:local
```

This will now be running on port 4000 of localhost. Expose this with

```
ngrok http 4000
```

In your shell you will see a link similar to this - `https://e9g1335dd0ac.ngrok.io`, note this down. Ensure you copy the `https://` version instead of `http://`

On https://developer.amazon.com/alexa/console/ask find the skill uploaded by the creator tool, click into it. On the left bar, select "Endpoint", it should say something similar to `https://alexa.voiceflow.app/state/skill/[versionID]`. Replace the `https://alexa.voiceflow.app` portion with your own ngrok endpoint. It should end up looking something like this:

![Screenshot from 2020-09-07 12-48-15](https://user-images.githubusercontent.com/5643574/92407382-76008780-f108-11ea-9eb7-e0504141865b.png)
(make sure that it ends with `/state/skill/[versionID]`)

You should now be able to test your skill using the Alexa Developer Console Skill Testing tool or on an actual Alexa device and see that it is executing on your local machine.

> with this `.env.local` configuration, the google sheets, zapier blocks will not work

> every time you make changes on Alexa you will need to export again, move the project file to `/projects` and update `PROJECT_SOURCE` in `.env.local` and restart `voiceflow/client` - finally update the endpoint again on ADC (it will be overwritten by `https://alexa.voiceflow.app` again)

# Notable Code Locations

[lib/controllers/alexa.ts](https://github.com/voiceflow/alexa-runtime/blob/0c0025f102dfdfcbd1e442bb0f336a4604171d22/lib/controllers/alexa.ts#L20) - this is where the raw request and response are handled. You can log the request object and response object to help debug.

[lib/services/voiceflow/handlers](https://github.com/voiceflow/alexa-runtime/tree/master/lib/services/voiceflow/handlers) - handlers for all the various blocks and defining their behavior

[lib/services/alexa/request/lifecycle](https://github.com/voiceflow/alexa-runtime/tree/master/lib/services/alexa/request/lifecycle) - various side effects during the request/response lifecycle

[lib/services/alexa/local.ts](https://github.com/voiceflow/alexa-runtime/blob/master/lib/services/alexa/local.ts) - If `SESSIONS_SOURCE='local'`, this is where user state is being saved, can be logged.

## environment variables

`voiceflow/alexa-runtime` reads environment variables from a `.env.[environment]` file, where `[environment]` is either `local` or `production` depending on if you run `yarn start:local` or `yarn start`, respectively. (there is also an `.env.test` for integration tests)

### key types

| name                   | example/values                               |                                                                                       desc | required |
| ---------------------- | :------------------------------------------- | -----------------------------------------------------------------------------------------: | -------- |
| `PORT`                 | `4000`                                       |                                                         http port that service will run on | YES      |
| `PROJECT_SOURCE`       | `VF-Project-nPDdD6qZJ9.json`                 | JSON File inside `/projects` to read project - uses remote `VF_DATA_ENDPOINT` if undefined | NO       |
| `SESSIONS_SOURCE`      | `local` \| `dynamo` \| `postgres` \| `mongo` |                      if `local` read/write sessions to memory, otherwise default to dynamo | NO       |
| `VF_DATA_ENDPOINT`     | `http://localhost:8200`                      |           cloud endpoint to read Voiceflow project, ignored if `PROJECT_SOURCE` is defined | YES      |
| `DATADOG_API_KEY`      | `none`                                       |                                                       datadog API key for logging purposes | YES      |
| `LOG_LEVEL`            | `none` \| `warn`                             |                                                               logging verbosity and detail | NO       |
| `MIDDLEWARE_VERBOSITY` | `none` \| `warn` \| `debug`                  |                                              request/response logging verbosity and detail | NO       |

### session source

- `local`
  - stored in memory. All user sessions are lost if the server restarts, this is meant for debugging and prototyping.
- `dynamo`
  - Amazon's preferred method. If using `dynamo` define the `DYNAMO_ENDPOINT`, `AWS_REGION`, `SESSIONS_DYNAMO_TABLE` env variables.

If you want to add your own database or custom methods, feel free to look at the [lib/services/alexa](https://github.com/voiceflow/alexa-runtime/tree/master/lib/services/alexa) folder and contribute there.

**still under development**

- `mongo`
  - alternative NoSQL solution. If using `mongo` define the `MONGO_URI`, `MONGO_DB` env variable. Reads from a `runtime-sessions` collection.
- `postgres`
  - SQL solution. If using `postgres` define the `PG_USERNAME`,`PG_HOST`,`PG_DBNAME`,`PG_PASSWORD`,`PG_PORT` env variables. Reads from the `_sessions` table.

### handlers

These environment variables are optional and meant for specific blocks that have microservices that perform external functions. If left undefined the `code`/`API` block will run their requests locally on this server, as long as the project is trusted it is not an issue.

| name                            | example/values          |                                                                                            desc | required |
| ------------------------------- | :---------------------- | ----------------------------------------------------------------------------------------------: | -------- |
| `CODE_HANDLER_ENDPOINT`         | `http://localhost:8804` |                                      stateless cloud service endpoint to execute the code block | NO       |
| `INTEGRATIONS_HANDLER_ENDPOINT` | `http://localhost:8100` | cloud endpoint for zapier/google blocks - not available if `alexa-runtime` is ran as standalone | NO       |
| `API_HANDLER_ENDPOINT`          | `http://localhost:8803` |                                     stateless cloud endpoint for the API block to make requests | NO       |
