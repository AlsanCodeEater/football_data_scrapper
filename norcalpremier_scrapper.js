let base_url = "https://norcalpremier.com/clubs";
// const selector = 'div:nth-child(3) > div.widget-body > table > tbody'

import { writeCsv } from "../PupeeterToolsMjs/readWriteFile.mjs";
import * as scrappo from "../PupeeterToolsMjs/scrapper_tools.mjs";
import  input from    "../PupeeterToolsMjs/inputer.mjs";



let selector = {
    clubNameSelector: "h3",
    teamContactLinkSelector: 'ul>li>a[href*="contacts"]',
    linkSelector: " tr > td:nth-child(1) > a",
};

let contactSel = {
    div: "div:nth-child(3) > div > table > tbody>tr",
    info: "td",
};

const clubUrl = await input("Club Url Please : ");
const netStatus = ["load", "domcontentloaded", "networkidle0", "networkidle2"];

let fnameP = clubUrl.replace("https://", "");
let filename = fnameP.split("/");

async function getClubDetails(page) {
    let clubPageContact = await page.$$(contactSel.div);
    // let teamName = await page.$eval(' div:nth-child(2) > div > div > div > div:nth-child(1) > div > div', (e) => e.textContent);
    // let teamName = await page.$eval('div> div > div > div > div > div:nth-child(1) > div > div', (e) => e.textContent);
    // let clubName = await page.$eval('h3', (e) => e.textContent);

    let contacts = [];
    for (let i = 0; i < clubPageContact.length; i++) {
        let contact = await clubPageContact[i].$$eval(contactSel.info, (e) =>
            e.map((o) => o.textContent.replaceAll("\n", ""))
        );
        contacts.push(contact);
    }

    let clubData = { contacts: contacts };
    return clubData;
}

async function getTeamDetails(page) {
    let teamPageContact = await page.$$(contactSel.div);
    // let teamName = await page.$eval(' div:nth-child(2) > div > div > div > div:nth-child(1) > div > div', (e) => e.textContent);
    // let teamName = await page.$eval('div> div > div > div > div > div:nth-child(1) > div > div', (e) => e.textContent);

    let contacts = [];
    for (let i = 0; i < teamPageContact.length; i++) {
        let contact = await teamPageContact[i].$$eval(contactSel.info, (e) =>
            e.map((o) => o.textContent.replaceAll("\n", ""))
        );
        contacts.push(contact);
    }

    let teamData = { contacts: contacts };
    return teamData;
}

(async () => {
    let browser = await scrappo.Browser(true);

    let clubListPage = await scrappo.puppetPage(
        browser,
        clubUrl,
        netStatus[2],
        500,
        true
    );
    let clubLinks = await scrappo.nextPage(clubListPage, selector.linkSelector);

    for (let i = 0; i < clubLinks.length; i++) {
        console.log(`Fetching Data from ${i} th Link of ${clubLinks.length} clubs`);
        try {
            let cluPageLink = base_url + clubLinks[i];

            let clubPage = await scrappo.puppetPage(
                browser,
                cluPageLink,
                netStatus[2],
                500,
                true
            );
            let clubDetails = await getClubDetails(clubPage);

            for (let j = 0; j < clubDetails.contacts.length; j++) {
                let clubData = {
                    Title: clubDetails.contacts[j][0],
                    Name: clubDetails.contacts[j][1],
                    Email: clubDetails.contacts[j][2],
                    Phone: clubDetails.contacts[j][3],
                };

                await writeCsv(
                    filename[filename.length - 2] + "club",
                    clubData,
                    Object.keys(clubData)
                );
            }
            console.log(clubDetails, " url ", cluPageLink);

            let teamLinks = await scrappo.nextPage(clubPage, selector.linkSelector);
            for (let j = 0; j < teamLinks.length; j++) {
                console.log(
                    `Fetching Data from ${j} th link of ${teamLinks.length} teams of  ${i} Link  of ${clubLinks.length} clubs`
                );

                try {
                    let teamPage = await scrappo.puppetPage(
                        browser,
                        base_url + teamLinks[j],
                        netStatus[2],
                        500,
                        true
                    );
                    try {
                        let teamContactLink = await scrappo.nextPage(
                            teamPage,
                            selector.teamContactLinkSelector
                        );

                        let teamContactPage = await scrappo.puppetPage(
                            browser,
                            base_url + teamContactLink[0],
                            netStatus[2],
                            500,
                            true
                        );
                        let teamContactDetails = await getTeamDetails(teamContactPage);

                        for (let j = 0; j < teamContactDetails.contacts.length; j++) {
                            let teamData = {
                                Title: teamContactDetails.contacts[j][0],
                                Name: teamContactDetails.contacts[j][1],
                                Email: teamContactDetails.contacts[j][2],
                                Phone: teamContactDetails.contacts[j][3],
                            };
                            await writeCsv(
                                filename[filename.length - 2] + "team",
                                teamData,
                                Object.keys(teamData)
                            );
                        }
                        console.log(teamContactDetails, " url ", base_url + teamLinks[j]);
                    } catch (e) {
                        console.log(base_url + teamLinks[j] + "\n\n\n");
                        console.log(e);
                    }

                    browser = await scrappo.closeBrowser(browser, true);
                } catch (error) {
                    await writeCsv(
                        filename + "TeamErr",
                        { teamlink: base_url + teamContactLink[0] },
                        Object.keys({ teamlink: base_url + teamContactLink[0] })
                    );
                }
            }

            browser = await scrappo.closeBrowser(browser, true);
        } catch (error) {
            await writeCsv(
                filename + "clubErr",
                { clublink: base_url + clubLinks[i] },
                Object.keys({ clublink: base_url + clubLinks[i] })
            );
        }
    }
    console.log(
        `\n\n **** Congratulation ${clubUrl}  Successfully   Saved  file ${filename[filename.length - 2] + "club"
        } **** \n\n`
    );
    await browser.close();
})();
