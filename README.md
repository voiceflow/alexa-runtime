# alexa-runtime

[![circle ci](https://circleci.com/gh/voiceflow/alexa-runtime/tree/master.svg?style=shield)](https://circleci.com/gh/voiceflow/alexa-runtime/tree/master)
[![codecov](https://codecov.io/gh/voiceflow/alexa-runtime/branch/master/graph/badge.svg)](https://codecov.io/gh/voiceflow/alexa-runtime)
[![sonar quality gate](https://sonarcloud.io/api/project_badges/measure?project=voiceflow_alexa-runtime&metric=alert_status)](https://sonarcloud.io/dashboard?id=voiceflow_alexa-runtime)

`alexa-runtime` is an http webhook service that handles alexa requests and generates a response. It manages the state of the user based on the programs (flows) made on the Voiceflow Creator tool.
This is an interface between the [voiceflow/runtime](https://github.com/voiceflow/runtime)

> ⚠️ **This repository is still undergoing active development**: Major breaking changes may be pushed periodically and the documentation may become outdated - a stable version has not been released

## client architecture

![client architecture](https://user-images.githubusercontent.com/5643574/92404808-5a927e00-f102-11ea-8229-dc7bb1c9c15b.png)

It is important to understand the Alexa Request/Response webhook model
https://developer.amazon.com/en-US/docs/alexa/custom-skills/request-and-response-json-reference.html

### anatomy of an interaction

1. user says something to alexa, alexa uses natural language processing to transcribe user intent, then sends it via webhook (along with other metadata i.e. _userID_) to `alexa-runtime`
2. fetch user state (JSON format) from **end user session storage** based on a _userID_ identifier
3. fetch project version data for initialization parameters from **Voiceflow API/Project File**
4. fetch the current program (flow) that the user is on from **Voiceflow API/Project File**
5. go through each block and update the user state
6. save the final user state to **end user session storage**
7. generate a response based on the final user state, send back to alexa
8. alexa interprets response and speaks to user

repeat all steps each time a user speaks to the alexa skill, to perform a conversation

## environment variables

`voiceflow/alexa-runtime` reads environment variables from a `.env.[environment]` file, where `[environment]` is either `local` or `production` depending on if you run `yarn local` or `yarn start`, respectively. (there is also an `.env.test` for integration tests)

### types

| name                            | example/values                    |                                                                                                                desc | required |
| ------------------------------- | :-------------------------------- | ------------------------------------------------------------------------------------------------------------------: | -------- |
| `PORT`                          | `4000`                            |                                                                                  http port that service will run on | YES      |
| `PROJECT_SOURCE`                | `VF-Project-nPDdD6qZJ9.json`      |            JSON File inside `/projects` to read version/program metadata - if undefined will use `VF_DATA_ENDPOINT` | NO       |
| `SESSIONS_SOURCE`               | `local` \| `remote`               |           if `local` read/write sessions to memory, otherwise if `remote` or undefined read/write to DynamoDB` | NO |
| `AWS_REGION`                    | `localhost`                       |                                                  AWS Region for DynamoDB, doesn't matter if `SESSION_SOUCE='local'` | NO       |
| `DYNAMO_ENDPOINT`               | `http://localhost:8000`           |                           DynamoDB endpoint for end user session storage, doesn't matter if `SESSION_SOUCE='local'` | NO       |
| `SESSIONS_DYNAMO_TABLE`         | `com.getvoiceflow.local.sessions` |                              DynamoDB table for end user session storage, doesn't matter if `SESSION_SOUCE='local'` | YES      |
| `VF_DATA_ENDPOINT`              | `http://localhost:8200`           | cloud endpoint to read Voiceflow version and program metadata, doesn't matter if `PROJECT_SOURCE` is a defined file | YES      |
| `CODE_HANDLER_ENDPOINT`         | `http://localhost:8804`           |                                                          stateless cloud service endpoint to execute the code block | NO       |
| `INTEGRATIONS_HANDLER_ENDPOINT` | `http://localhost:8100`           |                     cloud endpoint for zapier/google blocks - not available if `alexa-runtime` is ran as standalone | YES      |
| `API_HANDLER_ENDPOINT`          | `http://localhost:8803`           |                                                         stateless cloud endpoint for the API block to make requests | NO       |
| `DATADOG_API_KEY`               | `none`                            |                                                                                datadog API key for logging purposes | YES      |
| `LOG_LEVEL`                     | `none` \| `warn`                  |                                                                                        logging verbosity and detail | NO       |
| `MIDDLEWARE_VERBOSITY`          | `none` \| `warn` \| `debug`       |                                                                       request/response logging verbosity and detail | NO       |

# configurations

## local/debugging setup

export your voiceflow project from the creator tool. Each time you update your project you will need to export again. You can find the export option here:

![Screenshot from 2020-09-07 12-14-44](https://user-images.githubusercontent.com/5643574/92405522-c3c6c100-f103-11ea-8ba8-6c10173e3419.png)

It should save a .vfr (voiceflow runtime) JSON file from your browser that would be named similar to this: `VF-Project-nPDdD6qZJ9.vfr`

fork `voiceflow/alexa-runtime` and clone to your local machine. Ensure `nodejs`, `npm`, and `yarn` are set up on your local machine. Run

```
yarn
```

to install all dependencies.

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
> LOG_LEVEL="warn"
> MIDDLEWARE_VERBOSITY="none"
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

Install a localhost tunnel tool such as [ngrok](https://ngrok.com/), [localtunnel](https://github.com/localtunnel/localtunnel), or [bespoken proxy](https://read.bespoken.io/cli/commands/#bst-proxy-http). This will allow you expose a localhost endpoint on the internet for Alexa to hit. For the purposes of this guide, we will implement `ngrok`

Run your local instance of `voiceflow/alexa-runtime` with

```
yarn local
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

> with this `.env.local` configuration, the code, google, zapier, and API blocks will not work

> every time you make changes on Alexa you will need to export again, move the project file to `/projects` and update `PROJECT_SOURCE` in `.env.local` and restart `voiceflow/client` - finally update the endpoint again on ADC (it will be overwritten by `https://alexa.voiceflow.app` again)

# Notable Code Locations

[lib/controllers/alexa.ts](https://github.com/voiceflow/alexa-runtime/blob/0c0025f102dfdfcbd1e442bb0f336a4604171d22/lib/controllers/alexa.ts#L20) - this is where the raw request and response are handled. You can log the request object and response object to help debug.

[lib/services/voiceflow/handlers](https://github.com/voiceflow/alexa-runtime/tree/master/lib/services/voiceflow/handlers) - handlers for all the various blocks and defining their behavior

[lib/services/alexa/request/lifecycle](https://github.com/voiceflow/alexa-runtime/tree/master/lib/services/alexa/request/lifecycle) - various side effects during the request/response lifecycle

[lib/services/alexa/local.ts](https://github.com/voiceflow/alexa-runtime/blob/master/lib/services/alexa/local.ts) - If `SESSIONS_SOURCE='local'`, this is where user state is being saved, can be logged.
