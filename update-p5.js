const https = require("https")
const fs = require("fs")

if (!fs.existsSync("./libraries")) {
    fs.mkdirSync("./libraries")
}

let url = "https://api.github.com/repos/processing/p5.js/releases/latest"
let files = ["p5.min.js", "p5.sound.min.js"]

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
    
    let data = ""
    res.on("data", chunk => data += chunk)

    res.on("end", async () => {

        let getFile = (link) => new Promise((resolve) => {
            https.get(link[1], res => {

                if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location) {

                    process.stdout.write("/redirect");
                    resolve(getFile([link[0], res.headers.location]))

                } else {

                    const writeStream = fs.createWriteStream(`./libraries/${link[0]}`, { "flags": "w+" })
                    res.pipe(writeStream)

                    writeStream.on("finish", () => {

                        process.stdout.write("/finished\n")

                        writeStream.close()
                        resolve()

                    })

                }
            })
        })

        for (link of JSON.parse(data)["assets"]
            .filter(a => files.includes(a["name"]))
            .map(a => [a["name"], a["browser_download_url"]])
        ) {
            process.stdout.write(`${link[0]}`);

            await getFile(link)
        }

    })
})