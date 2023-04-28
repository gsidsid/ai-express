![Banner](src/assets/readme-banner.png)

---

A fast, lightweight way to turn AI prompts into ready-to-use API endpoints– deploy with a few clicks and manage prompts with automated variable inference & substitution in a neat visual interface.

![Dashboard](src/assets/readme-dashboard.png)

Run locally, or [set up a database on MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) to deploy it for free in a few minutes. Note that free Render instances take ~30 seconds to wake after 15 minutes of inactivity, and should probably be just used for evaluation.

<details>
<summary> More details on how to do this</summary>

1. [Sign up for MongoDB](https://www.mongodb.com/cloud/atlas/register). On the "Deploy your database" screen, select AWS, M0 – Free (or whatever level of hosting you'd like, but free really ought to be more than enough).

2. Create a user profile for the new database and make a note of your database username and password. Then from the "Network Access" page, click "Add IP Address" then "Allow access from anywhere". You can easily configure this later to include only the IP addresses of your Render deployment for extra security.

3. Go to "Database" in the sidebar, click the "Connect" button for the database you just created, select "Drivers", and copy the connection string URL. Note that you'll need to fill in the `<password>` part of the URL with that of the profile you created in step 2.

Then click the button below and have your connection URL ready.

</details>

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/gsidsid/ai-express/)

## Usage

This template uses a simple express server with a Payload CMS configuration to give you a neat interface to manage prompts, updating your API dynamically whenever you publish/modify prompts on it.

Every prompt document created instantly becomes a live API endpoint, and any variable in double curly braces in the prompt text, like `{{name}}`, `{{age}}`, `{{color}}`, etc. automatically becomes a requirement to the JSON body that API endpoint will expect and check for in an HTTP POST request.

Variable notation can be extended to include more info `{{variableName|defaultValue|description}}`, prompts are automatically validated for token length against the model selected in the text editor, and API documentation + a test bench are maintained via Swagger so you can test changes to your prompts without firing up Postman.

The API will wait for and output the top chat completion `completion.data.choices[0].message.trim()` in a simple JSON object of the format `{ result: <your_completion> }`. If there was an error of any kind, you will receive `{ result: null, error: <error_message> }`.

## Development

1. Ensure MongoDB is installed locally – Instructions: [Mac](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/), [Windows](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-windows/). Don't forget to start it using `brew services start mongodb-community@6.0` or equivalent.

2. Rename the `.sample.env` file to `.env`, adding your Open AI API key, and updating `AIEXPRESS_API_KEY` with a new random value.

3. `yarn` and `yarn dev` will then start the application and reload on any changes. Requires Node 16+.

### Docker

If you have docker and docker-compose installed, you can run `docker compose up`. You may need to run `sudo chmod -R go+w /data/db` on the data/db directory first.

Or, to build the docker image, run `docker build -t my-tag .`

Ensure you are passing all needed environment variables when starting up your container via `--env-file` or setting them with your deployment.

The 3 typical env vars will be `MONGODB_URI`, `AIEXPRESS_API_KEY`, and `PAYLOAD_CONFIG_PATH`. `EXTERNAL_HOSTNAME` may also be relevant, depending on where you're deploying.

`docker run --env-file .env -p 3000:3000 my-tag`

## Future

- Plugins to let folks throw in other repetitive API stuff like redaction, rate limiting, and generated output validation middleware. Ideally all configurable just through the CMS.
- Use Payload's form building plugin to let folks put together end-user apps.
- A hosted service that makes setup even quicker, if there's interest.

Contributions are welcome.
