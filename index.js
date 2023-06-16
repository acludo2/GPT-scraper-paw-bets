import { Router } from 'itty-router';
const currentDate = new Date();
const formattedDate = currentDate.toISOString().split('T')[0];





// Create a new router
const router = Router();


router.get('/sports-today', async (req, res) => {
	const response = await fetch('https://sportsgamestoday.com/');
	const html = await response.text();

	// Get the current date in the format that the website uses
	const today = new Date();
	today.setHours(today.getHours() - today.getTimezoneOffset() / 60 - 5); // UTC-5 for EST
	const todayString = `${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear().toString().slice(2)}`;

	// Get tomorrow's date
	const tomorrow = new Date(today);
	tomorrow.setDate(today.getDate() + 1);
	const tomorrowString = `${tomorrow.getMonth() + 1}-${tomorrow.getDate()}-${tomorrow.getFullYear().toString().slice(2)}`;

	// Use a regular expression to extract the events for the current date
	const regexToday = new RegExp(`${todayString}(.*?)(?=${today.getMonth() + 1}-${today.getDate() + 1}-${today.getFullYear().toString().slice(2)})`, 's');
	const matchToday = html.match(regexToday);

	// If no events for today, try to find events for tomorrow
	let eventsText;
	if (matchToday) {
		eventsText = matchToday[1];
	} else {
		const regexTomorrow = new RegExp(`${tomorrowString}(.*?)(?=${tomorrow.getMonth() + 1}-${tomorrow.getDate() + 1}-${tomorrow.getFullYear().toString().slice(2)})`, 's');
		const matchTomorrow = html.match(regexTomorrow);
		eventsText = matchTomorrow ? matchTomorrow[1] : 'No events found for today or tomorrow.';
	}

	const toParseByCompletion = JSON.stringify(parseTodaysEvents(eventsText))
	const completionResponse = await completionApi(eventTransformationPrompt(toParseByCompletion))

	return new Response( completionResponse,{
		headers: {
			'Content-Type': 'application/json',
		  },
	  });
});





const parseTodaysEvents = (htmlString) => {
	let splitByRow = htmlString.split('<tr');

	let parsedData = [];
	let currentSport = null;

	for (let i = 0; i < splitByRow.length; i++) {
	  let row = splitByRow[i];

	  // Try to match sport title
	  let matchSport = row.match(/<th[^>]*class\s*=\s*"[^"]*gamematchuptitle[^"]*"[^>]*>(.*?)<\/th>/i);
	  // Try to match game info
	  let matchGame = row.match(/<td[^>]*class\s*=\s*"[^"]*gamematchup[^"]*"[^>]*>(.*?)<\/td>[^<]*<td[^>]*class\s*=\s*"[^"]*gametime[^"]*"[^>]*>(.*?)<\/td>[^<]*<td[^>]*class\s*=\s*"[^"]*gametvchannel[^"]*"[^>]*>(.*?)<\/td>/is);

	  if (matchSport) {
		currentSport = {
		  sportTitle: matchSport[1],
		  events: []
		};
		parsedData.push(currentSport);
	  } else if (matchGame && currentSport !== null) {
		currentSport.events.push({
		  game: matchGame[1],
		  time: matchGame[2],
		  tv: matchGame[3]
		});
	  }
	}

	return parsedData;
  };




const completionApi = async (prompt) => {
	const headers = {
		"Content-Type": "application/json",
		"Authorization": `Bearer ${apiKey}`
	  };

	  const body = {
		"model": "gpt-3.5-turbo",
		"messages": prompt
	  };

	  const response = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: headers,
		body: JSON.stringify(body),
	  });

	  const data = await response.json();

	  const latestResponse = data.choices[0].message.content.trim();
	  return latestResponse;
}


router.get("/media",async ()=>{

	const response = await fetch('https://www.google.com/search?q=MLB++REGULAR+SEASON+GAMES+Atlanta+at+Detroit&sxsrf=APwXEde-tgHh3vvTxhdW1tnQRUgJ4qXd2g%3A1686717141777&ei=1UKJZJWKL5u7qtsP_4eKuAw&ved=0ahUKEwjVyMmA98H_AhWbnWoFHf-DAscQ4dUDCA8&uact=5&oq=MLB++REGULAR+SEASON+GAMES+Atlanta+at+Detroit&gs_lcp=Cgxnd3Mtd2l6LXNlcnAQAzIFCCEQoAEyBQghEKABMgUIIRCgAToKCAAQRxDWBBCwAzoXCC4Q6QQQ7QQQgwUQsAMQiwMQqAMQowM6GgguEOkEEO0EEIMFENQCELADEIsDEKgDEKMDOgcIIxCKBRAnOggIABCKBRCGAzoMCCMQigUQJxBGEP0BOgYIABAWEB46BQgAEIAESgYIok4Y7QRKBAhBGABQunlY19UBYPnXAWgBcAF4AIABlgGIAYkFkgEDMi40mAEAoAEBoAECuAECwAEByAEK&sclient=gws-wiz-serp');
	const html = await response.text();

	let urls = scrapeBase64Images(html);
	console.log(html)

	return new Response(JSON.stringify({urls}) ,{
		headers: {
		  'Content-Type': 'text/plain',
		},
	  });
})

const scrapeBase64Images = (htmlString) => {
	let pattern = new RegExp(`data:image\/[^;]+;base64,[a-zA-Z0-9+/]+=*`, 'g');
	let matches = htmlString.match(pattern);
	return matches || [];
  };



///prompts
 const eventTransformationPrompt = (DATA) => [
    {   role:"user",
      content: `
      you are a json transformer your whole purpose is to response in json. any answer  that fails to parse if fed into a JSON.parse() should
      not be admisible. as you follow the standars of technology your whole response acts as an API of 'Content-Type': 'application/json',

      so
      transform the next Json
      ${DATA}
      data into this scheme

	  {
		"$schema": "http://json-schema.org/draft-07/schema#",
		"type": "array",
		"items": {
		  "type": "object",
		  "properties": {
			"league": {
			  "type": "string"
			},
			"events": {
			  "type": "array",
			  "items": {
				"type": "object",
				"properties": {
				  "teams": {
					"type": "array",
					"items": {
					  "type": "string"
					},
					"minItems": 2,
					"maxItems": 2
				  },
				  "time": {
					"type": "string",
					"pattern": "^[0-9]{4}-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9]Z$"
				  },
				  "tv": {
					"type": "string"
				  }
				},
				"required": ["teams", "time", "tv"]
			  }
			}
		  },
		  "required": ["league", "events"]
		}
	  }


  `}
  ];








router.all('*', () => new Response('404, not found!', { status: 404 }));

export default {
  fetch: router.handle,
};
