import chalk from 'chalk';
import fs from 'fs';

// eslint-disable-next-line import/extensions
import { config } from '../configs/config.js';

function getCredentialsForUsername(username) {
    const configCredentials = config.credentials;
    const singleelement = configCredentials.filter((a) => a.username === username)[0];
    return singleelement;
    // const { password } = singleelement;
    // return password;
}

function getIgnoreBookmarkURLObjects() {
    const ignoreBookmarkURLObjects = config.ignoreBookmarkURLS;
    let ignoreBookmarkURLText = JSON.stringify(ignoreBookmarkURLObjects);
    ignoreBookmarkURLText = ignoreBookmarkURLText.replaceAll('{config.appDomain}', config.appDomain);
    return JSON.parse(ignoreBookmarkURLText);
}

function getAppDomain() {
    return config.appDomain;
}

function setContractorsCurrentAllotted(contractor, allottedQty) {
    const currentAllotted = getContractorsCurrentAllotted(contractor);
    if (currentAllotted === allottedQty) {
        return;
    }
    const configUser = fs.readFileSync('.\\configs\\config-user.js', 'utf8');

    const regexString = `(const configUser = {[\\s|\\S]*contractors: {[\\s|\\S]*${contractor}: {[\\s]*\\n)([ ]*)(currentAllotted: )(\\d+)(,)`;
    const regexExpression = new RegExp(regexString, 'g');
    const newConfigUser = configUser.replace(regexExpression, `$1$2$3${allottedQty}$5`);

    if (configUser === newConfigUser) {
        console.log(
            chalk.white.bgRed.bold(
                `Unable to set contractors: '${contractor}', current allotted quantity to: '${allottedQty}'. Serious issue, please contact developer.`
            )
        );
        process.exit(1);
    }
    fs.writeFileSync('.\\configs\\config-user.js', newConfigUser, 'utf8');
}

function getContractorsCurrentAllotted(contractor) {
    const configUser = fs.readFileSync('.\\configs\\config-user.js', 'utf8');
    const regexString = `(const configUser = {[\\s|\\S]*contractors: {[\\s|\\S]*${contractor}: {[\\s]*\\n)([ ]*)(currentAllotted: )(\\d+)(,)`;
    const regexExpression = new RegExp(regexString, 'g');
    const match = configUser.match(regexExpression);
    const currentAllotted = match[0].match(regexString)[4];
    return currentAllotted;
}

function addToContractorsCurrentAllotted(contractor, quantity) {
    let newQuantity = getContractorsCurrentAllotted(contractor);
    newQuantity = parseInt(newQuantity, 10);
    newQuantity += quantity;
    setContractorsCurrentAllotted(contractor, newQuantity);
}

// eslint-disable-next-line import/prefer-default-export
export {
    getCredentialsForUsername,
    getIgnoreBookmarkURLObjects,
    getAppDomain,
    setContractorsCurrentAllotted,
    getContractorsCurrentAllotted,
    addToContractorsCurrentAllotted,
};
