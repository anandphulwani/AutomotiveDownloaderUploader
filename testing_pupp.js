import puppeteer from "puppeteer";

(async () => {

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        args: [
            '--user-data-dir=C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data'
        ],
    });

    const [page] = await browser.pages();   
    
    await page.goto('https://signin.coxautoinc.com/logout?bridge_solution=HME');
    //await page.waitForFunction("window.location.pathname == '/Welcome.aspx'")
    await page.waitForFunction("window.location.href.startsWith('https://homenetauto.signin.coxautoinc.com/?solutionID=HME_prod&clientId=')");
    await page.type('#username', "");
    await page.type('#username', "dinesharora80@gmail.com");
    await page.click('#signIn');
    console.log("Clicked Signed In");
    var text = '← dinesharora80@gmail.com';
    await page.waitForFunction(text => document.querySelector('#returnLink').innerText.includes(text),{},text);
    console.log("Found returnLink");
    await page.type('#password', "");
    await page.type('#password', "kunsh123");
    //<button id="signIn" type="submit" class="btn btn-primary ">Sign in</button>
    console.log("Filled password");
    text = 'Sign in';
    await page.waitForFunction(text => document.querySelector('#signIn').innerText.includes(text),{},text);
    console.log("Found Sign In button");
    await page.click('#signIn');
    console.log("Clicked on sign in button");
    await page.waitForFunction("window.location.href.startsWith('https://www.homenetiol.com/dashboard')");
    await page.waitForSelector('dt[.bb-userdatum__valu]')
    text = 'dinesharora80@gmail.com';
    await page.waitForFunction(text => document.querySelector('.bb-userdatum__value').innerText.includes(text),{},text);
    await new Promise(r => setTimeout(r, 5000));
    console.log("Found");
    await browser.close();
    //process.exit(0);
})();

/*
<input type="text" id="" name="username" autocomplete="username" maxlength="100" class="username-textInput form-control" value=""></input>
<button id="signIn" type="submit" class="btn btn-primary ">Next</button>
<input class="password-textInput form-control" id="password" type="password" name="password" autocomplete="current-password"></input>
<button id="signIn" type="submit" class="btn btn-primary ">Sign in</button>


*/